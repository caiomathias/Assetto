import Link from "next/link";

import { Busca } from "@/components/busca";
import { Icone } from "@/components/icones";
import { BotaoLink, Cabecalho, Cartao, Selo, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { documento, placa, telefone } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Clientes - Assetto" };

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { oficinaId } = await exigirSessao();
  const { q } = await searchParams;
  const termo = (q ?? "").trim();

  const clientes = await prisma.cliente.findMany({
    where: {
      oficinaId,
      ...(termo
        ? {
            OR: [
              { nome: { contains: termo, mode: "insensitive" as const } },
              { telefone: { contains: termo.replace(/\D/g, "") || termo } },
              { documento: { contains: termo.replace(/\D/g, "") || termo } },
              {
                veiculos: {
                  some: {
                    placa: {
                      contains: termo.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: { veiculos: { orderBy: { criadoEm: "desc" } } },
    orderBy: { nome: "asc" },
    take: 200,
  });

  return (
    <>
      <Cabecalho
        titulo="Clientes"
        descricao="Todo mundo que ja passou pela oficina."
        acao={
          <BotaoLink href="/clientes/novo">
            <Icone.mais className="h-5 w-5" />
            Novo cliente
          </BotaoLink>
        }
      />

      <div className="mb-5">
        <Busca acao="/clientes" valor={termo} placeholder="Nome, telefone, CPF/CNPJ ou placa" />
      </div>

      <Cartao>
        {clientes.length === 0 ? (
          <Vazio
            titulo={termo ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
            descricao={
              termo
                ? `Nada com "${termo}". Tente outro nome, telefone ou placa.`
                : "Cadastre o primeiro cliente para comecar a fazer orcamentos."
            }
            acao={<BotaoLink href="/clientes/novo">Cadastrar cliente</BotaoLink>}
          />
        ) : (
          <ul className="divide-y divide-slate-200">
            {clientes.map((cliente) => (
              <li key={cliente.id}>
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-900">{cliente.nome}</p>
                    <p className="text-slate-600">
                      {telefone(cliente.telefone)}
                      {cliente.documento && ` - ${documento(cliente.documento)}`}
                    </p>
                    {cliente.veiculos.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {cliente.veiculos.slice(0, 4).map((v) => (
                          <Selo key={v.id} tom="azul">
                            {placa(v.placa)} {v.modelo}
                          </Selo>
                        ))}
                        {cliente.veiculos.length > 4 && (
                          <Selo>+{cliente.veiculos.length - 4}</Selo>
                        )}
                      </div>
                    )}
                  </div>
                  <Icone.direita className="h-5 w-5 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      {clientes.length >= 200 && (
        <p className="mt-4 text-center text-slate-600">
          Mostrando os 200 primeiros. Use a busca para achar um cliente especifico.
        </p>
      )}
    </>
  );
}
