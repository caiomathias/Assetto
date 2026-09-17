"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icone } from "@/components/icones";
import { Botao, Cartao, CartaoTitulo, cx } from "@/components/ui";
import { placa as formatarPlaca, telefone as formatarTelefone } from "@/lib/format";

export type VeiculoResumo = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anoFabricacao: number | null;
  kmAtual: number | null;
};

export type ClienteResumo = {
  id: string;
  nome: string;
  telefone: string;
  documento: string | null;
  veiculos: VeiculoResumo[];
};

/**
 * Escolha de cliente e veiculo em duas etapas.
 *
 * Um <select> com 800 clientes e inutil no balcao. Aqui a pessoa digita
 * qualquer pedaco de nome, telefone ou placa e ve no maximo 8 resultados
 * em botoes grandes. Depois escolhe o carro, que ja vem filtrado pelo
 * cliente - assim nao existe a combinacao errada.
 */
export function SeletorClienteVeiculo({
  clientes,
  clienteInicialId,
  veiculoInicialId,
  bloqueado = false,
}: {
  clientes: ClienteResumo[];
  clienteInicialId?: string;
  veiculoInicialId?: string;
  bloqueado?: boolean;
}) {
  const [clienteId, setClienteId] = useState(clienteInicialId ?? "");
  const [veiculoId, setVeiculoId] = useState(veiculoInicialId ?? "");
  const [busca, setBusca] = useState("");

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const limpo = termo.replace(/[^a-z0-9]/g, "");
    const base = termo
      ? clientes.filter(
          (c) =>
            c.nome.toLowerCase().includes(termo) ||
            (limpo.length > 0 &&
              (c.telefone.includes(limpo) ||
                (c.documento ?? "").includes(limpo) ||
                c.veiculos.some((v) => v.placa.toLowerCase().includes(limpo)))),
        )
      : clientes;
    return base.slice(0, 8);
  }, [busca, clientes]);

  function escolherCliente(escolhido: ClienteResumo) {
    setClienteId(escolhido.id);
    // Um carro so: escolhe sozinho. Evita um clique obvio.
    setVeiculoId(escolhido.veiculos.length === 1 ? escolhido.veiculos[0].id : "");
    setBusca("");
  }

  return (
    <Cartao>
      <CartaoTitulo>Cliente e veiculo</CartaoTitulo>
      <input type="hidden" name="clienteId" value={clienteId} />
      <input type="hidden" name="veiculoId" value={veiculoId} />

      <div className="space-y-5 p-5">
        {!cliente ? (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Quem e o cliente? <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Icone.busca className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome, telefone ou placa"
                autoFocus
                className="w-full min-h-12 rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-10 text-base"
              />
            </div>

            <div className="mt-3 space-y-2">
              {resultados.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-4 py-6 text-center">
                  <p className="text-slate-700">Nenhum cliente encontrado.</p>
                  <Link
                    href="/clientes/novo"
                    className="mt-1 inline-block font-semibold text-marca-700 underline"
                  >
                    Cadastrar um cliente novo
                  </Link>
                </div>
              ) : (
                resultados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => escolherCliente(c)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left hover:border-marca-400 hover:bg-marca-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{c.nome}</p>
                      <p className="text-sm text-slate-600">
                        {formatarTelefone(c.telefone)}
                        {c.veiculos.length > 0 &&
                          ` - ${c.veiculos.map((v) => formatarPlaca(v.placa)).join(", ")}`}
                      </p>
                    </div>
                    <Icone.direita className="h-5 w-5 shrink-0 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-marca-50 px-4 py-3 ring-1 ring-marca-200">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-marca-800">Cliente</p>
                <p className="truncate text-lg font-bold text-slate-900">{cliente.nome}</p>
                <p className="text-slate-600">{formatarTelefone(cliente.telefone)}</p>
              </div>
              {!bloqueado && (
                <Botao
                  type="button"
                  variante="secundario"
                  tamanho="pequeno"
                  onClick={() => {
                    setClienteId("");
                    setVeiculoId("");
                  }}
                >
                  Trocar cliente
                </Botao>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">
                Qual veiculo? <span className="text-red-600">*</span>
              </p>

              {cliente.veiculos.length === 0 ? (
                <div className="rounded-lg bg-amber-50 px-4 py-4 ring-1 ring-amber-200">
                  <p className="font-semibold text-amber-900">
                    Este cliente ainda nao tem veiculo cadastrado.
                  </p>
                  <Link
                    href={`/clientes/${cliente.id}/veiculos/novo`}
                    className="mt-1 inline-block font-semibold text-marca-700 underline"
                  >
                    Cadastrar o veiculo agora
                  </Link>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {cliente.veiculos.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVeiculoId(v.id)}
                      aria-pressed={veiculoId === v.id}
                      className={cx(
                        "flex items-center gap-3 rounded-lg border px-4 py-3 text-left",
                        veiculoId === v.id
                          ? "border-marca-500 bg-marca-50 ring-2 ring-marca-300"
                          : "border-slate-200 hover:border-marca-400 hover:bg-slate-50",
                      )}
                    >
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-white">
                        {formatarPlaca(v.placa)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900">
                          {v.marca} {v.modelo}
                        </span>
                        {v.anoFabricacao && (
                          <span className="text-sm text-slate-600">{v.anoFabricacao}</span>
                        )}
                      </span>
                      {veiculoId === v.id && (
                        <Icone.ok className="ml-auto h-5 w-5 shrink-0 text-marca-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Cartao>
  );
}
