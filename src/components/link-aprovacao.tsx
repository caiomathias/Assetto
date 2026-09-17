"use client";

import { useState } from "react";

import { Icone } from "@/components/icones";
import { Botao } from "@/components/ui";

/**
 * Link publico do orcamento. O caso de uso real e: atendente copia e cola no
 * WhatsApp do cliente. Por isso o botao de WhatsApp vem pronto com a
 * mensagem escrita.
 */
export function LinkAprovacao({
  url,
  telefone,
  numero,
  oficina,
}: {
  url: string;
  telefone: string;
  numero: string;
  oficina: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const mensagem =
    `Ola! Aqui e da ${oficina}. ` +
    `Segue o orcamento ${numero} do seu veiculo. ` +
    `Voce pode aprovar ou recusar direto no link: ${url}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copie o link abaixo:", url);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700">{url}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Botao type="button" variante="secundario" onClick={copiar}>
          {copiado ? (
            <>
              <Icone.ok className="h-5 w-5 text-emerald-600" /> Link copiado
            </>
          ) : (
            "Copiar link"
          )}
        </Botao>

        {telefone.length >= 10 && (
          <a
            href={`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700"
          >
            <Icone.whatsapp className="h-5 w-5" />
            Enviar no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
