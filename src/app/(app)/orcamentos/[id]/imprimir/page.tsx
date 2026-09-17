import { notFound } from "next/navigation";

import { BotaoImprimir } from "@/components/botao-imprimir";
import { Documento } from "@/components/documento";
import { BotaoLink } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Imprimir orçamento - Assetto" };

export default async function PaginaImprimirOrcamento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { id } = await params;

  const orcamento = await prisma.orcamento.findFirst({
    where: { id, oficinaId },
    include: {
      cliente: true,
      veiculo: true,
      oficina: true,
      itens: { orderBy: { ordem: "asc" } },
    },
  });
  if (!orcamento) notFound();

  const endereco = [
    orcamento.cliente.endereco &&
      `${orcamento.cliente.endereco}${orcamento.cliente.numero ? `, ${orcamento.cliente.numero}` : ""}`,
    orcamento.cliente.bairro,
    orcamento.cliente.cidade,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <>
      <div className="no-print mb-5 flex flex-wrap gap-3">
        <BotaoLink href={`/orcamentos/${orcamento.id}`} variante="secundario">
          Voltar
        </BotaoLink>
        <BotaoImprimir>Imprimir esta via</BotaoImprimir>
      </div>

      <Documento
        tipo="Orçamento"
        numero={String(orcamento.numero).padStart(4, "0")}
        emissao={orcamento.criadoEm}
        oficina={orcamento.oficina}
        cliente={{
          nome: orcamento.cliente.nome,
          telefone: orcamento.cliente.telefone,
          documento: orcamento.cliente.documento,
          endereco: endereco || null,
        }}
        veiculo={{
          placa: orcamento.veiculo.placa,
          marca: orcamento.veiculo.marca,
          modelo: orcamento.veiculo.modelo,
          anoFabricacao: orcamento.veiculo.anoFabricacao,
          cor: orcamento.veiculo.cor,
          kmAtual: orcamento.kmAtual ?? orcamento.veiculo.kmAtual,
        }}
        problema={orcamento.descricaoProblema}
        observacoes={orcamento.observacoes}
        itens={orcamento.itens}
        descontoCentavos={orcamento.descontoCentavos}
        totalCentavos={orcamento.totalCentavos}
        rodape={
          orcamento.validadeAte
            ? `Este orçamento vale até ${data(orcamento.validadeAte)}. Preços sujeitos a alteração após essa data.`
            : undefined
        }
      />
    </>
  );
}
