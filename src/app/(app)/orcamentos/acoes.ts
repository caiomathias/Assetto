"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirSessao } from "@/lib/auth";
import { falha, mensagemDeErro, type Resultado } from "@/lib/erros";
import { dataDoInput } from "@/lib/format";
import { aplicarDesconto, lerItens } from "@/lib/itens";
import { prisma } from "@/lib/prisma";
import { proximoNumero } from "@/lib/sequencia";

const cabecalhoSchema = z.object({
  clienteId: z.string().min(1, "Escolha o cliente."),
  veiculoId: z.string().min(1, "Escolha o veiculo."),
  validadeAte: z.string().optional(),
  kmAtual: z.string().optional(),
  descricaoProblema: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

export async function salvarOrcamento(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId, usuarioId } = await exigirSessao();

  const analise = cabecalhoSchema.safeParse({
    clienteId: dados.get("clienteId"),
    veiculoId: dados.get("veiculoId"),
    validadeAte: dados.get("validadeAte")?.toString(),
    kmAtual: dados.get("kmAtual")?.toString(),
    descricaoProblema: dados.get("descricaoProblema")?.toString(),
    observacoes: dados.get("observacoes")?.toString(),
  });
  if (!analise.success) return falha(analise.error.issues[0].message);

  const leitura = lerItens(dados.get("itens"));
  if (!leitura.ok) return falha(leitura.erro);

  const { desconto, total } = aplicarDesconto(
    leitura.subtotal,
    Number(dados.get("descontoCentavos") ?? 0),
  );

  const { clienteId, veiculoId, ...resto } = analise.data;
  const id = dados.get("id")?.toString() || null;

  // O veiculo precisa ser desta oficina E deste cliente. Sem essa checagem,
  // trocar o id no formulario colaria o carro de outro cliente na OS.
  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, oficinaId, clienteId },
  });
  if (!veiculo) return falha("Veiculo nao encontrado para este cliente.");

  const km = resto.kmAtual ? Number.parseInt(resto.kmAtual, 10) : null;

  const camposComuns = {
    clienteId,
    veiculoId,
    validadeAte: dataDoInput(resto.validadeAte),
    kmAtual: Number.isFinite(km) ? km : null,
    descricaoProblema: resto.descricaoProblema || null,
    observacoes: resto.observacoes || null,
    descontoCentavos: desconto,
    totalCentavos: total,
  };

  let orcamentoId: string;
  try {
    orcamentoId = await prisma.$transaction(async (tx) => {
      if (id) {
        const atual = await tx.orcamento.findFirst({ where: { id, oficinaId } });
        if (!atual) throw new Error("Orcamento nao encontrado.");
        if (atual.status === "CONVERTIDO") {
          throw new Error("Este orcamento ja virou ordem de servico e nao pode mais ser alterado.");
        }

        // Trocar a lista inteira e mais simples e seguro do que tentar
        // casar item a item: os ids dos itens nao importam para ninguem.
        await tx.itemOrcamento.deleteMany({ where: { orcamentoId: id } });
        await tx.orcamento.update({
          where: { id },
          data: {
            ...camposComuns,
            itens: { create: leitura.itens },
          },
        });
        return id;
      }

      const numero = await proximoNumero(tx, oficinaId, "ORCAMENTO");
      const criado = await tx.orcamento.create({
        data: {
          ...camposComuns,
          oficinaId,
          numero,
          criadoPorId: usuarioId,
          itens: { create: leitura.itens },
        },
      });
      return criado.id;
    });
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${orcamentoId}`);
}

/** Marca como enviado; e isso que libera o link publico de aprovacao. */
export async function enviarAoCliente(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  await prisma.orcamento.updateMany({
    where: { id, oficinaId, status: { in: ["RASCUNHO", "ENVIADO", "RECUSADO"] } },
    data: { status: "ENVIADO", enviadoEm: new Date(), motivoRecusa: null },
  });

  revalidatePath(`/orcamentos/${id}`);
  redirect(`/orcamentos/${id}`);
}

/** Aprovacao registrada pelo balcao (cliente respondeu por telefone). */
export async function responderNoBalcao(dados: FormData): Promise<void> {
  const sessao = await exigirSessao();
  const id = dados.get("id")?.toString();
  const resposta = dados.get("resposta")?.toString();
  if (!id || (resposta !== "APROVADO" && resposta !== "RECUSADO")) return;

  await prisma.orcamento.updateMany({
    where: { id, oficinaId: sessao.oficinaId, status: { in: ["RASCUNHO", "ENVIADO"] } },
    data: {
      status: resposta,
      respondidoEm: new Date(),
      respondidoPor: `${sessao.nome} (registrado no balcao)`,
      motivoRecusa: resposta === "RECUSADO" ? dados.get("motivo")?.toString() || null : null,
    },
  });

  revalidatePath(`/orcamentos/${id}`);
  redirect(`/orcamentos/${id}`);
}

/**
 * Orcamento aprovado vira ordem de servico, copiando os itens.
 * A copia e proposital: depois disso o orcamento e um documento historico e
 * a OS segue a propria vida (o mecanico pode acrescentar peca).
 */
export async function converterEmOS(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  const ordemId = await prisma.$transaction(async (tx) => {
    const orcamento = await tx.orcamento.findFirst({
      where: { id, oficinaId },
      include: { itens: { orderBy: { ordem: "asc" } } },
    });
    if (!orcamento) throw new Error("Orcamento nao encontrado.");
    if (orcamento.status === "CONVERTIDO") {
      const existente = await tx.ordemServico.findFirst({ where: { orcamentoId: id } });
      return existente?.id ?? null;
    }
    if (orcamento.status !== "APROVADO") {
      throw new Error("So da para abrir a OS depois que o cliente aprovar o orcamento.");
    }

    const numero = await proximoNumero(tx, oficinaId, "ORDEM_SERVICO");
    const ordem = await tx.ordemServico.create({
      data: {
        oficinaId,
        numero,
        orcamentoId: orcamento.id,
        clienteId: orcamento.clienteId,
        veiculoId: orcamento.veiculoId,
        status: "EM_EXECUCAO",
        kmEntrada: orcamento.kmAtual,
        descricaoProblema: orcamento.descricaoProblema,
        observacoes: orcamento.observacoes,
        descontoCentavos: orcamento.descontoCentavos,
        totalCentavos: orcamento.totalCentavos,
        iniciadoEm: new Date(),
        itens: {
          create: orcamento.itens.map((item) => ({
            tipo: item.tipo,
            pecaId: item.pecaId,
            servicoId: item.servicoId,
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnitCentavos: item.valorUnitCentavos,
            totalCentavos: item.totalCentavos,
            ordem: item.ordem,
          })),
        },
      },
    });

    await tx.orcamento.update({ where: { id }, data: { status: "CONVERTIDO" } });
    return ordem.id;
  });

  revalidatePath("/orcamentos");
  revalidatePath("/patio");
  if (ordemId) redirect(`/os/${ordemId}`);
  redirect(`/orcamentos/${id}`);
}

export async function excluirOrcamento(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  await prisma.orcamento.deleteMany({
    where: { id, oficinaId, status: { not: "CONVERTIDO" } },
  });
  revalidatePath("/orcamentos");
  redirect("/orcamentos");
}
