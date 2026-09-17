"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirSessao } from "@/lib/auth";
import { falha, mensagemDeErro, sucesso, type Resultado } from "@/lib/erros";
import { dataDoInput, paraCentavos } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const lancamentoSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoria: z.string().trim().min(1, "Escolha a categoria."),
  descricao: z.string().trim().min(2, "Descreva o lançamento."),
  formaPagamento: z
    .enum(["DINHEIRO", "PIX", "DEBITO", "CREDITO", "BOLETO", "TRANSFERENCIA", "OUTRO"])
    .nullable()
    .catch(null),
});

export async function salvarLancamento(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId } = await exigirSessao();

  const forma = dados.get("formaPagamento")?.toString();
  const analise = lancamentoSchema.safeParse({
    tipo: dados.get("tipo"),
    categoria: dados.get("categoria"),
    descricao: dados.get("descricao"),
    formaPagamento: forma || null,
  });
  if (!analise.success) return falha(analise.error.issues[0].message);

  const valor = paraCentavos(dados.get("valor")?.toString());
  if (valor <= 0) return falha("Digite um valor maior que zero.");

  const vencimento = dataDoInput(dados.get("vencimento")?.toString()) ?? new Date();
  const jaPago = dados.get("jaPago") === "on";

  try {
    await prisma.lancamento.create({
      data: {
        ...analise.data,
        oficinaId,
        valorCentavos: valor,
        vencimento,
        pagoEm: jaPago ? new Date() : null,
        observacoes: dados.get("observacoes")?.toString().trim() || null,
      },
    });
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/financeiro");
  revalidatePath("/painel");
  return sucesso();
}

/** Marca como pago/recebido, ou desfaz se já estava. */
export async function alternarPagamento(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  const lancamento = await prisma.lancamento.findFirst({ where: { id, oficinaId } });
  if (!lancamento) return;

  await prisma.lancamento.update({
    where: { id },
    data: { pagoEm: lancamento.pagoEm ? null : new Date() },
  });

  revalidatePath("/financeiro");
  revalidatePath("/painel");
}

export async function excluirLancamento(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  // Lancamento vindo de OS faturada não pode sumir por engano: o valor
  // precisa bater com a OS. Para desfazer, cancela-se a OS.
  const lancamento = await prisma.lancamento.findFirst({ where: { id, oficinaId } });
  if (!lancamento || lancamento.ordemServicoId) {
    redirect("/financeiro?erro=vinculado");
  }

  await prisma.lancamento.delete({ where: { id } });
  revalidatePath("/financeiro");
  revalidatePath("/painel");
  redirect("/financeiro");
}
