# Publicar o Assetto

O sistema é publicado no **Netlify** (que você já usa) com o banco no
**Supabase**. Este documento registra como está montado, o que já foi feito e o
que ainda depende de você.

> **Ambiente de teste, não de produção.** Serve para validar o produto e mostrar
> para oficinas. Antes de colocar cliente pagante dentro, leia "Antes de valer
> de verdade" no fim.

---

## O que já está pronto

| Item | Valor |
| --- | --- |
| Projeto Supabase | `assetto-sistema`, região São Paulo (`sa-east-1`) |
| Site Netlify | `assetto-sistema` → <https://assetto-sistema.netlify.app> |
| Custo | R$ 0/mês nas duas faixas gratuitas |

Já configurado:

- Usuário de banco dedicado `assetto_app` (o sistema **não** usa o superusuário
  `postgres`) e schema próprio `assetto`.
- Variáveis `NEXT_PUBLIC_APP_URL` e `NODE_VERSION` no Netlify.
- Acesso público liberado no site. O Netlify criou o site exigindo login da
  equipe para visitar, o que bloquearia o link de aprovação que vai para o
  cliente da oficina. Isso foi desligado.

O site `assettoperformance.com` não foi tocado: o sistema ficou num site
separado.

---

## Por que schema separado

Por padrão o Supabase publica uma API REST sobre o schema `public`. Como o
sistema guarda CPF, telefone e endereço de clientes da oficina, as tabelas
foram criadas num schema `assetto`, que essa API não expõe. É uma camada a
menos de risco, de graça.

---

## Por que a conexão é a do "Session pooler"

O Supabase oferece três endereços de banco:

| Endereço | Serve? |
| --- | --- |
| Conexão direta (`db.....supabase.co`) | **Não.** É só IPv6, e as funções do Netlify saem por IPv4. |
| Session pooler (porta 5432) | **Sim.** IPv4, e mantém a sessão inteira numa conexão só. |
| Transaction pooler (porta 6543) | Evitar por ora. Não suporta *prepared statements* e complica a transação do faturamento. |

O faturamento de uma OS baixa estoque e lança o financeiro numa transação
única. É a operação mais delicada do sistema, e a conexão de sessão é a que
sustenta isso sem surpresa.

### O parâmetro que não pode faltar: `connection_limit=1`

A connection string termina com `&connection_limit=1&pool_timeout=20`. Sem
isso o sistema derruba a si mesmo, e foi o que aconteceu na primeira vez:
primeiro acesso funcionando, segundo devolvendo "Application error: a
server-side exception has occurred".

O motivo: o Prisma abre um *pool* de conexões por processo, e em hospedagem
serverless cada instância da função é um processo novo. Com o padrão do
Prisma, meia dúzia de instâncias já segurava 15 conexões ociosas e estourava o
limite de clientes do pooler — aí a conexão seguinte é recusada e a página
quebra.

Com `connection_limit=1`, cada instância segura uma conexão só. O
`pool_timeout=20` faz a requisição esperar por uma conexão livre em vez de
falhar na hora.

Se esse erro voltar, o diagnóstico é uma consulta:

```sql
select count(*) filter (where usename = 'assetto_app') as da_aplicacao,
       count(*) filter (where state = 'idle') as ociosas
  from pg_stat_activity;
```

Muitas conexões ociosas da aplicação = é isso de novo.

**Atenção ao host:** ele tem um número (`aws-0`, `aws-1`...) que é índice de
cluster, não a região. A documentação do Supabase diz explicitamente que não dá
para deduzir e que o endereço precisa ser copiado do painel.

---

## Permissões do banco

O papel `assetto_app` precisa exatamente disto, e nada além:

```sql
GRANT USAGE, CREATE ON SCHEMA assetto TO assetto_app;
```

A aplicação cria as próprias tabelas pelas migrações, então já é dona delas —
não precisa de GRANT tabela a tabela.

**O que deu errado na primeira publicação:** a migração inicial começava com
`CREATE SCHEMA IF NOT EXISTS "public"`, linha que o gerador do Prisma inclui
por padrão. Criar schema exige permissão no **banco inteiro**, não no schema, e
o build quebrou três vezes até isso ser contornado com
`GRANT CREATE ON DATABASE postgres TO assetto_app`.

Isso foi corrigido na origem: a linha saiu da migração (o schema alvo vem da
connection string, e no Supabase nem é o `public`), e o privilégio de criar
schema no banco foi revogado. Um ambiente novo agora sobe só com o GRANT
acima.

## Os dados estão isolados da API pública?

Sim, e foi verificado, não presumido. Consultando as permissões reais no banco:

| Papel | USAGE no schema `assetto` | Tabelas com grant | Lê `Cliente` |
| --- | --- | --- | --- |
| `anon` | não | 0 | não |
| `authenticated` | não | 0 | não |
| `service_role` | não | 0 | não |
| `assetto_app` | sim | todas | sim |

O advisor do Supabase acusa "RLS desabilitado" nas tabelas desse schema. No
nosso caso é alarme falso: ele olha RLS sem olhar permissão, e esses papéis não
alcançam o schema de jeito nenhum. Se um dia o schema `assetto` for adicionado
aos schemas expostos pela API, aí sim isso vira problema — e a resposta seria
RLS por `oficinaId`, não mexer nos grants.

