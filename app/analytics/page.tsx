"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { reportService } from '@/lib/api/services/report';
import { StrategyPerformance } from '@/types/api';

export default function Analytics() {
  const [performances, setPerformances] = useState<StrategyPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await reportService.getStrategyPerformance();
        setPerformances(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const totalBets = performances.reduce((acc, p) => acc + p.totalBets, 0);
  // Derivados de /analytics/markets — a contagem exata de greens virá direto
  // da API na fase de des-mock.
  const greens = Math.round(
    performances.reduce((acc, p) => acc + (p.totalBets * p.winRate) / 100, 0)
  );
  const winRate = totalBets > 0 ? (greens / totalBets) * 100 : 0;

  const kpis = [
    {
      label: 'Greens do Mês',
      value: String(greens),
      icon: CheckCircle2,
      accent: 'text-emerald-600',
    },
    {
      label: 'Win Rate do Mês',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      accent: winRate >= 50 ? 'text-emerald-600' : 'text-rose-600',
    },
    {
      label: 'Total de Apostas',
      value: String(totalBets),
      icon: BarChart3,
      accent: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">Analytics</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Resultado consolidado do mês por mercado.</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">{kpi.label}</span>
              <kpi.icon className={cn("h-5 w-5", kpi.accent)} />
            </div>
            <p className={cn("mt-3 text-4xl font-black tracking-tight", kpi.accent)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Lista por mercado */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            Performance por Mercado
          </h3>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mês atual</span>
        </div>

        {performances.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            Nenhum dado de mercado disponível ainda.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {performances.map((stat) => (
              <li key={stat.strategyName} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stat.strategyName}</span>
                <div className="flex items-center gap-6">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
                    {stat.totalBets} apostas
                  </span>
                  <span className="text-xs font-black text-slate-550 dark:text-slate-450 min-w-[52px] text-right">
                    {stat.winRate}% WR
                  </span>
                  <span className={cn(
                    "text-xs font-black min-w-[72px] text-right",
                    stat.roi >= 0 ? "text-emerald-700 dark:text-emerald-450" : "text-rose-700 dark:text-rose-455"
                  )}>
                    {stat.roi >= 0 ? '+' : ''}{stat.roi}% ROI
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
