import { notFound } from "next/navigation";

import { BotaoImprimir } from "@/components/botao-imprimir";
import { Documento } from "@/components/documento";
import { BotaoLink } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Imprimir OS - Assetto" };

export default async function PaginaImprimirOS({ params }: { params: Promise<{ id: string }> }) {
  const { oficinaId } = await exigirSessao();
  const { id } = await params;

  const ordem = await prisma.ordemServico.findFirst({
    where: { id, oficinaId },
    include: {
      cliente: true,
      veiculo: true,
      oficina: true,
      responsavel: true,
      itens: { orderBy: { ordem: "asc" } },
    },
  });
  if (!ordem) notFound();

  const endereco = [
    ordem.cliente.endereco &&
      `${ordem.cliente.endereco}${ordem.cliente.numero ? `, ${ordem.cliente.numero}` : ""}`,
    ordem.cliente.bairro,
    ordem.cliente.cidade,
  ]
    .filter(Boolean)
    .join(" - ");

  const relato = [
    ordem.descricaoProblema && `Cliente relatou: ${ordem.descricaoProblema}`,
    ordem.diagnostico && `Diagnostico da oficina: ${ordem.diagnostico}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <>
      <div className="nao-imprimir mb-5 flex flex-wrap gap-3">
        <BotaoLink href={`/os/${ordem.id}`} variante="secundario">
          Voltar
        </BotaoLink>
        <BotaoImprimir>Imprimir esta via</BotaoImprimir>
      </div>

      <Documento
        tipo="Ordem de servico"
        numero={String(ordem.numero).padStart(4, "0")}
        emissao={ordem.criadoEm}
        oficina={ordem.oficina}
        cliente={{
          nome: ordem.cliente.nome,
          telefone: ordem.cliente.telefone,
          documento: ordem.cliente.documento,
          endereco: endereco || null,
        }}
        veiculo={{
          placa: ordem.veiculo.placa,
          marca: ordem.veiculo.marca,
          modelo: ordem.veiculo.modelo,
          anoFabricacao: ordem.veiculo.anoFabricacao,
          cor: ordem.veiculo.cor,
          kmAtual: ordem.kmEntrada ?? ordem.veiculo.kmAtual,
        }}
        problema={relato || null}
        observacoes={ordem.observacoes}
        itens={ordem.itens}
        descontoCentavos={ordem.descontoCentavos}
        totalCentavos={ordem.totalCentavos}
        rodape={
          ordem.responsavel
            ? `Mecanico responsavel: ${ordem.responsavel.nome}`
            : "Declaro que autorizei os servicos descritos acima."
        }
      />
    </>
  );
}
