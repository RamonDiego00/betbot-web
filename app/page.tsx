"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Wallet,
  Percent,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Activity,
  Calendar,
  Loader2,
  Layers,
  Target
} from 'lucide-react';
import { cn, formatPeriodRangeLabel, resolvePeriodRangeForDisplay, type PeriodPreset } from '@/lib/utils';
import { dashboardService } from '@/lib/api/services/dashboard';
import { automationService } from '@/lib/api/services/automation';
import { DashboardSummary, DashboardLeagueGames, BetWorkerJsonResponse, WorkerBetTicket } from '@/types/api';

// --- TYPES ---
interface StatCardProps { label: string; value: string; icon: React.ElementType; trend: string; type: 'neutral' | 'success' | 'danger'; }

const TeamLogo = ({ name, logoUrl }: { name: string; logoUrl?: string }) => {
  const [errored, setErrored] = useState(false);
  return (
    <div className="h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm shrink-0">
      {logoUrl && !errored ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-contain" onError={() => setErrored(true)} />
      ) : (
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{name?.charAt(0) || '?'}</span>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, type }: StatCardProps) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <Icon className="h-5 w-5 text-slate-800 dark:text-slate-200" />
      </div>
      <span className={cn(
        "text-[10px] font-black px-2 py-0.5 rounded-full border",
        type === 'success' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : 
        type === 'danger' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" : 
        "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
      )}>
        {trend}
      </span>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</h3>
    </div>
  </div>
);

const CategoryBadge = ({ category }: { category: WorkerBetTicket['category'] }) => {
  const styles = {
    SAFE: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    MEDIUM: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    RISKY: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  };
  const labels = {
    SAFE: "Segura",
    MEDIUM: "Moderada",
    RISKY: "Arriscada",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", styles[category])}>
      {labels[category]}
    </span>
  );
};

