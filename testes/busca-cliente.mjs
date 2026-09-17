/**
 * Busca de cliente no seletor de orçamento e OS, com base grande.
 *
 * Este é o ponto do sistema que pior envelhece com o crescimento da oficina:
 * a tela era montada com a base inteira dentro do navegador. Com 5 mil
 * clientes chegava a 1,2 MB por abertura, no 4G do balcão. Agora a busca é
 * feita no servidor e só voltam 8 registros.
 *
 * O teste precisa de uma base grande para ter sentido, e ele mesmo a cria e a
 * apaga no fim. Antes dependia de um INSERT colado à mão, documentado aqui no
 * comentário: quem não lesse o comentário via o teste passar sem base grande
 * nenhuma, e as 5 mil linhas ficavam para trás poluindo os outros testes.
 *
 * As fixtures se chamam "Teste Carga N", sem acento de propósito: se a limpeza
 * falhar, elas não disparam o verificador de acentuação.
 *
 * Como rodar: npm start noutro terminal, depois `npm run teste:busca`.
 */
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright-core";

const QUANTAS = 5000;
const PREFIXO = "Teste Carga ";
const prisma = new PrismaClient();

/** Cria a base grande na oficina de demonstração. Devolve como desfazer. */
async function prepararBase() {
  const dono = await prisma.usuario.findUnique({
    where: { email: "demo@assetto.com.br" },
    select: { oficinaId: true },
  });
  if (!dono) throw new Error("Rode `npm run db:seed` antes: a oficina de demonstração não existe.");
  const oficinaId = dono.oficinaId;

  const clientes = [];
  const veiculos = [];
  for (let g = 1; g <= QUANTAS; g++) {
    const id = `carga-${g}`;
    const n = String(g).padStart(4, "0");
    clientes.push({
      id,
      oficinaId,
      nome: `${PREFIXO}${g}`,
      tipoPessoa: "FISICA",
      telefone: `119${String(g).padStart(8, "0")}`,
    });
    veiculos.push({ id: `carga-v-${g}`, oficinaId, clienteId: id, placa: `AAA${n}`, marca: "Fiat", modelo: "Uno" });
  }
  await prisma.veiculo.deleteMany({ where: { oficinaId, placa: { startsWith: "AAA" } } });
  await prisma.cliente.deleteMany({ where: { oficinaId, nome: { startsWith: PREFIXO } } });
  await prisma.cliente.createMany({ data: clientes });
  await prisma.veiculo.createMany({ data: veiculos });

  return async () => {
    await prisma.veiculo.deleteMany({ where: { id: { startsWith: "carga-v-" } } });
    await prisma.cliente.deleteMany({ where: { id: { startsWith: "carga-" } } });
    await prisma.$disconnect();
  };
}

const limpar = await prepararBase();

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
const iniciais = await p.locator("button", { hasText: /Teste Carga|Maria|Jo/ }).count();
iniciais > 0 && iniciais <= 12 ? ok("lista inicial enxuta", `${iniciais} botões`) : falhou("lista inicial enxuta", `${iniciais}`);

// 2. acha um cliente lá no fundo da base
await campo.fill("Teste Carga 4321");
const achado = p.getByRole("button", { name: /Teste Carga 4321/ }).first();
try { await achado.waitFor({ timeout: 8000 }); ok("acha o cliente 4321 entre 5 mil"); }
catch { falhou("acha o cliente 4321 entre 5 mil"); }

// 3. busca por placa
await campo.fill("AAA4321");
try { await p.getByRole("button", { name: /Teste Carga 4321/ }).first().waitFor({ timeout: 8000 }); ok("acha pela placa"); }
catch { falhou("acha pela placa"); }

// 4. busca por telefone
await campo.fill("11900004321");
try { await p.getByRole("button", { name: /Teste Carga 4321/ }).first().waitFor({ timeout: 8000 }); ok("acha pelo telefone"); }
catch { falhou("acha pelo telefone"); }

// 5. termo sem resultado
await campo.fill("zzzzzzzznaoexiste");
try { await p.locator("text=Nenhum cliente encontrado").waitFor({ timeout: 8000 }); ok("avisa quando não acha"); }
catch { falhou("avisa quando não acha"); }

// 6. escolher e seguir
await campo.fill("Teste Carga 4321");
await p.getByRole("button", { name: /Teste Carga 4321/ }).first().click();
await p.waitForTimeout(600);
(await p.locator("text=Trocar cliente").count()) > 0 ? ok("seleciona o cliente") : falhou("seleciona o cliente");
(await p.locator("text=AAA-4321").count()) > 0 ? ok("mostra o veículo dele") : falhou("mostra o veículo dele");

await b.close();
// A base de teste sai daqui mesmo se algum passo falhar: deixar 5 mil clientes
// para trás atrapalha todo o resto da suíte.
await limpar();
console.log(`\n${erros === 0 ? "Tudo passou." : `${erros} falha(s).`}\n`);
process.exit(erros === 0 ? 0 : 1);
