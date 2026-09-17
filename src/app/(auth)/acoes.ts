"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { conferirSenha, criarSessao, encerrarSessao, hashSenha } from "@/lib/auth";
import { falha, mensagemDeErro, type Resultado } from "@/lib/erros";
import { prisma } from "@/lib/prisma";

const entrarSchema = z.object({
  email: z.string().trim().toLowerCase().email("Digite um e-mail valido."),
  senha: z.string().min(1, "Digite sua senha."),
});

export async function entrar(_anterior: Resultado | null, dados: FormData): Promise<Resultado> {
  const analise = entrarSchema.safeParse({
    email: dados.get("email"),
    senha: dados.get("senha"),
  });

  if (!analise.success) {
    return falha(analise.error.issues[0].message);
  }

  const usuario = await prisma.usuario.findUnique({ where: { email: analise.data.email } });

  // Mensagem unica de proposito: nao revela se o e-mail existe.
  const generico = "E-mail ou senha incorretos.";
  if (!usuario || !usuario.ativo) return falha(generico);
  if (!(await conferirSenha(analise.data.senha, usuario.senhaHash))) return falha(generico);

  await criarSessao(usuario.id);
  redirect("/painel");
}

const criarContaSchema = z
  .object({
    oficina: z.string().trim().min(2, "Digite o nome da oficina."),
    nome: z.string().trim().min(2, "Digite seu nome."),
    email: z.string().trim().toLowerCase().email("Digite um e-mail valido."),
    senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As duas senhas digitadas nao sao iguais.",
    path: ["confirmacao"],
  });

export async function criarConta(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  const analise = criarContaSchema.safeParse({
    oficina: dados.get("oficina"),
    nome: dados.get("nome"),
    email: dados.get("email"),
    senha: dados.get("senha"),
    confirmacao: dados.get("confirmacao"),
  });

  if (!analise.success) return falha(analise.error.issues[0].message);

  const { oficina, nome, email, senha } = analise.data;

  const jaExiste = await prisma.usuario.findUnique({ where: { email } });
  if (jaExiste) return falha("Ja existe uma conta com esse e-mail.");

  let usuarioId: string;
  try {
    // Oficina e primeiro usuario nascem juntos: uma conta sem oficina nao
    // conseguiria fazer nada, entao nao pode existir pela metade.
    const criado = await prisma.$transaction(async (tx) => {
      const novaOficina = await tx.oficina.create({ data: { nome: oficina } });
      return tx.usuario.create({
        data: {
          oficinaId: novaOficina.id,
          nome,
          email,
          senhaHash: await hashSenha(senha),
          papel: "DONO",
        },
      });
    });
    usuarioId = criado.id;
  } catch (e) {
    return falha(mensagemDeErro(e));
  }

  await criarSessao(usuarioId);
  redirect("/painel");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/entrar");
}
