import Link from "next/link";
import { redirect } from "next/navigation";

import { criarConta } from "../acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { Campo, Cartao, Entrada } from "@/components/ui";
import { sessaoAtual } from "@/lib/auth";

export const metadata = { title: "Criar conta - Assetto" };

export default async function PaginaCriarConta() {
  if (await sessaoAtual()) redirect("/painel");

  return (
    <Cartao className="p-6 sm:p-8">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Cadastrar oficina</h1>
      <p className="mb-6 text-slate-600">Leva menos de um minuto.</p>

      <Formulario acao={criarConta}>
        <Campo rotulo="Nome da oficina" obrigatorio>
          <Entrada name="oficina" required autoFocus placeholder="Auto Center Silva" />
        </Campo>

        <Campo rotulo="Seu nome" obrigatorio>
          <Entrada name="nome" required autoComplete="name" placeholder="Joao Silva" />
        </Campo>

        <Campo rotulo="Seu e-mail" ajuda="Sera usado para entrar no sistema." obrigatorio>
          <Entrada name="email" type="email" required autoComplete="email" />
        </Campo>

        <Campo rotulo="Crie uma senha" ajuda="Minimo de 6 caracteres." obrigatorio>
          <Entrada name="senha" type="password" required autoComplete="new-password" minLength={6} />
        </Campo>

        <Campo rotulo="Digite a senha de novo" obrigatorio>
          <Entrada name="confirmacao" type="password" required autoComplete="new-password" />
        </Campo>

        <BotaoSalvar className="w-full">Criar conta</BotaoSalvar>
      </Formulario>

      <p className="mt-6 text-center text-slate-600">
        Ja tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-marca-700 underline">
          Entrar
        </Link>
      </p>
    </Cartao>
  );
}
