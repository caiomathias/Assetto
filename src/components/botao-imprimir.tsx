"use client";

import { Icone } from "@/components/icones";
import { Botao } from "@/components/ui";

export function BotaoImprimir({ children = "Imprimir" }: { children?: React.ReactNode }) {
  return (
    <Botao type="button" variante="secundario" onClick={() => window.print()}>
      <Icone.imprimir className="h-5 w-5" />
      {children}
    </Botao>
  );
}
