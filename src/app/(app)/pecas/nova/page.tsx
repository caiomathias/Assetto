import { FormularioPeca } from "../formulario-peca";
import { Cabecalho } from "@/components/ui";

export const metadata = { title: "Nova peça - Assetto" };

export default function PaginaNovaPeca() {
  return (
    <>
      <Cabecalho titulo="Nova peça" descricao="Depois de cadastrada, ela aparece nos orçamentos." />
      <FormularioPeca />
    </>
  );
}
