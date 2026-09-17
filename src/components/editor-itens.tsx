"use client";

import { useMemo, useState } from "react";

import { Icone } from "@/components/icones";
import { Botao, Cartao, CartaoTitulo, Selo, cx } from "@/components/ui";
import { moeda, moedaSimples, paraCentavos, paraQuantidade } from "@/lib/format";

export type ItemCatalogo = {
  id: string;
  tipo: "PECA" | "SERVICO";
  nome: string;
  precoCentavos: number;
  /** Só para peças: saldo em estoque, para avisar quando não tem. */
  estoque?: number;
  unidade?: string;
};

export type ItemEditavel = {
  chave: string;
  tipo: "PECA" | "SERVICO";
  pecaId: string | null;
  servicoId: string | null;
  descricao: string;
  quantidade: string;
  valorUnit: string;
};

export function itemVazio(tipo: "PECA" | "SERVICO" = "SERVICO"): ItemEditavel {
  return {
    chave: Math.random().toString(36).slice(2),
    tipo,
    pecaId: null,
    servicoId: null,
    descricao: "",
    quantidade: "1",
    valorUnit: "0,00",
  };
}

/**
 * Editor de itens do orçamento / da OS.
 *
 * Decisoes de usabilidade, porque está é a tela mais usada do sistema:
 * - O total de cada linha é o total geral aparecem enquanto digita. Ninguém
 *   precisa somar de cabeca nem esperar salvar para conferir.
 * - Dropdown do catalogo preenche descrição e preço, mas os dois campos
 *   continuam editaveis: na oficina real, o preço muda por cliente.
 * - Da para digitar um item que não está no catalogo, sem cadastrar nada.
 * - Aviso visivel quando a peça escolhida não tem saldo em estoque.
 *
 * Os itens viajam para o servidor como JSON num único campo escondido. O
 * formulario continua sendo um <form> normal com Server Action.
 */
