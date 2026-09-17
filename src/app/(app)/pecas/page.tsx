import Link from "next/link";

import { AbasPecas } from "./abas";
import { Busca } from "@/components/busca";
import { Icone } from "@/components/icones";
import { Aviso, BotaoLink, Cabecalho, Cartao, Selo, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { moeda, quantidade as formatarQtd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Pecas - Assetto" };

export default async function PaginaPecas({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { q } = await searchParams;
  const termo = (q ?? "").trim();

  const pecas = await prisma.peca.findMany({
    where: {
      oficinaId,
      ativo: true,
      ...(termo
        ? {
            OR: [
              { nome: { contains: termo, mode: "insensitive" as const } },
              { codigo: { contains: termo, mode: "insensitive" as const } },
              { marca: { contains: termo, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { nome: "asc" },
    take: 300,
  });

  const emFalta = pecas.filter((p) => p.quantidade <= p.estoqueMinimo);
  const valorEmEstoque = pecas.reduce(
    (soma, p) => soma + Math.round(p.quantidade * p.precoCustoCentavos),
    0,
  );

  return (
    <>
      <Cabecalho
        titulo="Pecas"
        descricao="Estoque, precos e alerta de reposicao."
        acao={
          <BotaoLink href="/pecas/nova">
            <Icone.mais className="h-5 w-5" />
            Nova peca
          </BotaoLink>
        }
      />

      <AbasPecas atual="pecas" />

      {emFalta.length > 0 && (
        <div className="mb-5">
          <Aviso tom="amarelo">
            <strong>{emFalta.length} peca(s) no estoque minimo ou abaixo:</strong>{" "}
            {emFalta
              .slice(0, 6)
              .map((p) => p.nome)
              .join(", ")}
            {emFalta.length > 6 && ` e mais ${emFalta.length - 6}`}.
          </Aviso>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Busca acao="/pecas" valor={termo} placeholder="Nome, codigo ou marca" />
        <p className="text-slate-600">
          Valor em estoque (custo):{" "}
          <strong className="text-slate-900">{moeda(valorEmEstoque)}</strong>
        </p>
      </div>

      <Cartao>
        {pecas.length === 0 ? (
          <Vazio
            titulo={termo ? "Nenhuma peca encontrada" : "Nenhuma peca cadastrada"}
            descricao="Cadastre as pecas que a oficina costuma usar para agilizar os orcamentos."
            acao={<BotaoLink href="/pecas/nova">Cadastrar peca</BotaoLink>}
          />
        ) : (
          <ul className="divide-y divide-slate-200">
            {pecas.map((peca) => {
              const faltando = peca.quantidade <= peca.estoqueMinimo;
              const negativo = peca.quantidade < 0;

              return (
                <li key={peca.id}>
                  <Link
                    href={`/pecas/${peca.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-slate-900">{peca.nome}</p>
                      <p className="text-slate-600">
                        {[peca.codigo, peca.marca, peca.localizacao].filter(Boolean).join(" - ") ||
                          "Sem codigo"}
                      </p>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Venda</p>
                        <p className="font-bold text-slate-900">
                          {moeda(peca.precoVendaCentavos)}
                        </p>
                      </div>
                      <div className="w-28 text-right">
                        <p className="text-sm text-slate-500">Em estoque</p>
                        <Selo tom={negativo ? "vermelho" : faltando ? "amarelo" : "verde"}>
                          {formatarQtd(peca.quantidade)} {peca.unidade}
                        </Selo>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
    </>
  );
}
