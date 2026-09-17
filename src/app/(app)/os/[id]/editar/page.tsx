import { notFound, redirect } from "next/navigation";

import { FormularioOS } from "../../formulario-os";
import { Cabecalho } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { carregarCatalogo, carregarClientes } from "@/lib/consultas";
import { dataInput, moedaSimples } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Editar ordem de serviço - Assetto" };

export default async function PaginaEditarOS({ params }: { params: Promise<{ id: string }> }) {
  const { oficinaId } = await exigirSessao();
  const { id } = await params;

  const ordem = await prisma.ordemServico.findFirst({
    where: { id, oficinaId },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
  if (!ordem) notFound();
  if (ordem.estoqueBaixado) redirect(`/os/${id}`);

  const [clientes, catalogo, mecanicos] = await Promise.all([
    carregarClientes(oficinaId),
    carregarCatalogo(oficinaId),
    prisma.usuario.findMany({
      where: { oficinaId, ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  return (
    <>
      <Cabecalho titulo={`Editar OS ${String(ordem.numero).padStart(4, "0")}`} />
      <FormularioOS
        clientes={clientes}
        catalogo={catalogo}
        mecanicos={mecanicos}
        ordem={{
          id: ordem.id,
          clienteId: ordem.clienteId,
          veiculoId: ordem.veiculoId,
          responsavelId: ordem.responsavelId,
          kmEntrada: ordem.kmEntrada,
          previsaoEntrega: dataInput(ordem.previsaoEntrega),
          descricaoProblema: ordem.descricaoProblema,
          diagnostico: ordem.diagnostico,
          observacoes: ordem.observacoes,
          descontoCentavos: ordem.descontoCentavos,
          itens: ordem.itens.map((item) => ({
            chave: item.id,
            tipo: item.tipo,
            pecaId: item.pecaId,
            servicoId: item.servicoId,
            descricao: item.descricao,
            quantidade: String(item.quantidade).replace(".", ","),
            valorUnit: moedaSimples(item.valorUnitCentavos),
          })),
        }}
      />
    </>
  );
}
