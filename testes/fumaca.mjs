import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const passos = [];
const SUFIXO = String(Date.now()).slice(-5);
const PLACA = `TST${SUFIXO.slice(1)}`; // 7 caracteres, como placa de verdade
const NOME_TESTE = `Cliente Teste ${SUFIXO}`;
let erros = 0;

function ok(nome, detalhe = "") {
  passos.push(`  OK   ${nome}${detalhe ? ` - ${detalhe}` : ""}`);
}
function falhou(nome, detalhe = "") {
  erros++;
  passos.push(`  FALHA ${nome}${detalhe ? ` - ${detalhe}` : ""}`);
}

const navegador = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const ctx = await navegador.newContext({ locale: "pt-BR" });
const p = await ctx.newPage();

const errosDeConsole = [];
p.on("pageerror", (e) => errosDeConsole.push(`${p.url()} :: ${String(e)}`));
p.on("response", (r) => { if (r.status() >= 400) errosDeConsole.push(`HTTP ${r.status()} ${r.url()}`); });
p.on("console", (m) => {
  if (m.type() === "error") errosDeConsole.push(`${p.url()} :: ${m.text()}`);
});

try {
  // 1. Login
  await p.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await p.fill('input[name="email"]', "demo@assetto.com.br");
  await p.fill('input[name="senha"]', "assetto123");
  await p.click('button[type="submit"]');
  await p.waitForURL("**/painel", { timeout: 15000 });
  ok("login", await p.locator("h1").first().innerText());

  // 2. Todas as telas do menu carregam
  for (const rota of ["/painel", "/patio", "/clientes", "/orcamentos", "/os", "/pecas", "/pecas/servicos", "/financeiro", "/crm", "/configuracoes"]) {
    const r = await p.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
    const titulo = await p.locator("h1").first().innerText().catch(() => "?");
    if (r.status() === 200) ok(`abre ${rota}`, titulo);
    else falhou(`abre ${rota}`, `status ${r.status()}`);
  }

  // 3. Busca de cliente
  await p.goto(`${BASE}/clientes?q=ABC1D23`, { waitUntil: "networkidle" });
  const achou = await p.locator("text=Maria Aparecida Souza").count();
  achou > 0 ? ok("busca cliente por placa") : falhou("busca cliente por placa");

  // 4. Cadastrar cliente novo
  await p.goto(`${BASE}/clientes/novo`, { waitUntil: "networkidle" });
  await p.fill('input[name="nome"]', NOME_TESTE);
  await p.fill('input[name="telefone"]', "11988776655");
  await p.click("button:has-text('Cadastrar cliente')");
  await p.waitForURL(/\/clientes\/(?!novo)[a-z0-9]+$/, { timeout: 15000 });
  const urlCliente = p.url();
  ok("cadastra cliente", urlCliente.split("/").pop());

  // 5. Cadastrar veiculo
  const linkVeiculo = p.locator("a:has-text('Adicionar veiculo')").first();
  if (!(await linkVeiculo.count())) falhou("link para adicionar veiculo");
  await p.goto(`${urlCliente}/veiculos/novo`, { waitUntil: "networkidle" });
  await p.fill('input[name="placa"]', PLACA);
  await p.fill('input[name="marca"]', "Renault");
  await p.fill('input[name="modelo"]', "Kwid");
  await p.fill('input[name="anoFabricacao"]', "2022");
  await p.click("button:has-text('Adicionar veiculo')");
  await p.waitForURL(urlCliente, { timeout: 15000 });
  (await p.locator(`text=${PLACA.slice(0, 3)}-${PLACA.slice(3)}`).count()) > 0
    ? ok("cadastra veiculo")
    : falhou("cadastra veiculo", "placa nao apareceu na ficha");

  // 6. Placa duplicada precisa ser recusada com mensagem clara
  await p.goto(`${urlCliente}/veiculos/novo`, { waitUntil: "networkidle" });
  await p.fill('input[name="placa"]', "ABC1D23");
  await p.fill('input[name="marca"]', "Fiat");
  await p.fill('input[name="modelo"]', "Uno");
  await p.click("button:has-text('Adicionar veiculo')");
  await p.waitForTimeout(2500);
  const aviso = await p.locator("text=/ja esta cadastrada/i").count();
  aviso > 0 ? ok("bloqueia placa duplicada") : falhou("bloqueia placa duplicada");

  // 7. Criar orcamento completo
  await p.goto(`${BASE}/orcamentos/novo`, { waitUntil: "networkidle" });
  await p.fill('input[placeholder*="nome"]', NOME_TESTE);
  await p.waitForTimeout(400);
  await p.getByRole("button", { name: NOME_TESTE }).first().click();
  await p.waitForTimeout(400);
  await p.fill('textarea[name="descricaoProblema"]', "Barulho no motor em teste automatizado.");
  // primeiro item: escolhe um servico do catalogo
  const selectCatalogo = p.locator("select").filter({ hasText: "Digitar manualmente" }).first();
  await selectCatalogo.selectOption({ label: "Troca de oleo e filtro - R$\u00a090,00" });
  await p.waitForTimeout(300);
  // segundo item: peca
  await p.locator("button:has-text('Adicionar peca')").click();
  await p.waitForTimeout(300);
  const selects = p.locator("select").filter({ hasText: "Digitar manualmente" });
  await selects.nth(1).selectOption({ index: (await selects.nth(1).locator("option").allTextContents()).findIndex((t) => t.includes("Filtro de oleo")) });
  await p.waitForTimeout(300);
  const totalNaTela = await p.locator("text=/^R\\$/").last().innerText();
  await p.click("button:has-text('Criar orcamento')");
  await p.waitForURL(/\/orcamentos\/(?!novo)[a-z0-9]+$/, { timeout: 15000 });
  const urlOrcamento = p.url();
  ok("cria orcamento", `total na tela ${totalNaTela}`);

  // 8. Enviar ao cliente e pegar o link publico
  await p.locator("button:has-text('Marcar como enviado')").click();
  await p.waitForTimeout(2500);
  const link = await p.locator("span.font-mono").filter({ hasText: "/orcamento/" }).first().innerText();
  link.includes("/orcamento/") ? ok("gera link publico", link) : falhou("gera link publico");

  // 9. Cliente aprova pelo link, em aba anonima (sem sessao)
  const anonimo = await navegador.newContext({ locale: "pt-BR" });
  const pagCliente = await anonimo.newPage();
  await pagCliente.goto(link, { waitUntil: "networkidle" });
  const temBotao = await pagCliente.locator("text=Aprovar e autorizar o servico").count();
  if (!temBotao) falhou("pagina publica do orcamento");
  else {
    ok("pagina publica abre sem login");
    await pagCliente.click("text=Aprovar e autorizar o servico");
    await pagCliente.waitForTimeout(2500);
    (await pagCliente.locator("text=Orcamento aprovado").count()) > 0
      ? ok("cliente aprova pelo link")
      : falhou("cliente aprova pelo link");
  }
  await anonimo.close();

  // 10. Converter em OS
  await p.goto(urlOrcamento, { waitUntil: "networkidle" });
  await p.locator("button:has-text('Abrir ordem de servico')").first().click();
  await p.waitForURL(/\/os\/(?!nova)[a-z0-9]+$/, { timeout: 15000 });
  const urlOS = p.url();
  ok("orcamento vira OS");

  // 11. Estoque da peca ANTES de faturar
  async function estoqueFiltroDeOleo() {
    const atual = p.url();
    await p.goto(`${BASE}/pecas?q=Filtro de oleo`, { waitUntil: "networkidle" });
    const texto = await p.locator("li", { hasText: "Filtro de oleo" }).first().innerText();
    const achado = texto.match(/(-?[\d.,]+)\s+UN/);
    await p.goto(atual, { waitUntil: "networkidle" });
    return achado ? Number(achado[1].replace(",", ".")) : NaN;
  }
  const estoqueAntes = await estoqueFiltroDeOleo();

  // 12. Faturar a OS
  await p.selectOption('select[name="formaPagamento"]', "PIX");
  await p.selectOption('select[name="situacao"]', "RECEBIDO");
  await p.locator("button:has-text('Faturar e fechar OS')").click();
  await p.waitForTimeout(3000);
  (await p.locator("text=Faturada").count()) > 0
    ? ok("fatura OS")
    : falhou("fatura OS", "selo 'Faturada' nao apareceu");

  // 12b. A peca usada saiu do estoque
  const estoqueDepois = await estoqueFiltroDeOleo();
  estoqueDepois === estoqueAntes - 1
    ? ok("faturamento baixa o estoque", `${estoqueAntes} -> ${estoqueDepois}`)
    : falhou("faturamento baixa o estoque", `${estoqueAntes} -> ${estoqueDepois}`);

  // 13. Receita apareceu no financeiro
  await p.goto(`${BASE}/financeiro`, { waitUntil: "networkidle" });
  const temLancamento = await p.locator("text=/^OS \\d{4}$/").count();
  temLancamento > 0
    ? ok("faturamento gera receita no financeiro", `${temLancamento} lancamento(s) de OS`)
    : falhou("faturamento gera receita no financeiro");

  // 14. Kanban do patio move a OS
  await p.goto(`${BASE}/patio`, { waitUntil: "networkidle" });
  const cartoes = await p.locator("article").count();
  cartoes > 0 ? ok("patio mostra cartoes", `${cartoes} cartao(oes)`) : falhou("patio mostra cartoes");
  const avancar = p.locator('button[aria-label="Avancar etapa"]:not([disabled])').first();
  if (await avancar.count()) {
    await avancar.click();
    await p.waitForTimeout(2500);
    ok("move cartao no patio");
  } else falhou("move cartao no patio", "nenhum botao de avancar");

  // 15. CRM move cartao
  await p.goto(`${BASE}/crm`, { waitUntil: "networkidle" });
  const avancarCrm = p.locator('button[aria-label="Avancar etapa"]:not([disabled])').first();
  if (await avancarCrm.count()) {
    await avancarCrm.click();
    await p.waitForTimeout(2500);
    ok("move cartao no CRM");
  } else falhou("move cartao no CRM");

  // 16. Movimento de estoque
  await p.goto(`${BASE}/pecas`, { waitUntil: "networkidle" });
  await p.locator("ul li a[href^='/pecas/']").first().click();
  await p.waitForURL(/\/pecas\/(?!nova|servicos)[a-z0-9]+$/, { timeout: 15000 });
  await p.selectOption('select[name="tipo"]', "ENTRADA");
  await p.fill('input[name="quantidade"]', "5");
  await p.fill('input[name="motivo"]', "Teste automatizado");
  await p.locator("button:has-text('Registrar movimento')").click();
  await p.waitForTimeout(2500);
  (await p.locator("text=Teste automatizado").count()) > 0
    ? ok("registra entrada de estoque")
    : falhou("registra entrada de estoque");

  // 17. Impressao
  const r = await p.goto(`${urlOS}/imprimir`, { waitUntil: "networkidle" });
  r.status() === 200 && (await p.locator("text=Ordem de servico").count()) > 0
    ? ok("via para impressao da OS")
    : falhou("via para impressao da OS");

  // 18. Isolamento entre oficinas: outra conta nao ve os dados
  const outroCtx = await navegador.newContext({ locale: "pt-BR" });
  const pagOutro = await outroCtx.newPage();
  await pagOutro.goto(`${BASE}/criar-conta`, { waitUntil: "networkidle" });
  await pagOutro.fill('input[name="oficina"]', "Oficina Vizinha");
  await pagOutro.fill('input[name="nome"]', "Vizinho");
  await pagOutro.fill('input[name="email"]', `vizinho${Date.now()}@teste.com`);
  await pagOutro.fill('input[name="senha"]', "senha123");
  await pagOutro.fill('input[name="confirmacao"]', "senha123");
  await pagOutro.click('button[type="submit"]');
  await pagOutro.waitForURL("**/painel", { timeout: 15000 });

  const respostaOS = await pagOutro.goto(urlOS, { waitUntil: "networkidle" });
  const bloqueado =
    respostaOS.status() === 404 ||
    (await pagOutro.locator("text=Pagina nao encontrada").count()) > 0;
  bloqueado
    ? ok("outra oficina NAO ve a OS alheia")
    : falhou("outra oficina NAO ve a OS alheia", "conseguiu abrir!");

  await pagOutro.goto(`${BASE}/clientes`, { waitUntil: "networkidle" });
  const vazio = await pagOutro.locator("text=Nenhum cliente cadastrado ainda").count();
  vazio > 0
    ? ok("outra oficina comeca com lista vazia")
    : falhou("outra oficina comeca com lista vazia");
  await outroCtx.close();

  // 19. Sem sessao vai para o login
  const semLogin = await navegador.newContext();
  const pagSemLogin = await semLogin.newPage();
  await pagSemLogin.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
  pagSemLogin.url().includes("/entrar")
    ? ok("area interna exige login")
    : falhou("area interna exige login", pagSemLogin.url());
  await semLogin.close();
} catch (e) {
  falhou("execucao", String(e).split("\n")[0]);
}

console.log("\n=== Teste de fumaca do Assetto ===");
console.log(passos.join("\n"));
if (errosDeConsole.length) {
  console.log("\nErros de console no navegador:");
  console.log(errosDeConsole.slice(0, 10).map((e) => `  - ${e}`).join("\n"));
}
console.log(`\n${erros === 0 ? "Tudo passou." : `${erros} falha(s).`}\n`);

await navegador.close();
process.exit(erros === 0 ? 0 : 1);
