import Link from "next/link";
import { redirect } from "next/navigation";

import { entrar } from "../acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { Campo, Cartao, Entrada } from "@/components/ui";
import { sessaoAtual } from "@/lib/auth";

export const metadata = { title: "Entrar - Assetto" };

export default async function PaginaEntrar() {
  if (await sessaoAtual()) redirect("/painel");

  return (
    <Cartao className="p-6 sm:p-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Entrar no sistema</h1>

      <Formulario acao={entrar}>
        <Campo rotulo="E-mail" obrigatorio>
          <Entrada
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            placeholder="voce@suaoficina.com.br"
          />
        </Campo>

        <Campo rotulo="Senha" obrigatorio>
          <Entrada name="senha" type="password" autoComplete="current-password" required />
        </Campo>

        <BotaoSalvar className="w-full">Entrar</BotaoSalvar>
      </Formulario>

      <p className="mt-6 text-center text-slate-600">
        Ainda não tem conta?{" "}
        <Link href="/criar-conta" className="font-semibold text-marca-700 underline">
          Cadastre sua oficina
        </Link>
      </p>
    </Cartao>
  );
}
