"use server";

import { revalidatePath } from "next/cache";
import { Papel } from "@prisma/client";
import { z } from "zod";

import { conferirSenha, exigirSessao, hashSenha, podeGerenciar } from "@/lib/auth";
import { falha, mensagemDeErro, sucesso, type Resultado } from "@/lib/erros";
import { soDigitos } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const opcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

export async function salvarOficina(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const sessao = await exigirSessao();
  if (!podeGerenciar(sessao.papel)) return falha("Você não tem permissão para alterar isso.");

  const analise = z
    .object({
      nome: z.string().trim().min(2, "Digite o nome da oficina."),
      cnpj: opcional,
      telefone: opcional,
      email: opcional,
      cep: opcional,
      endereco: opcional,
      numero: opcional,
      bairro: opcional,
      cidade: opcional,
      uf: opcional,
    })
    .safeParse({
      nome: dados.get("nome"),
      cnpj: dados.get("cnpj"),
      telefone: dados.get("telefone"),
      email: dados.get("email"),
      cep: dados.get("cep"),
      endereco: dados.get("endereco"),
      numero: dados.get("numero"),
      bairro: dados.get("bairro"),
      cidade: dados.get("cidade"),
      uf: dados.get("uf"),
    });

  if (!analise.success) return falha(analise.error.issues[0].message);

  try {
    await prisma.oficina.update({
      where: { id: sessao.oficinaId },
      data: {
        ...analise.data,
        cnpj: analise.data.cnpj ? soDigitos(analise.data.cnpj) : null,
        telefone: analise.data.telefone ? soDigitos(analise.data.telefone) : null,
        cep: analise.data.cep ? soDigitos(analise.data.cep) : null,
        uf: analise.data.uf ? analise.data.uf.toUpperCase().slice(0, 2) : null,
      },
    });
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/configuracoes");
  return sucesso();
}

export async function criarUsuario(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const sessao = await exigirSessao();
  if (!podeGerenciar(sessao.papel)) return falha("Você não tem permissão para criar usuários.");

  const analise = z
    .object({
      nome: z.string().trim().min(2, "Digite o nome."),
      email: z.string().trim().toLowerCase().email("E-mail invalido."),
      senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
      papel: z.nativeEnum(Papel).catch(Papel.ATENDENTE),
    })
    .safeParse({
      nome: dados.get("nome"),
      email: dados.get("email"),
      senha: dados.get("senha"),
      papel: dados.get("papel"),
    });

  if (!analise.success) return falha(analise.error.issues[0].message);

  const existe = await prisma.usuario.findUnique({ where: { email: analise.data.email } });
  if (existe) return falha("Já existe uma conta com esse e-mail.");

  try {
    await prisma.usuario.create({
      data: {
        oficinaId: sessao.oficinaId,
        nome: analise.data.nome,
        email: analise.data.email,
        senhaHash: await hashSenha(analise.data.senha),
        papel: analise.data.papel,
      },
    });
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  revalidatePath("/configuracoes");
  return sucesso();
}

/** Ativa/desativa um colega. Ninguém pode desativar a si mesmo. */
export async function alternarUsuario(dados: FormData): Promise<void> {
  const sessao = await exigirSessao();
  if (!podeGerenciar(sessao.papel)) return;

  const id = dados.get("id")?.toString();
  if (!id || id === sessao.usuarioId) return;

  const usuario = await prisma.usuario.findFirst({
    where: { id, oficinaId: sessao.oficinaId },
  });
  if (!usuario) return;

  await prisma.usuario.update({ where: { id }, data: { ativo: !usuario.ativo } });

  // Desativar precisa derrubar as sessões abertas, senao a pessoa continua
  // usando o sistema até o cookie vencer.
  if (usuario.ativo) await prisma.sessao.deleteMany({ where: { usuarioId: id } });

  revalidatePath("/configuracoes");
}

export async function trocarSenha(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const sessao = await exigirSessao();

  const atual = dados.get("senhaAtual")?.toString() ?? "";
  const nova = dados.get("senhaNova")?.toString() ?? "";
  const confirmacao = dados.get("confirmacao")?.toString() ?? "";

  if (nova.length < 6) return falha("A nova senha precisa ter pelo menos 6 caracteres.");
  if (nova !== confirmacao) return falha("As duas senhas digitadas não são iguais.");

  const usuario = await prisma.usuario.findUnique({ where: { id: sessao.usuarioId } });
  if (!usuario) return falha("Usuário não encontrado.");
  if (!(await conferirSenha(atual, usuario.senhaHash))) return falha("Senha atual incorreta.");

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash: await hashSenha(nova) },
  });

  return sucesso();
}
