# Assetto — arquitetura

Documento para quem for mexer no código. As escolhas estão explicadas, não só
listadas, para que dê para discordar com conhecimento de causa depois.

## Tecnologia

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | Next.js 15, App Router | Um projeto só para tela e servidor. Server Actions eliminam a camada de API para um CRUD deste tamanho. |
| Linguagem | TypeScript, modo estrito | O compilador pega o erro antes do balcão. |
| Banco | PostgreSQL com Prisma | Transação de verdade (necessária no faturamento), e o Prisma deixa o schema legível por quem não é do time. |
| Estilo | Tailwind CSS 4 | Sem arquivo de estilo paralelo para manter. |
| Sessão | Cookie httpOnly + token no banco | Dá para derrubar o acesso de alguém na hora, coisa que JWT sozinho não faz. |
| Componentes | Próprios, em `src/components/ui` | Nove componentes. Uma biblioteca inteira seria peso morto e tiraria o controle do tamanho de alvo de toque. |

Sem biblioteca de kanban: o arrastar-e-soltar usa a API nativa do navegador em
umas 40 linhas. Uma dependência a menos para atualizar, e as setas de avançar
e voltar cobrem quem não consegue arrastar.

## Multi-inquilino

**Toda tabela de negócio tem `oficinaId`, e nenhuma consulta roda sem ele.**

O `oficinaId` sai sempre da sessão (`exigirSessao()`), nunca do formulário.
Escritas usam `updateMany`/`deleteMany` com `oficinaId` no `where`: se alguém
trocar o id no navegador, zero linhas são afetadas em vez de editar dado de
outra oficina. Leituras usam `findFirst` com `oficinaId`, e o registro de outra
oficina simplesmente não existe (404).

Isso está coberto por teste: `testes/fumaca.mjs` cria uma segunda oficina e
confirma que ela não abre a OS da primeira nem vê os clientes dela.

É essa decisão que permite vender por assinatura sem reescrever nada. Se um dia
um cliente grande exigir banco separado, o caminho é trocar a conexão por
oficina — o código de consulta continua igual.

## Regras que não podem ser quebradas

**Dinheiro é `Int` em centavos.** Nunca `Float`, nunca `Decimal` na aplicação.
`R$ 1.234,56` é `123456`. A conversão do que o usuário digita está em
`paraCentavos()` e aceita `1.234,56`, `1234,56`, `1234.56` e `1234`.

**Total é calculado no servidor.** O valor que veio do navegador é entrada, não
verdade. `lerItens()` revalida tudo e recalcula os totais; o desconto nunca
pode deixar o total negativo.

**Faturar é uma transação só.** Baixa de estoque, movimento de auditoria,
lançamento da receita e marcação da OS acontecem juntos ou não acontecem. A
flag `estoqueBaixado` impede faturar duas vezes. Estoque errado e dinheiro
lançado em dobro são os dois erros que fazem uma oficina abandonar o sistema.

**Numeração de OS e orçamento vem de `Sequencia`**, com `increment` atômico
dentro da mesma transação do registro. Duas pessoas salvando ao mesmo tempo
nunca geram o mesmo número.

**Acento é regra, não detalhe.** Todo texto que o usuário lê é escrito em
português correto, com acento. Identificadores, nomes de campo de formulário,
rotas, chaves de enum e classes CSS ficam em ASCII — acentuar um desses quebra
o sistema em silêncio. `npm run teste:acentos` abre todas as telas e falha se
encontrar palavra sem acento no texto visível.

Só que teste de navegador não alcança o que a tela não mostrou. "cliente
especifico" (só aparece acima de 200 clientes), "E-mail invalido", "não pode
ser excluido" e "Este orcamento venceu" ficaram na base sem ninguém ver, porque
são ramos que os dados de demonstração nunca acionam. Por isso existe também o
`npm run teste:acentos-fonte`, que lê o código e olha texto de exibição — JSX e
literal de string com cara de frase. Os dois se completam: um vê o que é
renderizado, o outro vê o que está escrito.

**Nenhum erro técnico chega à tela.** `mensagemDeErro()` traduz os códigos do
Prisma para português de gente. `P2002` vira "já existe um registro com esses
dados".

## Mapa do código

```
prisma/schema.prisma          modelo de dados, comentado
prisma/seed.ts                oficina de demonstração completa

src/lib/
  auth.ts                     sessão, hash de senha, exigirSessao()
  prisma.ts                   cliente do banco (com cache em desenvolvimento)
  format.ts                   moeda, data, telefone, placa, documento
  itens.ts                    validação e recálculo dos itens
  sequencia.ts                numeração por oficina
  rotulos.ts                  todo texto de enum que aparece na tela
  consultas.ts                catálogo e clientes para os seletores
  erros.ts                    Resultado padrão das actions

src/components/               UI, formulários, kanban, editor de itens
src/app/(auth)/               entrar e criar conta
src/app/(app)/                sistema logado, um diretório por módulo
src/app/orcamento/[token]/    página pública de aprovação (sem login)
```

Cada módulo em `src/app/(app)/` tem um `acoes.ts` com as Server Actions, e as
páginas ao lado. Nomes em português porque o domínio é brasileiro: quem ler o
código depois entende o negócio sem traduzir.

## Padrões

**Server Actions com estado.** Toda action de formulário tem a assinatura
`(anterior, FormData) => Promise<Resultado>` e devolve `{ ok: false, erro }`
em vez de lançar exceção. O componente `<Formulario>` mostra o erro, desabilita
o botão enquanto salva e evita envio duplicado no clique nervoso.

