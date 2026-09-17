"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { StatusOS, type Prisma } from "@prisma/client";
import { z } from "zod";

import { exigirSessao } from "@/lib/auth";
import { falha, mensagemDeErro, type Resultado } from "@/lib/erros";
import { dataDoInput } from "@/lib/format";
import { aplicarDesconto, lerItens } from "@/lib/itens";
import { prisma } from "@/lib/prisma";
import { proximoNumero } from "@/lib/sequencia";

function atualizarTelas(id?: string) {
  revalidatePath("/patio");
  revalidatePath("/os");
  revalidatePath("/painel");
  if (id) revalidatePath(`/os/${id}`);
}

const cabecalhoSchema = z.object({
  clienteId: z.string().min(1, "Escolha o cliente."),
  veiculoId: z.string().min(1, "Escolha o veículo."),
  responsavelId: z.string().optional(),
  kmEntrada: z.string().optional(),
  previsaoEntrega: z.string().optional(),
  descricaoProblema: z.string().trim().optional(),
  diagnostico: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

export async function salvarOS(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId } = await exigirSessao();

  const analise = cabecalhoSchema.safeParse({
    clienteId: dados.get("clienteId"),
    veiculoId: dados.get("veiculoId"),
    responsavelId: dados.get("responsavelId")?.toString(),
    kmEntrada: dados.get("kmEntrada")?.toString(),
    previsaoEntrega: dados.get("previsaoEntrega")?.toString(),
    descricaoProblema: dados.get("descricaoProblema")?.toString(),
    diagnostico: dados.get("diagnostico")?.toString(),
    observacoes: dados.get("observacoes")?.toString(),
  });
  if (!analise.success) return falha(analise.error.issues[0].message);

  const leitura = lerItens(dados.get("itens"));
  if (!leitura.ok) return falha(leitura.erro);

  const { desconto, total } = aplicarDesconto(
    leitura.subtotal,
    Number(dados.get("descontoCentavos") ?? 0),
  );

  const { clienteId, veiculoId, responsavelId, ...resto } = analise.data;
  const id = dados.get("id")?.toString() || null;

  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, oficinaId, clienteId },
  });
  if (!veiculo) return falha("Veículo não encontrado para este cliente.");

  const km = resto.kmEntrada ? Number.parseInt(resto.kmEntrada, 10) : null;

  const camposComuns = {
    clienteId,
    veiculoId,
    responsavelId: responsavelId || null,
    kmEntrada: Number.isFinite(km) ? km : null,
    previsaoEntrega: dataDoInput(resto.previsaoEntrega),
    descricaoProblema: resto.descricaoProblema || null,
    diagnostico: resto.diagnostico || null,
    observacoes: resto.observacoes || null,
    descontoCentavos: desconto,
    totalCentavos: total,
  };

  let ordemId: string;
  try {
    ordemId = await prisma.$transaction(async (tx) => {
      if (id) {
        const atual = await tx.ordemServico.findFirst({ where: { id, oficinaId } });
        if (!atual) throw new Error("Ordem de serviço não encontrada.");
        if (atual.estoqueBaixado) {
          throw new Error(
            "Esta OS já foi faturada. Os itens não podem mais mudar porque o estoque e o financeiro já foram lançados.",
          );
        }

        await tx.itemOS.deleteMany({ where: { ordemServicoId: id } });
        await tx.ordemServico.update({
          where: { id },
          data: { ...camposComuns, itens: { create: leitura.itens } },
        });
        return id;
      }

      const numero = await proximoNumero(tx, oficinaId, "ORDEM_SERVICO");
      const criada = await tx.ordemServico.create({
        data: {
          ...camposComuns,
          oficinaId,
          numero,
          status: "RECEBIDO",
          itens: { create: leitura.itens },
        },
      });
      return criada.id;
    });
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  atualizarTelas(ordemId);
  redirect(`/os/${ordemId}`);
}

/**
 * Move a OS de coluna no pátio. Cada status carrega um carimbo de tempo,
 * porque é disso que saem os indicadores de "quanto tempo o carro ficou aqui".
 */
export async function mudarStatus(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  const novo = dados.get("status")?.toString();
  const voltarPara = dados.get("voltarPara")?.toString();

  if (!id || !novo || !(novo in StatusOS)) return;
  const status = novo as StatusOS;

  const ordem = await prisma.ordemServico.findFirst({ where: { id, oficinaId } });
  if (!ordem) return;

  const marcas: Prisma.OrdemServicoUpdateInput = { status };
  if (status === "EM_EXECUCAO" && !ordem.iniciadoEm) marcas.iniciadoEm = new Date();
  if (status === "PRONTO" && !ordem.finalizadoEm) marcas.finalizadoEm = new Date();
  if (status === "ENTREGUE" && !ordem.entregueEm) marcas.entregueEm = new Date();

  await prisma.ordemServico.update({ where: { id }, data: marcas });

  atualizarTelas(id);
  if (voltarPara) redirect(voltarPara);
}

const faturamentoSchema = z.object({
  formaPagamento: z.enum([
    "DINHEIRO",
    "PIX",
    "DEBITO",
    "CREDITO",
    "BOLETO",
    "TRANSFERENCIA",
    "OUTRO",
  ]),
  situacao: z.enum(["RECEBIDO", "A_RECEBER"]),
  vencimento: z.string().optional(),
});

