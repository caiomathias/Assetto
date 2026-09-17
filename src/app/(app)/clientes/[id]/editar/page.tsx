import { notFound } from "next/navigation";

import { FormularioCliente } from "../../formulario-cliente";
import { Cabecalho } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Editar cliente - Assetto" };

export default async function PaginaEditarCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({ where: { id, oficinaId } });
  if (!cliente) notFound();

  return (
    <>
      <Cabecalho titulo="Editar cliente" descricao={cliente.nome} />
      <FormularioCliente cliente={cliente} />
    </>
  );
}
