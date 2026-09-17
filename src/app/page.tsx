import { redirect } from "next/navigation";

import { sessaoAtual } from "@/lib/auth";

export default async function Raiz() {
  const sessao = await sessaoAtual();
  redirect(sessao ? "/painel" : "/entrar");
}