/**
 * Fatura a OS. E o único ponto do sistema onde três coisas acontecem juntas,
 * e por isso tudo roda numa transação so:
 *   1. baixa do estoque das peças usadas, com movimento para auditoria;
 *   2. lancamento da receita no financeiro;
 *   3. marcação da OS como faturada, para não repetir.
 *
 * Se qualquer passo falhar, nenhum acontece. Estoque errado e dinheiro
 * lancado em dobro são os dois erros que destroem a confianca no sistema.
 */
export async function faturarOS(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId, usuarioId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return falha("Ordem de serviço não informada.");

  const analise = faturamentoSchema.safeParse({
    formaPagamento: dados.get("formaPagamento"),
    situacao: dados.get("situacao"),
    vencimento: dados.get("vencimento")?.toString(),
  });
  if (!analise.success) return falha("Escolha a forma de pagamento.");

  const recebido = analise.data.situacao === "RECEBIDO";
  const vencimento = dataDoInput(analise.data.vencimento) ?? new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const ordem = await tx.ordemServico.findFirst({
        where: { id, oficinaId },
        include: { itens: true },
      });
      if (!ordem) throw new Error("Ordem de serviço não encontrada.");
      if (ordem.estoqueBaixado) throw new Error("Esta OS já foi faturada.");
      if (ordem.status === "CANCELADO") throw new Error("OS cancelada não pode ser faturada.");
      if (ordem.itens.length === 0) throw new Error("Adicione itens antes de faturar.");

      // Um item pode aparecer duas vezes (duas linhas da mesma peça).
      // Somar antes evita dois updates concorrentes na mesma linha.
      const porPeca = new Map<string, number>();
      for (const item of ordem.itens) {
        if (item.tipo !== "PECA" || !item.pecaId) continue;
        porPeca.set(item.pecaId, (porPeca.get(item.pecaId) ?? 0) + item.quantidade);
      }

      for (const [pecaId, quantidade] of porPeca) {
        const peca = await tx.peca.findFirst({ where: { id: pecaId, oficinaId } });
        if (!peca) continue;

        // Estoque negativo é permitido de propósito: a peça já foi montada no
        // carro. Bloquear aqui só faria a oficina parar de usar o sistema.
        // O saldo negativo fica visivel na tela de peças para ser acertado.
        const saldo = Number((peca.quantidade - quantidade).toFixed(3));

        await tx.peca.update({ where: { id: pecaId }, data: { quantidade: saldo } });
        await tx.movimentoEstoque.create({
          data: {
            oficinaId,
            pecaId,
            tipo: "SAIDA",
            quantidade,
            saldoDepois: saldo,
            motivo: `Uso na OS ${String(ordem.numero).padStart(4, "0")}`,
            ordemServicoId: ordem.id,
            usuarioId,
          },
        });
      }

      await tx.lancamento.create({
        data: {
          oficinaId,
          tipo: "RECEITA",
          categoria: "Serviço / OS",
          descricao: `OS ${String(ordem.numero).padStart(4, "0")}`,
          valorCentavos: ordem.totalCentavos,
          vencimento,
          pagoEm: recebido ? new Date() : null,
          formaPagamento: analise.data.formaPagamento,
          ordemServicoId: ordem.id,
          clienteId: ordem.clienteId,
        },
      });

      await tx.ordemServico.update({
        where: { id: ordem.id },
        data: {
          estoqueBaixado: true,
          status: "ENTREGUE",
          finalizadoEm: ordem.finalizadoEm ?? new Date(),
          entregueEm: ordem.entregueEm ?? new Date(),
        },
      });
    });
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  atualizarTelas(id);
  revalidatePath("/financeiro");
  revalidatePath("/pecas");
  redirect(`/os/${id}`);
}

export async function excluirOS(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  // OS faturada é documento contábil: cancela, não apaga.
  const ordem = await prisma.ordemServico.findFirst({ where: { id, oficinaId } });
  if (!ordem) return;

  if (ordem.estoqueBaixado) {
    await prisma.ordemServico.update({ where: { id }, data: { status: "CANCELADO" } });
    atualizarTelas(id);
    redirect(`/os/${id}`);
  }

  await prisma.ordemServico.delete({ where: { id } });
  atualizarTelas();
  redirect("/os");
}

/**
 * Versão chamada pelo arrastar-e-soltar do pátio. Recebe argumentos simples
 * em vez de FormData porque quem chama e JavaScript, não um <form>.
 */
export async function moverOS(id: string, novoStatus: string): Promise<void> {
  const { oficinaId } = await exigirSessao();
  if (!(novoStatus in StatusOS)) return;
  const status = novoStatus as StatusOS;

  const ordem = await prisma.ordemServico.findFirst({ where: { id, oficinaId } });
  if (!ordem || ordem.status === status) return;

  const marcas: Prisma.OrdemServicoUpdateInput = { status };
  if (status === "EM_EXECUCAO" && !ordem.iniciadoEm) marcas.iniciadoEm = new Date();
  if (status === "PRONTO" && !ordem.finalizadoEm) marcas.finalizadoEm = new Date();
  if (status === "ENTREGUE" && !ordem.entregueEm) marcas.entregueEm = new Date();

  await prisma.ordemServico.update({ where: { id }, data: marcas });
  atualizarTelas(id);
}
