"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

import { Entrada } from "@/components/ui";
import { mascaraCep, mascaraDocumento, mascaraTelefone, soDigitos } from "@/lib/format";

type Props = Omit<ComponentProps<typeof Entrada>, "value" | "onChange" | "defaultValue"> & {
  defaultValue?: string | null;
};

/**
 * Campo que se formata sozinho enquanto a pessoa digita.
 *
 * O detalhe que dá trabalho é o cursor: ao inserir um ponto ou um parêntese, o
 * texto cresce e o cursor "pula" para o fim se ninguém cuidar. Quem edita o
 * meio do número — o caso de corrigir um dígito errado — perderia a posição a
 * cada tecla. Por isso a posição é recalculada contando DÍGITOS antes do
 * cursor, não caracteres: a pontuação entra e sai sem mover o ponto de edição.
 */
function CampoMascarado({
  mascara,
  defaultValue,
  ...props
}: Props & { mascara: (valor: string) => string }) {
  const [valor, setValor] = useState(() => mascara(defaultValue ?? ""));
  const refInput = useRef<HTMLInputElement>(null);
  const digitosAntesDoCursor = useRef<number | null>(null);

  useLayoutEffect(() => {
    const alvo = digitosAntesDoCursor.current;
    const input = refInput.current;
    if (alvo === null || !input) return;
    digitosAntesDoCursor.current = null;

    let posicao = 0;
    let contados = 0;
    while (posicao < valor.length && contados < alvo) {
      if (/\d/.test(valor[posicao])) contados += 1;
      posicao += 1;
    }
    // Pula a pontuação logo à frente, para não deixar o cursor "atrás" do ponto.
    while (posicao < valor.length && !/\d/.test(valor[posicao])) posicao += 1;
    input.setSelectionRange(posicao, posicao);
  }, [valor]);

  return (
    <Entrada
      inputMode="numeric"
      {...props}
      ref={refInput}
      value={valor}
      onChange={(e) => {
        const input = e.target;
        const ate = input.value.slice(0, input.selectionStart ?? input.value.length);
        digitosAntesDoCursor.current = soDigitos(ate).length;
        setValor(mascara(input.value));
      }}
    />
  );
}

export function EntradaTelefone(props: Props) {
  return (
    <CampoMascarado
      inputMode="tel"
      placeholder="(11) 98888-7777"
      {...props}
      mascara={mascaraTelefone}
    />
  );
}

export function EntradaDocumento(props: Props) {
  return <CampoMascarado placeholder="000.000.000-00" {...props} mascara={mascaraDocumento} />;
}

export function EntradaCep(props: Props) {
  return <CampoMascarado placeholder="00000-000" {...props} mascara={mascaraCep} />;
}
