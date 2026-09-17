/** Helpers de exibição. Tudo em pt-BR, porque o usuário final e brasileiro. */

/** 12345 (centavos) -> "R$ 123,45" */
export function moeda(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((centavos ?? 0) / 100);
}

/** 12345 (centavos) -> "123,45" (para usar dentro de inputs) */
export function moedaSimples(centavos: number): string {
  return ((centavos ?? 0) / 100).toFixed(2).replace(".", ",");
}

/**
 * Le o que o usuário digitou num campo de dinheiro e devolve centavos.
 * Aceita "1.234,56", "1234,56", "1234.56" e "1234".
 */
export function paraCentavos(entrada: string | number | null | undefined): number {
  if (entrada === null || entrada === undefined || entrada === "") return 0;
  if (typeof entrada === "number") return Math.round(entrada * 100);

  let texto = entrada.trim().replace(/[^\d,.-]/g, "");
  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");

  if (temVirgula && temPonto) {
    // "1.234,56" -> ponto e separador de milhar
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    texto = texto.replace(",", ".");
  }

  const valor = Number.parseFloat(texto);
  return Number.isFinite(valor) ? Math.round(valor * 100) : 0;
}

/** Le quantidade digitada ("2", "0,5", "1.5"). */
export function paraQuantidade(entrada: string | number | null | undefined): number {
  if (entrada === null || entrada === undefined || entrada === "") return 0;
  if (typeof entrada === "number") return entrada;
  const valor = Number.parseFloat(entrada.trim().replace(",", "."));
  return Number.isFinite(valor) ? valor : 0;
}

export function quantidade(valor: number): string {
  return Number.isInteger(valor)
    ? String(valor)
    : valor.toFixed(3).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
}

export function data(valor: Date | string | null | undefined): string {
  if (!valor) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(valor));
}

export function dataHora(valor: Date | string | null | undefined): string {
  if (!valor) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

/** Formato para <input type="date"> */
export function dataInput(valor: Date | string | null | undefined): string {
  if (!valor) return "";
  const d = new Date(valor);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Converte "2026-03-15" de um <input type="date"> em Date no fuso local,
 * ao meio-dia. Usar `new Date("2026-03-15")` interpretaria como UTC e, no
 * Brasil (UTC-3), a data apareceria como 14/03.
 */
export function dataDoInput(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia, 12, 0, 0);
}

export function telefone(valor: string | null | undefined): string {
  if (!valor) return "-";
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor;
}

export function placa(valor: string | null | undefined): string {
  if (!valor) return "-";
  const p = valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (p.length === 7) return `${p.slice(0, 3)}-${p.slice(3)}`;
  return p;
}

export function documento(valor: string | null | undefined): string {
  if (!valor) return "-";
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return valor;
}

export function soDigitos(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// Máscaras progressivas
//
// As funções acima formatam um valor completo, para exibir. Estas formatam
// valor pela metade, enquanto a pessoa ainda está digitando: com 3 dígitos o
// telefone já mostra "(11) 9". É isso que evita o balconista ter que digitar
// parêntese e traço na mão.
//
// O que vai para o banco continua sendo só dígito: as Server Actions passam
// tudo por soDigitos().
// ---------------------------------------------------------------------------

/** "11988887777" -> "(11) 98888-7777", funcionando desde o primeiro dígito. */
export function mascaraTelefone(valor: string): string {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  // Fixo tem 8 dígitos depois do DDD; celular tem 9.
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Mesmo campo aceita CPF e CNPJ, então a máscara troca sozinha quando passa
 * de 11 dígitos. Assim o atendente não precisa dizer ao sistema qual é qual.
 */
export function mascaraDocumento(valor: string): string {
  const d = soDigitos(valor).slice(0, 14);
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** "01310100" -> "01310-100" */
export function mascaraCep(valor: string): string {
  const d = soDigitos(valor).slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
