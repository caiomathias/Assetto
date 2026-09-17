# Assetto — visão de produto

## Para quem é

Oficina mecânica de carros de passeio e utilitários leves, de 2 a 15 pessoas.
O sistema fica aberto no computador do balcão e num tablet no pátio. Parte da
equipe tem pouca familiaridade com sistema, e algumas pessoas vão usar o
Assetto como primeiro software de trabalho da vida.

Isso define tudo o resto.

## As três regras de desenho

**1. Ninguém deveria precisar de treinamento.** Cada tela tem uma frase
explicando para que serve. Os botões dizem o que vai acontecer ("Faturar e
fechar OS"), não o que o sistema faz ("Confirmar"). Não existe sigla que a
oficina já não use (OS e KM são do vocabulário; "CRM" ganhou uma explicação na
própria tela).

**2. O que é raro fica escondido; o que é diário fica na frente.** O menu segue
o dia de trabalho: Pátio antes de Clientes, Configurações por último. Cadastro
de cliente exige dois campos (nome e telefone); endereço, documento e
observações existem, mas não atrapalham quem tem um cliente esperando no
balcão.

**3. Errar tem que ser barato.** Nenhuma ação destrutiva acontece sem
confirmação. Cliente com histórico não é apagado, é protegido. Peça já usada em
OS vira inativa em vez de sumir. OS já faturada é cancelada, nunca excluída —
o histórico do financeiro precisa continuar fechando.

## Módulos

### Clientes e veículos
Busca por nome, telefone, CPF/CNPJ **ou placa** — na oficina, quem chega é o
carro, e a placa costuma ser a única coisa que se sabe. A ficha do cliente
mostra os veículos e todo o histórico de orçamentos e OS. Botão direto para o
WhatsApp.

### Orçamento
Editor com total calculado ao vivo. O catálogo de peças e serviços preenche
descrição e preço, mas ambos continuam editáveis — na oficina real o preço muda
por cliente. Também dá para digitar um item que não está cadastrado, sem
precisar cadastrar nada antes. Quando a peça escolhida não tem saldo, aparece o
aviso na hora.

**Aprovação pelo cliente:** cada orçamento gera um link. O cliente abre no
celular, vê o que será feito e o valor, e toca em aprovar ou recusar. O sistema
registra quem respondeu, quando e de qual endereço de internet. Quem responde
por telefone é registrado pelo balcão, com o nome de quem atendeu.

### Ordem de serviço
Nasce de um orçamento aprovado (com os itens copiados) ou direto, quando o
serviço já está autorizado. Guarda o relato do cliente e o diagnóstico da
oficina separados — são coisas diferentes e as duas aparecem na via impressa.

### Pátio (kanban)
Recebido → Aguardando aprovação → Em execução → Aguardando peça → Pronto →
Entregue. Arrastar funciona no computador; as setas de avançar e voltar
funcionam em qualquer lugar, inclusive num tablet engordurado. Cada coluna
mostra quantos carros e quanto dinheiro tem ali dentro. Entrega atrasada fica
vermelha.

Entregues de hoje continuam visíveis; as mais antigas saem do quadro para ele
não virar arquivo morto.

### Peças
Cadastro com custo, venda, quantidade, estoque mínimo e onde a peça fica
guardada. Todo movimento de estoque deixa registro com o saldo resultante — é
o extrato que explica qualquer divergência no inventário. O acerto por contagem
pede quantas unidades existem de verdade na prateleira, que é como a pessoa
pensa, não a diferença.

**A baixa acontece no faturamento da OS**, nunca antes. Estoque negativo é
permitido de propósito: a peça já está montada no carro, e bloquear nesse
momento só faria a oficina parar de usar o sistema. O saldo negativo fica
vermelho na tela até ser acertado.

### Financeiro
Contas a receber e a pagar, com visão por mês. Faturar uma OS lança a receita
sozinho. O resto (aluguel, folha, compra de peças) é lançado à mão, com
categorias prontas. Contas em aberto de qualquer mês aparecem no resumo —
conta atrasada de janeiro não pode sumir porque a tela está em março.

Lançamento que veio de OS faturada não pode ser excluído solto: para desfazer,
cancela-se a OS. Isso mantém o financeiro batendo com as ordens de serviço.

### CRM (kanban)
Novo contato → Contato feito → Orçamento enviado → Negociando → Fechado /
Perdido. É onde fica quem pediu preço e não fechou — o dinheiro que a oficina
perde sem perceber. Cada cartão tem data do próximo contato, e o painel mostra
com quem falar hoje. Mesmo formato do pátio de propósito: quem aprendeu uma
tela já sabe usar a outra.

## Decisões de negócio já tomadas

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Tipo de veículo | Carros e utilitários leves | Foco em oficina de bairro. Moto e caminhão exigem campos diferentes e entram depois. |
| Nota fiscal | Fora da v1 | Exige gateway fiscal, certificado A1 por oficina e cadastro tributário. Atrasaria o lançamento em meses. O financeiro é controle interno. |
| Aprovação de orçamento | Link público por WhatsApp | Maior diferencial de venda do produto, e barato de construir. |
| Peças | Estoque simples com baixa no faturamento | Cobre o que a oficina precisa. Compras e fornecedores entram quando houver demanda. |

## O que ficou de fora, de propósito

Emissão fiscal, agendamento com horário, integração com tabela de peças,
controle de comissão de mecânico, app para celular, relatórios avançados,
assinatura e cobrança recorrente. Nada disso está bloqueado pela arquitetura —
ver `docs/arquitetura.md`.

## Próximos passos sugeridos

Em ordem de retorno para o negócio:

1. **Cobrança da assinatura.** O campo `plano` já existe na oficina; falta
   ligar um meio de pagamento e travar o acesso quando vencer.
2. **Agendamento.** A oficina vive de encaixe; uma agenda simples por dia
   resolveria a maior parte.
3. **Lembrete automático de revisão.** Com KM e histórico no banco, dá para
   avisar o cliente sozinho — vira receita recorrente.
4. **Fotos na OS.** Registrar o estado do carro na entrada evita discussão na
   entrega.
5. **Emissão de NFS-e** via integração, quando houver clientes pedindo.
