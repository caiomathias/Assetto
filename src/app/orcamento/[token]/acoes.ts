"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

/**
 * Resposta do cliente pelo link público. Roda sem login: a única credencial
 * é o token do orçamento, que só quem recebeu o link conhece.
 *
 * Por isso a ação é deliberadamente estreita - ela consegue mudar apenas o
 * status de um orçamento que está em ENVIADO, e nada mais.
 */
export async function responderOrcamento(dados: FormData): Promise<void> {
  const token = dados.get("token")?.toString();
  const resposta = dados.get("resposta")?.toString();
  if (!token || (resposta !== "APROVADO" && resposta !== "RECUSADO")) return;

  const cabecalhos = await headers();
  const ip =
    cabecalhos.get("x-forwarded-for")?.split(",")[0].trim() ??
    cabecalhos.get("x-real-ip") ??
    null;

  const nome = dados.get("nome")?.toString().trim() || null;
  const motivo = dados.get("motivo")?.toString().trim() || null;

  await prisma.orcamento.updateMany({
    where: { tokenPublico: token, status: "ENVIADO" },
    data: {
      status: resposta,
      respondidoEm: new Date(),
      respondidoPor: nome ? `${nome} (pelo link)` : "Cliente (pelo link)",
      respondidoIp: ip,
      motivoRecusa: resposta === "RECUSADO" ? motivo : null,
    },
  });

  revalidatePath(`/orcamento/${token}`);
}
