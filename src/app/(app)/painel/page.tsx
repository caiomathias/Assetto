import Link from "next/link";

import { Icone } from "@/components/icones";
import { BotaoLink, Cabecalho, Cartao, CartaoTitulo, Selo, Vazio, cx } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, moeda, placa } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { STATUS_OS } from "@/lib/rotulos";

export const metadata = { title: "Painel - Assetto" };

function Numero({
  titulo,
  valor,
  detalhe,
  href,
  tom = "azul",
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  href: string;
  tom?: "azul" | "verde" | "vermelho" | "amarelo";
}) {
  const cores = {
    azul: "text-slate-900",
    verde: "text-emerald-700",
    vermelho: "text-red-700",
    amarelo: "text-amber-700",
  };

  return (
    <Link href={href}>
      <Cartao className="h-full p-5 transition-shadow hover:shadow-md">
        <p className="text-sm font-semibold text-slate-500">{titulo}</p>
        <p className={cx("mt-1 text-3xl font-black", cores[tom])}>{valor}</p>
        {detalhe && <p className="mt-0.5 text-sm text-slate-500">{detalhe}</p>}
      </Cartao>
    </Link>
  );
}

export default async function PaginaPainel() {
  const sessao = await exigirSessao();
  const oficinaId = sessao.oficinaId;

  const agora = new Date();
  const inicioDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimDoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
  const fimDeHoje = new Date(agora);
  fimDeHoje.setHours(23, 59, 59, 999);

  const [
    noPatio,
    prontos,
    aguardandoAprovacao,
    recebidoNoMes,
    pagoNoMes,
    aReceber,
    pecasEmFalta,
    contatosParaHoje,
    ultimasOS,
  ] = await Promise.all([
    prisma.ordemServico.count({
      where: {
        oficinaId,
        status: { in: ["RECEBIDO", "AGUARDANDO_APROVACAO", "EM_EXECUCAO", "AGUARDANDO_PECA"] },
      },
    }),
    prisma.ordemServico.count({ where: { oficinaId, status: "PRONTO" } }),
    prisma.orcamento.count({ where: { oficinaId, status: "ENVIADO" } }),
    prisma.lancamento.aggregate({
      where: {
        oficinaId,
        tipo: "RECEITA",
        pagoEm: { gte: inicioDoMes, lt: fimDoMes },
      },
      _sum: { valorCentavos: true },
    }),
    prisma.lancamento.aggregate({
      where: {
        oficinaId,
        tipo: "DESPESA",
        pagoEm: { gte: inicioDoMes, lt: fimDoMes },
      },
      _sum: { valorCentavos: true },
    }),
    prisma.lancamento.aggregate({
      where: { oficinaId, tipo: "RECEITA", pagoEm: null },
      _sum: { valorCentavos: true },
      _count: true,
    }),
    // O Prisma nao compara duas colunas da mesma tabela, entao o filtro de
    // "abaixo do minimo" e feito em SQL puro.
    prisma.$queryRaw<{ id: string; nome: string; quantidade: number; unidade: string }[]>`
      SELECT id, nome, quantidade, unidade
      FROM "Peca"
      WHERE "oficinaId" = ${oficinaId}
        AND ativo = true
        AND quantidade <= "estoqueMinimo"
      ORDER BY nome ASC
      LIMIT 8
    `,
    prisma.oportunidade.findMany({
      where: {
        oficinaId,
        etapa: { in: ["NOVO", "CONTATO_FEITO", "ORCAMENTO_ENVIADO", "NEGOCIACAO"] },
        proximoContatoEm: { lte: fimDeHoje },
      },
      orderBy: { proximoContatoEm: "asc" },
      take: 8,
    }),
    prisma.ordemServico.findMany({
      where: { oficinaId, status: { notIn: ["ENTREGUE", "CANCELADO"] } },
      include: { cliente: true, veiculo: true },
      orderBy: { criadoEm: "desc" },
      take: 8,
    }),
  ]);

  const entrou = recebidoNoMes._sum.valorCentavos ?? 0;
  const saiu = pagoNoMes._sum.valorCentavos ?? 0;

  const primeiroNome = sessao.nome.split(" ")[0];

  return (
    <>
      <Cabecalho
        titulo={`Ola, ${primeiroNome}`}
        descricao="Resumo de hoje na oficina."
        acao={
          <>
            <BotaoLink href="/orcamentos/novo" variante="secundario">
              Novo orcamento
            </BotaoLink>
            <BotaoLink href="/os/nova">
              <Icone.mais className="h-5 w-5" />
              Nova OS
            </BotaoLink>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Numero
          titulo="Carros na oficina"
          valor={String(noPatio)}
          detalhe={prontos > 0 ? `${prontos} pronto(s) para retirada` : "Em andamento"}
          href="/patio"
        />
        <Numero
          titulo="Orcamentos aguardando"
          valor={String(aguardandoAprovacao)}
          detalhe="Esperando resposta do cliente"
          href="/orcamentos?status=ENVIADO"
          tom="amarelo"
        />
        <Numero
          titulo="Entrou este mes"
          valor={moeda(entrou)}
          detalhe={`Saiu ${moeda(saiu)} - saldo ${moeda(entrou - saiu)}`}
          href="/financeiro"
          tom="verde"
        />
        <Numero
          titulo="A receber"
          valor={moeda(aReceber._sum.valorCentavos ?? 0)}
          detalhe={`${aReceber._count} conta(s) em aberto`}
          href="/financeiro"
          tom="amarelo"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Cartao>
            <CartaoTitulo
              acao={
                <BotaoLink href="/patio" variante="secundario" tamanho="pequeno">
                  Ver patio
                </BotaoLink>
              }
            >
              Servicos em andamento
            </CartaoTitulo>

            {ultimasOS.length === 0 ? (
              <Vazio
                titulo="Nenhum servico em andamento"
                descricao="Quando um carro entrar, abra a ordem de servico para ele aparecer aqui."
                acao={<BotaoLink href="/os/nova">Abrir OS</BotaoLink>}
              />
            ) : (
              <ul className="divide-y divide-slate-200">
                {ultimasOS.map((os) => (
                  <li key={os.id}>
                    <Link
                      href={`/os/${os.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs font-bold tracking-wider text-white">
                            {placa(os.veiculo.placa)}
                          </span>
                          <span className="font-semibold text-slate-900">{os.cliente.nome}</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {os.veiculo.marca} {os.veiculo.modelo}
                          {os.previsaoEntrega && ` - entrega ${data(os.previsaoEntrega)}`}
                        </p>
                      </div>
                      <Selo tom={STATUS_OS[os.status].tom}>{STATUS_OS[os.status].titulo}</Selo>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>

        <div className="space-y-6">
          <Cartao>
            <CartaoTitulo
              acao={
                <BotaoLink href="/crm" variante="secundario" tamanho="pequeno">
                  Ver CRM
                </BotaoLink>
              }
            >
              Falar hoje
            </CartaoTitulo>

            {contatosParaHoje.length === 0 ? (
              <p className="px-5 py-6 text-center text-slate-600">
                Nenhum contato marcado para hoje.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {contatosParaHoje.map((contato) => (
                  <li key={contato.id} className="px-5 py-3">
                    <p className="font-semibold text-slate-900">{contato.nomeContato}</p>
                    <p className="text-sm text-slate-600">
                      {contato.proximoContatoEm && data(contato.proximoContatoEm)}
                      {contato.valorEstimadoCentavos > 0 &&
                        ` - ${moeda(contato.valorEstimadoCentavos)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao>
            <CartaoTitulo
              acao={
                <BotaoLink href="/pecas" variante="secundario" tamanho="pequeno">
                  Ver pecas
                </BotaoLink>
              }
            >
              Pecas para repor
            </CartaoTitulo>

            {pecasEmFalta.length === 0 ? (
              <p className="px-5 py-6 text-center text-slate-600">Estoque em dia.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {pecasEmFalta.map((peca) => (
                  <li key={peca.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <Link
                      href={`/pecas/${peca.id}`}
                      className="min-w-0 flex-1 truncate font-medium text-slate-900 hover:underline"
                    >
                      {peca.nome}
                    </Link>
                    <Selo tom={peca.quantidade < 0 ? "vermelho" : "amarelo"}>
                      {peca.quantidade} {peca.unidade}
                    </Selo>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      </div>
    </>
  );
}
