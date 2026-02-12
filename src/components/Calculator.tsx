'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  HeartPulse,
  PieChart as PieIcon,
  Printer,
  Share2,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  LegendPayload,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { calculateCLT, calculatePJ } from '@/lib/taxes';
import { formatCurrency, formatMoneyInput, parseMoney } from '@/lib/utils';

interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
}

interface CustomRectangleProps {
  fill?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartDataItem;
}

export default function CalculatorComparison() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [copySuccess, setCopySuccess] = useState(false);

  const [inputs, setInputs] = useState({
    cltValue: String(Number(searchParams.get('clt')) || 8000),
    pjValue: String(Number(searchParams.get('pj')) || 14000),
    cltBenefits: String(Number(searchParams.get('ben')) || 1000),
    pjHealth: String(Number(searchParams.get('health')) || 0),
  });

  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>(
    (searchParams.get('view') as 'monthly' | 'yearly') || 'monthly',
  );

  const values = useMemo(
    () => ({
      cltValue: parseMoney(inputs.cltValue),
      pjValue: parseMoney(inputs.pjValue),
      cltBenefits: parseMoney(inputs.cltBenefits),
      pjHealth: parseMoney(inputs.pjHealth),
    }),
    [inputs],
  );

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    params.set('clt', values.cltValue.toString());
    params.set('pj', values.pjValue.toString());
    params.set('ben', values.cltBenefits.toString());
    params.set('health', values.pjHealth.toString());
    params.set('view', viewMode);

    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  }, [values, viewMode, router]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [updateURL]);

  const results = useMemo(() => {
    const clt = calculateCLT(values.cltValue, values.cltBenefits);
    const pj = calculatePJ(values.pjValue, values.pjHealth, 0);
    const diff =
      viewMode === 'monthly'
        ? pj.netIncome - clt.netTotalMonthly
        : pj.totalYearlyNet - clt.totalYearlyNet;

    return { clt, pj, diff };
  }, [values, viewMode]);

  const breakEven = useMemo(() => {
    const targetNet = results.clt.totalYearlyNet;
    let low = 0,
      high = values.cltValue * 4,
      estimate = 0;

    for (let i = 0; i < 20; i++) {
      estimate = (low + high) / 2;
      if (calculatePJ(estimate, values.pjHealth).totalYearlyNet < targetNet)
        low = estimate;
      else high = estimate;
    }
    return estimate;
  }, [results.clt.totalYearlyNet, values.pjHealth, values.cltValue]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      alert('Erro ao copiar link. Tente novamente.');
    }
  }, []);

  const handleInputChange =
    (field: keyof typeof inputs) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatMoneyInput(e.target.value);
      setInputs((prev) => ({ ...prev, [field]: formatted }));
    };

  const barData: ChartDataItem[] = useMemo(
    () => [
      {
        name: viewMode === 'monthly' ? 'CLT' : 'CLT (Ano)',
        value:
          viewMode === 'monthly'
            ? results.clt.netTotalMonthly
            : results.clt.totalYearlyNet,
        fill: '#3b82f6',
      },
      {
        name: viewMode === 'monthly' ? 'PJ' : 'PJ (Ano)',
        value:
          viewMode === 'monthly'
            ? results.pj.netIncome
            : results.pj.totalYearlyNet,
        fill: '#10b981',
      },
    ],
    [viewMode, results],
  );

  const pieDataCLT = useMemo(
    () => [
      { name: 'Líquido', value: results.clt.netSalary, fill: '#3b82f6' },
      {
        name: 'Impostos',
        value: results.clt.inss + results.clt.irrf,
        fill: '#ef4444',
      },
      { name: 'Benefícios', value: values.cltBenefits, fill: '#8b5cf6' },
    ],
    [
      results.clt.netSalary,
      results.clt.inss,
      results.clt.irrf,
      values.cltBenefits,
    ],
  );

  const tooltipFormatter = useCallback(
    (
      value: string | number | readonly (string | number)[] | undefined,
      name: string | undefined,
    ): ReactNode | [ReactNode, ReactNode] => {
      if (value === undefined) return 'N/A';
      return [formatCurrency(Number(value)), name || ''];
    },
    [],
  );

  const renderLegend = useCallback(
    (props: { payload?: readonly LegendPayload[] }) => {
      const { payload } = props;

      if (!payload) return null;

      return (
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {payload.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-slate-400">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    },
    [],
  );

  return (
    <div className="mx-auto w-full max-w-7xl p-4 text-slate-200 md:p-8">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="mb-8 text-5xl font-bold tracking-tight text-white md:text-7xl">
          CLT <span className="text-slate-700">vs</span> PJ
        </h1>

        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setViewMode('monthly')}
            className={`rounded-lg px-8 py-2 font-mono text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            aria-label="Visualizar cálculos mensais"
          >
            MENSAL
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`rounded-lg px-8 py-2 font-mono text-sm font-bold transition-all ${viewMode === 'yearly' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            aria-label="Visualizar cálculos anuais"
          >
            ANUAL
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent p-6 md:flex-row"
      >
        <div className="flex items-center gap-4">
          <Target className="h-6 w-6 text-purple-400" />
          <div>
            <h4 className="font-bold text-purple-100">Ponto de Equilíbrio</h4>
            <p className="text-sm text-slate-400">
              Quanto você precisa faturar para igualar seu CLT atual:
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-950 px-6 py-3 font-mono text-3xl font-bold text-white">
          {formatCurrency(breakEven)}{' '}
          <span className="font-sans text-xs text-slate-500">/mês</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`mb-8 rounded-2xl border p-4 text-center font-semibold ${
          results.diff > 0
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : results.diff < 0
              ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
              : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
        }`}
      >
        {results.diff > 0 ? (
          <>
            PJ está <strong>{formatCurrency(Math.abs(results.diff))}</strong>{' '}
            melhor {viewMode === 'monthly' ? 'por mês' : 'por ano'}
          </>
        ) : results.diff < 0 ? (
          <>
            CLT está <strong>{formatCurrency(Math.abs(results.diff))}</strong>{' '}
            melhor {viewMode === 'monthly' ? 'por mês' : 'por ano'}
          </>
        ) : (
          <>Ambos estão equivalentes</>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400">
              <Briefcase size={16} /> Configuração CLT
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="clt-salary"
                  className="font-mono text-[10px] text-slate-500"
                >
                  SALÁRIO BRUTO
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 font-mono text-sm text-slate-500">
                    R$
                  </span>
                  <input
                    id="clt-salary"
                    type="text"
                    inputMode="numeric"
                    value={inputs.cltValue}
                    onChange={handleInputChange('cltValue')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 pl-10 font-mono text-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="clt-benefits"
                  className="font-mono text-[10px] text-slate-500"
                >
                  BENEFÍCIOS (VA/VR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 font-mono text-sm text-slate-500">
                    R$
                  </span>
                  <input
                    id="clt-benefits"
                    type="text"
                    inputMode="numeric"
                    value={inputs.cltBenefits}
                    onChange={handleInputChange('cltBenefits')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 pl-10 font-mono text-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
              <Building2 size={16} /> Proposta PJ
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="pj-revenue"
                  className="font-mono text-[10px] text-slate-500"
                >
                  FATURAMENTO MENSAL
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 font-mono text-sm text-slate-500">
                    R$
                  </span>
                  <input
                    id="pj-revenue"
                    type="text"
                    inputMode="numeric"
                    value={inputs.pjValue}
                    onChange={handleInputChange('pjValue')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 pl-10 font-mono text-white outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="pj-health"
                  className="font-mono text-[10px] text-slate-500"
                >
                  PLANO DE SAÚDE PJ
                </label>
                <div className="relative">
                  <HeartPulse className="absolute left-3 top-4 h-4 w-4 text-red-500/40" />
                  <span className="absolute left-9 top-3.5 font-mono text-sm text-slate-500">
                    R$
                  </span>
                  <input
                    id="pj-health"
                    type="text"
                    inputMode="numeric"
                    value={inputs.pjHealth}
                    onChange={handleInputChange('pjHealth')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 pl-16 font-mono text-white outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.a
            href="LINK_HERE" // TODO: add link, ex: https://contabilizei.com.br/indicacao/seu-codigo
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
          >
            <div className="z-10 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                <Building2 size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Abrir CNPJ Grátis
                </p>
                <p className="text-sm text-slate-300">
                  Ganhe desconto na contabilidade
                </p>
              </div>
            </div>

            <div className="z-10 rounded-full bg-emerald-500 p-2 text-slate-950 transition-transform group-hover:-rotate-45">
              <ArrowRight size={16} className="rotate-45" />{' '}
            </div>

            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl transition-all group-hover:bg-emerald-500/30" />
          </motion.a>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleCopyLink}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 py-4 font-bold text-white transition-all hover:bg-slate-700 active:scale-95"
            aria-label="Copiar link da simulação"
          >
            {copySuccess ? (
              <>
                <Check size={18} className="text-emerald-400" />
                <span className="text-emerald-400">LINK COPIADO!</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                COPIAR SIMULAÇÃO
              </>
            )}
          </motion.button>

          <button
            onClick={() => window.print()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-transparent py-4 font-bold text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
          >
            <Printer size={18} />
            SALVAR PDF
          </button>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl border border-slate-800 bg-[#0B1121] p-6 shadow-2xl"
            >
              <h3 className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <TrendingUp size={14} /> Comparação de Renda
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                      itemStyle={{
                        color: '#e2e8f0',
                      }}
                      formatter={tooltipFormatter}
                    />
                    <Bar
                      dataKey="value"
                      barSize={30}
                      shape={(props: CustomRectangleProps) => (
                        <Rectangle {...props} radius={[0, 4, 4, 0]} />
                      )}
                      animationDuration={500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-3xl border border-slate-800 bg-[#0B1121] p-6 shadow-2xl"
            >
              <h3 className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <PieIcon size={14} /> Distribuição CLT (Mês)
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataCLT}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      animationDuration={500}
                    >
                      {pieDataCLT.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                        padding: '8px 12px',
                      }}
                      itemStyle={{
                        color: '#e2e8f0',
                      }}
                      formatter={tooltipFormatter}
                    />
                    <Legend content={renderLegend} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm"
          >
            <div className="overflow-x-auto p-4 md:p-8">
              <table className="w-full min-w-[500px] text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="pb-4 pr-4 font-sans text-xs uppercase tracking-widest">
                      Detalhamento (
                      {viewMode === 'monthly' ? 'Mensal' : 'Anual'})
                    </th>
                    <th className="whitespace-nowrap px-2 pb-4 text-right font-sans text-xs uppercase tracking-widest text-blue-400">
                      CLT
                    </th>
                    <th className="whitespace-nowrap pb-4 pl-2 text-right font-sans text-xs uppercase tracking-widest text-emerald-400">
                      PJ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="text-slate-400">
                    <td className="py-4 pr-4 font-sans text-xs">Bruto Base</td>
                    <td className="whitespace-nowrap px-2 text-right text-xs md:text-sm">
                      {formatCurrency(
                        viewMode === 'monthly'
                          ? values.cltValue
                          : values.cltValue * 12,
                      )}
                    </td>
                    <td className="whitespace-nowrap pl-2 text-right text-xs md:text-sm">
                      {formatCurrency(
                        viewMode === 'monthly'
                          ? values.pjValue
                          : values.pjValue * 12,
                      )}
                    </td>
                  </tr>
                  <tr className="bg-blue-500/5 text-blue-300">
                    <td className="py-4 pr-4 font-sans text-xs">
                      Benefícios (Líquido)
                    </td>
                    <td className="whitespace-nowrap px-2 text-right text-xs md:text-sm">
                      {formatCurrency(
                        viewMode === 'monthly'
                          ? values.cltBenefits
                          : values.cltBenefits * 12,
                      )}
                    </td>
                    <td className="whitespace-nowrap pl-2 text-right text-xs opacity-20 md:text-sm">
                      R$ 0,00
                    </td>
                  </tr>
                  {viewMode === 'yearly' && (
                    <tr className="bg-blue-500/5 text-blue-300">
                      <td className="py-4 pr-4 font-sans text-xs">
                        13º e Férias (Adicional)
                      </td>
                      <td className="whitespace-nowrap px-2 text-right text-xs md:text-sm">
                        {formatCurrency(
                          results.clt.totalYearlyNet -
                            results.clt.netTotalMonthly * 12,
                        )}
                      </td>
                      <td className="whitespace-nowrap pl-2 text-right text-xs opacity-20 md:text-sm">
                        R$ 0,00
                      </td>
                    </tr>
                  )}
                  <tr className="text-red-400">
                    <td className="py-4 pr-4 font-sans text-xs">
                      Impostos Totais
                    </td>
                    <td className="whitespace-nowrap px-2 text-right text-xs md:text-sm">
                      -
                      {formatCurrency(
                        viewMode === 'monthly'
                          ? results.clt.inss + results.clt.irrf
                          : values.cltValue * 13.33 -
                              results.clt.totalYearlyNet +
                              values.cltBenefits * 12,
                      )}
                    </td>
                    <td className="whitespace-nowrap pl-2 text-right text-xs md:text-sm">
                      -
                      {formatCurrency(
                        viewMode === 'monthly'
                          ? results.pj.taxes +
                              results.pj.inssProLabore +
                              results.pj.irrfProLabore
                          : values.pjValue * 12 -
                              results.pj.totalYearlyNet -
                              values.pjHealth * 12,
                      )}
                    </td>
                  </tr>
                  <tr className="text-red-400">
                    <td className="py-4 pr-4 font-sans text-xs">
                      Custo Saúde / Operacional
                    </td>
                    <td className="whitespace-nowrap px-2 text-right text-xs opacity-20 md:text-sm">
                      R$ 0,00
                    </td>
                    <td className="whitespace-nowrap pl-2 text-right text-xs md:text-sm">
                      -
                      {formatCurrency(
                        viewMode === 'monthly'
                          ? values.pjHealth
                          : values.pjHealth * 12,
                      )}
                    </td>
                  </tr>
                  <tr className="bg-slate-800/30 text-white">
                    <td className="py-6 pr-4 font-sans text-sm font-bold md:text-base">
                      DINHEIRO NO BOLSO
                    </td>
                    <td className="whitespace-nowrap px-2 text-right text-base font-bold text-blue-400 md:text-lg">
                      {formatCurrency(
                        viewMode === 'monthly'
                          ? results.clt.netTotalMonthly
                          : results.clt.totalYearlyNet,
                      )}
                    </td>
                    <td className="whitespace-nowrap pl-2 text-right text-base font-bold text-emerald-400 md:text-lg">
                      {formatCurrency(
                        viewMode === 'monthly'
                          ? results.pj.netIncome
                          : results.pj.totalYearlyNet,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
