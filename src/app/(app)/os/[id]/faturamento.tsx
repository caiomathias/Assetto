"use client";

import { useState } from "react";

import { faturarOS } from "../acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { Campo, Entrada, Selecao } from "@/components/ui";
import { dataInput, moeda } from "@/lib/format";
import { FORMA_PAGAMENTO } from "@/lib/rotulos";

/**
 * Fechamento da OS. Uma tela só para o momento em que o cliente paga.
 * Ao confirmar, o sistema baixa as peças do estoque é lanca a receita no
 * financeiro - por isso o aviso explicito antes do botão.
 */
export function FormularioFaturamento({
  ordemId,
  totalCentavos,
}: {
  ordemId: string;
  totalCentavos: number;
}) {
  const [situacao, setSituacao] = useState<"RECEBIDO" | "A_RECEBER">("RECEBIDO");

  return (
    <Formulario acao={faturarOS} className="space-y-4">
      <input type="hidden" name="id" value={ordemId} />

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
        <p className="text-slate-700">Valor a cobrar</p>
        <p className="text-3xl font-black text-slate-900">{moeda(totalCentavos)}</p>
      </div>

      <Campo rotulo="Forma de pagamento" obrigatorio>
        <Selecao name="formaPagamento" defaultValue="PIX" required>
          {Object.entries(FORMA_PAGAMENTO).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </Selecao>
      </Campo>

      <Campo rotulo="O cliente já pagou?" obrigatorio>
        <Selecao
          name="situacao"
          value={situacao}
          onChange={(e) => setSituacao(e.target.value as "RECEBIDO" | "A_RECEBER")}
        >
          <option value="RECEBIDO">Sim, recebido agora</option>
          <option value="A_RECEBER">Não, vai pagar depois</option>
        </Selecao>
      </Campo>

      <Campo
        rotulo={situacao === "RECEBIDO" ? "Data do recebimento" : "Data de vencimento"}
        ajuda={
          situacao === "A_RECEBER"
            ? "Vai aparecer em contas a receber até ser quitado."
            : undefined
        }
      >
        <Entrada name="vencimento" type="date" defaultValue={dataInput(new Date())} />
      </Campo>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
        Ao confirmar, as peças saem do estoque e o valor entra no financeiro. Depois disso os
        itens da OS não podem mais ser alterados.
      </p>

      <BotaoSalvar variante="sucesso" className="w-full">
        Faturar e fechar OS
      </BotaoSalvar>
    </Formulario>
  );
}
