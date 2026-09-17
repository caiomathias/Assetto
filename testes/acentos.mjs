/**
 * Verificador de acentuação.
 *
 * O produto é vendido para oficinas brasileiras; texto sem acento na tela
 * passa impressão de sistema mal feito. Este script abre todas as telas num
 * navegador de verdade e procura, no texto visível, palavras que em português
 * sempre levam acento.
 *
 * Endereços de URL aparecem na tela (o link de aprovação) e são a única
 * ocorrência legítima sem acento.
 *
 * Como rodar: npm start noutro terminal, depois `npm run teste:acentos`.
 */
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
// Palavras que, em portugues, sempre levam acento. Se aparecerem sem, e defeito.
const SUSPEITAS = /\b(nao|voce|orcamento|orcamentos|servico|servicos|peca|pecas|patio|veiculo|veiculos|mecanico|configuracoes|descricao|observacoes|observacao|numero|codigo|usuario|usuarios|sessao|execucao|aprovacao|situacao|localizacao|impressao|emissao|informacoes|alteracoes|acao|acoes|opcao|opcoes|combustivel|eletrico|hibrido|disponivel|proximo|proxima|ultimo|ultima|ultimos|ultimas|historico|minimo|maximo|automatico|basico|tecnico|generico|unico|unica|proprio|area|pagina|obrigatorio|responsavel|possivel|credito|debito|transferencia|referencia|preco|precos|salarios|agua|mes|duvida|ninguem|alguem|tres|funcionario|relatorio|atencao|tambem|alem|apos|atras|sera|estao|vao|ja|ate|fisica|juridica|revisao|suspensao|devolucao|permissao|exclusao|confirmacao|gestao|mao|cartao|cartoes|reposicao|valido|previsao|padrao|nivel|util|analise|periodo|calculo|versao|saida|avancar|comecar|titulo|oleo|balcao|demonstracao|diagnostico|fabricacao|indicacao|anotacoes|manutencao|inventario|entao|sao|manha|amanha|orgao|razao|decisao|versao|opiniao|sugestao|comissao|previsao|lancamento|lancamentos|lancado|lancados|lanca|lancar|comeco|pedaco|cabeca|licenca|almoco|forca|servicos|criancas|mecanica|garantia)\b/gi;

const b = await chromium.launch({ ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}), args: ["--no-sandbox"] });
const p = await (await b.newContext({ locale: "pt-BR" })).newPage();

const achados = new Map();
async function varrer(rota) {
  const r = await p.goto(BASE + rota, { waitUntil: "networkidle" });
  if (!r || r.status() !== 200) return;
  // URLs aparecem na tela (o link de aprovação) e não levam acento por definição.
  const texto = (await p.locator("body").innerText()).replace(/https?:\/\/\S+/g, " ");
  for (const m of texto.matchAll(SUSPEITAS)) {
    const trecho = texto.slice(Math.max(0, m.index - 45), m.index + m[0].length + 45).replace(/\s+/g, " ");
    achados.set(`${m[0]} :: ${trecho}`, rota);
  }
}

await varrer("/entrar");
await varrer("/criar-conta");
await p.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
await p.fill('input[name="email"]', "demo@assetto.com.br");
await p.fill('input[name="senha"]', "assetto123");
await p.click('button[type="submit"]');
await p.waitForURL("**/painel");

const rotas = ["/painel","/patio","/clientes","/clientes/novo","/orcamentos","/orcamentos/novo","/os","/os/nova","/pecas","/pecas/nova","/pecas/servicos","/financeiro","/crm","/configuracoes"];
for (const r of rotas) await varrer(r);

// telas de detalhe
async function primeiro(lista, prefixo) {
  await p.goto(BASE + lista, { waitUntil: "networkidle" });
  return p.locator(`ul li a[href^='${prefixo}']`).first().getAttribute("href").catch(() => null);
}
for (const [lista, prefixo] of [["/clientes","/clientes/"],["/orcamentos","/orcamentos/"],["/os","/os/"],["/pecas","/pecas/"]]) {
  const href = await primeiro(lista, prefixo);
  if (!href) continue;
  await varrer(href);
  await varrer(href + "/editar");
  await varrer(href + "/imprimir");
}

// pagina publica
await p.goto(`${BASE}/orcamentos?status=ENVIADO`, { waitUntil: "networkidle" });
const orc = await p.locator("ul li a[href^='/orcamentos/']").first().getAttribute("href").catch(() => null);
if (orc) {
  await p.goto(BASE + orc, { waitUntil: "networkidle" });
  const link = await p.locator("span.font-mono").filter({ hasText: "/orcamento/" }).first().innerText().catch(() => null);
  if (link) await varrer(new URL(link).pathname);
}

if (achados.size === 0) console.log("Nenhuma palavra sem acento no texto visível.");
else {
  console.log(`${achados.size} ocorrência(s):`);
  for (const [k, rota] of achados) console.log(`  [${rota}] ${k}`);
}
await b.close();
