"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Plus, 
  Search, 
  Filter,
  AlertCircle,
  Loader2,
  Wallet,
  CheckCircle2,
  Clock
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
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-800 shadow-sm">
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
        <span className="absolute text-xs font-black text-slate-900">{Math.round(percentage)}%</span>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-slate-900 uppercase">R$ {current} / R$ {target}</p>
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
    { label: 'Saldo Total', value: `R$ ${summary.currentBankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-white border border-slate-800' },
    { label: 'Lucro Total', value: `R$ ${summary.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: ArrowUpRight, color: 'text-emerald-700', bg: 'bg-white border border-slate-800' },
    { label: 'ROI Geral', value: `${summary.roi}%`, icon: ArrowUpRight, color: 'text-amber-600', bg: 'bg-white border border-slate-800' },
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Financeiro</h2>
          <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-tighter">Gerencie seus depósitos, saques e metas financeiras.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-800 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
            <Plus className="h-4 w-4" /> Novo Registro
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm">
            Exportar Relatório
          </button>
        </div>
      </header>

      {/* BLOCO 1: Overview Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          {overviewCards.map((card, idx) => (
            <div key={idx} className={cn("p-5 rounded-xl flex items-center gap-4 shadow-sm", card.bg)}>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-800/10">
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</h4>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Histórico de Lucro por Mês</h3>
            <select className="text-[10px] font-black bg-white border border-slate-800 rounded px-2 py-1 text-slate-500 outline-none uppercase tracking-widest">
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
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-1.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 uppercase tracking-tighter">
                    R$ {data.value.toLocaleString()}
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 2: Saldos por Casa */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Saldos por Casa</h3>
            <div className="flex items-center gap-3">
              <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Search className="h-4 w-4" /></button>
              <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Filter className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plataforma</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Moeda</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankrolls.map((br) => (
                    <tr key={br.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black uppercase text-slate-700">{br.platform}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{br.currency}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900">
                        {br.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Ativo</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BLOCO 3: Metas Financeiras */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1">Metas e Limites</h3>
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
            
            <div className="bg-white border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Dica de Gestão</span>
                </div>
                <p className="text-xs font-bold leading-relaxed text-slate-700">
                  Você está a apenas <span className="font-black text-indigo-600">R$ 500,00</span> de atingir sua meta mensal. Mantenha a disciplina na stake!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
