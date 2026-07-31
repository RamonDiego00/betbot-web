"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Search,
  Filter,
  Loader2,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { financeiroService } from '@/lib/api/services/financeiro';
import { dashboardService } from '@/lib/api/services/dashboard';
import {
  DashboardSummary,
  LucroMensalItem,
  SaldoCasaItem,
} from '@/types/api';

export default function Financeiro() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [saldos, setSaldos] = useState<SaldoCasaItem[]>([]);
  const [lucroMensal, setLucroMensal] = useState<LucroMensalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryData, saldosData, lucroData] = await Promise.allSettled([
          dashboardService.getSummary(),
          financeiroService.getSaldos(),
          financeiroService.getLucroMensal(),
        ]);

        if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
        if (saldosData.status === 'fulfilled') setSaldos(saldosData.value);
        if (lucroData.status === 'fulfilled') setLucroMensal(lucroData.value);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const [activeBarIdx, setActiveBarIdx] = useState<number | null>(null);

  const maxLucro = lucroMensal.length > 0 ? Math.max(...lucroMensal.map((d) => Math.abs(d.valor)), 1) : 1;

  const overviewCards = summary ? [
    {
      label: 'Saldo Total',
      value: `R$ ${(summary.totalBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    },
    {
      label: 'Lucro do Mês',
      value: `R$ ${(summary.monthlyProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ArrowUpRight,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    },
    {
      label: 'ROI Geral',
      value: `${(summary.overallRoi || 0).toFixed(2)}%`,
      icon: ArrowUpRight,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    },
  ] : [];

  if (loading) {
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
      </header>

      {/* BLOCO 1: Overview Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          {overviewCards.map((card, idx) => (
            <div key={idx} className={cn("p-5 rounded-xl flex items-center gap-4 shadow-sm", card.bg)}>
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

        {/* Gráfico de barras — dados reais da API */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Histórico de Lucro por Mês</h3>
          </div>
          {lucroMensal.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-xs text-slate-400 dark:text-slate-500 italic font-bold">Sem dados mensais</div>
          ) : (
            <div className="flex items-end justify-between h-40 px-2 gap-4">
              {lucroMensal.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveBarIdx((prev) => (prev === idx ? null : idx))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveBarIdx((prev) => (prev === idx ? null : idx));
                      }
                    }}
                    className={cn(
                      "w-full rounded-t hover:opacity-80 transition-all cursor-pointer relative group",
                      data.valor >= 0 ? "bg-brand-500 hover:bg-brand-600" : "bg-rose-400 hover:bg-rose-500"
                    )}
                    style={{ height: `${(Math.abs(data.valor) / maxLucro) * 100}%`, minHeight: '4px' }}
                  >
                    <div className={cn(
                      "absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-black py-1.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 uppercase tracking-tighter",
                      activeBarIdx === idx && "opacity-100"
                    )}>
                      R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{data.mes}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BLOCO 2: Saldos por Casa */}
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
