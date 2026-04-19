"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Percent, 
  ChevronDown,
  ChevronUp,
  Star,
  Activity,
  Calendar,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/lib/api/services/dashboard';
import { Game, SummaryKPIs, Bankroll } from '@/types/api';

// --- TYPES ---
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  type: 'neutral' | 'success' | 'danger';
}

// --- COMPONENTES AUXILIARES ---

const TeamLogo = ({ name }: { name: string }) => (
  <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
    <span className="text-[10px] font-bold text-slate-400">{name?.charAt(0) || '?'}</span>
  </div>
);

const StatCard = ({ label, value, icon: Icon, trend, type }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>
      <span className={cn(
        "text-xs font-semibold px-2 py-1 rounded-full",
        type === 'success' ? "bg-emerald-50 text-emerald-600" : 
        type === 'danger' ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"
      )}>
        {trend}
      </span>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

export default function Dashboard() {
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [summary, setSummary] = useState<SummaryKPIs | null>(null);
  const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gamesData, summaryData, bankrollsData] = await Promise.all([
          dashboardService.getTodayGames(),
          dashboardService.getSummary(),
          dashboardService.getBankrolls()
        ]);
        setGames(gamesData);
        setSummary(summaryData);
        setBankrolls(bankrollsData);
        
        // Expand leagues that have matches
        const leagues = Array.from(new Set(gamesData.map(g => g.league)));
        setExpandedLeagues(leagues);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleLeague = (league: string) => {
    setExpandedLeagues(prev => 
      prev.includes(league) ? prev.filter(l => l !== league) : [...prev, league]
    );
  };

  const gamesByLeague = games.reduce((acc, game) => {
    if (!acc[game.league]) {
      acc[game.league] = [];
    }
    acc[game.league].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  const stats: StatCardProps[] = summary ? [
    { label: 'Saldo Total', value: `R$ ${summary.currentBankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, trend: 'N/A', type: 'neutral' },
    { label: 'Lucro (Geral)', value: `R$ ${summary.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, trend: `${summary.roi}% ROI`, type: summary.totalProfit >= 0 ? 'success' : 'danger' },
    { label: 'Win Rate', value: `${summary.winRate}%`, icon: Percent, trend: 'N/A', type: 'neutral' },
    { label: 'Apostas Totais', value: summary.totalBets.toString(), icon: Activity, trend: 'N/A', type: 'neutral' },
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
      {/* Header do Dashboard */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }).format(new Date()).replace(/^\w/, (c) => c.toUpperCase())}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            Banca Atual: R$ {summary?.currentBankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-sm">
            Nova Aposta
          </button>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Jogos do Dia (Estilo Flashscore) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900">Jogos do Dia</h3>
            <div className="flex gap-2">
              <span className="text-xs font-medium text-slate-400">Filtrar por:</span>
              <button className="text-xs font-bold text-indigo-600">Minhas Ligas</button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {Object.keys(gamesByLeague).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Nenhum jogo encontrado para hoje.</div>
            ) : Object.entries(gamesByLeague).map(([league, leagueGames], idx) => {
              const isExpanded = expandedLeagues.includes(league);
              
              return (
                <div key={idx} className="border-b border-slate-100 last:border-0">
                  {/* Accordion Header */}
                  <div 
                    onClick={() => toggleLeague(league)}
                    className="bg-slate-50/80 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">{league}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>

                  {/* Match List */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-50">
                      {leagueGames.map((game) => (
                        <div key={game.id} className="flex items-center py-3 px-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                          {/* Time/Status */}
                          <div className="w-16 flex flex-col items-start justify-center">
                            {game.status === 'IN_PROGRESS' ? (
                              <span className="text-[11px] font-bold text-rose-600 animate-pulse">AO VIVO</span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-500">
                                {new Date(game.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          {/* Teams & Scores */}
                          <div className="flex-1 flex items-center justify-center gap-8 px-4">
                            {/* Home Team */}
                            <div className="flex items-center justify-end gap-3 flex-1">
                              <span className="text-sm font-semibold text-slate-900 text-right">{game.homeTeam}</span>
                              <TeamLogo name={game.homeTeam} />
                            </div>

                            {/* Score Central */}
                            <div className="flex items-center gap-2 min-w-[60px] justify-center bg-slate-50 px-3 py-1 rounded border border-slate-100 group-hover:bg-white transition-colors">
                              <span className={cn(
                                "text-sm font-black",
                                game.status === 'IN_PROGRESS' ? "text-rose-600" : "text-slate-900"
                              )}>-</span>
                              <span className="text-slate-300 text-[10px]">-</span>
                              <span className={cn(
                                "text-sm font-black",
                                game.status === 'IN_PROGRESS' ? "text-rose-600" : "text-slate-900"
                              )}>-</span>
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center justify-start gap-3 flex-1">
                              <TeamLogo name={game.awayTeam} />
                              <span className="text-sm font-semibold text-slate-900 text-left">{game.awayTeam}</span>
                            </div>
                          </div>

                          {/* Action Icon */}
                          <div className="w-8 flex justify-end">
                            <Star className="h-3.5 w-3.5 text-slate-200 group-hover:text-slate-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Banca & Performance */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Banca & Saldos
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-3">Saldos por Casa</h4>
              <div className="space-y-2.5">
                {bankrolls.length === 0 ? (
                  <div className="text-xs text-slate-500">Nenhum saldo encontrado.</div>
                ) : bankrolls.map(br => (
                  <div key={br.id} className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">{br.platform}</span>
                    <span className="text-xs font-black text-slate-900">
                      {br.currency} {br.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">ROI Geral</span>
                <span className={cn(
                  "text-xs font-bold",
                  (summary?.roi ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {summary?.roi}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
