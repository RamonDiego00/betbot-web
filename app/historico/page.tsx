"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Trophy,
  Activity,
  Target,
  BarChart,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Clock,
} from 'lucide-react';
import { cn, formatPeriodRangeLabel, resolvePeriodRangeForDisplay, type PeriodPreset } from '@/lib/utils';
import { ticketService } from '@/lib/api/services/ticket';
import { dashboardService } from '@/lib/api/services/dashboard';
import { TicketHistoryItem, DashboardSummary } from '@/types/api';

function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

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
  const [tickets, setTickets] = useState<TicketHistoryItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('daily');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [rangeDraft, setRangeDraft] = useState({ start: '', end: '' });
  const [showRangePicker, setShowRangePicker] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const summaryParams = customRange
        ? { period: 'custom', startDate: customRange.start, endDate: customRange.end }
        : { period: periodPreset };

      const [historyData, summaryData] = await Promise.all([
        ticketService.getHistory(periodPreset, customRange ? { startDate: customRange.start, endDate: customRange.end } : undefined),
        dashboardService.getSummary(summaryParams),
      ]);
      setTickets(historyData.tickets);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching history data:', error);
      setLoadError(true);
      setTickets([]);
      toast.error('Falha ao carregar o histórico de apostas.');
    } finally {
      setLoading(false);
    }
  }, [periodPreset, customRange]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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

  const winRate = summary?.dailyStats && summary.dailyStats.total > 0
    ? Math.round((summary.dailyStats.won / summary.dailyStats.total) * 100)
    : 0;

  const performanceStats = summary ? [
    { label: 'Total de Bets', value: (summary.dailyStats.total ?? 0).toLocaleString(), icon: Activity, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/20' },
    { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: 'text-emerald-700 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'ROI Geral', value: `${summary.overallRoi}%`, icon: BarChart, color: 'text-emerald-700 dark:text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Lucro Total', value: `R$ ${summary.monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Trophy, color: 'text-amber-500 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  ] : [];

  const filteredTickets = tickets.filter((ticket) =>
    ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayRange = resolvePeriodRangeForDisplay(periodPreset, customRange);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Histórico de Apostas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-tighter">Analise seu desempenho e gerencie seus tickets passados.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por ID do ticket..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-full md:w-64 text-slate-900 dark:text-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
                  <label htmlFor="range-start" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">De</label>
                  <input
                    id="range-start"
                    type="date"
                    value={rangeDraft.start}
                    onChange={(e) => setRangeDraft((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="range-end" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Até</label>
                  <input
                    id="range-end"
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
          ) : loadError ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Falha ao carregar o histórico</p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tente novamente em instantes ou troque o período.</p>
            </div>
          ) : (
            <>
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ticket</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Valor Apostado</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resultado</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Lucro/Perda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-black uppercase italic">Nenhuma aposta encontrada.</td>
                      </tr>
                    ) : filteredTickets.map((bet) => (
                      <tr key={bet.ticketId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {formatDateBR(bet.date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded uppercase tracking-tighter">
                            #{bet.ticketId.slice(-8)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">R$ {bet.amountWagered.toFixed(2)}</td>
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
                          {bet.result === 'WIN' ? '+' : ''}R$ {bet.profitLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTickets.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-black uppercase italic">Nenhuma aposta encontrada.</div>
              ) : filteredTickets.map((bet) => (
                <div key={bet.ticketId} className="px-4 py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter truncate">#{bet.ticketId.slice(-8)}</span>
                    <span className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm",
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
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Valor Apostado</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">R$ {bet.amountWagered.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lucro/Perda</p>
                      <p className={cn(
                        "text-xs font-black",
                        bet.result === 'WIN' ? "text-emerald-700 dark:text-emerald-400" :
                        bet.result === 'LOSS' ? "text-rose-700 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {bet.result === 'WIN' ? '+' : ''}R$ {bet.profitLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    {formatDateBR(bet.date)}
                  </p>
                </div>
              ))}
            </div>
            </>
          )}

          {/* Contador */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Mostrando {filteredTickets.length} apostas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
