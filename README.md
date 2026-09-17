# Assetto

Sistema de gestão para oficinas mecânicas. Feito para ser usado no balcão, por
quem tem pressa e não tem paciência com sistema complicado.

**Módulos:** clientes e veículos, orçamento com aprovação por WhatsApp, ordem de
serviço, pátio em kanban, peças com estoque, financeiro e CRM.

---

## Como rodar na sua máquina

Você precisa de [Node.js 20 ou superior](https://nodejs.org) e um banco
PostgreSQL. Se tiver Docker instalado, o banco sobe sozinho.

```bash
# 1. Instalar as dependências
npm install

# 2. Criar o arquivo de configuração
cp .env.example .env

# 3. Subir o banco de dados (só se tiver Docker)
docker compose up -d

# 4. Criar as tabelas e os dados de demonstração
npm run setup

# 5. Ligar o sistema
npm run dev
```

Abra <http://localhost:3000> e entre com:

| campo | valor |
| --- | --- |
| E-mail | `demo@assetto.com.br` |
| Senha | `assetto123` |

Esse login vem com uma oficina de exemplo já cheia de dados: seis clientes,
peças em estoque, orçamentos, ordens de serviço no pátio, contas no financeiro
e contatos no CRM. Dá para clicar em tudo sem medo.

Para começar do zero com a sua própria oficina, clique em **Cadastre sua
oficina** na tela de entrada.

### Sem Docker

Se você já tem um PostgreSQL rodando, edite a linha `DATABASE_URL` do arquivo
`.env` com os dados do seu banco e pule o passo 3.

---

## O dia a dia no sistema

O menu está na ordem do trabalho da oficina, não em ordem alfabética.

**Pátio** é a tela que fica aberta o dia todo. Cada carro é um cartão; arraste
entre as colunas ou use as setas do próprio cartão (no tablet, a seta funciona
melhor que arrastar).

**O caminho completo de um serviço:**

1. **Clientes** → cadastre a pessoa e o carro (nome e telefone já bastam).
2. **Orçamentos** → monte a lista de peças e serviços. O total aparece enquanto
   você digita.
3. Clique em **Marcar como enviado** e depois em **Enviar no WhatsApp**. O
   cliente abre o link no celular e aprova com um toque. Fica registrado quem
   aprovou, quando e de qual endereço de internet.
4. Orçamento aprovado → botão **Abrir ordem de serviço**. Os itens são copiados
   para a OS e o carro aparece no pátio.
5. Serviço pronto → na OS, **Faturar e fechar**. Nesse momento, e só nesse, o
   sistema baixa as peças do estoque e lança o valor no financeiro.

Quem prefere trabalhar sem orçamento pode abrir a OS direto em **Nova ordem de
serviço**.

**CRM** é para quem pediu preço e ainda não fechou: quem ligou, quem veio pelo
Instagram, quem prometeu voltar. O painel avisa com quem falar hoje.

---

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Liga o sistema em modo de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm start` | Liga a versão de produção |
| `npm run setup` | Cria as tabelas e os dados de demonstração |
| `npm run db:seed` | Recria só os dados de demonstração |
| `npm run db:studio` | Abre uma tela para ver o banco de dados |
| `npm run typecheck` | Confere se o código tem erro de tipo |
| `npm run teste:fumaca` | Testa o caminho completo num navegador de verdade |
| `npm run teste:acentos` | Confere se sobrou texto sem acento em alguma tela |

O teste de fumaça precisa do sistema já rodando (`npm start`) e de um Chromium
instalado (`npx playwright install chromium`, ou aponte o caminho em
`CHROME_EXECUTABLE`). Ele percorre o fluxo inteiro, do login ao faturamento, e
confere que uma oficina não enxerga os dados da outra. O `teste:acentos` abre
todas as telas e procura palavras sem acento no texto visível — o produto é
vendido para oficinas brasileiras, e texto sem acento passa impressão de
sistema mal feito.

---

## Documentação

- [`docs/produto.md`](docs/produto.md) — o que cada módulo faz, as decisões de
  negócio já tomadas e o que ficou de fora de propósito.
- [`docs/arquitetura.md`](docs/arquitetura.md) — decisões técnicas, modelo de
  dados e o caminho até o modelo de assinatura.

---

## Tecnologia, em uma linha

Next.js 15, TypeScript, Tailwind CSS e PostgreSQL com Prisma. Multi-inquilino
desde o primeiro dia: cada oficina só enxerga os próprios dados, que é o que
permite vender por assinatura sem reescrever nada.
