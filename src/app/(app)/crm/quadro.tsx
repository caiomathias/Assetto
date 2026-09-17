"use client";

import { useState, useTransition } from "react";

import { excluirOportunidade, moverOportunidade } from "./acoes";
import { BotaoAcao } from "@/components/formulario";
import { Icone } from "@/components/icones";
import { cx } from "@/components/ui";
import { moeda } from "@/lib/format";
import { COLUNAS_CRM, ETAPA_CRM } from "@/lib/rotulos";
import type { EtapaCrm } from "@prisma/client";

export type CartaoCrm = {
  id: string;
  nomeContato: string;
  telefone: string | null;
  origem: string | null;
  etapa: EtapaCrm;
  valorEstimadoCentavos: number;
  proximoContatoEm: string | null;
  atrasado: boolean;
  observacoes: string | null;
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
 * Funil de vendas. Mesmo formato do patio de proposito: quem aprendeu a
 * mexer numa tela ja sabe mexer na outra.
 */
export function QuadroCrm({ cartoes }: { cartoes: CartaoCrm[] }) {
  const [otimista, setOtimista] = useState<Record<string, EtapaCrm>>({});
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<EtapaCrm | null>(null);
  const [, iniciarTransicao] = useTransition();

  function etapaDe(cartao: CartaoCrm): EtapaCrm {
    return otimista[cartao.id] ?? cartao.etapa;
  }

  function mover(id: string, destino: EtapaCrm) {
    setOtimista((atual) => ({ ...atual, [id]: destino }));
    iniciarTransicao(async () => {
      await moverOportunidade(id, destino);
      setOtimista((atual) => {
        const copia = { ...atual };
        delete copia[id];
        return copia;
      });
    });
  }

  function vizinha(etapa: EtapaCrm, direcao: -1 | 1): EtapaCrm | null {
    const indice = COLUNAS_CRM.indexOf(etapa);
    if (indice === -1) return null;
    return COLUNAS_CRM[indice + direcao] ?? null;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUNAS_CRM.map((coluna) => {
        const rotulo = ETAPA_CRM[coluna];
        const daColuna = cartoes.filter((c) => etapaDe(c) === coluna);
        const total = daColuna.reduce((soma, c) => soma + c.valorEstimadoCentavos, 0);

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
                  Vazio
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
                    <p className="font-semibold text-slate-900">{cartao.nomeContato}</p>
                    {cartao.telefone && (
                      <a
                        href={`https://wa.me/55${cartao.telefone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
                      >
                        <Icone.whatsapp className="h-4 w-4" />
                        Chamar no WhatsApp
                      </a>
                    )}

                    {cartao.valorEstimadoCentavos > 0 && (
                      <p className="mt-1 font-bold text-slate-900">
                        {moeda(cartao.valorEstimadoCentavos)}
                      </p>
                    )}
                    {cartao.origem && (
                      <p className="text-sm text-slate-500">Veio de: {cartao.origem}</p>
                    )}
                    {cartao.observacoes && (
                      <p className="mt-1 line-clamp-3 text-sm text-slate-600">
                        {cartao.observacoes}
                      </p>
                    )}
                    {cartao.proximoContatoEm && (
                      <p
                        className={cx(
                          "mt-1 flex items-center gap-1 text-sm font-semibold",
                          cartao.atrasado ? "text-red-600" : "text-slate-500",
                        )}
                      >
                        {cartao.atrasado && <Icone.alerta className="h-4 w-4" />}
                        Falar em {cartao.proximoContatoEm}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        disabled={!anterior}
                        onClick={() => anterior && mover(cartao.id, anterior)}
                        className="flex min-h-9 flex-1 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                        aria-label="Voltar etapa"
                      >
                        <Icone.esquerda className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        disabled={!proxima}
                        onClick={() => proxima && mover(cartao.id, proxima)}
                        className="flex min-h-9 flex-1 items-center justify-center rounded-md bg-marca-600 text-white hover:bg-marca-700 disabled:opacity-30"
                        aria-label="Avancar etapa"
                      >
                        <Icone.direita className="h-5 w-5" />
                      </button>
                      <form action={excluirOportunidade}>
                        <input type="hidden" name="id" value={cartao.id} />
                        <BotaoAcao
                          variante="fantasma"
                          confirmar={`Excluir o contato ${cartao.nomeContato}?`}
                        >
                          <Icone.fechar className="h-4 w-4" />
                        </BotaoAcao>
                      </form>
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
