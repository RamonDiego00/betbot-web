"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Loader2,
  Wallet,
  CheckCircle2,
  Percent,
  PiggyBank,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  TooltipContentProps,
} from 'recharts';
import { cn, formatPeriodRangeLabel, resolvePeriodRangeForDisplay, type PeriodPreset } from '@/lib/utils';
import { financeiroService } from '@/lib/api/services/financeiro';
import { dashboardService } from '@/lib/api/services/dashboard';
import {
  DashboardSummary,
  SaldoCasaItem,
  PontoSaldo,
  TopMercadoItem,
  FluxoCaixaItem,
} from '@/types/api';

function formatDateShort(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatBRLShort(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  }
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

// --- Hook de tema (Recharts precisa de cores explícitas — não herda `dark:` do Tailwind) ---

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(target.classList.contains('dark'));
    });
    observer.observe(target, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

function getChartColors(isDark: boolean) {
  return {
    grid: isDark ? '#1e293b' : '#e2e8f0', // slate-800 / slate-200
    axis: isDark ? '#64748b' : '#94a3b8', // slate-500 / slate-400
    brand: isDark ? '#58c6a6' : '#226350', // brand-400 / brand-600
    brandFill: isDark ? 'rgba(88,198,166,0.30)' : 'rgba(34,99,80,0.18)',
    positive: isDark ? '#34d399' : '#059669', // emerald-400 / emerald-600
    negative: isDark ? '#fb7185' : '#e11d48', // rose-400 / rose-600
    neutral: isDark ? '#64748b' : '#94a3b8', // slate-500 / slate-400
    tooltipBg: isDark ? '#0f172a' : '#ffffff', // slate-900 / white
    tooltipBorder: isDark ? '#1e293b' : '#e2e8f0',
  };
}

// --- Waterfall (Fluxo de Caixa) ---

type WaterfallKind = 'total' | 'positive' | 'negative';

interface WaterfallDatum {
  name: string;
  base: number;
  value: number;
  displayValue: number;
  kind: WaterfallKind;
}

function buildWaterfallData(f: FluxoCaixaItem): WaterfallDatum[] {
  const data: WaterfallDatum[] = [
    { name: 'Saldo Inicial', base: 0, value: f.saldoInicial, displayValue: f.saldoInicial, kind: 'total' },
  ];

  let running = f.saldoInicial;
  const steps: { name: string; delta: number }[] = [
    { name: 'Depósitos', delta: f.depositos },
    { name: 'Ganhos', delta: f.ganhos },
    { name: 'Perdas', delta: -f.perdas },
    { name: 'Stakes Abertos', delta: -f.stakesEmAberto },
    { name: 'Saques', delta: -f.saques },
  ];

  for (const step of steps) {
    const base = step.delta >= 0 ? running : running + step.delta;
    const value = Math.abs(step.delta);
    data.push({ name: step.name, base, value, displayValue: step.delta, kind: step.delta >= 0 ? 'positive' : 'negative' });
    running += step.delta;
  }

  data.push({ name: 'Saldo Final', base: 0, value: f.saldoFinal, displayValue: f.saldoFinal, kind: 'total' });

  return data;
}

export default function Financeiro() {
  const isDark = useIsDarkMode();
  const chartColors = getChartColors(isDark);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [saldos, setSaldos] = useState<SaldoCasaItem[]>([]);
  const [constantLoading, setConstantLoading] = useState(true);

  const [summaryPeriod, setSummaryPeriod] = useState<DashboardSummary | null>(null);
  const [evolucaoSaldo, setEvolucaoSaldo] = useState<PontoSaldo[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaItem | null>(null);
  const [topMercados, setTopMercados] = useState<TopMercadoItem[]>([]);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodLoadError, setPeriodLoadError] = useState(false);

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('daily');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [rangeDraft, setRangeDraft] = useState({ start: '', end: '' });
  const [showRangePicker, setShowRangePicker] = useState(false);

  useEffect(() => {
    async function fetchConstant() {
      try {
        const [summaryData, saldosData] = await Promise.allSettled([
          dashboardService.getSummary(),
          financeiroService.getSaldos(),
        ]);
        if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
        if (saldosData.status === 'fulfilled') setSaldos(saldosData.value);
      } catch (error) {
        console.error('Error fetching constant financial data:', error);
      } finally {
        setConstantLoading(false);
      }
    }
    fetchConstant();
  }, []);

  const fetchPeriodData = useCallback(async () => {
    setPeriodLoading(true);
    setPeriodLoadError(false);
    try {
      const params = customRange
        ? { period: 'custom', startDate: customRange.start, endDate: customRange.end }
        : { period: periodPreset };

      const [summaryPeriodData, evolucaoData, fluxoData, topMercadosData] = await Promise.all([
        dashboardService.getSummary(params),
        financeiroService.getEvolucaoSaldo(params),
        financeiroService.getFluxoCaixa(params),
        financeiroService.getTopMercados(params),
      ]);

      setSummaryPeriod(summaryPeriodData);
      setEvolucaoSaldo(evolucaoData);
      setFluxoCaixa(fluxoData);
      setTopMercados(topMercadosData);
    } catch (error) {
      console.error('Error fetching financial period data:', error);
      setPeriodLoadError(true);
      toast.error('Falha ao carregar os dados financeiros do período.');
    } finally {
      setPeriodLoading(false);
    }
  }, [periodPreset, customRange]);

  useEffect(() => {
    fetchPeriodData();
  }, [fetchPeriodData]);

  const handlePresetChange = (preset: Exclude<PeriodPreset, 'custom'>) => {
    setPeriodPreset(preset);
    setCustomRange(null);
    setShowRangePicker(false);
  };

  const handleApplyCustomRange = () => {
    if (!rangeDraft.start || !rangeDraft.end) return;
    setPeriodPreset('custom');
    setCustomRange({ start: rangeDraft.start, end: rangeDraft.end });
    setShowRangePicker(false);
  };

  const overviewCards = [
    {
      label: 'Saldo Total (Agora)',
      value: formatBRL(summary?.totalBalance ?? 0),
      icon: Wallet,
      color: 'text-brand-600 dark:text-brand-400',
    },
    {
      label: 'Lucro do Período',
      value: formatBRL(summaryPeriod?.monthlyProfit ?? 0),
      icon: (summaryPeriod?.monthlyProfit ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight,
      color: (summaryPeriod?.monthlyProfit ?? 0) >= 0
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-rose-700 dark:text-rose-400',
    },
    {
      label: 'ROI do Período',
      value: `${(summaryPeriod?.overallRoi ?? 0).toFixed(2)}%`,
      icon: Percent,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Banca Inicial (Período)',
      value: formatBRL(fluxoCaixa?.saldoInicial ?? 0),
      icon: PiggyBank,
      color: 'text-brand-600 dark:text-brand-400',
    },
  ];

  const waterfallData = fluxoCaixa ? buildWaterfallData(fluxoCaixa) : [];

  const displayRange = resolvePeriodRangeForDisplay(periodPreset, customRange);

  if (constantLoading && periodLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Financeiro</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-tighter">Acompanhe seus saldos e lucros.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {formatPeriodRangeLabel(displayRange)}
          </span>
          <button
            type="button"
            onClick={() => handlePresetChange('daily')}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm border",
              periodPreset === 'daily' && !customRange
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('yesterday')}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm border",
              periodPreset === 'yesterday' && !customRange
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Ontem
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('weekly')}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm border",
              periodPreset === 'weekly' && !customRange
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('monthly')}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm border",
              periodPreset === 'monthly' && !customRange
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Mês
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setRangeDraft(customRange ?? { start: '', end: '' });
                setShowRangePicker((prev) => !prev);
              }}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm border",
                customRange
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              Personalizado
            </button>

            {showRangePicker && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-4 z-20 space-y-3">
                <div className="space-y-1">
                  <label htmlFor="fin-range-start" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">De</label>
                  <input
                    id="fin-range-start"
                    type="date"
                    value={rangeDraft.start}
                    onChange={(e) => setRangeDraft((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="fin-range-end" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Até</label>
                  <input
                    id="fin-range-end"
                    type="date"
                    value={rangeDraft.end}
                    onChange={(e) => setRangeDraft((prev) => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  disabled={!rangeDraft.start || !rangeDraft.end}
                  className="w-full px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BLOCO 1: Cards de overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <card.icon className={cn("h-6 w-6", card.color)} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{card.label}</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{card.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* BLOCO 2: Evolução do Saldo da Banca */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Evolução do Saldo da Banca</h3>
        </div>
        {periodLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : periodLoadError ? (
          <div className="h-72 flex items-center justify-center text-xs text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest">Falha ao carregar dados do período</div>
        ) : evolucaoSaldo.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 italic font-bold">Sem dados de saldo no período</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucaoSaldo} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis
                  dataKey="data"
                  tickFormatter={formatDateShort}
                  tick={{ fill: chartColors.axis, fontSize: 10, fontWeight: 700 }}
                  axisLine={{ stroke: chartColors.grid }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatBRLShort}
                  tick={{ fill: chartColors.axis, fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip content={(props: TooltipContentProps) => <SaldoTooltip {...props} colors={chartColors} />} />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke={chartColors.brand}
                  strokeWidth={2}
                  fill="url(#saldoGradient)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* BLOCO 3: Fluxo de Caixa (Waterfall) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Fluxo de Caixa</h3>
        </div>
        {periodLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : periodLoadError || !fluxoCaixa ? (
          <div className="h-72 flex items-center justify-center text-xs text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest">Falha ao carregar dados do período</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartColors.axis, fontSize: 9, fontWeight: 700 }}
                  axisLine={{ stroke: chartColors.grid }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tickFormatter={formatBRLShort}
                  tick={{ fill: chartColors.axis, fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip content={(props: TooltipContentProps) => <WaterfallTooltip {...props} colors={chartColors} />} cursor={{ fill: chartColors.grid, opacity: 0.3 }} />
                <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {waterfallData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.kind === 'total'
                          ? chartColors.neutral
                          : entry.kind === 'positive'
                          ? chartColors.positive
                          : chartColors.negative
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* BLOCO 4: Top Mercados & Linhas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Top Mercados & Linhas</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {periodLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : periodLoadError ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Falha ao carregar os dados</p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tente novamente em instantes ou troque o período.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mercado</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Linha</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pernas</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pernas Ganhas</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {topMercados.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">Nenhum mercado encontrado no período.</td>
                        </tr>
                      ) : topMercados.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                          <td className="px-6 py-4 text-xs font-black uppercase text-slate-700 dark:text-slate-300">{m.mercado}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{m.linha}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{m.totalPernas}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{m.pernasGanhas}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                              m.winRate >= 50
                                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/20"
                                : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-500/20"
                            )}>
                              {m.winRate.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {topMercados.length === 0 ? (
                  <div className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">Nenhum mercado encontrado no período.</div>
                ) : topMercados.map((m, idx) => (
                  <div key={idx} className="px-4 py-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 truncate">{m.mercado}</span>
                      <span className={cn(
                        "shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        m.winRate >= 50
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/20"
                          : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-500/20"
                      )}>
                        {m.winRate.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{m.linha}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pernas</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{m.totalPernas}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pernas Ganhas</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{m.pernasGanhas}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* BLOCO 5: Saldos por Casa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Saldos por Casa</h3>
          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"><Search className="h-4 w-4" /></button>
            <button className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"><Filter className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Plataforma</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Moeda</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saldo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {saldos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">Nenhum saldo encontrado.</td>
                    </tr>
                  ) : saldos.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">{s.casa}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">BRL</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-slate-100">
                        {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">{s.statusSincronizacao}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {saldos.length === 0 ? (
              <div className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">Nenhum saldo encontrado.</div>
            ) : saldos.map((s, idx) => (
              <div key={idx} className="px-4 py-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 truncate">{s.casa}</span>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">{s.statusSincronizacao}</span>
                  </div>
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">BRL</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Tooltips customizados (cores explícitas, respeitando o tema atual) ---

interface ChartColors {
  positive: string;
  negative: string;
  neutral: string;
  tooltipBg: string;
  tooltipBorder: string;
}

function SaldoTooltip({ active, payload, label, colors }: TooltipContentProps & { colors: ChartColors }) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.value;
  if (typeof value !== 'number') return null;
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-lg border"
      style={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder }}
    >
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
        {typeof label === 'string' ? formatDateShort(label) : ''}
      </p>
      <p className="text-xs font-black text-slate-900 dark:text-slate-100">{formatBRL(value)}</p>
    </div>
  );
}

function WaterfallTooltip({ active, payload, colors }: TooltipContentProps & { colors: ChartColors }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload.find((p) => p.dataKey === 'value')?.payload as WaterfallDatum | undefined;
  if (!entry) return null;

  const color = entry.kind === 'total' ? colors.neutral : entry.kind === 'positive' ? colors.positive : colors.negative;

  return (
    <div
      className="rounded-lg px-3 py-2 shadow-lg border"
      style={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder }}
    >
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{entry.name}</p>
      <p className="text-xs font-black" style={{ color }}>
        {entry.kind === 'positive' ? '+' : ''}{formatBRL(entry.displayValue)}
      </p>
    </div>
  );
}
