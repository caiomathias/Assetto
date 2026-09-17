import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4 text-center">
      <p className="text-3xl font-black text-marca-700">Assetto</p>
      <h1 className="text-2xl font-bold text-slate-900">Página não encontrada</h1>
      <p className="max-w-md text-slate-600">
        O endereco não existe, o registro foi apagado ou pertence a outra oficina.
      </p>
      <Link
        href="/painel"
        className="mt-2 inline-flex min-h-12 items-center rounded-lg bg-marca-600 px-6 font-semibold text-white hover:bg-marca-700"
      >
        Voltar ao painel
      </Link>
    </main>
  );
}
