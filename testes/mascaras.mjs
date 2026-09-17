/**
 * Máscaras dos campos de telefone, CPF/CNPJ e CEP.
 *
 * Existe porque esse comportamento é chato de acertar e fácil de quebrar sem
 * ninguém notar: a formatação acontece a cada tecla, e o cursor precisa
 * continuar onde estava mesmo quando um ponto ou parêntese entra no meio do
 * texto. Um bug aqui não derruba o sistema — só faz o atendente xingar a
 * cada cadastro.
 *
 * Confere também que o que chega ao banco continua sendo só dígito.
 *
 * Como rodar: npm start noutro terminal, depois `npm run teste:mascaras`.
 */
import { chromium } from "playwright-core";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const b = await chromium.launch({
  ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
  args: ["--no-sandbox"],
});
const p = await (await b.newContext({ locale: "pt-BR" })).newPage();
let erros = 0;
const checa = (nome, obtido, esperado) => {
  const ok = obtido === esperado;
  if (!ok) erros++;
  console.log(`  ${ok ? "OK   " : "FALHA"} ${nome}: "${obtido}"${ok ? "" : ` (esperava "${esperado}")`}`);
};

await p.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
await p.fill('input[name="email"]', "demo@assetto.com.br");
await p.fill('input[name="senha"]', "assetto123");
await p.click('button[type="submit"]');
await p.waitForURL("**/painel");
await p.goto(`${BASE}/clientes/novo`, { waitUntil: "networkidle" });

// Digita dígito a dígito, como uma pessoa faria.
console.log("\n--- telefone, enquanto digita ---");
const tel = p.locator('input[name="telefone"]');
for (const [digitos, esperado] of [["11", "11"], ["119", "(11) 9"], ["1198888", "(11) 9888-8"], ["11988887777", "(11) 98888-7777"]]) {
  await tel.fill("");
  await tel.pressSequentially(digitos, { delay: 15 });
  checa(`${digitos.length} dígitos`, await tel.inputValue(), esperado);
}
// Fixo de 10 dígitos usa outro formato
await tel.fill(""); await tel.pressSequentially("1133224455", { delay: 15 });
checa("fixo 10 dígitos", await tel.inputValue(), "(11) 3322-4455");

console.log("\n--- CPF vira CNPJ sozinho ---");
const doc = p.locator('input[name="documento"]');
await doc.fill(""); await doc.pressSequentially("12345678901", { delay: 15 });
checa("CPF", await doc.inputValue(), "123.456.789-01");
await doc.fill(""); await doc.pressSequentially("12345678000190", { delay: 15 });
checa("CNPJ", await doc.inputValue(), "12.345.678/0001-90");

console.log("\n--- CEP ---");
const cep = p.locator('input[name="cep"]');
await cep.fill(""); await cep.pressSequentially("01310100", { delay: 15 });
checa("CEP", await cep.inputValue(), "01310-100");

console.log("\n--- letra digitada é ignorada ---");
await tel.fill(""); await tel.pressSequentially("11a98b8887777", { delay: 15 });
checa("só dígitos entram", await tel.inputValue(), "(11) 98888-7777");

console.log("\n--- cursor fica no lugar ao corrigir o meio ---");
await tel.fill(""); await tel.pressSequentially("11988887777", { delay: 15 });
await tel.click();
// posiciona o cursor depois do 5o dígito e digita: deve inserir ali, não no fim
// "(11) 98|888-7777" -> 4 dígitos antes do cursor (1,1,9,8)
await p.evaluate(() => {
  const i = document.querySelector('input[name="telefone"]');
  i.setSelectionRange(7, 7);
});
await p.keyboard.type("5");
// dígitos viram 1198 5 8887777, cortado em 11: 11985888777
checa("insere no meio", await tel.inputValue(), "(11) 98588-8777");
const posCursor = await p.evaluate(() => document.querySelector('input[name="telefone"]').selectionStart);
checa("cursor continua no meio", posCursor, 8);

console.log("\n--- grava no banco só os dígitos ---");
await p.fill('input[name="nome"]', "Teste Mascara");
await tel.fill(""); await tel.pressSequentially("11988887777", { delay: 15 });
await doc.fill(""); await doc.pressSequentially("12345678901", { delay: 15 });
await cep.fill(""); await cep.pressSequentially("01310100", { delay: 15 });
await p.click("button:has-text('Cadastrar cliente')");
await p.waitForURL(/\/clientes\/(?!novo)[a-z0-9]+$/, { timeout: 20000 });
const texto = await p.locator("body").innerText();
checa("telefone exibido formatado", texto.includes("(11) 98888-7777"), true);
checa("CPF exibido formatado", texto.includes("123.456.789-01"), true);

await b.close();
console.log(`\n${erros === 0 ? "Tudo passou." : `${erros} falha(s).`}\n`);
process.exit(erros === 0 ? 0 : 1);
