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
import { Game, DashboardSummary, Bankroll, DashboardLeagueGames } from '@/types/api';

// --- TYPES ---
interface StatCardProps { label: string; value: string; icon: React.ElementType; trend: string; type: 'neutral' | 'success' | 'danger'; }

const TeamLogo = ({ name }: { name: string }) => (
  <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-800/10 overflow-hidden shadow-sm">
    <span className="text-[10px] font-black text-slate-400">{name?.charAt(0) || '?'}</span>
  </div>
);

const StatCard = ({ label, value, icon: Icon, trend, type }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl border border-slate-800 shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg border border-slate-800/10">
        <Icon className="h-5 w-5 text-slate-800" />
      </div>
      <span className={cn(
        "text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-800",
        type === 'success' ? "bg-emerald-50 text-emerald-700" : 
        type === 'danger' ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"
      )}>
        {trend}
      </span>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

export default function Dashboard() {
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>([]);
  const [leaguesData, setLeaguesData] = useState<DashboardLeagueGames[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gamesByLeague, summaryData, bankrollsData] = await Promise.all([
          dashboardService.getGamesByLeague(),
          dashboardService.getSummary(),
          dashboardService.getBankrolls()
        ]);
        
        const validLeagues = Array.isArray(gamesByLeague) ? gamesByLeague : [];
        const validBankrolls = Array.isArray(bankrollsData) ? bankrollsData : [];
        
        setLeaguesData(validLeagues);
        setSummary(summaryData);
        setBankrolls(validBankrolls);
        
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
  }, []);

  const toggleLeague = (league: string) => setExpandedLeagues(prev => prev.includes(league) ? prev.filter(l => l !== league) : [...prev, league]);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date()).replace(/^\w/, (c) => c.toUpperCase());

  const winRate = summary?.dailyStats && summary.dailyStats.total > 0 
    ? Math.round((summary.dailyStats.won / summary.dailyStats.total) * 100) 
    : 0;

  const stats: StatCardProps[] = summary ? [
    { label: 'Saldo Total', value: `R$ ${(summary.totalBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, trend: 'N/A', type: 'neutral' },
    { label: 'Lucro (Mês)', value: `R$ ${(summary.monthlyProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, trend: `${summary.overallRoi || 0}% ROI`, type: (summary.monthlyProfit || 0) >= 0 ? 'success' : 'danger' },
    { label: 'Win Rate (Dia)', value: `${winRate}%`, icon: Percent, trend: `${summary.dailyStats.won}W / ${summary.dailyStats.lost}L`, type: 'neutral' },
    { label: 'Apostas (Dia)', value: (summary.dailyStats.total || 0).toString(), icon: Activity, trend: `${summary.dailyStats.pending} PEND`, type: 'neutral' },
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Visão Geral</h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 font-bold uppercase tracking-tighter">
            <Calendar className="h-4 w-4 text-indigo-600" />
            {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-800 rounded-lg text-xs font-black uppercase text-slate-900 shadow-sm flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Banca: R$ {summary?.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <button type="button" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm">
            Nova Aposta
          </button>
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
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Jogos do Dia</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            {leaguesData.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Nenhum jogo encontrado para hoje.</div>
            ) : leaguesData.map((leagueInfo, idx) => {
              const isExpanded = expandedLeagues.includes(leagueInfo.league);
              
              return (
                <div key={idx} className="border-b border-slate-800 last:border-0">
                  <div onClick={() => toggleLeague(leagueInfo.league)} className="bg-slate-50 px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-800/10">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liga:</span>
                      <span className="text-[11px] font-black text-slate-900">{leagueInfo.league}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-800" /> : <ChevronDown className="h-4 w-4 text-slate-800" />}
                  </div>

                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      {leagueInfo.matches.map((match) => (
                        <div key={match.match_id} className="flex items-center py-3.5 px-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                          <div className="w-14 flex flex-col items-start justify-center font-black">
                            {match.status === '1H' || match.status === '2H' || match.status === 'HT' ? (
                              <span className="text-[10px] text-rose-600 animate-pulse">AO VIVO ({match.status})</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                {new Date(match.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 flex items-center justify-center gap-6 px-4">
                            <div className="flex items-center justify-end gap-3 flex-1">
                              <span className="text-xs font-bold text-slate-900 text-right">{match.home}</span>
                              <TeamLogo name={match.home} />
                            </div>
                            <div className="flex items-center gap-2 min-w-[50px] justify-center bg-slate-900 px-2 py-1 rounded border border-slate-800 text-white shadow-sm">
                              <span className="text-xs font-black">{match.homeScore ?? '-'}</span>
                              <span className="text-slate-500 text-[10px] font-black">x</span>
                              <span className="text-xs font-black">{match.awayScore ?? '-'}</span>
                            </div>
                            <div className="flex items-center justify-start gap-3 flex-1">
                              <TeamLogo name={match.away} />
                              <span className="text-xs font-bold text-slate-900 text-left">{match.away}</span>
                            </div>
                          </div>
                          <div className="w-6 flex justify-end"><Star className="h-3 w-3 text-slate-200 group-hover:text-indigo-600 transition-colors" /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1">Status de Banca</h3>
          <div className="bg-white rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-800/10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Saldos por Casa</h4>
              <div className="space-y-2.5">
                {bankrolls.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">Nenhum saldo encontrado.</div>
                ) : bankrolls.map(br => (
                  <div key={br.id} className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">{br.provider}</span>
                    <span className="text-xs font-black text-slate-900">
                      R$ {br.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">ROI Geral</span>
                <span className={cn(
                  "text-xs font-black",
                  (summary?.overallRoi ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {summary?.overallRoi}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Win Rate (Dia)</span>
                <span className="text-xs font-black text-slate-900 underline decoration-indigo-600 decoration-2 underline-offset-4">
                  {winRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
