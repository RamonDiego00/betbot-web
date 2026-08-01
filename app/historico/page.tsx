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
  ChevronDown,
} from 'lucide-react';
import { cn, formatPeriodRangeLabel, resolvePeriodRangeForDisplay, type PeriodPreset } from '@/lib/utils';
import { ticketService } from '@/lib/api/services/ticket';
import { dashboardService } from '@/lib/api/services/dashboard';
import { TicketHistoryItem, TicketLeg, DashboardSummary } from '@/types/api';

function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function shortTicketId(ticketId: string): string {
  return `#${ticketId.slice(-8)}`;
}

// Confrontos do ticket: prioriza `matches`, cai para os nomes distintos das `legs`.
function ticketMatches(bet: TicketHistoryItem): string[] {
  const fromMatches = (bet.matches ?? []).filter(Boolean);
  if (fromMatches.length > 0) return Array.from(new Set(fromMatches));
  return Array.from(new Set((bet.legs ?? []).map((leg) => leg.match).filter(Boolean)));
}

// Rótulo principal da linha. Sem dado de confronto, mantém o id curto (comportamento antigo).
function ticketLabel(bet: TicketHistoryItem): { title: string; extraMatches: number; isFallback: boolean } {
  const matches = ticketMatches(bet);
  if (matches.length === 0) {
    return { title: shortTicketId(bet.ticketId), extraMatches: 0, isFallback: true };
  }
  return { title: matches[0], extraMatches: matches.length - 1, isFallback: false };
}

function groupLegsByMatch(legs: TicketLeg[]): { match: string; legs: TicketLeg[] }[] {
  const groups: { match: string; legs: TicketLeg[] }[] = [];
  legs.forEach((leg) => {
    const key = leg.match || 'Confronto não identificado';
    const existing = groups.find((group) => group.match === key);
    if (existing) existing.legs.push(leg);
    else groups.push({ match: key, legs: [leg] });
  });
  return groups;
}

function legDescription(leg: TicketLeg): string {
  return [leg.market, leg.selection, leg.period, leg.teamFilter].filter(Boolean).join(' · ');
}

const TicketDetails = ({ bet }: { bet: TicketHistoryItem }) => {
  const groups = groupLegsByMatch(bet.legs ?? []);

  return (
    <div className="space-y-3">
      {groups.length === 0 ? (
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          Detalhe indisponível para este dia.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.match} className="space-y-1.5">
            <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter break-words">
              {group.match}
            </p>
            <ul className="space-y-1 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
              {group.legs.map((leg, idx) => (
                <li key={`${group.match}-${idx}`} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 break-words">
                  {legDescription(leg)}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        Ticket {shortTicketId(bet.ticketId)}
      </p>
    </div>
  );
};

const ResultBadge = ({ result }: { result: TicketHistoryItem['result'] }) => (
  <span className={cn(
    "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm",
    result === 'WIN' ? "text-emerald-700 dark:text-emerald-400" :
    result === 'LOSS' ? "text-rose-700 dark:text-rose-400" :
    result === 'VOID' ? "text-slate-500 dark:text-slate-400" :
    "text-amber-600 dark:text-amber-400"
  )}>
    {result === 'WIN' ? <ArrowUpRight className="h-3 w-3" /> :
     result === 'LOSS' ? <ArrowDownRight className="h-3 w-3" /> :
     result === 'VOID' ? <Minus className="h-3 w-3" /> :
     <Clock className="h-3 w-3" />}
    {result === 'WIN' ? 'Win' :
     result === 'LOSS' ? 'Loss' :
     result === 'VOID' ? 'Void' : 'Pending'}
  </span>
);

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
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

  const toggleTicket = (ticketId: string) => {
    setExpandedTickets((prev) => ({ ...prev, [ticketId]: !prev[ticketId] }));
  };

  const handleRowKeyDown = (event: React.KeyboardEvent, ticketId: string) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      toggleTicket(ticketId);
    }
  };

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
      setExpandedTickets({});
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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTickets = tickets.filter((ticket) => {
    if (!normalizedSearch) return true;
    if (ticket.ticketId.toLowerCase().includes(normalizedSearch)) return true;
    return ticketMatches(ticket).some((match) => match.toLowerCase().includes(normalizedSearch));
  });

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
              placeholder="Buscar por time ou ID do ticket..."
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
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Confronto</th>
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
                    ) : filteredTickets.map((bet) => {
                      const label = ticketLabel(bet);
                      const isExpanded = !!expandedTickets[bet.ticketId];
                      return (
                      <React.Fragment key={bet.ticketId}>
                      <tr
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => toggleTicket(bet.ticketId)}
                        onKeyDown={(e) => handleRowKeyDown(e, bet.ticketId)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40"
                      >
                        <td className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap">
                          {formatDateBR(bet.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 min-w-0" title={`Ticket ${shortTicketId(bet.ticketId)}`}>
                            <ChevronDown className={cn(
                              "h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500 transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                            <span className={cn(
                              "line-clamp-1 break-all max-w-[220px] lg:max-w-[320px]",
                              label.isFallback
                                ? "text-[10px] font-black text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded uppercase tracking-tighter"
                                : "text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter"
                            )}>
                              {label.title}
                            </span>
                            {label.extraMatches > 0 && (
                              <span className="shrink-0 text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                +{label.extraMatches}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">R$ {bet.amountWagered.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <ResultBadge result={bet.result} />
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-right text-xs font-black whitespace-nowrap",
                          bet.result === 'WIN' ? "text-emerald-700 dark:text-emerald-400" :
                          bet.result === 'LOSS' ? "text-rose-700 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {bet.result === 'WIN' ? '+' : ''}R$ {bet.profitLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/40">
                          <td colSpan={5} className="px-6 pt-1 pb-5">
                            <TicketDetails bet={bet} />
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTickets.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-black uppercase italic">Nenhuma aposta encontrada.</div>
              ) : filteredTickets.map((bet) => {
                const label = ticketLabel(bet);
                const isExpanded = !!expandedTickets[bet.ticketId];
                return (
                <div key={bet.ticketId}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleTicket(bet.ticketId)}
                    className="w-full text-left px-4 py-4 space-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40 active:bg-slate-50/50 dark:active:bg-slate-800/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500 transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter line-clamp-1 break-all">
                          {label.title}
                        </span>
                        {label.extraMatches > 0 && (
                          <span className="shrink-0 text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            +{label.extraMatches}
                          </span>
                        )}
                      </div>
                      <ResultBadge result={bet.result} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Valor Apostado</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">R$ {bet.amountWagered.toFixed(2)}</p>
                      </div>
                      <div className="min-w-0">
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
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-slate-50/50 dark:bg-slate-950/40">
                      <div className="pt-3">
                        <TicketDetails bet={bet} />
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
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
