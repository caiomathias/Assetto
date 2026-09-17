import "server-only";

import type { Prisma, TipoSequencia } from "@prisma/client";

/**
 * Próximo número de OS / orçamento da oficina.
 *
 * Roda dentro da mesma transação do registro que está sendo criado. O `update`
 * atômico no Postgres serializa duas pessoas salvando ao mesmo tempo, então
 * duas OS nunca saem com o mesmo número.
 */
export async function proximoNumero(
  tx: Prisma.TransactionClient,
  oficinaId: string,
  tipo: TipoSequencia,
): Promise<number> {
  const sequencia = await tx.sequencia.upsert({
    where: { oficinaId_tipo: { oficinaId, tipo } },
    create: { oficinaId, tipo, valor: 1 },
    update: { valor: { increment: 1 } },
  });
  return sequencia.valor;
}
