import "server-only";

import type { ItemCatalogo } from "@/components/editor-itens";
import type { ClienteResumo } from "@/components/seletor-cliente-veiculo";

import { prisma } from "./prisma";

/** Pecas + servicos ativos, no formato que o editor de itens espera. */
export async function carregarCatalogo(oficinaId: string): Promise<ItemCatalogo[]> {
  const [servicos, pecas] = await Promise.all([
    prisma.servico.findMany({
      where: { oficinaId, ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.peca.findMany({
      where: { oficinaId, ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return [
    ...servicos.map((s) => ({
      id: s.id,
      tipo: "SERVICO" as const,
      nome: s.nome,
      precoCentavos: s.precoCentavos,
    })),
    ...pecas.map((p) => ({
      id: p.id,
      tipo: "PECA" as const,
      nome: p.codigo ? `${p.nome} (${p.codigo})` : p.nome,
      precoCentavos: p.precoVendaCentavos,
      estoque: p.quantidade,
      unidade: p.unidade,
    })),
  ];
}

/** Clientes com veiculos, para o seletor do orcamento / da OS. */
export async function carregarClientes(oficinaId: string): Promise<ClienteResumo[]> {
  const clientes = await prisma.cliente.findMany({
    where: { oficinaId },
    orderBy: { nome: "asc" },
    include: {
      veiculos: { orderBy: { criadoEm: "desc" } },
    },
  });

  return clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    documento: c.documento,
    veiculos: c.veiculos.map((v) => ({
      id: v.id,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      anoFabricacao: v.anoFabricacao,
      kmAtual: v.kmAtual,
    })),
  }));
}