export function EditorItens({
  catalogo,
  itensIniciais,
  descontoInicial,
}: {
  catalogo: ItemCatalogo[];
  itensIniciais?: ItemEditavel[];
  descontoInicial?: number;
}) {
  const [itens, setItens] = useState<ItemEditavel[]>(
    itensIniciais?.length ? itensIniciais : [itemVazio("SERVICO")],
  );
  const [desconto, setDesconto] = useState(moedaSimples(descontoInicial ?? 0));

  const pecas = useMemo(() => catalogo.filter((c) => c.tipo === "PECA"), [catalogo]);
  const servicos = useMemo(() => catalogo.filter((c) => c.tipo === "SERVICO"), [catalogo]);

  function alterar(chave: string, mudanca: Partial<ItemEditavel>) {
    setItens((atual) =>
      atual.map((item) => (item.chave === chave ? { ...item, ...mudanca } : item)),
    );
  }

  function escolherDoCatalogo(chave: string, catalogoId: string) {
    if (!catalogoId) {
      alterar(chave, { pecaId: null, servicoId: null });
      return;
    }
    const escolhido = catalogo.find((c) => c.id === catalogoId);
    if (!escolhido) return;

    alterar(chave, {
      tipo: escolhido.tipo,
      pecaId: escolhido.tipo === "PECA" ? escolhido.id : null,
      servicoId: escolhido.tipo === "SERVICO" ? escolhido.id : null,
      descricao: escolhido.nome,
      valorUnit: moedaSimples(escolhido.precoCentavos),
    });
  }

  function adicionar(tipo: "PECA" | "SERVICO") {
    setItens((atual) => [...atual, itemVazio(tipo)]);
  }

  function remover(chave: string) {
    setItens((atual) =>
      atual.length === 1 ? [itemVazio(atual[0].tipo)] : atual.filter((i) => i.chave !== chave),
    );
  }

  const totalItem = (item: ItemEditavel) =>
    Math.round(paraQuantidade(item.quantidade) * paraCentavos(item.valorUnit));

  const subtotal = itens.reduce((soma, item) => soma + totalItem(item), 0);
  const descontoCentavos = Math.min(paraCentavos(desconto), subtotal);
  const total = subtotal - descontoCentavos;

  return (
    <Cartao>
      <CartaoTitulo>Peças e serviços</CartaoTitulo>

      {/* O servidor le só estes dois campos. */}
      <input
        type="hidden"
        name="itens"
        value={JSON.stringify(
          itens
            .filter((i) => i.descricao.trim() !== "")
            .map((i) => ({
              tipo: i.tipo,
              pecaId: i.pecaId,
              servicoId: i.servicoId,
              descricao: i.descricao.trim(),
              quantidade: paraQuantidade(i.quantidade),
              valorUnitCentavos: paraCentavos(i.valorUnit),
            })),
        )}
      />
      <input type="hidden" name="descontoCentavos" value={descontoCentavos} />

      <div className="space-y-3 p-4 sm:p-5">
        {itens.map((item, indice) => {
          const peca = item.pecaId ? pecas.find((p) => p.id === item.pecaId) : null;
          const qtd = paraQuantidade(item.quantidade);
          const semEstoque = peca && peca.estoque !== undefined && peca.estoque < qtd;

          return (
            <div
              key={item.chave}
              className={cx(
                "rounded-lg border p-3 sm:p-4",
                item.tipo === "PECA" ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400">#{indice + 1}</span>
                  <Selo tom={item.tipo === "PECA" ? "azul" : "roxo"}>
                    {item.tipo === "PECA" ? "Peça" : "Serviço"}
                  </Selo>
                </div>
                <button
                  type="button"
                  onClick={() => remover(item.chave)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remover item ${indice + 1}`}
                  title="Remover item"
                >
                  <Icone.fechar className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-12">
                <label className="sm:col-span-5">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">
                    Escolher do cadastro
                  </span>
                  <select
                    value={item.pecaId ?? item.servicoId ?? ""}
                    onChange={(e) => escolherDoCatalogo(item.chave, e.target.value)}
                    className="w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base"
                  >
                    <option value="">Digitar manualmente</option>
                    {servicos.length > 0 && (
                      <optgroup label="Serviços">
                        {servicos.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome} - {moeda(s.precoCentavos)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {pecas.length > 0 && (
                      <optgroup label="Peças">
                        {pecas.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} - {moeda(p.precoCentavos)}
                            {p.estoque !== undefined ? ` (${p.estoque} em estoque)` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </label>

                <label className="sm:col-span-7">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">
                    Descrição que o cliente vai ler
                  </span>
                  <input
                    value={item.descricao}
                    onChange={(e) => alterar(item.chave, { descricao: e.target.value })}
                    placeholder={
                      item.tipo === "PECA" ? "Ex: Pastilha de freio dianteira" : "Ex: Troca de óleo"
                    }
                    className="w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base"
                  />
                </label>

                <label className="sm:col-span-3">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Quantidade</span>
                  <input
                    value={item.quantidade}
                    onChange={(e) => alterar(item.chave, { quantidade: e.target.value })}
                    inputMode="decimal"
                    className="w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base"
                  />
                </label>

                <label className="sm:col-span-4">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">
                    Valor por unidade (R$)
                  </span>
                  <input
                    value={item.valorUnit}
                    onChange={(e) => alterar(item.chave, { valorUnit: e.target.value })}
                    inputMode="decimal"
                    className="w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base"
                  />
                </label>

                <div className="sm:col-span-5">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">
                    Total do item
                  </span>
                  <div className="flex min-h-11 items-center rounded-lg bg-slate-100 px-3 text-lg font-bold text-slate-900">
                    {moeda(totalItem(item))}
                  </div>
                </div>
              </div>

              {semEstoque && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-orange-700">
                  <Icone.alerta className="h-4 w-4" />
                  Estoque atual: {peca.estoque}. Vai faltar peça para atender esta quantidade.
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2">
          <Botao type="button" variante="secundario" onClick={() => adicionar("SERVICO")}>
            <Icone.mais className="h-5 w-5" />
            Adicionar serviço
          </Botao>
          <Botao type="button" variante="secundario" onClick={() => adicionar("PECA")}>
            <Icone.mais className="h-5 w-5" />
            Adicionar peça
          </Botao>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
        <div className="ml-auto max-w-sm space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-700">Soma dos itens</span>
            <span className="font-semibold text-slate-900">{moeda(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label htmlFor="campo-desconto" className="text-slate-700">
              Desconto (R$)
            </label>
            <input
              id="campo-desconto"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              inputMode="decimal"
              className="w-32 min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-right text-base"
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-300 pt-2">
            <span className="text-lg font-bold text-slate-900">Total</span>
            <span className="text-2xl font-black text-marca-700">{moeda(total)}</span>
          </div>
        </div>
      </div>
    </Cartao>
  );
}
