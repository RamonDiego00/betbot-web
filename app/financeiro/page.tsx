"use client";

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- TYPES ---
interface MonthlyData {
  month: string;
  value: number;
}

interface Transaction {
  id: number;
  type: 'deposito' | 'saque';
  bank: string;
  value: string;
  date: string;
  status: 'concluido' | 'pendente';
}

interface ProgressCircleProps {
  current: number;
  target: number;
  label: string;
  color: string;
}

// --- MOCK DATA ---
const OVERVIEW_CARDS = [
  { label: 'Total de Depósitos', value: 'R$ 8.500,00', icon: Plus, color: 'text-indigo-600', bg: 'bg-white border border-slate-800' },
  { label: 'Total de Saques', value: 'R$ 3.200,00', icon: ArrowDownRight, color: 'text-rose-600', bg: 'bg-white border border-slate-800' },
  { label: 'Lucro Médio Mensal', value: 'R$ 1.840,00', icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-white border border-slate-800' },
];

const MONTHLY_PROFIT_DATA: MonthlyData[] = [
  { month: 'Out', value: 950 },
  { month: 'Nov', value: 1400 },
  { month: 'Dez', value: 2100 },
  { month: 'Jan', value: 1200 },
  { month: 'Fev', value: 1850 },
  { month: 'Mar', value: 1500 },
  { month: 'Abr', value: 2450 },
];

const TRANSACTIONS: Transaction[] = [
  { id: 1, type: 'deposito', bank: 'Bet365', value: 'R$ 500,00', date: '12/04/2026', status: 'concluido' },
  { id: 2, type: 'saque', bank: 'Pinnacle', value: 'R$ 1.200,00', date: '10/04/2026', status: 'concluido' },
  { id: 3, type: 'deposito', bank: 'Betfair', value: 'R$ 300,00', date: '08/04/2026', status: 'pendente' },
  { id: 4, type: 'saque', bank: 'Bet365', value: 'R$ 200,00', date: '05/04/2026', status: 'concluido' },
];

const GOALS = {
  profit: { current: 1500, target: 2000, label: 'Meta de Lucro' },
  loss: { current: 40, limit: 100, label: 'Limite de Perda' }
};

// --- COMPONENTES AUXILIARES ---

const ProgressCircle = ({ current, target, label, color }: ProgressCircleProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-800">
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
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Financeiro</h2>
          <p className="text-slate-500 mt-1 font-medium">Gerencie seus depósitos, saques e metas financeiras.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-800 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
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
          {OVERVIEW_CARDS.map((card, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
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

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Histórico de Lucro por Mês</h3>
            <select className="text-xs font-bold bg-white border border-slate-800 rounded p-1 text-slate-500 outline-none">
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
            <h3 className="font-bold text-slate-900">Histórico de Transações</h3>
            <div className="flex items-center gap-3">
              <button className="text-slate-400 hover:text-slate-600 transition-colors"><Search className="h-4 w-4" /></button>
              <button className="text-slate-400 hover:text-slate-600 transition-colors"><Filter className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Banca</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {TRANSACTIONS.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-slate-800 bg-white",
                          t.type === 'deposito' 
                            ? "text-emerald-700" 
                            : "text-rose-700"
                        )}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{t.bank}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900">{t.value}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{t.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {t.status === 'concluido' ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-[10px] font-bold text-emerald-700 uppercase">Concluído</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-[10px] font-bold text-amber-600 uppercase">Pendente</span>
                            </>
                          )}
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
          <h3 className="font-bold text-slate-900 px-1">Metas e Limites</h3>
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
            
            <div className="bg-white border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Dica de Gestão</span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-700">
                  Você está a apenas <span className="font-black">R$ 500,00</span> de atingir sua meta mensal. Mantenha a disciplina na stake!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