export default function Dashboard() {
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>([]);
  const [leaguesData, setLeaguesData] = useState<DashboardLeagueGames[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dailyBets, setDailyBets] = useState<BetWorkerJsonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('daily');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [rangeDraft, setRangeDraft] = useState({ start: '', end: '' });
  const [showRangePicker, setShowRangePicker] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const summaryParams = customRange
          ? { period: 'custom', startDate: customRange.start, endDate: customRange.end }
          : { period: periodPreset };

        const [gamesByLeague, summaryData, dailyBetsData] = await Promise.all([
          dashboardService.getGamesByLeague(),
          dashboardService.getSummary(summaryParams),
          automationService.getDailyBets().catch(() => null)
        ]);

        const validLeagues = Array.isArray(gamesByLeague) ? gamesByLeague : [];

        setLeaguesData(validLeagues);
        setSummary(summaryData);
        setDailyBets(dailyBetsData);

        // Expand leagues that have matches
        const leagues = validLeagues.map(l => l.league);
        setExpandedLeagues(leagues);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [periodPreset, customRange]);

  const toggleLeague = (league: string) => setExpandedLeagues(prev => prev.includes(league) ? prev.filter(l => l !== league) : [...prev, league]);

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

  const periodLabel = customRange
    ? 'Personalizado'
    : periodPreset === 'weekly'
      ? 'Semana'
      : periodPreset === 'monthly'
        ? 'Mês'
        : periodPreset === 'yesterday'
          ? 'Ontem'
          : 'Dia';

  const displayRange = resolvePeriodRangeForDisplay(periodPreset, customRange);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date()).replace(/^\w/, (c) => c.toUpperCase());

  const winRate = summary?.dailyStats && summary.dailyStats.total > 0
    ? Math.round((summary.dailyStats.won / summary.dailyStats.total) * 100)
    : 0;

  const dailyTickets = dailyBets?.tickets ?? [];

  const stats: StatCardProps[] = summary ? [
    { label: 'Saldo Total', value: `R$ ${(summary.totalBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, trend: 'N/A', type: 'neutral' },
    { label: `Lucro (${periodLabel})`, value: `R$ ${(summary.monthlyProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, trend: `${(summary.overallRoi || 0).toFixed(2)}% ROI`, type: (summary.monthlyProfit || 0) >= 0 ? 'success' : 'danger' },
    { label: `Win Rate (${periodLabel})`, value: `${winRate}%`, icon: Percent, trend: `${summary.dailyStats.won}W / ${summary.dailyStats.lost}L`, type: 'neutral' },
    { label: `Apostas (${periodLabel})`, value: (summary.dailyStats.total || 0).toString(), icon: Activity, trend: `${summary.dailyStats.pending} PEND`, type: 'neutral' },
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Visão Geral</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-bold uppercase tracking-tighter">
            <Calendar className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Jogos do Dia</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {leaguesData.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Nenhum jogo encontrado para hoje.</div>
            ) : leaguesData.map((leagueInfo, idx) => {
              const isExpanded = expandedLeagues.includes(leagueInfo.league);
              
              return (
                <div key={idx} className="border-b border-slate-200 dark:border-slate-800 last:border-0">
                  <div onClick={() => toggleLeague(leagueInfo.league)} className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-200/10 dark:border-slate-800/20">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Liga:</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">{leagueInfo.league}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-800 dark:text-slate-200" /> : <ChevronDown className="h-4 w-4 text-slate-800 dark:text-slate-200" />}
                  </div>

                  {isExpanded && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {leagueInfo.matches.map((match) => (
                        <Link
                          key={match.match_id}
                          href={`/confronto/${match.match_id}`}
                          className="flex items-center py-3.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group"
                        >
                          <div className="w-14 shrink-0 flex flex-col items-start justify-center font-black">
                            {match.status === '1H' || match.status === '2H' || match.status === 'HT' ? (
                              <span className="text-[10px] text-rose-600 animate-pulse">AO VIVO ({match.status})</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {new Date(match.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-center gap-2 sm:gap-6 px-4">
                            <div className="min-w-0 flex items-center justify-end gap-1.5 sm:gap-3 flex-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 text-right truncate">{match.home}</span>
                              <TeamLogo name={match.home} logoUrl={match.homeTeamLogo} />
                            </div>
                            <div className="shrink-0 flex items-center gap-2 min-w-[50px] justify-center bg-slate-900 dark:bg-slate-950 px-2 py-1 rounded border border-slate-800 dark:border-slate-700 text-white shadow-sm">
                              <span className="text-xs font-black">{match.homeScore ?? '-'}</span>
                              <span className="text-slate-500 text-[10px] font-black">x</span>
                              <span className="text-xs font-black">{match.awayScore ?? '-'}</span>
                            </div>
                            <div className="min-w-0 flex items-center justify-start gap-1.5 sm:gap-3 flex-1">
                              <TeamLogo name={match.away} logoUrl={match.awayTeamLogo} />
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 text-left truncate">{match.away}</span>
                            </div>
                          </div>
                          <div className="w-6 shrink-0 flex justify-end"><ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" /></div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest px-1">Apostas do Dia</h3>

          {dailyTickets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">Nenhuma aposta gerada hoje</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyTickets.map((ticket) => (
                <div key={ticket.ticket_id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <CategoryBadge category={ticket.category} />
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {ticket.type === 'SINGLE' ? 'Aposta Simples' : 'Aposta Múltipla'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stake</p>
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100">R$ {ticket.stake.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Odd Total</p>
                        <p className="text-xs font-black text-brand-600 dark:text-brand-400">{ticket.total_odd.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {ticket.matches.map((match) => (
                      <div key={match.match_id} className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3 space-y-2">
                        <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                          <Target className="h-3 w-3 text-brand-500 dark:text-brand-400 shrink-0" />
                          {match.match_name}
                        </h4>

                        <div className="space-y-2 pl-1">
                          {match.markets.map((market, mIdx) => (
                            <div key={`${match.match_id}-${mIdx}`} className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Layers className="h-2.5 w-2.5 shrink-0" />
                                {market.market_name}
                              </p>
                              <ul className="space-y-0.5 pl-3.5">
                                {market.selections.map((selection, sIdx) => (
                                  <li key={`${match.match_id}-${mIdx}-${sIdx}`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    {selection.description}
                                    {selection.period && (
                                      <span className="text-slate-400 dark:text-slate-500 font-semibold"> · {selection.period}</span>
                                    )}
                                    {selection.team_filter && (
                                      <span className="text-slate-400 dark:text-slate-500 font-semibold"> · {selection.team_filter}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
