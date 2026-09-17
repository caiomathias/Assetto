"use client";

import { useState } from "react";

import { salvarLancamento } from "./acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { Campo, Entrada, Selecao } from "@/components/ui";
import { dataInput } from "@/lib/format";
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, FORMA_PAGAMENTO } from "@/lib/rotulos";

/**
 * Lancamento manual. O que vem de OS faturada entra sozinho; este formulario
 * e para o resto (aluguel, compra de peca, venda avulsa).
 */
export function NovoLancamento() {
  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const categorias = tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  return (
    <Formulario acao={salvarLancamento} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(["RECEITA", "DESPESA"] as const).map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setTipo(opcao)}
            aria-pressed={tipo === opcao}
            className={
              tipo === opcao
                ? opcao === "RECEITA"
                  ? "min-h-12 rounded-lg bg-emerald-600 font-bold text-white"
                  : "min-h-12 rounded-lg bg-red-600 font-bold text-white"
                : "min-h-12 rounded-lg bg-white font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            }
          >
            {opcao === "RECEITA" ? "Entrou dinheiro" : "Saiu dinheiro"}
          </button>
        ))}
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      <Campo rotulo="Descricao" obrigatorio>
        <Entrada
          name="descricao"
          required
          placeholder={tipo === "RECEITA" ? "Venda de oleo no balcao" : "Aluguel de maio"}
        />
      </Campo>

      <Campo rotulo="Categoria" obrigatorio>
        <Selecao name="categoria" key={tipo} defaultValue={categorias[0]}>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Selecao>
      </Campo>

      <Campo rotulo="Valor (R$)" obrigatorio>
        <Entrada name="valor" inputMode="decimal" required placeholder="0,00" />
      </Campo>

      <Campo rotulo="Vencimento">
        <Entrada name="vencimento" type="date" defaultValue={dataInput(new Date())} />
      </Campo>

      <Campo rotulo="Forma de pagamento">
        <Selecao name="formaPagamento" defaultValue="">
          <option value="">Nao informar</option>
          {Object.entries(FORMA_PAGAMENTO).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </Selecao>
      </Campo>

      <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
        <input type="checkbox" name="jaPago" defaultChecked className="h-5 w-5" />
        <span className="font-semibold text-slate-800">
          {tipo === "RECEITA" ? "Ja recebi esse dinheiro" : "Ja paguei essa conta"}
        </span>
      </label>

      <BotaoSalvar tamanho="normal" className="w-full">
        Lancar
      </BotaoSalvar>
    </Formulario>
  );
}