---

## O que falta (2 passos)

### 1. Pegar o endereço do banco

No painel do Supabase, projeto `assetto-sistema`:

1. Clique em **Connect**, no topo da página.
2. Escolha a aba **Session pooler**.
3. Copie **só o trecho do host** — o pedaço entre a `@` e os dois-pontos, algo
   como `aws-1-sa-east-1.pooler.supabase.com`.

> Não precisa mandar a string inteira: ela contém a senha do usuário
> `postgres`, e o sistema não usa esse usuário. O host basta.

Com esse host, a variável `DATABASE_URL` do Netlify fica assim (a senha do
`assetto_app` é gerada e guardada só no Netlify):

```
postgresql://assetto_app.vvkwzqmjmqlydtfyopxt:SENHA@HOST:5432/postgres?schema=assetto&sslmode=require
```

### 2. Ligar o repositório ao site

No painel do Netlify, site `assetto-sistema`:

1. **Project configuration → Build & deploy → Continuous deployment**
2. **Link repository** → GitHub → escolha `caiomathias/Assetto`
3. Branch: a principal do repositório (a que começa com `claude/`)
4. O comando de build e a pasta já vêm do `netlify.toml` — não precisa mudar
   nada
5. **Deploy**

A partir daí, todo push no GitHub gera um deploy novo sozinho.

O primeiro build aplica as migrações e cria as tabelas. O banco começa vazio:
abra o site e clique em **Cadastre sua oficina**.

---

## O que testar, na ordem

Faça no celular pelo menos uma vez — é onde os problemas de usabilidade
aparecem.

**O caminho principal, ponta a ponta:**

- [ ] Cadastrar um cliente com o carro dele
- [ ] Montar um orçamento com dois ou três itens
- [ ] Marcar como enviado e mandar o link para o seu próprio WhatsApp
- [ ] Abrir o link **em outro celular** e aprovar como se fosse o cliente
- [ ] Ver o orçamento virar OS e o carro aparecer no pátio
- [ ] Mover o cartão no pátio até "Pronto"
- [ ] Faturar a OS e conferir que a peça saiu do estoque e o valor entrou no
      financeiro

**Depois, as perguntas que valem mais que os botões:**

- [ ] Quanto tempo leva para fazer um orçamento completo? Passando de 2
      minutos, tem o que simplificar.
- [ ] Um funcionário seu consegue usar sem você explicar? **É o teste mais
      valioso de todos.** Sente do lado, não fale nada, e veja onde ele trava.
- [ ] A via impressa está boa para entregar ao cliente?
- [ ] Faltou alguma informação que a oficina pede toda hora?

Anote o que incomodar, mesmo que pareça bobagem. É disso que sai a próxima
lista de trabalho.

---

## Perguntas comuns

**Vai custar alguma coisa?** Não, nas faixas gratuitas. O Supabase pausa o
projeto depois de uns dias sem uso; basta reativar pelo painel.

**Posso usar meu próprio domínio?** Pode, em **Domain management** no Netlify.
Depois atualize a variável `NEXT_PUBLIC_APP_URL` com o endereço novo e mande
redeployar, senão o link de aprovação continua apontando para o endereço
antigo.

**Como coloco os dados de demonstração?** Já existe, no ambiente publicado,
uma oficina fictícia cheia — "Auto Center Demonstração", com 320 clientes, 400
veículos, 50 carros no pátio e 14 meses de histórico. Serve para ver as telas
com volume de verdade e para mostrar o produto a uma oficina sem expor dado de
ninguém.

As credenciais dela **não ficam neste repositório**, que é público: quem tem
acesso ao repositório teria acesso à conta. Peça que eu passe.

O seed local (`npm run db:seed`) é outra coisa, e continua valendo só para a
sua máquina — ver o aviso em "Antes de valer de verdade".

---

## Antes de valer de verdade

1. **Backup do banco.** Na faixa gratuita do Supabase a janela de recuperação é
   curta. Dado de cliente perdido não tem desculpa.
2. **Trocar a senha do banco**, já que ela foi gerada nesta conversa. Dá para
   rodar `ALTER USER assetto_app WITH PASSWORD '...'` no SQL Editor do Supabase
   e atualizar a variável no Netlify.
3. **Decidir se o repositório continua público.** Hoje ele é: qualquer pessoa lê
   o código do seu produto. Para testar tudo bem, mas para um produto de
   assinatura é decisão de negócio. Fecha em **Settings → General → Change
   visibility** no GitHub, e o Netlify continua funcionando.
4. **Não rodar o seed em produção**: a conta `demo@assetto.com.br` tem senha
   pública neste repositório.
5. **Rever o pooler.** A conexão de sessão segura uma conexão por cliente. Com
   dezenas de oficinas simultâneas isso precisa ser revisto — e quando mudar,
   **testar o faturamento primeiro** (`npm run teste:fumaca` cobre esse caso).
6. **Cobrança e bloqueio por falta de pagamento** — ver `docs/produto.md`.
