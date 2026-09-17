import { NovaOportunidade } from "./nova-oportunidade";
import { QuadroCrm, type CartaoCrm } from "./quadro";
import { Cabecalho, Cartao, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, moeda } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "CRM - Assetto" };

export default async function PaginaCrm() {
  const { oficinaId } = await exigirSessao();

  // Ganho/perdido antigo sai do quadro: o funil serve para o que ainda pode
  // virar dinheiro. O historico continua no banco.
  const limite = new Date();
  limite.setDate(limite.getDate() - 30);

  const oportunidades = await prisma.oportunidade.findMany({
    where: {
      oficinaId,
      OR: [
        { etapa: { in: ["NOVO", "CONTATO_FEITO", "ORCAMENTO_ENVIADO", "NEGOCIACAO"] } },
        { etapa: { in: ["GANHO", "PERDIDO"] }, fechadoEm: { gte: limite } },
      ],
    },
    orderBy: [{ proximoContatoEm: "asc" }, { criadoEm: "desc" }],
  });

  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  const cartoes: CartaoCrm[] = oportunidades.map((o) => ({
    id: o.id,
    nomeContato: o.nomeContato,
    telefone: o.telefone,
    origem: o.origem,
    etapa: o.etapa,
    valorEstimadoCentavos: o.valorEstimadoCentavos,
    proximoContatoEm: o.proximoContatoEm ? data(o.proximoContatoEm) : null,
    atrasado: o.proximoContatoEm !== null && o.proximoContatoEm < hoje,
    observacoes: o.observacoes,
  }));

  const emAberto = cartoes.filter(
    (c) => c.etapa !== "GANHO" && c.etapa !== "PERDIDO",
  );
  const potencial = emAberto.reduce((soma, c) => soma + c.valorEstimadoCentavos, 0);

  return (
    <>
      <Cabecalho
        titulo="CRM"
        descricao={
          emAberto.length > 0
            ? `${emAberto.length} contato(s) em aberto, somando ${moeda(potencial)} em potencial.`
            : "Acompanhe quem pediu preco e ainda nao fechou."
        }
      />

      <div className="mb-6">
        <NovaOportunidade />
      </div>

      {cartoes.length === 0 ? (
        <Cartao>
          <Vazio
            titulo="Nenhum contato no funil"
            descricao="Anote aqui quem ligou pedindo preco, quem veio pelo Instagram, quem prometeu voltar. Sem isso, essas pessoas somem."
          />
        </Cartao>
      ) : (
        <QuadroCrm cartoes={cartoes} />
      )}
    </>
  );
}
