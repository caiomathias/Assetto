import "server-only";

import { headers } from "next/headers";

/**
 * Endereco publico da aplicacao, usado nos links que vao para o cliente.
 * Prefere a variavel de ambiente; sem ela, deduz do cabecalho da requisicao
 * para que funcione em desenvolvimento sem configurar nada.
 */
export async function urlDoApp(): Promise<string> {
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configurada) return configurada;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}
