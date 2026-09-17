import Link from "next/link";

import { alternarPagamento, excluirLancamento } from "./acoes";
import { NovoLancamento } from "./novo-lancamento";
import { BotaoAcao } from "@/components/formulario";
import { Aviso, Cabecalho, Cartao, CartaoTitulo, Selo, Vazio, cx } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, moeda } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { FORMA_PAGAMENTO } from "@/lib/rotulos";

export const metadata = { title: "Financeiro - Assetto" };

/** "2026-03" -> primeiro e último instante do mês, no fuso local. */
function faixaDoMes(referencia: string | undefined) {
  const hoje = new Date();
  const [ano, mes] = (referencia ?? "").split("-").map(Number);
  const valido = Number.isInteger(ano) && Number.isInteger(mes) && mes >= 1 && mes <= 12;

  const inicio = valido
    ? new Date(ano, mes - 1, 1)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);

  const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const anterior = new Date(inicio.getFullYear(), inicio.getMonth() - 1, 1);
  const proximo = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);

  return {
    inicio,
    fim,
    titulo: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(inicio),
    chaveAnterior: chave(anterior),
    chaveProximo: chave(proximo),
  };
}

function Indicador({
  titulo,
  valor,
  tom,
  detalhe,
}: {
  titulo: string;
  valor: string;
  tom: "verde" | "vermelho" | "azul" | "amarelo";
  detalhe?: string;
}) {
  const cores = {
    verde: "text-emerald-700",
    vermelho: "text-red-700",
    azul: "text-slate-900",
    amarelo: "text-amber-700",
  };
  return (
    <Cartao className="p-5">
      <p className="text-sm font-semibold text-slate-500">{titulo}</p>
      <p className={cx("mt-1 text-2xl font-black", cores[tom])}>{valor}</p>
      {detalhe && <p className="mt-0.5 text-sm text-slate-500">{detalhe}</p>}
    </Cartao>
  );
}

