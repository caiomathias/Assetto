"use client";

import { useState } from "react";

import { movimentarEstoque } from "../acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { Campo, Entrada, Selecao } from "@/components/ui";
import { quantidade as formatarQtd } from "@/lib/format";

type Tipo = "ENTRADA" | "SAIDA" | "AJUSTE";

const AJUDA: Record<Tipo, string> = {
  ENTRADA: "Chegou peca nova do fornecedor.",
  SAIDA: "Saiu peca sem passar por uma OS (perda, uso interno, devolucao).",
  AJUSTE: "Contagem fisica: digite quantas unidades existem de verdade na prateleira.",
};

export function Movimentar({
  pecaId,
  unidade,
  saldoAtual,
}: {
  pecaId: string;
  unidade: string;
  saldoAtual: number;
}) {
  const [tipo, setTipo] = useState<Tipo>("ENTRADA");

  return (
    <Formulario acao={movimentarEstoque} className="space-y-4">
      <input type="hidden" name="pecaId" value={pecaId} />

      <Campo rotulo="O que aconteceu" obrigatorio>
        <Selecao name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
          <option value="ENTRADA">Entrou peca no estoque</option>
          <option value="SAIDA">Saiu peca do estoque</option>
          <option value="AJUSTE">Acertar pela contagem</option>
        </Selecao>
      </Campo>

      <Campo
        rotulo={
          tipo === "AJUSTE"
            ? `Quantas unidades existem hoje (${unidade})`
            : `Quantidade (${unidade})`
        }
        ajuda={AJUDA[tipo]}
        obrigatorio
      >
        <Entrada
          name="quantidade"
          inputMode="decimal"
          required
          defaultValue={tipo === "AJUSTE" ? formatarQtd(saldoAtual) : ""}
          key={tipo}
        />
      </Campo>

      <Campo rotulo="Motivo (opcional)">
        <Entrada name="motivo" placeholder="Ex: compra na Auto Pecas Silva" />
      </Campo>

      <BotaoSalvar tamanho="normal" className="w-full">
        Registrar movimento
      </BotaoSalvar>
    </Formulario>
  );
}
