import "server-only";

import { headers } from "next/headers";

/**
 * Endereco público da aplicação, usado nos links que vão para o cliente.
 * Prefere a variavel de ambiente; sem ela, deduz do cabeçalho da requisição
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
