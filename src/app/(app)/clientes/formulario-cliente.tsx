import type { Cliente } from "@prisma/client";

import { salvarCliente } from "./acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { AreaTexto, BotaoLink, Campo, Cartao, CartaoTitulo, Entrada, Selecao } from "@/components/ui";
import { TIPO_PESSOA } from "@/lib/rotulos";

export function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  return (
    <Formulario acao={salvarCliente}>
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <Cartao>
        <CartaoTitulo>Dados principais</CartaoTitulo>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Campo rotulo="Nome completo" obrigatorio className="sm:col-span-2">
            <Entrada name="nome" defaultValue={cliente?.nome} required autoFocus />
          </Campo>

          <Campo rotulo="Tipo">
            <Selecao name="tipoPessoa" defaultValue={cliente?.tipoPessoa ?? "FISICA"}>
              {Object.entries(TIPO_PESSOA).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </Selecao>
          </Campo>

          <Campo rotulo="CPF ou CNPJ" ajuda="Pode deixar em branco.">
            <Entrada name="documento" defaultValue={cliente?.documento ?? ""} inputMode="numeric" />
          </Campo>

          <Campo rotulo="Telefone / WhatsApp" ajuda="Com DDD. Ex: 11988887777" obrigatorio>
            <Entrada
              name="telefone"
              defaultValue={cliente?.telefone}
              required
              inputMode="tel"
              placeholder="11988887777"
            />
          </Campo>

          <Campo rotulo="E-mail">
            <Entrada name="email" type="email" defaultValue={cliente?.email ?? ""} />
          </Campo>
        </div>
      </Cartao>

      <Cartao>
        <CartaoTitulo>Endereco</CartaoTitulo>
        <div className="grid gap-5 p-5 sm:grid-cols-6">
          <Campo rotulo="CEP" className="sm:col-span-2">
            <Entrada name="cep" defaultValue={cliente?.cep ?? ""} inputMode="numeric" />
          </Campo>
          <Campo rotulo="Rua" className="sm:col-span-4">
            <Entrada name="endereco" defaultValue={cliente?.endereco ?? ""} />
          </Campo>
          <Campo rotulo="Número" className="sm:col-span-1">
            <Entrada name="numero" defaultValue={cliente?.numero ?? ""} />
          </Campo>
          <Campo rotulo="Complemento" className="sm:col-span-2">
            <Entrada name="complemento" defaultValue={cliente?.complemento ?? ""} />
          </Campo>
          <Campo rotulo="Bairro" className="sm:col-span-3">
            <Entrada name="bairro" defaultValue={cliente?.bairro ?? ""} />
          </Campo>
          <Campo rotulo="Cidade" className="sm:col-span-4">
            <Entrada name="cidade" defaultValue={cliente?.cidade ?? ""} />
          </Campo>
          <Campo rotulo="UF" className="sm:col-span-2">
            <Entrada name="uf" defaultValue={cliente?.uf ?? ""} maxLength={2} placeholder="SP" />
          </Campo>
        </div>
      </Cartao>

      <Cartao>
        <CartaoTitulo>Observações</CartaoTitulo>
        <div className="p-5">
          <Campo rotulo="Anotações sobre o cliente" ajuda="Só a equipe da oficina ve isso.">
            <AreaTexto name="observacoes" defaultValue={cliente?.observacoes ?? ""} />
          </Campo>
        </div>
      </Cartao>

      <div className="flex flex-wrap gap-3">
        <BotaoSalvar>{cliente ? "Salvar alterações" : "Cadastrar cliente"}</BotaoSalvar>
        <BotaoLink
          href={cliente ? `/clientes/${cliente.id}` : "/clientes"}
          variante="secundario"
          tamanho="grande"
        >
          Cancelar
        </BotaoLink>
      </div>
    </Formulario>
  );
}
