/**
 * Teste do ambiente publicado.
 *
 * Diferente do teste de fumaça, este não depende dos dados de demonstração:
 * ele cria a própria oficina, o próprio catálogo e roda o caminho do dinheiro
 * de ponta a ponta. Serve para provar, no ambiente real, a parte mais
 * arriscada da publicação — o faturamento, que baixa estoque e lança o
 * financeiro numa transação única, passando pelo pooler do banco.
 *
 * Deixa uma oficina de teste no banco de propósito, e imprime o e-mail dela no
 * fim para que seja apagada depois. NÃO rodar contra um banco com dados reais
 * sem essa limpeza.
 *
 * Como rodar:
 *   BASE_URL=https://assetto-sistema.netlify.app npm run teste:producao
 *
 * IGNORAR_TLS=1 desliga a validação de certificado. Só serve para rodar de
 * dentro de uma rede com proxy que intercepta HTTPS; nunca use por padrão,
 * porque aí o teste deixaria passar um certificado inválido de verdade.
 *
 * Limitação conhecida: atrás de um proxy corporativo, o navegador costuma
 * falhar ao seguir o redirecionamento que as Server Actions devolvem depois
 * de um POST (ERR_TOO_MANY_RETRIES ou timeout), mesmo com a gravação tendo
 * acontecido no banco. Se este teste falhar em passo de navegação mas o dado
 * aparecer no banco, o problema é a rede de onde ele está sendo rodado, não a
 * aplicação. Rode de uma rede sem proxy antes de concluir que há defeito.
 */
import { chromium } from "playwright-core";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SUFIXO = String(Date.now()).slice(-6);
const EMAIL = `teste.automatizado.${SUFIXO}@exemplo.invalido`;
const SENHA = "teste123456";
const OFICINA = `ZZ Teste Automatizado ${SUFIXO}`;
const PLACA = `TST${SUFIXO.slice(2)}`;

const passos = [];
let erros = 0;
const ok = (n, d = "") => passos.push(`  OK    ${n}${d ? ` - ${d}` : ""}`);
const falhou = (n, d = "") => { erros++; passos.push(`  FALHA ${n}${d ? ` - ${d}` : ""}`); };

const navegador = await chromium.launch({
  ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
  args: ["--no-sandbox"],
});
const opcoesContexto = {
  locale: "pt-BR",
  ...(process.env.IGNORAR_TLS === "1" ? { ignoreHTTPSErrors: true } : {}),
};
const p = await (await navegador.newContext(opcoesContexto)).newPage();
// Ambiente publicado responde mais devagar que o local, e função serverless
// tem partida a frio.
p.setDefaultTimeout(45000);
p.setDefaultNavigationTimeout(45000);

const problemas = [];
p.on("pageerror", (e) => problemas.push(`${p.url()} :: ${String(e).slice(0, 300)}`));
p.on("response", (r) => { if (r.status() >= 500) problemas.push(`HTTP ${r.status()} ${r.url()}`); });

/** Lê o estoque da peça de teste na listagem. */
async function estoqueDaPeca() {
  await p.goto(`${BASE}/pecas?q=Peca de teste`, { waitUntil: "domcontentloaded" });
  const texto = await p.locator("li", { hasText: "Peca de teste" }).first().innerText();
  const achado = texto.match(/(-?[\d.,]+)\s+UN/);
  return achado ? Number(achado[1].replace(",", ".")) : NaN;
}

