# Publicar o Assetto para testar

Este guia é para colocar o sistema no ar num endereço público, de graça, para
você usar no computador e no celular. Não precisa saber programar e não precisa
instalar nada na sua máquina.

**Leva uns 20 minutos.** No fim você terá um endereço como
`https://assetto.vercel.app` que abre em qualquer lugar.

> **Isto é um ambiente de teste, não de produção.** Serve para você validar o
> produto e mostrar para oficinas. Antes de colocar cliente pagante dentro,
> leia a seção "Antes de valer de verdade" no fim deste documento.

---

## O que você vai precisar

Duas contas gratuitas, além do GitHub que você já tem:

| Serviço | Para que serve | Custo |
| --- | --- | --- |
| [Neon](https://neon.tech) | Guardar os dados (banco PostgreSQL) | Grátis |
| [Vercel](https://vercel.com) | Rodar o sistema e dar o endereço | Grátis |

Nos dois dá para entrar com a conta do GitHub, sem cartão de crédito.

---

## Passo 1 — Criar o banco de dados (Neon)

1. Entre em <https://neon.tech> e crie a conta com o GitHub.
2. Clique em **Create project**. Dê o nome `assetto`.
3. Em região, escolha a mais perto do Brasil (`AWS South America (São Paulo)`
   se aparecer; se não, `US East` serve).
4. Terminando, o Neon mostra uma tela de **Connection string**. É um texto
   longo que começa com `postgresql://`.

**Atenção a este detalhe, é o único ponto onde dá para errar feio:**

O Neon oferece dois endereços. Um deles tem a palavra **`-pooler`** no meio.
**Copie o que NÃO tem `-pooler`.** Costuma aparecer marcando a opção
*Direct connection* ou desmarcando *Connection pooling*.

```
✅ certo   postgresql://usuario:senha@ep-nome-123.sa-east-1.aws.neon.tech/neondb?sslmode=require
❌ errado  postgresql://usuario:senha@ep-nome-123-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

O motivo: o endereço com `pooler` divide a conexão entre vários acessos, e
isso costuma dar problema justamente na operação mais delicada do sistema —
faturar uma OS, que baixa o estoque e lança o financeiro de uma vez só. A
conexão direta não tem esse risco e dá conta de sobra do volume de um teste.

Guarde esse texto, você vai colar daqui a pouco.

---

## Passo 2 — Publicar o sistema (Vercel)

1. Entre em <https://vercel.com> e crie a conta com o GitHub.
2. Clique em **Add New → Project**.
3. Ache o repositório `Assetto` na lista e clique em **Import**.
4. Na tela que abre, **não mude nada** em Framework, Build Command ou
   Output Directory — a Vercel reconhece o projeto sozinho.

   > O nome da branch é feio (`claude/workshop-management-system-...`), mas é
   > a branch principal do repositório e a Vercel já a escolhe sozinha. Se um
   > dia você renomear para `main`, lembre de atualizar a Production Branch em
   > **Settings → Git**.
5. Abra a seção **Environment Variables** e cadastre duas:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | o endereço do Neon que você copiou (o **sem** `-pooler`) |
   | `NEXT_PUBLIC_APP_URL` | deixe em branco por enquanto |

6. Clique em **Deploy** e espere. Demora uns 2 minutos.

Se der erro, quase sempre é o `DATABASE_URL` colado errado (faltando um pedaço
ou com espaço no fim). Corrija em **Settings → Environment Variables** e clique
em **Redeploy**.

---

## Passo 3 — Apontar o endereço certo

Terminado o deploy, a Vercel mostra o endereço do seu sistema, algo como
`https://assetto-xxxx.vercel.app`.

1. Vá em **Settings → Environment Variables**.
2. Edite `NEXT_PUBLIC_APP_URL` e coloque esse endereço, **sem barra no fim**:
   `https://assetto-xxxx.vercel.app`
3. Vá na aba **Deployments**, clique nos três pontinhos do último e escolha
   **Redeploy**.

Isso é o que faz o link de aprovação de orçamento apontar para o endereço
certo quando você mandar no WhatsApp.

---

## Passo 4 — Criar sua oficina

Abra o endereço e clique em **Cadastre sua oficina**.

Use dados de verdade (nome, CNPJ, telefone, endereço): eles aparecem no
cabeçalho dos orçamentos e das OS impressas, e é assim que você vê como o
documento fica na mão do cliente.

O banco começa vazio — sem os dados de demonstração. Isso é proposital: para
avaliar o produto, é melhor cadastrar seus próprios clientes e sentir o
trabalho real de uso.

---

## O que testar, na ordem

Sugestão de roteiro. Faça no celular pelo menos uma vez, porque é onde a
maioria dos problemas de usabilidade aparece.

**O caminho principal, ponta a ponta:**

- [ ] Cadastrar um cliente com o carro dele
- [ ] Montar um orçamento com dois ou três itens
- [ ] Marcar como enviado e mandar o link para o seu próprio WhatsApp
- [ ] Abrir o link **em outro celular** e aprovar como se fosse o cliente
- [ ] Ver o orçamento virar OS e o carro aparecer no pátio
- [ ] Mover o cartão no pátio até "Pronto"
- [ ] Faturar a OS e conferir que a peça saiu do estoque e o valor entrou
      no financeiro

**Depois, as perguntas que importam mais que os botões:**

- [ ] Quanto tempo leva para fazer um orçamento completo? Se passar de 2
      minutos, tem coisa para simplificar.
- [ ] Um funcionário seu consegue usar sem você explicar? **Esse é o teste
      mais valioso de todos.** Sente do lado, não fale nada e veja onde ele
      trava.
- [ ] A via impressa está boa para entregar ao cliente?
- [ ] Faltou alguma informação que a oficina pede toda hora?

Anote o que incomodar, mesmo que pareça bobagem. É disso que sai a próxima
lista de trabalho — e vale mais que qualquer suposição minha.

---

## Perguntas comuns

**Vai custar alguma coisa?** Não, nas faixas gratuitas dos dois serviços. O
Neon hiberna o banco quando ninguém usa, então a primeira tela depois de
algumas horas parada pode demorar uns segundos a mais. É normal.

**Posso usar meu próprio domínio?** Pode. Em **Settings → Domains** na Vercel
você aponta algo como `sistema.suaoficina.com.br`. Lembre de atualizar o
`NEXT_PUBLIC_APP_URL` depois e redeployar.

**E quando eu mudar o código?** Todo push para a branch publicada gera um
deploy novo automaticamente.

**Como coloco os dados de demonstração?** Dá, mas exige rodar um comando no
terminal apontando para o banco do Neon. Se quiser, me peça que eu te passo a
linha exata. Para avaliar o produto, cadastrar os próprios dados é melhor.

---

## Antes de valer de verdade

Este ambiente é para teste. Antes de ter oficina pagante dentro, falta:

1. **Backup do banco.** O Neon tem recuperação por tempo, mas na faixa gratuita
   a janela é curta. Dado de cliente perdido não tem desculpa.
2. **Trocar a senha de demonstração.** A conta `demo@assetto.com.br` tem senha
   pública neste repositório. Se você rodar os dados de demonstração em
   produção, apague a conta depois.
3. **Decidir se o repositório continua público.** Hoje ele é público: qualquer
   pessoa lê o código do seu produto. Para testar tudo bem, mas para um
   produto de assinatura isso é uma decisão de negócio, não um detalhe. Em
   **Settings → General → Change visibility**, no GitHub, dá para fechar — e a
   Vercel continua funcionando com repositório privado.

   O `.env` já está no `.gitignore`, então senha de banco não vai parar lá por
   acidente. Ainda assim, com repositório público, nunca cole credencial em
   nenhum arquivo do projeto.
4. **Rever a conexão do banco.** A conexão direta que este guia usa é a certa
   agora, mas tem limite de conexões simultâneas. Com dezenas de oficinas
   usando ao mesmo tempo, isso precisa ser revisto.
5. **Cobrança e bloqueio por falta de pagamento** — ver `docs/produto.md`.
