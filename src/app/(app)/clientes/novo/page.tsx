import { FormularioCliente } from "../formulario-cliente";
import { Cabecalho } from "@/components/ui";

export const metadata = { title: "Novo cliente - Assetto" };

export default function PaginaNovoCliente() {
  return (
    <>
      <Cabecalho titulo="Novo cliente" descricao="Nome e telefone ja bastam. O resto e opcional." />
      <FormularioCliente />
    </>
  );
}
