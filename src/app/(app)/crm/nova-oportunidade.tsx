"use client";

import { useState } from "react";

import { salvarOportunidade } from "./acoes";
import { BotaoSalvar, Formulario } from "@/components/formulario";
import { AreaTexto, Botao, Campo, Cartao, CartaoTitulo, Entrada, Selecao } from "@/components/ui";
import { ORIGENS_CRM } from "@/lib/rotulos";

/**
 * Cadastro rapido de contato. Fica escondido atras de um botao porque o
 * quadro e a tela principal - o formulario nao pode competir com ele.
 */
export function NovaOportunidade() {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <Botao type="button" onClick={() => setAberto(true)}>
        + Novo contato
      </Botao>
    );
  }

  return (
    <Cartao>
      <CartaoTitulo
        acao={
          <Botao type="button" variante="fantasma" onClick={() => setAberto(false)}>
            Fechar
          </Botao>
        }
      >
        Novo contato
      </CartaoTitulo>

      <div className="p-5">
        <Formulario acao={salvarOportunidade}>
          <div className="grid gap-5 sm:grid-cols-4">
            <Campo rotulo="Nome do contato" obrigatorio className="sm:col-span-2">
              <Entrada name="nomeContato" required autoFocus placeholder="Maria Souza" />
            </Campo>

            <Campo rotulo="Telefone / WhatsApp" className="sm:col-span-2">
              <Entrada name="telefone" inputMode="tel" placeholder="11988887777" />
            </Campo>

            <Campo rotulo="Como chegou ate a oficina">
              <Selecao name="origem" defaultValue="">
                <option value="">Nao informar</option>
                {ORIGENS_CRM.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Selecao>
            </Campo>

            <Campo rotulo="Valor estimado (R$)" ajuda="Quanto esse servico pode render.">
              <Entrada name="valorEstimado" inputMode="decimal" placeholder="0,00" />
            </Campo>

            <Campo rotulo="Falar de novo em">
              <Entrada name="proximoContatoEm" type="date" />
            </Campo>

            <Campo rotulo="Etapa">
              <Selecao name="etapa" defaultValue="NOVO">
                <option value="NOVO">Novo contato</option>
                <option value="CONTATO_FEITO">Contato feito</option>
                <option value="ORCAMENTO_ENVIADO">Orcamento enviado</option>
                <option value="NEGOCIACAO">Negociando</option>
              </Selecao>
            </Campo>

            <Campo rotulo="Anotacoes" className="sm:col-span-4">
              <AreaTexto
                name="observacoes"
                placeholder="Ex: quer trocar a embreagem, pediu para ligar depois das 18h"
              />
            </Campo>
          </div>

          <BotaoSalvar tamanho="normal">Adicionar ao funil</BotaoSalvar>
        </Formulario>
      </div>
    </Cartao>
  );
}