try {
  // 1. Cria a oficina (prova que o cadastro grava no banco publicado)
  await p.goto(`${BASE}/criar-conta`, { waitUntil: "domcontentloaded" });
  await p.fill('input[name="oficina"]', OFICINA);
  await p.fill('input[name="nome"]', "Robo de Teste");
  await p.fill('input[name="email"]', EMAIL);
  await p.fill('input[name="senha"]', SENHA);
  await p.fill('input[name="confirmacao"]', SENHA);
  await p.click('button[type="submit"]');
  await p.waitForURL("**/painel", { timeout: 40000 });
  ok("cria oficina e entra", OFICINA);

  // 2. Cliente e veículo
  await p.goto(`${BASE}/clientes/novo`, { waitUntil: "domcontentloaded" });
  await p.fill('input[name="nome"]', "Cliente de Teste");
  await p.fill('input[name="telefone"]', "11900000000");
  await p.click("button:has-text('Cadastrar cliente')");
  await p.waitForURL(/\/clientes\/(?!novo)[a-z0-9]+$/, { timeout: 30000 });
  const urlCliente = p.url();
  await p.goto(`${urlCliente}/veiculos/novo`, { waitUntil: "domcontentloaded" });
  await p.fill('input[name="placa"]', PLACA);
  await p.fill('input[name="marca"]', "Fiat");
  await p.fill('input[name="modelo"]', "Uno");
  await p.click("button:has-text('Adicionar veículo')");
  await p.waitForURL(urlCliente, { timeout: 30000 });
  ok("cadastra cliente e veículo", PLACA);

  // 3. Peça com estoque, para o faturamento ter o que baixar
  await p.goto(`${BASE}/pecas/nova`, { waitUntil: "domcontentloaded" });
  await p.fill('input[name="nome"]', "Peca de teste");
  await p.fill('input[name="precoCusto"]', "50,00");
  await p.fill('input[name="precoVenda"]', "100,00");
  await p.fill('input[name="quantidade"]', "10");
  await p.click("button:has-text('Cadastrar peça')");
  await p.waitForURL(/\/pecas(\?|$)/, { timeout: 30000 });
  const estoqueAntes = await estoqueDaPeca();
  estoqueAntes === 10
    ? ok("cadastra peça com estoque", `${estoqueAntes} UN`)
    : falhou("cadastra peça com estoque", `esperava 10, veio ${estoqueAntes}`);

  // 4. Orçamento com a peça
  await p.goto(`${BASE}/orcamentos/novo`, { waitUntil: "domcontentloaded" });
  await p.fill('input[placeholder*="nome"]', "Cliente de Teste");
  await p.waitForTimeout(500);
  await p.getByRole("button", { name: "Cliente de Teste" }).first().click();
  await p.waitForTimeout(500);
  await p.locator("button:has-text('Adicionar peça')").click();
  await p.waitForTimeout(400);
  const selects = p.locator("select").filter({ hasText: "Digitar manualmente" });
  const opcoes = await selects.nth(1).locator("option").allTextContents();
  await selects.nth(1).selectOption({ index: opcoes.findIndex((t) => t.includes("Peca de teste")) });
  await p.waitForTimeout(400);
  const qtd = p.locator('input[inputmode="decimal"]').nth(2);
  await qtd.fill("2");
  await p.waitForTimeout(300);
  await p.click("button:has-text('Criar orçamento')");
  await p.waitForURL(/\/orcamentos\/(?!novo)[a-z0-9]+$/, { timeout: 30000 });
  const urlOrcamento = p.url();
  ok("cria orçamento");

  // 5. Link público — prova que NEXT_PUBLIC_APP_URL está certo no ambiente
  await p.locator("button:has-text('Marcar como enviado')").click();
  await p.waitForTimeout(4000);
  const link = await p.locator("span.font-mono").filter({ hasText: "/orcamento/" }).first().innerText();
  link.startsWith(BASE)
    ? ok("link público aponta para o domínio publicado", link)
    : falhou("link público aponta para o domínio publicado", `veio ${link}`);

  // 6. Cliente aprova, sem sessão
  const anonimo = await navegador.newContext(opcoesContexto);
  const pagCliente = await anonimo.newPage();
  await pagCliente.goto(link, { waitUntil: "domcontentloaded" });
  if (await pagCliente.locator("text=Aprovar e autorizar o serviço").count()) {
    await pagCliente.click("text=Aprovar e autorizar o serviço");
    await pagCliente.waitForTimeout(4000);
    (await pagCliente.locator("text=Orçamento aprovado").count()) > 0
      ? ok("cliente aprova pelo link, sem login")
      : falhou("cliente aprova pelo link, sem login");
  } else falhou("página pública abre", "botão de aprovar não apareceu");
  await anonimo.close();

  // 7. Vira OS
  await p.goto(urlOrcamento, { waitUntil: "domcontentloaded" });
  await p.locator("button:has-text('Abrir ordem de serviço')").first().click();
  await p.waitForURL(/\/os\/(?!nova)[a-z0-9]+$/, { timeout: 30000 });
  ok("orçamento vira OS");

  // 8. O TESTE QUE IMPORTA: faturar através do pooler.
  //    Baixa de estoque, movimento e lançamento financeiro numa transação só.
  await p.selectOption('select[name="formaPagamento"]', "PIX");
  await p.selectOption('select[name="situacao"]', "RECEBIDO");
  await p.locator("button:has-text('Faturar e fechar OS')").click();
  await p.waitForTimeout(6000);
  (await p.locator("text=Faturada").count()) > 0
    ? ok("fatura a OS (transação interativa no pooler)")
    : falhou("fatura a OS (transação interativa no pooler)", "selo 'Faturada' não apareceu");

  // 9. A transação fez as duas coisas?
  const estoqueDepois = await estoqueDaPeca();
  estoqueDepois === estoqueAntes - 2
    ? ok("estoque baixou", `${estoqueAntes} -> ${estoqueDepois}`)
    : falhou("estoque baixou", `${estoqueAntes} -> ${estoqueDepois}`);

  await p.goto(`${BASE}/financeiro`, { waitUntil: "domcontentloaded" });
  (await p.locator("text=/^OS \\d{4}$/").count()) > 0
    ? ok("receita lançada no financeiro")
    : falhou("receita lançada no financeiro");
} catch (e) {
  falhou("execução", String(e).split("\n")[0]);
}

console.log(`\n=== Teste do ambiente publicado: ${BASE} ===`);
console.log(passos.join("\n"));
if (problemas.length) {
  console.log("\nProblemas no navegador:");
  console.log(problemas.slice(0, 8).map((x) => `  - ${x}`).join("\n"));
}
console.log(`\nOficina de teste criada: ${OFICINA} (${EMAIL})`);
console.log("APAGUE essa oficina do banco depois de conferir o resultado.");
console.log(`\n${erros === 0 ? "Tudo passou." : `${erros} falha(s).`}\n`);

await navegador.close();
process.exit(erros === 0 ? 0 : 1);
