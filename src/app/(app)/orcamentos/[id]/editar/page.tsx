import { notFound, redirect } from "next/navigation";

import { FormularioOrcamento } from "../../formulario-orcamento";
import { Cabecalho } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { carregarCatalogo, carregarClientesIniciais } from "@/lib/consultas";
import { dataInput, moedaSimples } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Editar orçamento - Assetto" };

export default async function PaginaEditarOrcamento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { id } = await params;

  const orcamento = await prisma.orcamento.findFirst({
    where: { id, oficinaId },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
  if (!orcamento) notFound();
  if (orcamento.status === "CONVERTIDO") redirect(`/orcamentos/${id}`);

  const [clientes, catalogo] = await Promise.all([
    carregarClientesIniciais(oficinaId, orcamento.clienteId),
    carregarCatalogo(oficinaId),
  ]);

  return (
    <>
      <Cabecalho
        titulo={`Editar orçamento ${String(orcamento.numero).padStart(4, "0")}`}
        descricao="Alterar itens mantem o mesmo número e o mesmo link do cliente."
      />
      <FormularioOrcamento
        clientes={clientes}
        catalogo={catalogo}
        orcamento={{
          id: orcamento.id,
          clienteId: orcamento.clienteId,
          veiculoId: orcamento.veiculoId,
          validadeAte: dataInput(orcamento.validadeAte),
          kmAtual: orcamento.kmAtual,
          descricaoProblema: orcamento.descricaoProblema,
          observacoes: orcamento.observacoes,
          descontoCentavos: orcamento.descontoCentavos,
          itens: orcamento.itens.map((item) => ({
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
