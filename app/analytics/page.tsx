"use client";

import React from 'react';
import { 
  BarChart3, 
  Trophy, 
  PieChart, 
  TrendingUp, 
  Zap, 
  Lightbulb,
  ArrowUpRight,
  Target,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- TYPES ---
interface MarketStat {
  market: string;
  roi: string;
  profit: string;
  winRate: number;
}

interface LeagueStat {
  league: string;
  profit: string;
  status: 'positive' | 'negative';
  rank: number;
}

interface OddsRange {
  range: string;
  winRate: number;
  totalBets: number;
}

// --- MOCK DATA PARA FEEDBACK ---
const MARKET_STATS: MarketStat[] = [
  { market: 'Match Result (ML)', roi: '+12.5%', profit: 'R$ 1.250', winRate: 68 },
  { market: 'Over 2.5 Gols', roi: '+8.2%', profit: 'R$ 840', winRate: 62 },
  { market: 'AH +0.5 (Dupla Hipótese)', roi: '+15.4%', profit: 'R$ 1.540', winRate: 74 },
  { market: 'Ambos Marcam (BTTS)', roi: '-2.1%', profit: '-R$ 210', winRate: 48 },
];

const TOP_LEAGUES: LeagueStat[] = [
  { league: 'Premier League', profit: '+R$ 2.450', status: 'positive', rank: 1 },
  { league: 'Champions League', profit: '+R$ 1.840', status: 'positive', rank: 2 },
  { league: 'Brasileirão Serie A', profit: '+R$ 1.200', status: 'positive', rank: 3 },
  { league: 'Bundesliga', profit: '-R$ 420', status: 'negative', rank: 4 },
];

const ODDS_EFFICIENCY: OddsRange[] = [
  { range: '1.20 - 1.50', winRate: 82, totalBets: 340 },
  { range: '1.51 - 1.80', winRate: 64, totalBets: 480 },
  { range: '1.81 - 2.20', winRate: 54, totalBets: 290 },
  { range: '2.21+', winRate: 32, totalBets: 138 },
];

// --- COMPONENTES AUXILIARES ---

const PerformanceIndicator = ({ label, winRate, color }: { label: string, winRate: number, color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[10px] md:text-xs">
      <span className="font-bold text-slate-700 uppercase tracking-wider">{label}</span>
      <span className={cn("font-black", color)}>{winRate}% Win Rate</span>
    </div>
    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-50">
      <div 
        className={cn("h-full transition-all duration-1000", 
          color.includes('emerald') ? "bg-emerald-500" : 
          color.includes('indigo') ? "bg-indigo-500" : "bg-amber-500"
        )} 
        style={{ width: `${winRate}%` }} 
      />
    </div>
  </div>
);

export default function Analytics() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Analytics Estratégico</h2>
          <p className="text-slate-500 mt-1 font-medium">Dados consolidados para retroalimentar seu motor de apostas.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
            <Zap className="h-4 w-4" /> Aplicar Ajustes no Motor
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 1: Eficiência por Mercado */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              ROI por Mercado
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Últimos 30 Dias</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {MARKET_STATS.map((stat, idx) => (
                <div key={idx} className="group cursor-default">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">{stat.market}</span>
                    <span className={cn(
                      "text-xs font-black",
                      stat.roi.startsWith('+') ? "text-emerald-700" : "text-rose-700"
                    )}>{stat.roi} ROI</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", stat.roi.startsWith('+') ? "bg-emerald-500" : "bg-rose-500")}
                        style={{ width: `${stat.winRate}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 min-w-[30px]">{stat.winRate}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Resumo Rápido (Stats Card Interno) */}
            <div className="bg-white p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Padrão de Lucro</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white border border-slate-800 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">AH +0.5 é sua linha ideal</p>
                    <p className="text-[10px] text-slate-500">ROI 15.4% com 74% win rate</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white border border-slate-800 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Ticket Médio: R$ 142,00</p>
                    <p className="text-[10px] text-slate-500">Estabilidade alta no mercado ML</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: Top Ligas (Ranking) */}
        <div className="bg-white p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Performance por Liga
          </h3>
          <div className="space-y-4">
            {TOP_LEAGUES.map((league) => (
              <div key={league.rank} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-800 bg-white">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-300 w-4">#{league.rank}</span>
                  <span className="text-sm font-bold text-slate-700">{league.league}</span>
                </div>
                <span className={cn(
                  "text-xs font-black",
                  league.status === 'positive' ? "text-emerald-700" : "text-rose-700"
                )}>
                  {league.profit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 3: Distribuição por Range de Odds */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-500" />
            Eficiência por Odds
          </h3>
          <div className="space-y-5 pt-2">
            {ODDS_EFFICIENCY.map((range, idx) => (
              <PerformanceIndicator 
                key={idx} 
                label={range.range} 
                winRate={range.winRate} 
                color={range.winRate > 60 ? "text-emerald-700" : range.winRate > 40 ? "text-indigo-700" : "text-amber-600"} 
              />
            ))}
          </div>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foco Recomendado:</span>
            <span className="text-xs font-black text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-800">Range 1.51 - 1.80</span>
          </div>
        </div>

        {/* BLOCO 4: Retroalimentação (Insights para o Motor) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          {/* Background Decorativo - Suave para manter consistência */}
          <LineChart className="absolute -right-8 -bottom-8 h-48 w-48 text-slate-100 -rotate-12 pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-800">
                <Lightbulb className="h-6 w-6 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight italic text-slate-900 uppercase">Insights para Retroalimentação</h3>
                <p className="text-slate-500 text-xs">Ajustes sugeridos para o seu motor de geração de apostas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2 tracking-widest">
                  <ArrowUpRight className="h-3 w-3" /> Otimizar Filtros
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  Priorizar entradas no mercado <span className="text-emerald-700 font-black">AH +0.5</span> em ligas de elite (Premier League) onde o Win Rate ultrapassa 74%.
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-rose-600 flex items-center gap-2 tracking-widest">
                  <TrendingUp className="h-3 w-3" /> Corte de Risco
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  Reduzir a stake em 50% para o mercado <span className="text-rose-700 font-black">Ambos Marcam</span> até que a taxa de acerto retorne para o range de 55%.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-slate-800 bg-white flex items-center justify-center text-[8px] font-bold text-slate-900">
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Motor processando 1.248 pontos de dados...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
