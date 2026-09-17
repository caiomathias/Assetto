import { notFound } from "next/navigation";

import { responderOrcamento } from "./acoes";
import { TabelaItens } from "@/components/tabela-itens";
import { data, dataHora, moeda, placa, telefone } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Seu orçamento",
  robots: { index: false, follow: false },
};

/**
 * Página que o cliente da oficina abre no celular. Regras:
 * - Sem login, sem menu, sem jargao de sistema.
 * - Duas ações possíveis e só duas: aprovar ou recusar.
 * - Depois de responder, a página vira um comprovante do que foi decidido.
 */
export default async function PaginaPublicaOrcamento({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const orcamento = await prisma.orcamento.findUnique({
    where: { tokenPublico: token },
    include: {
      oficina: true,
      cliente: true,
      veiculo: true,
      itens: { orderBy: { ordem: "asc" } },
    },
  });

  // Rascunho ainda não foi enviado: o link não deve funcionar.
  if (!orcamento || orcamento.status === "RASCUNHO") notFound();

  const numero = String(orcamento.numero).padStart(4, "0");
  const podeResponder = orcamento.status === "ENVIADO";
  const aprovado = orcamento.status === "APROVADO" || orcamento.status === "CONVERTIDO";
  const vencido =
    orcamento.validadeAte !== null && orcamento.validadeAte < new Date() && podeResponder;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-xl bg-white px-5 py-6 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-xl font-black text-slate-900">{orcamento.oficina.nome}</p>
          {orcamento.oficina.telefone && (
            <p className="text-slate-600">{telefone(orcamento.oficina.telefone)}</p>
          )}
          <p className="mt-4 text-2xl font-bold text-slate-900">Orçamento {numero}</p>
          <p className="text-slate-600">
            {orcamento.veiculo.marca} {orcamento.veiculo.modelo} - {placa(orcamento.veiculo.placa)}
          </p>
        </header>

        {aprovado && (
          <div className="rounded-xl bg-emerald-600 px-5 py-5 text-center text-white shadow-sm">
            <p className="text-xl font-bold">Orçamento aprovado</p>
            {orcamento.respondidoEm && (
              <p className="mt-1 text-emerald-50">Em {dataHora(orcamento.respondidoEm)}</p>
            )}
            <p className="mt-2 text-emerald-50">
              A oficina já foi avisada e vai iniciar o serviço.
            </p>
          </div>
        )}

        {orcamento.status === "RECUSADO" && (
          <div className="rounded-xl bg-slate-700 px-5 py-5 text-center text-white shadow-sm">
            <p className="text-xl font-bold">Orçamento recusado</p>
            {orcamento.respondidoEm && (
              <p className="mt-1 text-slate-200">Em {dataHora(orcamento.respondidoEm)}</p>
            )}
            <p className="mt-2 text-slate-200">
              Se mudar de ideia, é só falar com a oficina pelo telefone acima.
            </p>
          </div>
        )}

        {vencido && (
          <div className="rounded-xl bg-amber-100 px-5 py-4 text-amber-900 ring-1 ring-amber-200">
            <p className="font-semibold">
              Este orçamento venceu em {data(orcamento.validadeAte)}.
            </p>
            <p>Você ainda pode aprovar, mas confirme os valores com a oficina antes.</p>
          </div>
        )}

        {orcamento.descricaoProblema && (
          <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <h2 className="border-b border-slate-200 px-5 py-3 font-bold text-slate-900">
              O que você relatou
            </h2>
            <p className="px-5 py-4 whitespace-pre-wrap text-slate-800">
              {orcamento.descricaoProblema}
            </p>
          </section>
        )}

        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <h2 className="border-b border-slate-200 px-5 py-3 font-bold text-slate-900">
            O que será feito
          </h2>
          <TabelaItens
            itens={orcamento.itens}
            descontoCentavos={orcamento.descontoCentavos}
            totalCentavos={orcamento.totalCentavos}
          />
        </section>

        {orcamento.observacoes && (
          <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <h2 className="border-b border-slate-200 px-5 py-3 font-bold text-slate-900">
              Observações
            </h2>
            <p className="px-5 py-4 whitespace-pre-wrap text-slate-800">{orcamento.observacoes}</p>
          </section>
        )}

        {podeResponder ? (
          <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-center">
              <p className="text-slate-700">Valor total do serviço</p>
              <p className="text-4xl font-black text-slate-900">{moeda(orcamento.totalCentavos)}</p>
              {orcamento.validadeAte && !vencido && (
                <p className="mt-1 text-slate-600">Válido até {data(orcamento.validadeAte)}</p>
              )}
            </div>

            <form action={responderOrcamento} className="space-y-3">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="resposta" value="APROVADO" />
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Seu nome (opcional)
                </span>
                <input
                  name="nome"
                  defaultValue={orcamento.cliente.nome}
                  className="w-full min-h-12 rounded-lg border border-slate-300 px-3 text-base"
                />
              </label>
              <button
                type="submit"
                className="min-h-16 w-full rounded-xl bg-emerald-600 text-xl font-bold text-white hover:bg-emerald-700"
              >
                Aprovar e autorizar o serviço
              </button>
            </form>

            <details className="rounded-lg bg-slate-50 p-4">
              <summary className="cursor-pointer font-semibold text-slate-700">
                Não quero fazer agora
              </summary>
              <form action={responderOrcamento} className="mt-3 space-y-3">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="resposta" value="RECUSADO" />
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">
                    Quer contar o motivo? (opcional)
                  </span>
                  <input
                    name="motivo"
                    placeholder="Ex: valor acima do esperado"
                    className="w-full min-h-12 rounded-lg border border-slate-300 px-3 text-base"
                  />
                </label>
                <button
                  type="submit"
                  className="min-h-12 w-full rounded-lg bg-white font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                >
                  Recusar orçamento
                </button>
              </form>
            </details>
          </section>
        ) : (
          <section className="rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-700">Valor total</p>
            <p className="text-3xl font-black text-slate-900">{moeda(orcamento.totalCentavos)}</p>
          </section>
        )}

        <p className="pb-6 text-center text-sm text-slate-500">
          Orçamento gerado pelo Assetto. Em caso de dúvida, fale com a oficina.
        </p>
      </div>
    </main>
  );
}
