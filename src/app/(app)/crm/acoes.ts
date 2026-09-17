"use server";

import { revalidatePath } from "next/cache";
import { EtapaCrm } from "@prisma/client";
import { z } from "zod";

import { exigirSessao } from "@/lib/auth";
import { falha, mensagemDeErro, sucesso, type Resultado } from "@/lib/erros";
import { dataDoInput, paraCentavos, soDigitos } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const oportunidadeSchema = z.object({
  nomeContato: z.string().trim().min(2, "Digite o nome do contato."),
  telefone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : soDigitos(v)))
    .nullable(),
  origem: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  etapa: z.nativeEnum(EtapaCrm).catch(EtapaCrm.NOVO),
  observacoes: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export async function salvarOportunidade(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId, usuarioId } = await exigirSessao();

  const analise = oportunidadeSchema.safeParse({
    nomeContato: dados.get("nomeContato"),
    telefone: dados.get("telefone"),
    origem: dados.get("origem"),
    etapa: dados.get("etapa"),
    observacoes: dados.get("observacoes"),
  });
  if (!analise.success) return falha(analise.error.issues[0].message);

  const valores = {
    ...analise.data,
    clienteId: dados.get("clienteId")?.toString() || null,
    valorEstimadoCentavos: paraCentavos(dados.get("valorEstimado")?.toString()),
    proximoContatoEm: dataDoInput(dados.get("proximoContatoEm")?.toString()),
  };

  const id = dados.get("id")?.toString() || null;

  try {
    if (id) {
      const r = await prisma.oportunidade.updateMany({ where: { id, oficinaId }, data: valores });
      if (r.count === 0) return falha("Oportunidade não encontrada.");
    } else {
      await prisma.oportunidade.create({
        data: { ...valores, oficinaId, responsavelId: usuarioId },
      });
    }
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/crm");
  return sucesso();
}

/** Chamada pelo arrastar-e-soltar e pelas setas do quadro. */
export async function moverOportunidade(id: string, novaEtapa: string): Promise<void> {
  const { oficinaId } = await exigirSessao();
  if (!(novaEtapa in EtapaCrm)) return;
  const etapa = novaEtapa as EtapaCrm;

  const fechada = etapa === "GANHO" || etapa === "PERDIDO";

  await prisma.oportunidade.updateMany({
    where: { id, oficinaId },
    data: { etapa, fechadoEm: fechada ? new Date() : null },
  });

  revalidatePath("/crm");
}

export async function excluirOportunidade(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  await prisma.oportunidade.deleteMany({ where: { id, oficinaId } });
  revalidatePath("/crm");
}
