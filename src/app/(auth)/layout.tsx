import type { ReactNode } from "react";

export default function LayoutAutenticacao({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-4xl font-black tracking-tight text-marca-700">Assetto</p>
          <p className="mt-1 text-slate-600">Gestao de oficina, sem complicacao.</p>
        </div>
        {children}
      </div>
    </main>
  );
}
