"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirSessao } from "@/lib/auth";
import { falha, mensagemDeErro, sucesso, type Resultado } from "@/lib/erros";
import { soDigitos } from "@/lib/format";
import { buscarClientesDaOficina } from "@/lib/consultas";
import { prisma } from "@/lib/prisma";
import type { ClienteResumo } from "@/components/seletor-cliente-veiculo";

/** Campo de texto que, se vier vazio, deve virar null e não string vazia. */
const opcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Digite o nome do cliente."),
  tipoPessoa: z.enum(["FISICA", "JURIDICA"]).default("FISICA"),
  documento: opcional,
  // Contar dígitos, não caracteres: o campo agora chega com máscara, e
  // "(11) 9" tem 6 caracteres mas só 3 dígitos.
  telefone: z
    .string()
    .trim()
    .refine(
      (v) => soDigitos(v).length >= 10,
      "Telefone incompleto. Precisa de DDD mais o número.",
    ),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .nullable()
    .refine((v) => v === null || z.string().email().safeParse(v).success, "E-mail invalido."),
  cep: opcional,
  endereco: opcional,
  numero: opcional,
  complemento: opcional,
  bairro: opcional,
  cidade: opcional,
  uf: opcional,
  observacoes: opcional,
});

function lerCliente(dados: FormData) {
  return clienteSchema.safeParse({
    nome: dados.get("nome"),
    tipoPessoa: dados.get("tipoPessoa") ?? "FISICA",
    documento: dados.get("documento"),
    telefone: dados.get("telefone"),
    email: dados.get("email"),
    cep: dados.get("cep"),
    endereco: dados.get("endereco"),
    numero: dados.get("numero"),
    complemento: dados.get("complemento"),
    bairro: dados.get("bairro"),
    cidade: dados.get("cidade"),
    uf: dados.get("uf"),
    observacoes: dados.get("observacoes"),
  });
}

export async function salvarCliente(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId } = await exigirSessao();
  const analise = lerCliente(dados);
  if (!analise.success) return falha(analise.error.issues[0].message);

  const id = dados.get("id")?.toString() || null;
  const valores = {
    ...analise.data,
    documento: analise.data.documento ? soDigitos(analise.data.documento) : null,
    telefone: soDigitos(analise.data.telefone),
    cep: analise.data.cep ? soDigitos(analise.data.cep) : null,
    uf: analise.data.uf ? analise.data.uf.toUpperCase().slice(0, 2) : null,
  };

  let clienteId: string;
  try {
    if (id) {
      // updateMany com oficinaId no where: se o id for de outra oficina,
      // nenhuma linha e afetada em vez de editar dado alheio.
      const r = await prisma.cliente.updateMany({
        where: { id, oficinaId },
        data: valores,
      });
      if (r.count === 0) return falha("Cliente não encontrado.");
      clienteId = id;
    } else {
      const criado = await prisma.cliente.create({ data: { ...valores, oficinaId } });
      clienteId = criado.id;
    }
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${clienteId}`);
}

export async function excluirCliente(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  if (!id) return;

  // Cliente com histórico não some: o financeiro e as OS antigas precisam
  // continuar mostrando de quem era o carro.
  const [orcamentos, ordens] = await Promise.all([
    prisma.orcamento.count({ where: { oficinaId, clienteId: id } }),
    prisma.ordemServico.count({ where: { oficinaId, clienteId: id } }),
  ]);
  if (orcamentos > 0 || ordens > 0) {
    redirect(`/clientes/${id}?erro=historico`);
  }

  await prisma.cliente.deleteMany({ where: { id, oficinaId } });
  revalidatePath("/clientes");
  redirect("/clientes");
}

// ---------------------------------------------------------------------------
// Veículos
// ---------------------------------------------------------------------------

const veiculoSchema = z.object({
  clienteId: z.string().min(1),
  placa: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/[^A-Z0-9]/g, ""))
    .refine((v) => v.length >= 6 && v.length <= 8, "Placa invalida. Ex: ABC1D23"),
  marca: z.string().trim().min(1, "Digite a marca."),
  modelo: z.string().trim().min(1, "Digite o modelo."),
  anoFabricacao: z.coerce.number().int().min(1900).max(2100).nullable().catch(null),
  anoModelo: z.coerce.number().int().min(1900).max(2100).nullable().catch(null),
  cor: opcional,
  combustivel: z
    .enum(["FLEX", "GASOLINA", "ETANOL", "DIESEL", "GNV", "ELETRICO", "HIBRIDO"])
    .default("FLEX"),
  chassi: opcional,
  renavam: opcional,
  kmAtual: z.coerce.number().int().min(0).nullable().catch(null),
  observacoes: opcional,
});

export async function salvarVeiculo(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const { oficinaId } = await exigirSessao();

  const vazioViraNulo = (campo: string) => {
    const v = dados.get(campo)?.toString().trim();
    return v ? v : null;
  };

  const analise = veiculoSchema.safeParse({
    clienteId: dados.get("clienteId"),
    placa: dados.get("placa"),
    marca: dados.get("marca"),
    modelo: dados.get("modelo"),
    anoFabricacao: vazioViraNulo("anoFabricacao"),
    anoModelo: vazioViraNulo("anoModelo"),
    cor: dados.get("cor"),
    combustivel: dados.get("combustivel") ?? "FLEX",
    chassi: dados.get("chassi"),
    renavam: dados.get("renavam"),
    kmAtual: vazioViraNulo("kmAtual"),
    observacoes: dados.get("observacoes"),
  });

  if (!analise.success) return falha(analise.error.issues[0].message);

  const { clienteId, ...valores } = analise.data;
  const id = dados.get("id")?.toString() || null;

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, oficinaId } });
  if (!cliente) return falha("Cliente não encontrado.");

  try {
    if (id) {
      const r = await prisma.veiculo.updateMany({ where: { id, oficinaId }, data: valores });
      if (r.count === 0) return falha("Veículo não encontrado.");
    } else {
      await prisma.veiculo.create({ data: { ...valores, clienteId, oficinaId } });
    }
  } catch (e) {
    const codigo = (e as { code?: string })?.code;
    if (codigo === "P2002") {
      return falha(`A placa ${analise.data.placa} já está cadastrada nesta oficina.`);
    }
    return falha(mensagemDeErro(e));
  }

  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

export async function excluirVeiculo(dados: FormData): Promise<void> {
  const { oficinaId } = await exigirSessao();
  const id = dados.get("id")?.toString();
  const clienteId = dados.get("clienteId")?.toString();
  if (!id || !clienteId) return;

  const ordens = await prisma.ordemServico.count({ where: { oficinaId, veiculoId: id } });
  if (ordens > 0) redirect(`/clientes/${clienteId}?erro=veiculo-historico`);

  await prisma.veiculo.deleteMany({ where: { id, oficinaId } });
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

/**
 * Busca usada pelo seletor de cliente enquanto a pessoa digita.
 *
 * Fica no servidor de propósito: mandar a base inteira para o navegador
 * filtrar lá funcionava com seis clientes e virava megabytes com cinco mil.
 */
export async function buscarClientes(termo: string): Promise<ClienteResumo[]> {
  const { oficinaId } = await exigirSessao();
  return buscarClientesDaOficina(oficinaId, termo.slice(0, 80));
}
