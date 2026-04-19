"use client";

import React, { useState, useEffect } from 'react';
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
  Minus,
  Loader2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ticketService } from '@/lib/api/services/ticket';
import { dashboardService } from '@/lib/api/services/dashboard';
import { Ticket, SummaryKPIs } from '@/types/api';

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm hover:border-indigo-400 transition-colors group">
    <div className={cn("p-3 rounded-lg", bg)}>
      <Icon className={cn("h-6 w-6", color)} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h4>
    </div>
  </div>
);

export default function Historico() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState<SummaryKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ticketsData, summaryData] = await Promise.all([
          ticketService.getHistory(),
          dashboardService.getSummary()
        ]);
        setTickets(ticketsData);
        setSummary(summaryData);
      } catch (error) {
        console.error("Error fetching history data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const performanceStats = summary ? [
    { label: 'Total de Bets', value: summary.totalBets.toLocaleString(), icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Win Rate', value: `${summary.winRate}%`, icon: Target, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'ROI Geral', value: `${summary.roi}%`, icon: BarChart, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Lucro Total', value: `R$ ${summary.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
  ] : [];

  const filteredTickets = tickets.filter(ticket => 
    ticket.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.selection.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Histórico de Apostas</h2>
          <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-tighter">Analise seu desempenho e gerencie seus tickets passados.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por mercado/seleção..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64 text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-800 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        </div>
      </header>

      {/* BLOCO 1: Estatísticas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceStats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* BLOCO 2: Tabela de Histórico */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Histórico Geral</span>
          </div>
          <div className="flex gap-4 text-[10px] font-black uppercase tracking-wider">
            <span className="text-emerald-700">Greens: {tickets.filter(t => t.result === 'WIN').length}</span>
            <span className="text-rose-700">Reds: {tickets.filter(t => t.result === 'LOSS').length}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mercado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleção</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Odds</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stake</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Lucro/Perda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-xs font-black uppercase italic">Nenhuma aposta encontrada.</td>
                  </tr>
                ) : filteredTickets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                      {new Date(bet.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-tighter">{bet.market}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-slate-600 bg-white border border-slate-800 px-2 py-1 rounded uppercase tracking-tighter">
                        {bet.selection}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900">{bet.odds.toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">R$ {bet.stake.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-800 bg-white shadow-sm",
                        bet.result === 'WIN' ? "text-emerald-700" :
                        bet.result === 'LOSS' ? "text-rose-700" :
                        bet.result === 'VOID' ? "text-slate-500" :
                        "text-amber-600" // PENDING
                      )}>
                        {bet.result === 'WIN' ? <ArrowUpRight className="h-3 w-3" /> : 
                         bet.result === 'LOSS' ? <ArrowDownRight className="h-3 w-3" /> : 
                         bet.result === 'VOID' ? <Minus className="h-3 w-3" /> :
                         <Clock className="h-3 w-3" />}
                        {bet.result === 'WIN' ? 'Win' : 
                         bet.result === 'LOSS' ? 'Loss' : 
                         bet.result === 'VOID' ? 'Void' : 'Pending'}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-right text-xs font-black",
                      bet.result === 'WIN' ? "text-emerald-700" : 
                      bet.result === 'LOSS' ? "text-rose-700" : "text-slate-400"
                    )}>
                      {bet.result === 'WIN' ? '+' : ''}R$ {bet.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando {filteredTickets.length} de {tickets.length} apostas</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white border border-slate-800 rounded text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">Anterior</button>
              <button className="px-3 py-1 bg-white border border-slate-800 rounded text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">Próxima</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
