import Link from "next/link";

import { Busca } from "@/components/busca";
import { Icone } from "@/components/icones";
import { BotaoLink, Cabecalho, Cartao, Selo, Vazio, cx } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, moeda, placa } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { STATUS_ORCAMENTO } from "@/lib/rotulos";
import type { StatusOrcamento } from "@prisma/client";

export const metadata = { title: "Orçamentos - Assetto" };

const FILTROS: { valor: string; titulo: string }[] = [
  { valor: "", titulo: "Todos" },
  { valor: "RASCUNHO", titulo: "Rascunho" },
  { valor: "ENVIADO", titulo: "Aguardando cliente" },
  { valor: "APROVADO", titulo: "Aprovados" },
  { valor: "RECUSADO", titulo: "Recusados" },
  { valor: "CONVERTIDO", titulo: "Viraram OS" },
];

export default async function PaginaOrcamentos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { q, status } = await searchParams;
  const termo = (q ?? "").trim();
  const filtro = FILTROS.some((f) => f.valor === status) ? status : "";

  const numeroBuscado = Number.parseInt(termo, 10);

  const orcamentos = await prisma.orcamento.findMany({
    where: {
      oficinaId,
      ...(filtro ? { status: filtro as StatusOrcamento } : {}),
      ...(termo
        ? {
            OR: [
              { cliente: { nome: { contains: termo, mode: "insensitive" as const } } },
              {
                veiculo: {
                  placa: { contains: termo.toUpperCase().replace(/[^A-Z0-9]/g, "") },
                },
              },
              ...(Number.isFinite(numeroBuscado) ? [{ numero: numeroBuscado }] : []),
            ],
          }
        : {}),
    },
    include: { cliente: true, veiculo: true },
    orderBy: { criadoEm: "desc" },
    take: 100,
  });

  return (
    <>
      <Cabecalho
        titulo="Orçamentos"
        descricao="Monte o preço, mande para o cliente e acompanhe a resposta."
        acao={
          <BotaoLink href="/orcamentos/novo">
            <Icone.mais className="h-5 w-5" />
            Novo orçamento
          </BotaoLink>
        }
      />

      <div className="mb-4">
        <Busca acao="/orcamentos" valor={termo} placeholder="Número, cliente ou placa" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={f.valor ? `/orcamentos?status=${f.valor}` : "/orcamentos"}
            className={cx(
              "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ring-1 ring-inset",
              filtro === f.valor
                ? "bg-slate-800 text-white ring-slate-800"
                : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50",
            )}
          >
            {f.titulo}
          </Link>
        ))}
      </div>

      <Cartao>
        {orcamentos.length === 0 ? (
          <Vazio
            titulo="Nenhum orçamento por aqui"
            descricao="Crie um orçamento para enviar o preço ao cliente pelo WhatsApp."
            acao={<BotaoLink href="/orcamentos/novo">Novo orçamento</BotaoLink>}
          />
        ) : (
          <ul className="divide-y divide-slate-200">
            {orcamentos.map((orc) => (
              <li key={orc.id}>
                <Link
                  href={`/orcamentos/${orc.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-500">
                        {String(orc.numero).padStart(4, "0")}
                      </span>
                      <span className="text-lg font-semibold text-slate-900">
                        {orc.cliente.nome}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {placa(orc.veiculo.placa)} - {orc.veiculo.marca} {orc.veiculo.modelo} -{" "}
                      {data(orc.criadoEm)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-900">
                      {moeda(orc.totalCentavos)}
                    </span>
                    <Selo tom={STATUS_ORCAMENTO[orc.status].tom}>
                      {STATUS_ORCAMENTO[orc.status].titulo}
                    </Selo>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      {orcamentos.length >= 100 && (
        <p className="mt-4 text-center text-slate-600">
          Mostrando os 100 mais recentes. Use a busca ou os filtros para achar um
          orçamento antigo.
        </p>
      )}
    </>
  );
}
