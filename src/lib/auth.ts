import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Papel } from "@prisma/client";

import { prisma } from "./prisma";

const COOKIE = "assetto_sessao";
const DURACAO_DIAS = 30;

export type Sessao = {
  usuarioId: string;
  nome: string;
  email: string;
  papel: Papel;
  oficinaId: string;
  oficinaNome: string;
};

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(usuarioId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);

  await prisma.sessao.create({ data: { token, usuarioId, expiraEm } });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({ where: { token } });
  }
  jar.delete(COOKIE);
}

/** Sessão atual, ou null se ninguém estiver logado. Não redireciona. */
export async function sessaoAtual(): Promise<Sessao | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { token },
    include: { usuario: { include: { oficina: true } } },
  });

  if (!sessao || sessao.expiraEm < new Date()) return null;
  if (!sessao.usuario.ativo || !sessao.usuario.oficina.ativa) return null;

  return {
    usuarioId: sessao.usuario.id,
    nome: sessao.usuario.nome,
    email: sessao.usuario.email,
    papel: sessao.usuario.papel,
    oficinaId: sessao.usuario.oficinaId,
    oficinaNome: sessao.usuario.oficina.nome,
  };
}

/**
 * Sessão obrigatória. Use em toda página e action de dentro do sistema:
 * além de autenticar, é daqui que sai o `oficinaId` que isola os dados.
 */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/entrar");
  return sessao;
}

const HIERARQUIA: Record<Papel, number> = {
  MECANICO: 1,
  ATENDENTE: 2,
  GERENTE: 3,
  DONO: 4,
};

export function podeGerenciar(papel: Papel): boolean {
  return HIERARQUIA[papel] >= HIERARQUIA.GERENTE;
}
