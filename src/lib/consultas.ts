import "server-only";

import type { ItemCatalogo } from "@/components/editor-itens";
import type { ClienteResumo } from "@/components/seletor-cliente-veiculo";

import { prisma } from "./prisma";

/** Peças + serviços ativos, no formato que o editor de itens espera. */
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

/** Formato que o seletor espera. */
type ClienteComVeiculos = {
  id: string;
  nome: string;
  telefone: string;
  documento: string | null;
  veiculos: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    anoFabricacao: number | null;
    kmAtual: number | null;
  }[];
};

function paraResumo(c: ClienteComVeiculos): ClienteResumo {
  return {
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
  };
}

const VEICULOS_DO_CLIENTE = { veiculos: { orderBy: { criadoEm: "desc" } } } as const;

/** Quantos clientes o seletor mostra de uma vez. */
export const LIMITE_SELETOR = 8;

/**
 * Lista inicial do seletor de cliente: os últimos cadastrados, mais o cliente
 * já escolhido quando a tela abre com um.
 *
 * Aqui esteve o pior gargalo do sistema. Antes esta função carregava TODOS os
 * clientes da oficina, com todos os veículos, para dentro do navegador — o
 * filtro era feito lá. Medido: com 5 mil clientes a tela de nova OS ia a
 * 1,2 MB de HTML, e isso toda vez que ela abria. No 4G do balcão são vários
 * segundos de espera numa tela que o atendente abre o dia inteiro.
 *
 * Agora vão poucos registros, e quem busca é o servidor.
 */
export async function carregarClientesIniciais(
  oficinaId: string,
  clienteId?: string,
): Promise<ClienteResumo[]> {
  const [recentes, escolhido] = await Promise.all([
    prisma.cliente.findMany({
      where: { oficinaId },
      orderBy: { criadoEm: "desc" },
      take: LIMITE_SELETOR,
      include: VEICULOS_DO_CLIENTE,
    }),
    clienteId
      ? prisma.cliente.findFirst({
          where: { id: clienteId, oficinaId },
          include: VEICULOS_DO_CLIENTE,
        })
      : null,
  ]);

  // O cliente já escolhido precisa estar na lista para aparecer selecionado,
  // mesmo que não esteja entre os mais recentes.
  const lista = escolhido
    ? [escolhido, ...recentes.filter((c) => c.id !== escolhido.id)]
    : recentes;

  return lista.map(paraResumo);
}

/** Busca do seletor, enquanto a pessoa digita. Roda no servidor. */
export async function buscarClientesDaOficina(
  oficinaId: string,
  termo: string,
): Promise<ClienteResumo[]> {
  const limpo = termo.trim();
  if (limpo === "") return carregarClientesIniciais(oficinaId);

  const digitos = limpo.replace(/\D/g, "");
  const placa = limpo.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const clientes = await prisma.cliente.findMany({
    where: {
      oficinaId,
      OR: [
        { nome: { contains: limpo, mode: "insensitive" } },
        ...(digitos.length >= 3
          ? [{ telefone: { contains: digitos } }, { documento: { contains: digitos } }]
          : []),
        ...(placa.length >= 3
          ? [{ veiculos: { some: { placa: { contains: placa } } } }]
          : []),
      ],
    },
    orderBy: { nome: "asc" },
    take: LIMITE_SELETOR,
    include: VEICULOS_DO_CLIENTE,
  });

  return clientes.map(paraResumo);
}
