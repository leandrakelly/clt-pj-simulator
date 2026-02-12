import { Suspense } from 'react';

import CalculatorComparison from '@/components/Calculator';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 selection:bg-emerald-500/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-70"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 py-12 md:py-20">
        <Suspense
          fallback={
            <div className="flex min-h-[500px] animate-pulse items-center justify-center font-mono text-slate-500">
              Carregando sistema...
            </div>
          }
        >
          <CalculatorComparison />
        </Suspense>
      </div>

      <footer className="relative z-10 mt-12 border-t border-slate-900 py-8 text-center">
        <p className="text-sm text-slate-500">
          Baseado nas tabelas oficiais de 2025 (INSS, IRRF e Simples Nacional).
          <br />
          <span className="text-slate-600">
            Não substitui consultoria contábil oficial.
          </span>
        </p>
      </footer>
    </main>
  );
}
