"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ticketService } from '@/lib/api/services/ticket';
import { dashboardService } from '@/lib/api/services/dashboard';
import { Ticket, DashboardSummary } from '@/types/api';

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: React.ElementType; color: string; bg: string }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm hover:border-brand-400 dark:hover:border-brand-500 transition-colors group">
    <div className={cn("p-3 rounded-lg", bg)}>
      <Icon className={cn("h-6 w-6", color)} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</h4>
    </div>
  </div>
);

export default function Historico() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTickets = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const [historyData, summaryData] = await Promise.all([
        ticketService.getHistory(page, 20, searchTerm ? { market: searchTerm } : undefined),
        page === 0 ? dashboardService.getSummary() : Promise.resolve(summary),
      ]);
      setTickets(historyData.tickets);
      setTotalPages(historyData.totalPages);
      setTotalItems(historyData.totalItems);
      setCurrentPage(historyData.currentPage);
      if (page === 0 && summaryData) setSummary(summaryData as DashboardSummary);
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTickets(0);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const winRate = summary?.dailyStats && summary.dailyStats.total > 0
    ? Math.round((summary.dailyStats.won / summary.dailyStats.total) * 100)
    : 0;

  const performanceStats = summary ? [
    { label: 'Total de Bets', value: totalItems.toLocaleString(), icon: Activity, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/20' },
    { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: 'text-emerald-700 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'ROI Geral', value: `${summary.overallRoi}%`, icon: BarChart, color: 'text-emerald-700 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Lucro Total', value: `R$ ${summary.monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Trophy, color: 'text-amber-500 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  ] : [];

  const filteredTickets = tickets.filter((ticket) =>
    ticket.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.selection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Histórico de Apostas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-tighter">Analise seu desempenho e gerencie seus tickets passados.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por mercado/seleção..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-full md:w-64 text-slate-900 dark:text-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        </div>
      </header>

      {/* BLOCO 1: Estatísticas de Performance */}
      {performanceStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceStats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>
      )}

      {/* BLOCO 2: Tabela de Histórico */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Histórico Geral</span>
          </div>
          <div className="flex gap-4 text-[10px] font-black uppercase tracking-wider">
            <span className="text-emerald-700 dark:text-emerald-400">Greens: {tickets.filter((t) => t.result === 'WIN').length}</span>
            <span className="text-rose-700 dark:text-rose-500">Reds: {tickets.filter((t) => t.result === 'LOSS').length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mercado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seleção</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Odds</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stake</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resultado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Lucro/Perda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-black uppercase italic">Nenhuma aposta encontrada.</td>
                    </tr>
                  ) : filteredTickets.map((bet) => (
                    <tr key={bet.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        {new Date(bet.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">{bet.market}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded uppercase tracking-tighter">
                          {bet.selection}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-slate-100">{bet.odds.toFixed(2)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">R$ {bet.stake.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm",
                          bet.result === 'WIN' ? "text-emerald-700 dark:text-emerald-400" :
                          bet.result === 'LOSS' ? "text-rose-700 dark:text-rose-400" :
                          bet.result === 'VOID' ? "text-slate-500 dark:text-slate-400" :
                          "text-amber-600 dark:text-amber-400"
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
                        bet.result === 'WIN' ? "text-emerald-700 dark:text-emerald-400" :
                        bet.result === 'LOSS' ? "text-rose-700 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {bet.result === 'WIN' ? '+' : ''}R$ {bet.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Mostrando {filteredTickets.length} de {totalItems} apostas
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTickets(currentPage - 1)}
                disabled={currentPage === 0 || loading}
                className="px-3 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="h-3 w-3" /> Anterior
              </button>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                {currentPage + 1} / {Math.max(totalPages, 1)}
              </span>
              <button
                onClick={() => fetchTickets(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || loading}
                className="px-3 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Próxima <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
