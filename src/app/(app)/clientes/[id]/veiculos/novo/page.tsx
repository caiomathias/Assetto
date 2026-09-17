import { notFound } from "next/navigation";

import { FormularioVeiculo } from "../../../formulario-veiculo";
import { Cabecalho } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Novo veículo - Assetto" };

export default async function PaginaNovoVeiculo({
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
      <Cabecalho titulo="Adicionar veículo" descricao={`Cliente: ${cliente.nome}`} />
      <FormularioVeiculo clienteId={cliente.id} />
    </>
  );
}
