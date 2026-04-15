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
  id: number;
  home: string;
  away: string;
  time: string;
  status: 'not_started' | 'live';
  minute?: string;
  scoreHome: string;
  scoreAway: string;
}

interface LeagueGroup {
  league: string;
  country: string;
  matches: Match[];
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  type: 'neutral' | 'success' | 'danger';
}

// --- MOCK DATA ---
const FINANCIAL_STATS: StatCardProps[] = [
  { label: 'Saldo Total', value: 'R$ 15.240,00', icon: Wallet, trend: '+2.5%', type: 'neutral' },
  { label: 'Lucro (Mês)', value: 'R$ 2.450,00', icon: TrendingUp, trend: '+12%', type: 'success' },
  { label: 'Perdas (Mês)', value: 'R$ 840,00', icon: TrendingDown, trend: '-5%', type: 'danger' },
  { label: 'ROI (Geral)', value: '18.4%', icon: Percent, trend: '+1.2%', type: 'success' },
];

const MATCHES_OF_THE_DAY: LeagueGroup[] = [
  {
    league: 'Champions League',
    country: 'Europa',
    matches: [
      { id: 1, home: 'Real Madrid', away: 'Man. City', time: '16:00', status: 'not_started', scoreHome: '-', scoreAway: '-' },
      { id: 2, home: 'Bayern Munich', away: 'Arsenal', time: '16:00', status: 'not_started', scoreHome: '-', scoreAway: '-' },
    ]
  },
  {
    league: 'Premier League',
    country: 'Inglaterra',
    matches: [
      { id: 3, home: 'Liverpool', away: 'Chelsea', time: '14:30', status: 'live', minute: '34', scoreHome: '1', scoreAway: '0' },
    ]
  },
  {
    league: 'Brasileirão Serie A',
    country: 'Brasil',
    matches: [
      { id: 4, home: 'Flamengo', away: 'Palmeiras', time: '21:30', status: 'not_started', scoreHome: '-', scoreAway: '-' },
      { id: 5, home: 'São Paulo', away: 'Corinthians', time: '16:00', status: 'not_started', scoreHome: '-', scoreAway: '-' },
    ]
  }
];

// --- COMPONENTES AUXILIARES ---

const TeamLogo = ({ name }: { name: string }) => (
  <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
    <span className="text-[10px] font-bold text-slate-400">{name.charAt(0)}</span>
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
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>(['Champions League', 'Premier League', 'Brasileirão Serie A']);

  const toggleLeague = (league: string) => {
    setExpandedLeagues(prev => 
      prev.includes(league) ? prev.filter(l => l !== league) : [...prev, league]
    );
  };

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
            Banca Atual: R$ 10.000,00
          </div>
          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-sm">
            Nova Aposta
          </button>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {FINANCIAL_STATS.map((stat, idx) => (
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
            {MATCHES_OF_THE_DAY.map((group, idx) => {
              const isExpanded = expandedLeagues.includes(group.league);
              
              return (
                <div key={idx} className="border-b border-slate-100 last:border-0">
                  {/* Accordion Header */}
                  <div 
                    onClick={() => toggleLeague(group.league)}
                    className="bg-slate-50/80 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{group.country}:</span>
                      <span className="text-xs font-bold text-slate-700">{group.league}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>

                  {/* Match List */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-50">
                      {group.matches.map((match) => (
                        <div key={match.id} className="flex items-center py-3 px-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                          {/* Time/Status */}
                          <div className="w-16 flex flex-col items-start justify-center">
                            {match.status === 'live' ? (
                              <span className="text-[11px] font-bold text-rose-600 animate-pulse">{match.minute}&apos;</span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-500">{match.time}</span>
                            )}
                          </div>

                          {/* Teams & Scores */}
                          <div className="flex-1 flex items-center justify-center gap-8 px-4">
                            {/* Home Team */}
                            <div className="flex items-center justify-end gap-3 flex-1">
                              <span className="text-sm font-semibold text-slate-900 text-right">{match.home}</span>
                              <TeamLogo name={match.home} />
                            </div>

                            {/* Score Central */}
                            <div className="flex items-center gap-2 min-w-[60px] justify-center bg-slate-50 px-3 py-1 rounded border border-slate-100 group-hover:bg-white transition-colors">
                              <span className={cn(
                                "text-sm font-black",
                                match.status === 'live' ? "text-rose-600" : "text-slate-900"
                              )}>{match.scoreHome}</span>
                              <span className="text-slate-300 text-[10px]">-</span>
                              <span className={cn(
                                "text-sm font-black",
                                match.status === 'live' ? "text-rose-600" : "text-slate-900"
                              )}>{match.scoreAway}</span>
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center justify-start gap-3 flex-1">
                              <TeamLogo name={match.away} />
                              <span className="text-sm font-semibold text-slate-900 text-left">{match.away}</span>
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
            Performance Hoje
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Apostas do Dia</span>
                <span className="font-bold text-slate-900">12</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: '50%' }} title="Won" />
                <div className="bg-rose-500 h-full" style={{ width: '16%' }} title="Lost" />
                <div className="bg-slate-300 h-full" style={{ width: '34%' }} title="Pending" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Green</div>
                  <div className="text-xs font-bold text-emerald-600">6</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Red</div>
                  <div className="text-xs font-bold text-rose-600">2</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Pendente</div>
                  <div className="text-xs font-bold text-slate-600">4</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Stake Média</span>
                <span className="text-xs font-bold text-indigo-600 underline decoration-indigo-200 underline-offset-4">R$ 150,00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">ROI Hoje</span>
                <span className="text-xs font-bold text-emerald-600">+4.2%</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-3">Saldos por Casa</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">Bet365</span>
                  <span className="text-xs font-black text-slate-900">R$ 5.430</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">Pinnacle</span>
                  <span className="text-xs font-black text-slate-900">R$ 8.210</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">Betfair</span>
                  <span className="text-xs font-black text-slate-900">R$ 1.600</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
