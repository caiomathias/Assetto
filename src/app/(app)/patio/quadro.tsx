"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { moverOS } from "../os/acoes";
import { Icone } from "@/components/icones";
import { cx } from "@/components/ui";
import { moeda } from "@/lib/format";
import { COLUNAS_PATIO, STATUS_OS } from "@/lib/rotulos";
import type { StatusOS } from "@prisma/client";

export type CartaoOS = {
  id: string;
  numero: number;
  status: StatusOS;
  cliente: string;
  placa: string;
  veiculo: string;
  responsavel: string | null;
  totalCentavos: number;
  previsaoEntrega: string | null;
  atrasada: boolean;
};

const CORES_COLUNA: Record<string, string> = {
  cinza: "border-t-slate-400",
  azul: "border-t-blue-500",
  amarelo: "border-t-amber-500",
  verde: "border-t-emerald-500",
  vermelho: "border-t-red-500",
  roxo: "border-t-violet-500",
  laranja: "border-t-orange-500",
};

/**
 * Quadro do pátio.
 *
 * Arrastar e soltar funciona no computador, mas NAO é a única forma de mover
 * a OS: cada cartão tem setas de avançar e voltar. Num tablet engordurado do
 * balcão, arrastar falha; o botão não.
 *
 * O cartão muda de coluna na tela antes da resposta do servidor (estado
 * otimista) para o quadro não "piscar" a cada movimento.
 */
export function QuadroPatio({ cartoes }: { cartoes: CartaoOS[] }) {
  const [otimista, setOtimista] = useState<Record<string, StatusOS>>({});
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<StatusOS | null>(null);
  const [, iniciarTransicao] = useTransition();

  function statusDe(cartao: CartaoOS): StatusOS {
    return otimista[cartao.id] ?? cartao.status;
  }

  function mover(id: string, destino: StatusOS) {
    setOtimista((atual) => ({ ...atual, [id]: destino }));
    iniciarTransicao(async () => {
      await moverOS(id, destino);
      // Deixa o servidor ser a verdade de novo assim que ele responde.
      setOtimista((atual) => {
        const copia = { ...atual };
        delete copia[id];
        return copia;
      });
    });
  }

  function vizinha(status: StatusOS, direcao: -1 | 1): StatusOS | null {
    const indice = COLUNAS_PATIO.indexOf(status);
    if (indice === -1) return null;
    return COLUNAS_PATIO[indice + direcao] ?? null;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUNAS_PATIO.map((coluna) => {
        const rotulo = STATUS_OS[coluna];
        const daColuna = cartoes.filter((c) => statusDe(c) === coluna);
        const total = daColuna.reduce((soma, c) => soma + c.totalCentavos, 0);

        return (
          <section
            key={coluna}
            onDragOver={(e) => {
              e.preventDefault();
              setColunaAlvo(coluna);
            }}
            onDragLeave={() => setColunaAlvo((atual) => (atual === coluna ? null : atual))}
            onDrop={(e) => {
              e.preventDefault();
              setColunaAlvo(null);
              if (arrastando) mover(arrastando, coluna);
              setArrastando(null);
            }}
            className={cx(
              "flex w-72 shrink-0 flex-col rounded-xl border-t-4 bg-slate-200/60 transition-colors",
              CORES_COLUNA[rotulo.tom],
              colunaAlvo === coluna && "bg-marca-100 ring-2 ring-marca-400",
            )}
          >
            <header className="px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold text-slate-900">{rotulo.titulo}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-sm font-bold text-slate-700">
                  {daColuna.length}
                </span>
              </div>
              <p className="text-xs text-slate-600">{rotulo.ajuda}</p>
              {total > 0 && (
                <p className="mt-1 text-sm font-semibold text-slate-700">{moeda(total)}</p>
              )}
            </header>

            <div className="flex-1 space-y-2 px-2 pb-3">
              {daColuna.length === 0 && (
                <p className="rounded-lg border-2 border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                  Nenhum carro aqui
                </p>
              )}

              {daColuna.map((cartao) => {
                const anterior = vizinha(coluna, -1);
                const proxima = vizinha(coluna, 1);

                return (
                  <article
                    key={cartao.id}
                    draggable
                    onDragStart={() => setArrastando(cartao.id)}
                    onDragEnd={() => {
                      setArrastando(null);
                      setColunaAlvo(null);
                    }}
                    className={cx(
                      "rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200",
                      arrastando === cartao.id && "opacity-50",
                    )}
                  >
                    <Link href={`/os/${cartao.id}`} className="block">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs font-bold tracking-wider text-white">
                          {cartao.placa}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500">
                          OS {String(cartao.numero).padStart(4, "0")}
                        </span>
                      </div>

                      <p className="mt-1.5 font-semibold text-slate-900">{cartao.veiculo}</p>
                      <p className="truncate text-sm text-slate-600">{cartao.cliente}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-bold text-slate-900">
                          {moeda(cartao.totalCentavos)}
                        </span>
                        {cartao.responsavel && (
                          <span className="text-slate-500">{cartao.responsavel}</span>
                        )}
                      </div>

                      {cartao.previsaoEntrega && (
                        <p
                          className={cx(
                            "mt-1 flex items-center gap-1 text-sm font-semibold",
                            cartao.atrasada ? "text-red-600" : "text-slate-500",
                          )}
                        >
                          {cartao.atrasada && <Icone.alerta className="h-4 w-4" />}
                          Entrega: {cartao.previsaoEntrega}
                        </p>
                      )}
                    </Link>

                    <div className="mt-3 flex gap-1 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        disabled={!anterior}
                        onClick={() => anterior && mover(cartao.id, anterior)}
                        title={anterior ? `Voltar para ${STATUS_OS[anterior].titulo}` : undefined}
                        className="flex min-h-9 flex-1 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                        aria-label="Voltar etapa"
                      >
                        <Icone.esquerda className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        disabled={!proxima}
                        onClick={() => proxima && mover(cartao.id, proxima)}
                        title={proxima ? `Avançar para ${STATUS_OS[proxima].titulo}` : undefined}
                        className="flex min-h-9 flex-1 items-center justify-center rounded-md bg-marca-600 text-white hover:bg-marca-700 disabled:opacity-30"
                        aria-label="Avançar etapa"
                      >
                        <Icone.direita className="h-5 w-5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
