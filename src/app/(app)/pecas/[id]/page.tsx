import { notFound } from "next/navigation";

import { excluirPeca } from "../acoes";
import { FormularioPeca } from "../formulario-peca";
import { Movimentar } from "./movimentar";
import { BotaoAcao } from "@/components/formulario";
import { Aviso, Cabecalho, Cartao, CartaoTitulo, Selo, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { dataHora, moeda, quantidade as formatarQtd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { TIPO_MOVIMENTO } from "@/lib/rotulos";

export const metadata = { title: "Peça - Assetto" };

export default async function PaginaPeca({ params }: { params: Promise<{ id: string }> }) {
  const { oficinaId } = await exigirSessao();
  const { id } = await params;

  const peca = await prisma.peca.findFirst({
    where: { id, oficinaId },
    include: {
      movimentos: {
        orderBy: { criadoEm: "desc" },
        take: 30,
        include: { usuario: true, ordemServico: true },
      },
    },
  });
  if (!peca) notFound();

  const margem =
    peca.precoCustoCentavos > 0
      ? Math.round(
          ((peca.precoVendaCentavos - peca.precoCustoCentavos) / peca.precoCustoCentavos) * 100,
        )
      : null;

  return (
    <>
      <Cabecalho
        titulo={peca.nome}
        descricao={[peca.codigo, peca.marca].filter(Boolean).join(" - ") || "Sem código"}
      />

      {peca.quantidade < 0 && (
        <div className="mb-5">
          <Aviso tom="vermelho">
            O estoque desta peça está negativo ({formatarQtd(peca.quantidade)} {peca.unidade}).
            Isso acontece quando a peça foi usada numa OS sem ter sido dada entrada antes. Use
            &quot;Acertar pela contagem&quot; para corrigir.
          </Aviso>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FormularioPeca peca={peca} />

          <Cartao>
            <CartaoTitulo>Histórico de movimentos</CartaoTitulo>
            {peca.movimentos.length === 0 ? (
              <Vazio titulo="Nenhum movimento registrado" />
            ) : (
              <ul className="divide-y divide-slate-200">
                {peca.movimentos.map((mov) => (
                  <li key={mov.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Selo tom={TIPO_MOVIMENTO[mov.tipo].tom}>{TIPO_MOVIMENTO[mov.tipo].titulo}</Selo>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {mov.quantidade > 0 ? "+" : ""}
                        {formatarQtd(mov.quantidade)} {peca.unidade}
                        <span className="ml-2 font-normal text-slate-500">
                          saldo: {formatarQtd(mov.saldoDepois)}
                        </span>
                      </p>
                      <p className="text-sm text-slate-600">
                        {[
                          mov.motivo,
                          mov.usuario?.nome,
                          dataHora(mov.criadoEm),
                        ]
                          .filter(Boolean)
                          .join(" - ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>

        <div className="space-y-6">
          <Cartao>
            <CartaoTitulo>Situação</CartaoTitulo>
            <dl className="space-y-3 p-5">
              <div>
                <dt className="text-sm font-semibold text-slate-500">Em estoque</dt>
                <dd className="text-3xl font-black text-slate-900">
                  {formatarQtd(peca.quantidade)}{" "}
                  <span className="text-lg font-semibold text-slate-500">{peca.unidade}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-500">Estoque mínimo</dt>
                <dd className="text-slate-900">
                  {formatarQtd(peca.estoqueMinimo)} {peca.unidade}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-500">Custo / Venda</dt>
                <dd className="text-slate-900">
                  {moeda(peca.precoCustoCentavos)} / {moeda(peca.precoVendaCentavos)}
                </dd>
                {margem !== null && (
                  <dd className="text-sm text-slate-600">Margem de {margem}%</dd>
                )}
              </div>
              {peca.localizacao && (
                <div>
                  <dt className="text-sm font-semibold text-slate-500">Onde fica</dt>
                  <dd className="text-slate-900">{peca.localizacao}</dd>
                </div>
              )}
            </dl>
          </Cartao>

          <Cartao>
            <CartaoTitulo>Mexer no estoque</CartaoTitulo>
            <div className="p-5">
              <Movimentar
                pecaId={peca.id}
                unidade={peca.unidade}
                saldoAtual={peca.quantidade}
              />
            </div>
          </Cartao>

          <Cartao>
            <div className="p-5">
              <form action={excluirPeca}>
                <input type="hidden" name="id" value={peca.id} />
                <BotaoAcao
                  variante="perigo"
                  tamanho="normal"
                  className="w-full"
                  confirmar={`Excluir a peça ${peca.nome}?`}
                >
                  Excluir peça
                </BotaoAcao>
              </form>
              <p className="mt-2 text-sm text-slate-500">
                Peças já usadas em alguma OS são apenas desativadas, para o histórico continuar
                correto.
              </p>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
