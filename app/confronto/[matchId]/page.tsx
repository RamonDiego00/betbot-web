"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Target, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { matchService } from '@/lib/api/services/match';
import { MatchDetail, MatchInsights, RecentFormEntry, TeamInsights } from '@/types/api';

const ARCHETYPE_LABELS: Record<string, string> = {
  HIGH_PRESSURE: 'Alta Pressão',
  MEDIUM_PRESSURE: 'Pressão Média',
  LOW_PRESSURE: 'Baixa Pressão',
  SLOW_GAME: 'Jogo Travado',
  TRANSITION: 'Transição',
};

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

function formatOdd(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
}

const ResultBadge = ({ won, status }: { won: boolean | null; status: string | null }) => {
  const isPending = won === null && (!status || status.toUpperCase() === 'PENDING');
  const label = isPending ? 'Pendente' : won ? 'Win' : 'Loss';
  const styles = isPending
    ? "text-amber-600 dark:text-amber-400"
    : won
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-rose-700 dark:text-rose-400";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm",
      styles
    )}>
      {isPending ? <Clock className="h-3 w-3" /> : won ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {label}
    </span>
  );
};

const FORM_RESULT_STYLES: Record<RecentFormEntry['result'], string> = {
  W: 'bg-emerald-500 dark:bg-emerald-400 text-white',
  L: 'bg-rose-500 dark:bg-rose-400 text-white',
  D: 'bg-slate-400 dark:bg-slate-600 text-white',
};

const TeamInsightsCard = ({ team, fallbackName }: { team: TeamInsights; fallbackName: string }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">
      {team.teamName ?? fallbackName}
    </h4>
    <div>
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
        Últimos 5 (liga)
      </p>
      {team.recentForm.length === 0 ? (
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">Sem dados recentes</p>
      ) : (
        <div className="flex items-center gap-1.5">
          {team.recentForm.map((entry) => (
            <span
              key={entry.fixtureId}
              title={`${entry.opponentName} (${entry.teamScore ?? '-'} x ${entry.opponentScore ?? '-'})`}
              className={cn(
                "h-6 w-6 flex items-center justify-center rounded-full text-[10px] font-black uppercase",
                FORM_RESULT_STYLES[entry.result]
              )}
            >
              {entry.result}
            </span>
          ))}
        </div>
      )}
    </div>
    {team.averages && (
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gols Pró</p>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{team.averages.goalsForAverage.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gols Contra</p>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{team.averages.goalsAgainstAverage.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Escanteios</p>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{team.averages.cornersAverage.toFixed(2)}</p>
        </div>
      </div>
    )}
  </div>
);

export default function ConfrontoDetalhe() {
  const params = useParams();
  const router = useRouter();
  const matchIdParam = Array.isArray(params?.matchId) ? params.matchId[0] : params?.matchId;
  const fixtureId = matchIdParam ? Number(matchIdParam) : NaN;

  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [insights, setInsights] = useState<MatchInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(false);

  useEffect(() => {
    if (!fixtureId || Number.isNaN(fixtureId)) {
      setLoading(false);
      setError(true);
      return;
    }
    async function fetchDetail() {
      try {
        const data = await matchService.getMatchDetail(fixtureId);
        setDetail(data);
      } catch (err) {
        console.error('Error fetching match detail:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [fixtureId]);

  useEffect(() => {
    if (!fixtureId || Number.isNaN(fixtureId)) {
      setInsightsLoading(false);
      setInsightsError(true);
      return;
    }
    async function fetchInsights() {
      try {
        const data = await matchService.getMatchInsights(fixtureId);
        setInsights(data);
      } catch (err) {
        console.error('Error fetching match insights:', err);
        setInsightsError(true);
      } finally {
        setInsightsLoading(false);
      }
    }
    fetchInsights();
  }, [fixtureId]);

  const archetypeLabel = detail?.archetype ? (ARCHETYPE_LABELS[detail.archetype] ?? detail.archetype) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Confronto</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-tighter">Detalhe do jogo e apostas geradas</p>
        </div>
      </header>

      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error || !detail ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">
            Não foi possível carregar os dados deste confronto.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Fixture</p>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">#{detail.fixtureId}</p>
            </div>
            {archetypeLabel ? (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800">
                  {archetypeLabel}
                </span>
                {detail.archetypeConfidence !== null && (
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Confiança: {(detail.archetypeConfidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                Arquétipo não classificado
              </span>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest px-1">Apostas Geradas</h3>

            {detail.legs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">
                  Nenhuma aposta gerada para este confronto
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {detail.legs.map((leg, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5 min-w-0">
                        <Target className="h-3 w-3 text-brand-500 dark:text-brand-400 shrink-0" />
                        <span className="truncate">{leg.market ?? 'Mercado desconhecido'}</span>
                      </h4>
                      <ResultBadge won={leg.won} status={leg.status} />
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {leg.selection ?? '-'}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Odd</p>
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{formatOdd(leg.odds)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Prob. Modelo</p>
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{formatPercent(leg.modelProb)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Odd Justa</p>
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{formatOdd(leg.fairOdd)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Edge</p>
                          <p className={cn(
                            "text-xs font-black",
                            leg.edge !== null && leg.edge >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                          )}>
                            {formatPercent(leg.edge)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest px-1">Visão Estratégica</h3>

            {insightsLoading ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : insightsError || !insights ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">
                  Não foi possível carregar a visão estratégica deste confronto.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TeamInsightsCard team={insights.homeTeam} fallbackName="Casa" />
                  <TeamInsightsCard team={insights.awayTeam} fallbackName="Fora" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {insights.markets.map((market) => (
                    <div
                      key={market.marketType}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">
                          {market.marketLabel}
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {market.selections.length === 0 ? (
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">Odds indisponíveis</p>
                        ) : (
                          market.selections.map((sel, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                {sel.selection}
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100 shrink-0">
                                {sel.odd.toFixed(2)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
