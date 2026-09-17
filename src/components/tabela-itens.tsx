import { Selo } from "@/components/ui";
import { moeda, quantidade as formatarQtd } from "@/lib/format";

export type ItemExibido = {
  id: string;
  tipo: "PECA" | "SERVICO";
  descricao: string;
  quantidade: number;
  valorUnitCentavos: number;
  totalCentavos: number;
};

/**
 * Tabela de itens usada no orçamento, na OS e na via impressa.
 * No celular vira lista - tabela de 4 colunas não cabe em tela de 360px.
 */
export function TabelaItens({
  itens,
  descontoCentavos,
  totalCentavos,
}: {
  itens: ItemExibido[];
  descontoCentavos: number;
  totalCentavos: number;
}) {
  const subtotal = itens.reduce((soma, i) => soma + i.totalCentavos, 0);

  return (
    <div>
      {/* Telas pequenas */}
      <ul className="divide-y divide-slate-200 sm:hidden">
        {itens.map((item) => (
          <li key={item.id} className="px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Selo tom={item.tipo === "PECA" ? "azul" : "roxo"}>
                  {item.tipo === "PECA" ? "Peça" : "Serviço"}
                </Selo>
                <p className="mt-1 font-semibold text-slate-900">{item.descricao}</p>
                <p className="text-sm text-slate-600">
                  {formatarQtd(item.quantidade)} x {moeda(item.valorUnitCentavos)}
                </p>
              </div>
              <span className="shrink-0 font-bold text-slate-900">{moeda(item.totalCentavos)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Telas maiores e impressão */}
      <table className="hidden w-full sm:table">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
            <th className="px-5 py-2 font-semibold">Descrição</th>
            <th className="px-3 py-2 text-right font-semibold">Qtd</th>
            <th className="px-3 py-2 text-right font-semibold">Valor unit.</th>
            <th className="px-5 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {itens.map((item) => (
            <tr key={item.id}>
              <td className="px-5 py-3">
                <span className="font-medium text-slate-900">{item.descricao}</span>
                <span className="ml-2 text-sm text-slate-500">
                  {item.tipo === "PECA" ? "peça" : "serviço"}
                </span>
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                {formatarQtd(item.quantidade)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                {moeda(item.valorUnitCentavos)}
              </td>
              <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                {moeda(item.totalCentavos)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div className="ml-auto max-w-xs space-y-1.5">
          <div className="flex justify-between text-slate-700">
            <span>Soma dos itens</span>
            <span className="tabular-nums">{moeda(subtotal)}</span>
          </div>
          {descontoCentavos > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Desconto</span>
              <span className="tabular-nums">- {moeda(descontoCentavos)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-bold text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">{moeda(totalCentavos)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
