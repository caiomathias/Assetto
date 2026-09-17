"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirSessao } from "@/lib/auth";
import { falha, mensagemDeErro, type Resultado } from "@/lib/erros";
import { paraCentavos, paraQuantidade } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const opcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const pecaSchema = z.object({
  nome: z.string().trim().min(2, "Digite o nome da peça."),
  codigo: opcional,
  marca: opcional,
  unidade: z.string().trim().default("UN"),
  localizacao: opcional,
  ativo: z.boolean().default(true),
});

export async function salvarPeca(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId, usuarioId } = await exigirSessao();

  const analise = pecaSchema.safeParse({
    nome: dados.get("nome"),
    codigo: dados.get("codigo"),
    marca: dados.get("marca"),
    unidade: dados.get("unidade")?.toString() || "UN",
    localizacao: dados.get("localizacao"),
    ativo: dados.get("ativo") === "on" || dados.get("ativo") === null,
  });
  if (!analise.success) return falha(analise.error.issues[0].message);

  const precoCusto = paraCentavos(dados.get("precoCusto")?.toString());
  const precoVenda = paraCentavos(dados.get("precoVenda")?.toString());
  const estoqueMinimo = paraQuantidade(dados.get("estoqueMinimo")?.toString());
  const quantidadeInicial = paraQuantidade(dados.get("quantidade")?.toString());

  const id = dados.get("id")?.toString() || null;

  try {
    if (id) {
      // Estoque NAO muda aqui. Quantidade só muda por movimento, para o
      // saldo sempre ter um histórico que explica como chegou nesse número.
      const r = await prisma.peca.updateMany({
        where: { id, oficinaId },
        data: {
          ...analise.data,
          precoCustoCentavos: precoCusto,
          precoVendaCentavos: precoVenda,
          estoqueMinimo,
        },
      });
      if (r.count === 0) return falha("Peça não encontrada.");
    } else {
      await prisma.$transaction(async (tx) => {
        const peca = await tx.peca.create({
          data: {
            ...analise.data,
            oficinaId,
            precoCustoCentavos: precoCusto,
            precoVendaCentavos: precoVenda,
            estoqueMinimo,
            quantidade: quantidadeInicial,
          },
        });

        if (quantidadeInicial !== 0) {
          await tx.movimentoEstoque.create({
            data: {
              oficinaId,
              pecaId: peca.id,
              tipo: "ENTRADA",
              quantidade: quantidadeInicial,
              saldoDepois: quantidadeInicial,
              motivo: "Estoque inicial",
              usuarioId,
            },
          });
        }
      });
    }
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/pecas");
  redirect("/pecas");
}

/**
 * Entrada, saída ou acerto de estoque. Sempre grava um movimento com o
 * saldo resultante: é o extrato que explica qualquer divergência de
 * inventário depois.
 */
export async function movimentarEstoque(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId, usuarioId } = await exigirSessao();

  const pecaId = dados.get("pecaId")?.toString();
  const tipo = dados.get("tipo")?.toString();
  const quantidade = paraQuantidade(dados.get("quantidade")?.toString());
  const motivo = dados.get("motivo")?.toString().trim() || null;

  if (!pecaId) return falha("Peça não informada.");
  if (tipo !== "ENTRADA" && tipo !== "SAIDA" && tipo !== "AJUSTE") {
    return falha("Escolha o tipo de movimento.");
  }
  if (quantidade <= 0 && tipo !== "AJUSTE") {
    return falha("Digite uma quantidade maior que zero.");
  }
  if (quantidade < 0) return falha("A quantidade não pode ser negativa.");

  try {
    await prisma.$transaction(async (tx) => {
      const peca = await tx.peca.findFirst({ where: { id: pecaId, oficinaId } });
      if (!peca) throw new Error("Peça não encontrada.");

      // No AJUSTE a quantidade digitada é a contagem física, não a diferenca:
      // é assim que a pessoa pensa ao fazer inventário ("tem 7 aqui").
      const saldo =
        tipo === "ENTRADA"
          ? peca.quantidade + quantidade
          : tipo === "SAIDA"
            ? peca.quantidade - quantidade
            : quantidade;

      const arredondado = Number(saldo.toFixed(3));

      await tx.peca.update({ where: { id: peca.id }, data: { quantidade: arredondado } });
      await tx.movimentoEstoque.create({
        data: {
          oficinaId,
          pecaId: peca.id,
          tipo,
          quantidade: tipo === "AJUSTE" ? Number((quantidade - peca.quantidade).toFixed(3)) : quantidade,
          saldoDepois: arredondado,
          motivo: motivo ?? (tipo === "AJUSTE" ? "Acerto de inventário" : null),
          usuarioId,
        },
      });
    });
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/pecas");
  revalidatePath(`/pecas/${pecaId}`);
  redirect(`/pecas/${pecaId}`);
}

export async function excluirPeca(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  const usada = await prisma.itemOS.count({ where: { pecaId: id } });

  // Peça já usada em OS vira inativa: some das buscas, mas o histórico
  // continua apontando para ela.
  if (usada > 0) {
    await prisma.peca.updateMany({ where: { id, oficinaId }, data: { ativo: false } });
  } else {
    await prisma.peca.deleteMany({ where: { id, oficinaId } });
  }

  revalidatePath("/pecas");
  redirect("/pecas");
}

// ---------------------------------------------------------------------------
// Catalogo de serviços
// ---------------------------------------------------------------------------

export async function salvarServico(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId } = await exigirSessao();

  const nome = dados.get("nome")?.toString().trim();
  if (!nome || nome.length < 2) return falha("Digite o nome do serviço.");

  const tempo = Number.parseInt(dados.get("tempoEstimadoMin")?.toString() ?? "", 10);
  const valores = {
    nome,
    descricao: dados.get("descricao")?.toString().trim() || null,
    precoCentavos: paraCentavos(dados.get("preco")?.toString()),
    tempoEstimadoMin: Number.isFinite(tempo) ? tempo : null,
    ativo: true,
  };

  const id = dados.get("id")?.toString() || null;

  try {
    if (id) {
      const r = await prisma.servico.updateMany({ where: { id, oficinaId }, data: valores });
      if (r.count === 0) return falha("Serviço não encontrado.");
    } else {
      await prisma.servico.create({ data: { ...valores, oficinaId } });
    }
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/pecas/servicos");
  redirect("/pecas/servicos");
}

export async function excluirServico(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  const usado = await prisma.itemOS.count({ where: { servicoId: id } });
  if (usado > 0) {
    await prisma.servico.updateMany({ where: { id, oficinaId }, data: { ativo: false } });
  } else {
    await prisma.servico.deleteMany({ where: { id, oficinaId } });
  }

  revalidatePath("/pecas/servicos");
  redirect("/pecas/servicos");
}
