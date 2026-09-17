import type { SVGProps } from "react";

/**
 * Icones em SVG inline. Evita uma dependencia externa so para desenhar
 * nove simbolos, e o traco grosso (1.8) le melhor em monitor de oficina.
 */
function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const Icone = {
  painel: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Base>
  ),
  patio: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="10" rx="1.5" />
      <rect x="16" y="4" width="5" height="13" rx="1.5" />
    </Base>
  ),
  cliente: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Base>
  ),
  orcamento: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M6 2.5h8l4.5 4.5v14.5H6z" />
      <path d="M14 2.5V7h4.5" />
      <path d="M9 12.5h6M9 16.5h4" />
    </Base>
  ),
  os: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M14.7 6.3a3.7 3.7 0 0 0 4.9 4.8l2.1 2.1a2 2 0 0 1-2.8 2.8l-2.1-2.1a3.7 3.7 0 0 0-4.8-4.9z" />
      <path d="M11.2 12.8 4 20a2 2 0 0 0 2.8 2.8" />
      <path d="M8.5 5.5 5.5 3 3 5.5l2.5 3" />
    </Base>
  ),
  peca: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M12 2.8 20 7v10l-8 4.2L4 17V7z" />
      <path d="M4 7l8 4.2L20 7M12 11.2V21" />
    </Base>
  ),
  financeiro: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M6 9v6M18 9v6" />
    </Base>
  ),
  crm: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M3 17.5 9 11l4 3.5 8-8.5" />
      <path d="M15.5 6H21v5.5" />
    </Base>
  ),
  config: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
    </Base>
  ),
  menu: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Base>
  ),
  fechar: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  ),
  busca: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Base>
  ),
  mais: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  ),
  esquerda: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M15 5 8 12l7 7" />
    </Base>
  ),
  direita: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="m9 5 7 7-7 7" />
    </Base>
  ),
  alerta: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M12 3.5 22 20H2z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </Base>
  ),
  ok: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Base>
  ),
  imprimir: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M7 9V3h10v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </Base>
  ),
  whatsapp: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3.4 3.3z" />
      <path d="M8.8 9.2c.4 2.6 3.4 5.6 6 6l1.3-1.6-2-1.2-1 .8a6.6 6.6 0 0 1-2.3-2.3l.8-1-1.2-2z" />
    </Base>
  ),
};
