import Link from "next/link";

import { Busca } from "@/components/busca";
import { Icone } from "@/components/icones";
import { BotaoLink, Cabecalho, Cartao, Selo, Vazio, cx } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { data, moeda, placa } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { STATUS_OS } from "@/lib/rotulos";
import type { StatusOS } from "@prisma/client";

export const metadata = { title: "Ordens de serviço - Assetto" };

const FILTROS = [
  { valor: "", titulo: "Todas" },
  { valor: "EM_EXECUCAO", titulo: "Em execução" },
  { valor: "AGUARDANDO_PECA", titulo: "Aguardando peça" },
  { valor: "PRONTO", titulo: "Prontas" },
  { valor: "ENTREGUE", titulo: "Entregues" },
  { valor: "CANCELADO", titulo: "Canceladas" },
];

export default async function PaginaOrdens({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { q, status } = await searchParams;
  const termo = (q ?? "").trim();
  const filtro = FILTROS.some((f) => f.valor === status) ? status : "";
  const numeroBuscado = Number.parseInt(termo, 10);

  const ordens = await prisma.ordemServico.findMany({
    where: {
      oficinaId,
      ...(filtro ? { status: filtro as StatusOS } : {}),
      ...(termo
        ? {
            OR: [
              { cliente: { nome: { contains: termo, mode: "insensitive" as const } } },
              { veiculo: { placa: { contains: termo.toUpperCase().replace(/[^A-Z0-9]/g, "") } } },
              ...(Number.isFinite(numeroBuscado) ? [{ numero: numeroBuscado }] : []),
            ],
          }
        : {}),
    },
    include: { cliente: true, veiculo: true, responsavel: true },
    orderBy: { criadoEm: "desc" },
    take: 100,
  });

  return (
    <>
      <Cabecalho
        titulo="Ordens de serviço"
        descricao="Histórico completo. Para o dia a dia, use o Pátio."
        acao={
          <>
            <BotaoLink href="/patio" variante="secundario">
              Ver pátio
            </BotaoLink>
            <BotaoLink href="/os/nova">
              <Icone.mais className="h-5 w-5" />
              Nova OS
            </BotaoLink>
          </>
        }
      />

      <div className="mb-4">
        <Busca acao="/os" valor={termo} placeholder="Número, cliente ou placa" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={f.valor ? `/os?status=${f.valor}` : "/os"}
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
        {ordens.length === 0 ? (
          <Vazio
            titulo="Nenhuma ordem de serviço"
            descricao="Abra uma OS quando o carro entrar na oficina."
            acao={<BotaoLink href="/os/nova">Nova ordem de serviço</BotaoLink>}
          />
        ) : (
          <ul className="divide-y divide-slate-200">
            {ordens.map((os) => (
              <li key={os.id}>
                <Link
                  href={`/os/${os.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-500">
                        {String(os.numero).padStart(4, "0")}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs font-bold tracking-wider text-white">
                        {placa(os.veiculo.placa)}
                      </span>
                      <span className="text-lg font-semibold text-slate-900">{os.cliente.nome}</span>
                    </div>
                    <p className="text-slate-600">
                      {os.veiculo.marca} {os.veiculo.modelo} - {data(os.criadoEm)}
                      {os.responsavel && ` - ${os.responsavel.nome}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-900">
                      {moeda(os.totalCentavos)}
                    </span>
                    <Selo tom={STATUS_OS[os.status].tom}>{STATUS_OS[os.status].titulo}</Selo>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      {ordens.length >= 100 && (
        <p className="mt-4 text-center text-slate-600">
          Mostrando as 100 mais recentes. Use a busca ou os filtros para achar uma
          ordem antiga.
        </p>
      )}
    </>
  );
}