**Itens viajam como JSON.** O editor de itens é um componente de cliente com
estado próprio; a lista vai para o servidor num campo escondido. O formulário
continua sendo um `<form>` normal com Server Action, sem API paralela.

**Kanban com estado otimista.** O cartão muda de coluna na tela antes da
resposta do servidor, e o servidor volta a ser a verdade assim que responde.
Sem isso o quadro pisca a cada movimento.

**Cópia em vez de referência entre orçamento e OS.** Ao converter, os itens são
copiados. Depois disso o orçamento é documento histórico e a OS segue a própria
vida — o mecânico pode acrescentar peça sem alterar o que o cliente aprovou.

## Segurança

- Senhas com bcrypt (custo 10).
- Sessão em cookie `httpOnly` + `sameSite=lax`, `secure` em produção, com
  registro no banco e validade de 30 dias. Desativar um usuário derruba as
  sessões abertas dele na hora.
- Login não revela se o e-mail existe.
- A página pública de aprovação roda sem sessão, então a action dela é
  deliberadamente estreita: só muda o status de um orçamento que está em
  `ENVIADO`, e nada mais. O token é um `cuid` de uso único por orçamento e a
  página tem `robots: noindex`.

## Antes de ir para produção

1. Trocar a senha do banco do `docker-compose.yml` e do `DATABASE_URL`. A
   sessão não usa segredo de ambiente: o token é um valor aleatório de 256
   bits guardado no banco, então não há nada para vazar num arquivo `.env`.
2. Definir `NEXT_PUBLIC_APP_URL` com o domínio real — é o que monta o link de
   aprovação enviado ao cliente.
3. Não rodar o seed: a senha dele é pública.
4. Configurar backup automático do PostgreSQL. É o ativo do cliente.
5. Limpar sessões vencidas periodicamente (`Sessao.expiraEm < now()`).
6. Rever a conexão do banco. O guia de publicação manda usar conexão direta,
   não pooler: pooler em modo transação tem incompatibilidades conhecidas com
   o Prisma (prepared statements, e transação interativa como a do
   faturamento), e a conexão direta não tem nenhuma. Em troca, conexão direta
   tem limite de conexões simultâneas. Com dezenas de oficinas isso precisa de
   outra solução — pooler em modo sessão, ou Prisma Accelerate. **Quando
   trocar, testar o faturamento primeiro**, que é a única operação que depende
   de transação interativa: `npm run teste:fumaca` cobre esse caso.

## Migrações

O schema é versionado em `prisma/migrations`. `npm run build` roda
`prisma migrate deploy` antes de compilar, então publicar já aplica o que
estiver pendente — local e produção passam pelo mesmo caminho.

`prisma db push` continua disponível (`npm run db:push`) para iterar schema
rápido em desenvolvimento, mas o que vale é a migração versionada. Ao mudar o
schema, gere a migração com `npm run db:migrate`.

Numa hospedagem com deploy de preview por branch, atenção: o build de preview
também roda `migrate deploy`. Com um banco só, a preview migra o banco de
produção. Ao chegar nesse ponto, separar os bancos.

**Cuidado ao gerar migração nova:** `prisma migrate diff --from-empty` inclui
um `CREATE SCHEMA IF NOT EXISTS "public"` no topo. Essa linha exige permissão
no banco inteiro, não no schema, e quebra qualquer ambiente onde a aplicação
roda com um papel restrito — foi o que derrubou a primeira publicação três
vezes. O schema alvo vem da connection string (`?schema=`), então a linha é
inútil: remova antes de commitar.

Se precisar editar uma migração já aplicada, lembre que o Prisma guarda o
sha256 do arquivo em `_prisma_migrations` e recusa rodar se não bater. Depois
de editar, atualize a coluna `checksum` em todos os bancos onde ela já foi
aplicada.

## Dívidas conhecidas

- **Listas sem paginação.** Limitadas a 100–300 registros com busca. Acima de
  alguns milhares de clientes, vai precisar de paginação de verdade.
- ~~Seletor de cliente carrega todos os clientes~~ **resolvido em 17/09/2026.**
  A tela de nova OS/orçamento mandava a base inteira para o navegador filtrar
  lá. Medido antes de corrigir: 6 clientes = 41 KB, 500 = 154 KB, 2 mil =
  496 KB, 5 mil = **1,2 MB** — a cada abertura da tela, no 4G do balcão. Agora
  o servidor busca e devolve 8 resultados: 42 KB com os mesmos 5 mil
  clientes, e constante daí para cima. Coberto por `npm run teste:busca`.
- **Conexão de banco em serverless é um equilíbrio frágil.** A conexão de
  sessão com `connection_limit=1` resolve o caso de hoje (poucos usuários),
  mas segura uma conexão por instância da função. Com dezenas de oficinas
  simultâneas o limite volta a apertar, e a saída provável é o pooler em modo
  transação — que exige revalidar a transação do faturamento antes, porque é
  o ponto que depende de sessão.
- **Assinatura não é cobrada.** `Oficina.plano` existe mas nada verifica. A
  única alavanca é `Oficina.ativa`, que bloqueia o login inteiro — brutal
  demais para usar como cobrança. Ver o plano em `docs/produto.md`.
- **Sem histórico de alteração** (quem mudou o quê). Só o estoque tem extrato.
- **Sem testes unitários.** A cobertura são os dois testes de ponta a ponta
  (`teste:fumaca` e `teste:acentos`), que protegem o caminho do dinheiro e a
  qualidade do texto. Vale acrescentar testes de `paraCentavos` e `lerItens`,
  que são onde um erro silencioso custa caro.
