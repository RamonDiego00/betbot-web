"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Trophy, 
  PieChart, 
  TrendingUp, 
  Zap, 
  Lightbulb,
  ArrowUpRight,
  Target,
  LineChart,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { reportService } from '@/lib/api/services/report';
import { StrategyPerformance } from '@/types/api';

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
  const [performances, setPerformances] = useState<StrategyPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await reportService.getStrategyPerformance();
        setPerformances(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const topStrategies = [...performances].sort((a, b) => a.ranking - b.ranking).slice(0, 5);

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
        {/* BLOCO 1: Eficiência por Estratégia */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              ROI por Estratégia
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geral</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {performances.length === 0 ? (
                <div className="text-xs text-slate-500">Nenhuma estratégia encontrada.</div>
              ) : performances.map((stat, idx) => (
                <div key={idx} className="group cursor-default">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">{stat.strategyName}</span>
                    <span className={cn(
                      "text-xs font-black",
                      stat.roi >= 0 ? "text-emerald-700" : "text-rose-700"
                    )}>{stat.roi >= 0 ? '+' : ''}{stat.roi}% ROI</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", stat.roi >= 0 ? "bg-emerald-500" : "bg-rose-500")}
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
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Melhor Performance</h4>
              <div className="space-y-4">
                {topStrategies[0] && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-white border border-slate-800 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{topStrategies[0].strategyName}</p>
                      <p className="text-[10px] text-slate-500">ROI {topStrategies[0].roi}% com {topStrategies[0].winRate}% win rate</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white border border-slate-800 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Total de Apostas Analisadas</p>
                    <p className="text-[10px] text-slate-500">{performances.reduce((acc, p) => acc + p.totalBets, 0)} tickets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: Ranking de Estratégias */}
        <div className="bg-white p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking de Estratégias
          </h3>
          <div className="space-y-4">
            {topStrategies.map((strat) => (
              <div key={strat.strategyName} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-800 bg-white">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-300 w-4">#{strat.ranking}</span>
                  <span className="text-sm font-bold text-slate-700">{strat.strategyName}</span>
                </div>
                <span className={cn(
                  "text-xs font-black",
                  strat.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                )}>
                  {strat.profit >= 0 ? '+' : ''}R$ {strat.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 3: Eficiência de Win Rate */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-500" />
            Eficiência de Win Rate
          </h3>
          <div className="space-y-5 pt-2">
            {topStrategies.map((strat, idx) => (
              <PerformanceIndicator 
                key={idx} 
                label={strat.strategyName} 
                winRate={strat.winRate} 
                color={strat.winRate > 60 ? "text-emerald-700" : strat.winRate > 40 ? "text-indigo-700" : "text-amber-600"} 
              />
            ))}
          </div>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Melhor Estratégia:</span>
            <span className="text-xs font-black text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-800">{topStrategies[0]?.strategyName || 'N/A'}</span>
          </div>
        </div>

        {/* BLOCO 4: Retroalimentação (Insights para o Motor) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          {/* Background Decorativo */}
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
                  Sua melhor estratégia no momento é a <span className="text-emerald-700 font-black">{topStrategies[0]?.strategyName || 'N/A'}</span>. Considere aumentar a exposição nela.
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-rose-600 flex items-center gap-2 tracking-widest">
                  <TrendingUp className="h-3 w-3" /> Corte de Risco
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  Estratégias com Win Rate abaixo de 50% devem ter suas stakes revisadas para preservar a banca principal.
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Motor processando dados analíticos de {performances.reduce((acc, p) => acc + p.totalBets, 0)} apostas...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
