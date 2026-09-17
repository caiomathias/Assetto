import { notFound } from "next/navigation";

import { FormularioVeiculo } from "../../../formulario-veiculo";
import { Cabecalho } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { placa } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Editar veículo - Assetto" };

export default async function PaginaEditarVeiculo({
  params,
}: {
  params: Promise<{ id: string; veiculoId: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { id, veiculoId } = await params;

  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, oficinaId, clienteId: id },
    include: { cliente: true },
  });
  if (!veiculo) notFound();

  return (
    <>
      <Cabecalho
        titulo={`${placa(veiculo.placa)} - ${veiculo.marca} ${veiculo.modelo}`}
        descricao={`Cliente: ${veiculo.cliente.nome}`}
      />
      <FormularioVeiculo clienteId={id} veiculo={veiculo} />
    </>
  );
}
