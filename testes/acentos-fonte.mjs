/**
 * Verificador de acentuação no código-fonte.
 *
 * Complementa `teste:acentos`, que abre as telas num navegador. Aquele só
 * enxerga o que os dados de demonstração conseguem fazer aparecer: aviso de
 * erro, estado vazio, mensagem de lista cortada e texto de ramo raro nunca
 * chegam a ser renderizados, e passavam batido.
 *
 * Foi assim que "cliente especifico", "E-mail invalido", "não pode ser
 * excluido" e "Este orcamento venceu" ficaram meses na base sem ninguém ver.
 *
 * Este aqui lê o fonte e olha texto de exibição: conteúdo de JSX e literal de
 * string que pareça frase. Identificador, rota, classe de CSS e chave de enum
 * continuam em ASCII de propósito — é a convenção do projeto.
 *
 * Como rodar: npm run teste:acentos-fonte  (não precisa de servidor)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SUSPEITAS =
  /\b(nao|voce|orcamento|orcamentos|servico|servicos|peca|pecas|patio|veiculo|veiculos|mecanico|configuracoes|descricao|observacoes|observacao|numero|codigo|usuario|usuarios|sessao|execucao|aprovacao|situacao|localizacao|impressao|emissao|cabecalho|mantem|endereco|enderecos|informacoes|alteracoes|acao|acoes|opcao|opcoes|combustivel|eletrico|hibrido|disponivel|proximo|proxima|ultimo|ultima|ultimos|ultimas|historico|minimo|maximo|automatico|basico|tecnico|generico|unico|unica|proprio|area|pagina|obrigatorio|responsavel|possivel|credito|debito|transferencia|referencia|preco|precos|salarios|agua|mes|duvida|ninguem|alguem|tres|funcionario|relatorio|atencao|tambem|alem|apos|atras|sera|estao|vao|ate|fisica|juridica|revisao|suspensao|devolucao|permissao|exclusao|confirmacao|gestao|mao|cartao|cartoes|reposicao|valido|invalido|previsao|padrao|nivel|util|analise|periodo|calculo|versao|saida|avancar|comecar|titulo|oleo|balcao|demonstracao|diagnostico|fabricacao|indicacao|anotacoes|manutencao|inventario|entao|sao|manha|amanha|orgao|razao|decisao|opiniao|sugestao|comissao|lancamento|lancamentos|lancado|lancados|lanca|lancar|comeco|pedaco|cabeca|licenca|almoco|forca|criancas|mecanica|especifico|especifica|excluido|excluida|necessario|obrigatoria)\b/gi;

/**
 * "e" e "é" são as duas palavras, e nenhuma lista de palavras separa uma da
 * outra: "Nome e telefone" está certo, "O resto e opcional" está errado. O que
 * denuncia é o que vem depois — adjetivo ou particípio pede o verbo.
 */
const VERBO_VIROU_CONJUNCAO =
  /(^|[^\wÀ-ÿ])e\s+(opcional|obrigatóri[oa]|necessári[oa]|possível|impossível|feit[oa]|important|melhor|pior|precis[oa]|calculad[oa]|gerad[oa]|automátic[oa]|simples|grátis|gratuit[oa]|igual|diferente|suficiente)([^\wÀ-ÿ]|$)/gi;

/** Texto que a pessoa lê, e não nome de coisa no código. */
function pareceFrase(t) {
  if (/^\//.test(t) || t.includes("://")) return false; // rota ou URL
  // Rótulo e título são de uma palavra só ("Endereço", "Peças"), e exigir
  // espaço deixava todos eles de fora — foi assim que "Endereco" sobreviveu em
  // dois rótulos. Palavra solta vale quando começa com maiúscula, que é como o
  // texto de tela é escrito e como o identificador do código não é.
  if (!/\s/.test(t)) {
    if (!/^[A-ZÀ-Ý]/.test(t)) return false; // identificador, rota, classe
    if (/[_-]/.test(t) || /[a-z][A-Z]/.test(t)) return false; // kebab, snake, camelCase
  }
  if (t === t.toUpperCase()) return false; // chave de enum
  // `>` também fecha comparação e seta de função, então o casamento de JSX
  // pega pedaço de código junto. Frase de verdade começa com letra e não tem
  // operador no meio.
  // A frase costuma retomar depois de uma expressão, e aí começa com o fecha
  // parêntese ou o ponto que sobrou ("...negativo ({qtd} {un})." → "). Isso
  // acontece quando..."). Isso não a descaracteriza.
  if (!/^[A-Za-zÀ-ÿ]/.test(t.replace(/^[\s).]+/, ""))) return false;
  if (/[=&|;]/.test(t) || /\?\?|\?\./.test(t)) return false;
  // `}` abre trecho de JSX, mas também fecha bloco de código. O que vem depois
  // costuma ser chamada de função (`await prisma.lancamento.delete(`), que não
  // é texto de tela.
  if (/\w\.\w/.test(t) || /\w\(/.test(t)) return false;
  return /[a-záéíóúâêôãõç]{3,}/.test(t);
}

function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

const achados = [];

for (const caminho of arquivos("src")) {
  // SQL cru é a exceção legítima: `FROM "Peca"` é o nome da tabela, e acentuar
  // quebraria a consulta. Some com o bloco antes de procurar, em vez de abrir
  // exceção por palavra.
  const conteudo = readFileSync(caminho, "utf8").replace(
    /\$(queryRaw|executeRaw)[^`]*`[\s\S]*?`/g,
    (bloco) => bloco.replace(/[^\n]/g, " "),
  );
  // Texto de JSX quebra em várias linhas quando é longo — e é justamente o
  // texto longo que tem palavra acentuada. Por isso a varredura é no arquivo
  // inteiro, não linha a linha.
  const linhaDe = (indice) => conteudo.slice(0, indice).split("\n").length;

  const trechos = [
    // A frase também é cortada por `{expressão}` no meio dela ("Este orçamento
    // venceu em {data(...)}."), então `{` e `}` servem de borda igual a `<`.
    ...[...conteudo.matchAll(/[>}]([^<>{}]{4,}?)[<{]/g)],
    ...[...conteudo.matchAll(/"([^"\\\n]{4,})"/g)],
    ...[...conteudo.matchAll(/'([^'\\\n]{4,})'/g)],
  ];

  for (const t of trechos) {
    // &quot; e companhia são texto, mas o `&` e o `;` deles pareciam código.
    const texto = t[1].replace(/&[a-z]+;/gi, '"').replace(/\s+/g, " ").trim();
    if (!pareceFrase(texto)) continue;
    for (const m of texto.matchAll(SUSPEITAS)) {
      achados.push(`  ${caminho}:${linhaDe(t.index)}  [${m[0]}]  ${texto.slice(0, 90)}`);
    }
    for (const m of texto.matchAll(VERBO_VIROU_CONJUNCAO)) {
      achados.push(`  ${caminho}:${linhaDe(t.index)}  [e -> é]  ${m[0].trim()}  em: ${texto.slice(0, 70)}`);
    }
  }
}

if (achados.length === 0) {
  console.log("Nenhuma palavra sem acento no texto de exibição do fonte.");
} else {
  console.log(`${achados.length} ocorrência(s) no fonte:`);
  for (const a of achados) console.log(a);
  process.exitCode = 1;
}