export default async function PaginaFinanceiro({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; erro?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { mes, erro } = await searchParams;
  const periodo = faixaDoMes(mes);

  // Conta que vence hoje ainda não está atrasada: o corte é a virada do dia,
  // não o fim dele.
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [lancamentos, pendentes] = await Promise.all([
    prisma.lancamento.findMany({
      where: { oficinaId, vencimento: { gte: periodo.inicio, lt: periodo.fim } },
      include: { cliente: true, ordemServico: true },
      orderBy: [{ vencimento: "asc" }, { criadoEm: "asc" }],
    }),
    // Em aberto de qualquer mês: uma conta atrasada de janeiro precisa
    // aparecer mesmo quando a tela está mostrando março.
    prisma.lancamento.findMany({
      where: { oficinaId, pagoEm: null },
      select: { tipo: true, valorCentavos: true, vencimento: true },
    }),
  ]);

  const somar = (lista: { valorCentavos: number }[]) =>
    lista.reduce((soma, l) => soma + l.valorCentavos, 0);

  const recebido = somar(lancamentos.filter((l) => l.tipo === "RECEITA" && l.pagoEm));
  const pago = somar(lancamentos.filter((l) => l.tipo === "DESPESA" && l.pagoEm));
  const aReceber = somar(pendentes.filter((l) => l.tipo === "RECEITA"));
  const aPagar = somar(pendentes.filter((l) => l.tipo === "DESPESA"));
  // Só despesa: este número aparece no detalhe do "a pagar", e contar receita
  // em aberto junto fazia a tela anunciar contas vencidas que não existiam.
  const vencidos = pendentes.filter((l) => l.tipo === "DESPESA" && l.vencimento < hoje);

  return (
    <>
      <Cabecalho
        titulo="Financeiro"
        descricao="O que entrou, o que saiu e o que ainda está para acontecer."
      />

      {erro === "vinculado" && (
        <div className="mb-5">
          <Aviso tom="vermelho">
            Este lançamento veio de uma OS faturada e não pode ser excluído aqui. Para desfazer,
            cancele a ordem de serviço.
          </Aviso>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/financeiro?mes=${periodo.chaveAnterior}`}
            className="flex min-h-11 items-center rounded-lg bg-white px-4 font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Mês anterior
          </Link>
          <span className="px-2 text-lg font-bold text-slate-900 first-letter:uppercase">
            {periodo.titulo}
          </span>
          <Link
            href={`/financeiro?mes=${periodo.chaveProximo}`}
            className="flex min-h-11 items-center rounded-lg bg-white px-4 font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Próximo mês
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo="Entrou no mês" valor={moeda(recebido)} tom="verde" />
        <Indicador titulo="Saiu no mês" valor={moeda(pago)} tom="vermelho" />
        <Indicador
          titulo="Saldo do mês"
          valor={moeda(recebido - pago)}
          tom={recebido - pago >= 0 ? "verde" : "vermelho"}
        />
        <Indicador
          titulo="A receber em aberto"
          valor={moeda(aReceber)}
          tom="amarelo"
          detalhe={`${moeda(aPagar)} a pagar${vencidos.length > 0 ? ` · ${vencidos.length} vencido(s)` : ""}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Cartao>
            <CartaoTitulo>Lançamentos de {periodo.titulo}</CartaoTitulo>

            {lancamentos.length === 0 ? (
              <Vazio
                titulo="Nenhum lançamento neste mês"
                descricao="Ao faturar uma OS o valor entra aqui automaticamente. Contas e vendas avulsas você lança ao lado."
              />
            ) : (
              <ul className="divide-y divide-slate-200">
                {lancamentos.map((lanc) => {
                  const receita = lanc.tipo === "RECEITA";
                  const atrasado = !lanc.pagoEm && lanc.vencimento < hoje;

                  return (
                    <li key={lanc.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">
                          {lanc.ordemServico ? (
                            <Link
                              href={`/os/${lanc.ordemServico.id}`}
                              className="underline decoration-slate-300 hover:decoration-slate-900"
                            >
                              {lanc.descricao}
                            </Link>
                          ) : (
                            lanc.descricao
                          )}
                        </p>
                        <p className="text-sm text-slate-600">
                          {[
                            lanc.categoria,
                            lanc.cliente?.nome,
                            lanc.formaPagamento && FORMA_PAGAMENTO[lanc.formaPagamento],
                            `venc. ${data(lanc.vencimento)}`,
                          ]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      </div>

                      <span
                        className={cx(
                          "text-lg font-bold tabular-nums",
                          receita ? "text-emerald-700" : "text-red-700",
                        )}
                      >
                        {receita ? "+" : "-"} {moeda(lanc.valorCentavos)}
                      </span>

                      <div className="flex items-center gap-2">
                        {lanc.pagoEm ? (
                          <Selo tom="verde">{receita ? "Recebido" : "Pago"}</Selo>
                        ) : (
                          <Selo tom={atrasado ? "vermelho" : "amarelo"}>
                            {atrasado ? "Vencido" : "Em aberto"}
                          </Selo>
                        )}

                        <form action={alternarPagamento}>
                          <input type="hidden" name="id" value={lanc.id} />
                          <BotaoAcao variante={lanc.pagoEm ? "fantasma" : "sucesso"}>
                            {lanc.pagoEm ? "Desfazer" : receita ? "Recebi" : "Paguei"}
                          </BotaoAcao>
                        </form>

                        {!lanc.ordemServicoId && (
                          <form action={excluirLancamento}>
                            <input type="hidden" name="id" value={lanc.id} />
                            <BotaoAcao
                              variante="fantasma"
                              confirmar={`Excluir "${lanc.descricao}"?`}
                            >
                              Excluir
                            </BotaoAcao>
                          </form>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Cartao>
        </div>

        <div>
          <Cartao>
            <CartaoTitulo>Lançar conta ou venda</CartaoTitulo>
            <div className="p-5">
              <NovoLancamento />
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
