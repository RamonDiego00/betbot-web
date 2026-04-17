"use client";

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Percent, 
  ChevronDown,
  ChevronUp,
  Star,
  Activity,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- TYPES ---
interface Match {
  id: number; home: string; away: string; time: string; status: 'not_started' | 'live';
  minute?: string; scoreHome: string; scoreAway: string;
}
interface LeagueGroup { league: string; country: string; matches: Match[]; }
interface StatCardProps { label: string; value: string; icon: React.ElementType; trend: string; type: 'neutral' | 'success' | 'danger'; }

// --- MOCK DATA ---
const FINANCIAL_STATS: StatCardProps[] = [
  { label: 'Saldo Total', value: 'R$ 15.240,00', icon: Wallet, trend: '+2.5%', type: 'neutral' },
  { label: 'Lucro (Mês)', value: 'R$ 2.450,00', icon: TrendingUp, trend: '+12%', type: 'success' },
  { label: 'Perdas (Mês)', value: 'R$ 840,00', icon: TrendingDown, trend: '-5%', type: 'danger' },
  { label: 'ROI (Geral)', value: '18.4%', icon: Percent, trend: '+1.2%', type: 'success' },
];

const MATCHES_OF_THE_DAY: LeagueGroup[] = [
  {
    league: 'Champions League', country: 'Europa',
    matches: [
      { id: 1, home: 'Real Madrid', away: 'Man. City', time: '16:00', status: 'not_started', scoreHome: '-', scoreAway: '-' },
      { id: 2, home: 'Bayern Munich', away: 'Arsenal', time: '16:00', status: 'not_started', scoreHome: '-', scoreAway: '-' },
    ]
  },
  {
    league: 'Premier League', country: 'Inglaterra',
    matches: [{ id: 3, home: 'Liverpool', away: 'Chelsea', time: '14:30', status: 'live', minute: '34', scoreHome: '1', scoreAway: '0' }]
  },
  {
    league: 'Brasileirão Serie A', country: 'Brasil',
    matches: [
      { id: 4, home: 'Flamengo', away: 'Palmeiras', time: '21:30', status: 'not_started', scoreHome: '-', scoreAway: '-' },
      { id: 5, home: 'São Paulo', away: 'Corinthians', time: '16:00', status: 'not_started', scoreHome: '-', scoreAway: '-' },
    ]
  }
];

const TeamLogo = ({ name }: { name: string }) => (
  <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-800/10 overflow-hidden">
    <span className="text-[10px] font-black text-slate-400">{name.charAt(0)}</span>
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
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>(['Champions League', 'Premier League', 'Brasileirão Serie A']);
  const toggleLeague = (league: string) => setExpandedLeagues(prev => prev.includes(league) ? prev.filter(l => l !== league) : [...prev, league]);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date()).replace(/^\w/, (c) => c.toUpperCase());

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
            Banca: R$ 10.000,00
          </div>
          <button type="button" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm">
            Nova Aposta
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {FINANCIAL_STATS.map((stat, idx) => <StatCard key={idx} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Jogos do Dia</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            {MATCHES_OF_THE_DAY.map((group, idx) => {
              const isExpanded = expandedLeagues.includes(group.league);
              return (
                <div key={idx} className="border-b border-slate-800 last:border-0">
                  <div onClick={() => toggleLeague(group.league)} className="bg-slate-50 px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-800/10">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.country}:</span>
                      <span className="text-[11px] font-black text-slate-900">{group.league}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-800" /> : <ChevronDown className="h-4 w-4 text-slate-800" />}
                  </div>

                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      {group.matches.map((match) => (
                        <div key={match.id} className="flex items-center py-3.5 px-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                          <div className="w-14 flex flex-col items-start justify-center font-black">
                            {match.status === 'live' ? <span className="text-[10px] text-rose-600 animate-pulse">{match.minute}'</span> : <span className="text-[10px] text-slate-400">{match.time}</span>}
                          </div>
                          <div className="flex-1 flex items-center justify-center gap-6 px-4">
                            <div className="flex items-center justify-end gap-3 flex-1">
                              <span className="text-xs font-bold text-slate-900 text-right">{match.home}</span>
                              <TeamLogo name={match.home} />
                            </div>
                            <div className="flex items-center gap-2 min-w-[50px] justify-center bg-slate-900 px-2 py-1 rounded border border-slate-800 text-white shadow-sm">
                              <span className="text-xs font-black">{match.scoreHome}</span>
                              <span className="text-slate-500 text-[10px] font-black">-</span>
                              <span className="text-xs font-black">{match.scoreAway}</span>
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
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1">Status Diário</h3>
          <div className="bg-white rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                <span>Total Hoje</span>
                <span className="text-slate-900">12 Apostas</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex border border-slate-800/10">
                <div className="bg-emerald-500 h-full" style={{ width: '50%' }} />
                <div className="bg-rose-500 h-full" style={{ width: '16%' }} />
                <div className="bg-slate-300 h-full" style={{ width: '34%' }} />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center border-r border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase">Win</p><p className="text-xs font-black text-emerald-600">6</p></div>
                <div className="text-center border-r border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase">Loss</p><p className="text-xs font-black text-rose-600">2</p></div>
                <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase">Pend.</p><p className="text-xs font-black text-slate-900">4</p></div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800/10 space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Stake</span><span className="text-xs font-black text-slate-900 underline decoration-indigo-600 decoration-2 underline-offset-4">R$ 150,00</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">ROI</span><span className="text-xs font-black text-emerald-600">+4.2%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
