/**
 * Busca de cliente no seletor de orçamento e OS, com base grande.
 *
 * Este é o ponto do sistema que pior envelhece com o crescimento da oficina:
 * a tela era montada com a base inteira dentro do navegador. Com 5 mil
 * clientes chegava a 1,2 MB por abertura, no 4G do balcão. Agora a busca é
 * feita no servidor e só voltam 8 registros.
 *
 * O teste precisa de uma base grande para ter sentido. Para criar:
 *
 *   insert into "Cliente" (id, "oficinaId", nome, "tipoPessoa", telefone,
 *                          "criadoEm", "atualizadoEm")
 *   select 'c'||g, '<id da oficina>', 'Cliente Numero '||g, 'FISICA',
 *          '119'||lpad(g::text,8,'0'), now(), now()
 *   from generate_series(1, 5000) g;
 *
 * Como rodar: npm start noutro terminal, depois `npm run teste:busca`.
 */
import { chromium } from "playwright-core";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const b = await chromium.launch({
  ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
  args: ["--no-sandbox"],
});
const p = await (await b.newContext({ locale: "pt-BR" })).newPage();
let erros = 0;
const ok = (n, d="") => console.log(`  OK    ${n}${d?` - ${d}`:""}`);
const falhou = (n, d="") => { erros++; console.log(`  FALHA ${n}${d?` - ${d}`:""}`); };

await p.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
await p.fill('input[name="email"]', "demo@assetto.com.br");
await p.fill('input[name="senha"]', "assetto123");
await p.click('button[type="submit"]');
await p.waitForURL("**/painel");

await p.goto(`${BASE}/os/nova`, { waitUntil: "networkidle" });
const campo = p.locator('input[placeholder*="nome"]');

// 1. lista inicial pequena
const iniciais = await p.locator("button", { hasText: /Cliente|Maria|Jo/ }).count();
iniciais > 0 && iniciais <= 12 ? ok("lista inicial enxuta", `${iniciais} botões`) : falhou("lista inicial enxuta", `${iniciais}`);

// 2. acha um cliente lá no fundo da base
await campo.fill("Cliente Numero 4321");
const achado = p.getByRole("button", { name: /Cliente Numero 4321/ }).first();
try { await achado.waitFor({ timeout: 8000 }); ok("acha o cliente 4321 entre 5 mil"); }
catch { falhou("acha o cliente 4321 entre 5 mil"); }

// 3. busca por placa
await campo.fill("AAA4321");
try { await p.getByRole("button", { name: /Cliente Numero 4321/ }).first().waitFor({ timeout: 8000 }); ok("acha pela placa"); }
catch { falhou("acha pela placa"); }

// 4. busca por telefone
await campo.fill("11900004321");
try { await p.getByRole("button", { name: /Cliente Numero 4321/ }).first().waitFor({ timeout: 8000 }); ok("acha pelo telefone"); }
catch { falhou("acha pelo telefone"); }

// 5. termo sem resultado
await campo.fill("zzzzzzzznaoexiste");
try { await p.locator("text=Nenhum cliente encontrado").waitFor({ timeout: 8000 }); ok("avisa quando não acha"); }
catch { falhou("avisa quando não acha"); }

// 6. escolher e seguir
await campo.fill("Cliente Numero 4321");
await p.getByRole("button", { name: /Cliente Numero 4321/ }).first().click();
await p.waitForTimeout(600);
(await p.locator("text=Trocar cliente").count()) > 0 ? ok("seleciona o cliente") : falhou("seleciona o cliente");
(await p.locator("text=AAA-4321").count()) > 0 ? ok("mostra o veículo dele") : falhou("mostra o veículo dele");

await b.close();
console.log(`\n${erros === 0 ? "Tudo passou." : `${erros} falha(s).`}\n`);
process.exit(erros === 0 ? 0 : 1);
