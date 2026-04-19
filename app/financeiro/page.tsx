"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter,
  AlertCircle,
  Loader2,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/lib/api/services/dashboard';
import { SummaryKPIs, Bankroll } from '@/types/api';

// --- TYPES ---
interface MonthlyData {
  month: string;
  value: number;
}

interface ProgressCircleProps {
  current: number;
  target: number;
  label: string;
  color: string;
}

// --- MOCK DATA (Fallback for now) ---
const MONTHLY_PROFIT_DATA: MonthlyData[] = [
  { month: 'Out', value: 950 },
  { month: 'Nov', value: 1400 },
  { month: 'Dez', value: 2100 },
  { month: 'Jan', value: 1200 },
  { month: 'Fev', value: 1850 },
  { month: 'Mar', value: 1500 },
  { month: 'Abr', value: 2450 },
];

const GOALS = {
  profit: { current: 1500, target: 2000, label: 'Meta de Lucro' },
  loss: { current: 40, limit: 100, label: 'Limite de Perda' }
};

// --- COMPONENTES AUXILIARES ---

const ProgressCircle = ({ current, target, label, color }: ProgressCircleProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200">
      <div className="relative h-24 w-24 flex items-center justify-center">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle className="text-slate-100 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
          <circle 
            className={cn("stroke-current transition-all duration-1000", color)} 
            strokeWidth="8" 
            strokeDasharray={251.2} 
            strokeDashoffset={251.2 - (percentage / 100) * 251.2} 
            strokeLinecap="round" 
            fill="transparent" 
            r="40" cx="50" cy="50" 
          />
        </svg>
        <span className="absolute text-xs font-bold text-slate-700">{Math.round(percentage)}%</span>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-900">R$ {current} / R$ {target}</p>
      </div>
    </div>
  );
};

export default function Financeiro() {
  const [summary, setSummary] = useState<SummaryKPIs | null>(null);
  const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryData, bankrollsData] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getBankrolls()
        ]);
        setSummary(summaryData);
        setBankrolls(bankrollsData);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const overviewCards = summary ? [
    { label: 'Saldo Total', value: `R$ ${summary.currentBankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Lucro Total', value: `R$ ${summary.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'ROI Geral', value: `${summary.roi}%`, icon: ArrowUpRight, color: 'text-amber-600', bg: 'bg-amber-50' },
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
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Financeiro</h2>
          <p className="text-slate-500 mt-1">Gerencie seus depósitos, saques e metas financeiras.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Novo Registro
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm">
            Exportar Relatório
          </button>
        </div>
      </header>

      {/* BLOCO 1: Overview Financeiro (Cards + Gráfico de Barras Minimalista) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          {overviewCards.map((card, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className={cn("p-3 rounded-lg", card.bg)}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                <h4 className="text-xl font-black text-slate-900">{card.value}</h4>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Histórico de Lucro por Mês</h3>
            <select className="text-xs font-bold bg-slate-50 border-0 rounded p-1 text-slate-500">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div className="flex items-end justify-between h-40 px-2 gap-4">
            {MONTHLY_PROFIT_DATA.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                <div 
                  className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-all cursor-help relative group" 
                  style={{ height: `${(data.value / 2500) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    R$ {data.value.toLocaleString()}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 2: Histórico de Transações */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-900">Saldos por Casa</h3>
            <div className="flex items-center gap-3">
              <button className="text-slate-400 hover:text-slate-600 transition-colors"><Search className="h-4 w-4" /></button>
              <button className="text-slate-400 hover:text-slate-600 transition-colors"><Filter className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plataforma</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moeda</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bankrolls.map((br) => (
                  <tr key={br.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold capitalize text-slate-700">{br.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">{br.currency}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900">
                      {br.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[10px] font-bold text-indigo-600 hover:underline">Ver Detalhes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BLOCO 3: Gráfico de Metas (Objetivo de Lucro e Limite de Perda) */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900">Objetivos do Mês</h3>
          <div className="grid grid-cols-1 gap-4">
            <ProgressCircle 
              current={GOALS.profit.current} 
              target={GOALS.profit.target} 
              label={GOALS.profit.label} 
              color="text-emerald-500"
            />
            <ProgressCircle 
              current={GOALS.loss.current} 
              target={GOALS.loss.limit} 
              label={GOALS.loss.label} 
              color="text-rose-500"
            />
            
            {/* Bloco 4 (Informativo): Recomendação de Gestão */}
            <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-4">
              <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Dica de Gestão</p>
                <p className="text-[11px] leading-relaxed text-indigo-900/70 font-medium italic">
                  &ldquo;Você já atingiu 75% da sua meta de lucro mensal. Considere reduzir a stake para garantir os ganhos atuais.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
