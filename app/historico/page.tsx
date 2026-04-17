"use client";

import React, { useState } from 'react';
import { 
  Trophy, 
  Activity, 
  Target, 
  BarChart, 
  Calendar, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- TYPES ---
interface Bet {
  id: number;
  date: string;
  match: string;
  market: string;
  odds: string;
  stake: string;
  result: 'green' | 'red' | 'void';
  profit: string;
}

// --- MOCK DATA ---
const PERFORMANCE_STATS = [
  { label: 'Total de Bets', value: '1,248', icon: Activity, color: 'text-indigo-600', bg: 'bg-white border border-slate-800' },
  { label: 'Taxa de Acerto (Win Rate)', value: '64.2%', icon: Target, color: 'text-emerald-700', bg: 'bg-white border border-slate-800' },
  { label: 'Yield Acumulado', value: '+12.4%', icon: BarChart, color: 'text-emerald-700', bg: 'bg-white border border-slate-800' },
  { label: 'Vitórias Totais', value: '802', icon: Trophy, color: 'text-amber-500', bg: 'bg-white border border-slate-800' },
];

const BET_HISTORY: Bet[] = [
  { id: 1, date: '12/04/2026', match: 'Real Madrid vs Man. City', market: 'Real Madrid Vence', odds: '2.10', stake: 'R$ 100', result: 'green', profit: '+R$ 110,00' },
  { id: 2, date: '12/04/2026', match: 'Bayern vs Arsenal', market: 'Mais de 2.5 Gols', odds: '1.85', stake: 'R$ 150', result: 'red', profit: '-R$ 150,00' },
  { id: 3, date: '11/04/2026', match: 'Liverpool vs Chelsea', market: 'Ambos Marcam (Sim)', odds: '1.72', stake: 'R$ 200', result: 'green', profit: '+R$ 144,00' },
  { id: 4, date: '11/04/2026', match: 'Flamengo vs Palmeiras', market: 'Palmeiras +0.5 AH', odds: '1.95', stake: 'R$ 100', result: 'void', profit: 'R$ 0,00' },
  { id: 5, date: '10/04/2026', match: 'São Paulo vs Corinthians', market: 'Empate', odds: '3.20', stake: 'R$ 50', result: 'red', profit: '-R$ 50,00' },
  { id: 6, date: '09/04/2026', match: 'PSG vs Barcelona', market: 'Barcelona Vence', odds: '2.40', stake: 'R$ 120', result: 'green', profit: '+R$ 168,00' },
];

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm hover:border-indigo-400 transition-colors group">
    <div className={cn("p-3 rounded-lg", bg)}>
      <Icon className={cn("h-6 w-6", color)} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-xl font-black text-slate-900">{value}</h4>
    </div>
  </div>
);

export default function Historico() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Histórico de Apostas</h2>
          <p className="text-slate-500 mt-1 font-medium">Analise seu desempenho e gerencie seus tickets passados.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar jogo..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64 text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-800 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        </div>
      </header>

      {/* BLOCO 1: Estatísticas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PERFORMANCE_STATS.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* BLOCO 2: Tabela de Histórico */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Período: Abril 2026</span>
          </div>
          <div className="flex gap-4 text-[10px] md:text-xs font-black uppercase tracking-wider">
            <span className="text-emerald-700">Greens: 8</span>
            <span className="text-rose-700">Reds: 4</span>
            <span className="text-slate-400">Reembolsos: 2</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jogo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linha (Market)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Odds</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stake</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resultado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Lucro/Perda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {BET_HISTORY.map((bet) => (
                  <tr key={bet.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-medium text-slate-400">{bet.date}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{bet.match}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase text-slate-600 bg-white border border-slate-800 px-2 py-1 rounded">
                        {bet.market}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700">{bet.odds}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{bet.stake}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-800 bg-white",
                        bet.result === 'green' ? "text-emerald-700" :
                        bet.result === 'red' ? "text-rose-700" :
                        "text-slate-500"
                      )}>
                        {bet.result === 'green' ? <ArrowUpRight className="h-3 w-3" /> : 
                         bet.result === 'red' ? <ArrowDownRight className="h-3 w-3" /> : 
                         <Minus className="h-3 w-3" />}
                        {bet.result === 'green' ? 'Win' : bet.result === 'red' ? 'Loss' : 'Void'}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-right text-xs font-black",
                      bet.result === 'green' ? "text-emerald-700" : 
                      bet.result === 'red' ? "text-rose-700" : "text-slate-400"
                    )}>
                      {bet.profit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação Simples */}
          <div className="px-6 py-4 bg-white border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Mostrando 6 de 1.248 apostas</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white border border-slate-800 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Anterior</button>
              <button className="px-3 py-1 bg-white border border-slate-800 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Próxima</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
