import { FormularioPeca } from "../formulario-peca";
import { Cabecalho } from "@/components/ui";

export const metadata = { title: "Nova peca - Assetto" };

export default function PaginaNovaPeca() {
  return (
    <>
      <Cabecalho titulo="Nova peca" descricao="Depois de cadastrada, ela aparece nos orcamentos." />
      <FormularioPeca />
    </>
  );
}
