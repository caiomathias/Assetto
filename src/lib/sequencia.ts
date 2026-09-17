import "server-only";

import type { Prisma, TipoSequencia } from "@prisma/client";

/**
 * Proximo numero de OS / orcamento da oficina.
 *
 * Roda dentro da mesma transacao do registro que esta sendo criado. O `update`
 * atomico no Postgres serializa duas pessoas salvando ao mesmo tempo, entao
 * duas OS nunca saem com o mesmo numero.
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
