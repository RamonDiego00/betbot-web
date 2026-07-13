"use client";

import React, { useEffect, useState } from 'react';
import { ListChecks, Loader2, Layers, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { automationService } from '@/lib/api/services/automation';
import { BetWorkerJsonResponse, WorkerBetTicket } from '@/types/api';

const CategoryBadge = ({ category }: { category: WorkerBetTicket['category'] }) => {
  const styles = {
    SAFE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    RISKY: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const labels = {
    SAFE: "Segura",
    MEDIUM: "Moderada",
    RISKY: "Arriscada",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", styles[category])}>
      {labels[category]}
    </span>
  );
};

export default function ApostasDoDia() {
  const [dailyBets, setDailyBets] = useState<BetWorkerJsonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await automationService.getDailyBets();
        setDailyBets(data);
      } catch (error) {
        console.error('Error fetching daily bets:', error);
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

  const tickets = dailyBets?.tickets ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Apostas do Dia</h2>
        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 font-bold uppercase tracking-tighter">
          <ListChecks className="h-4 w-4 text-indigo-600" />
          Leitura completa de todos os tickets gerados hoje
        </p>
      </header>

      {tickets.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-800 shadow-sm p-12 text-center">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Nenhuma aposta gerada hoje</p>
        </div>
      )}

      <div className="space-y-6">
        {tickets.map((ticket) => (
          <div key={ticket.ticket_id} className="bg-white rounded-xl border border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CategoryBadge category={ticket.category} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {ticket.type === 'SINGLE' ? 'Aposta Simples' : 'Aposta Múltipla'}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stake</p>
                  <p className="text-sm font-black text-slate-900">R$ {ticket.stake.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Odd Total</p>
                  <p className="text-sm font-black text-indigo-600">{ticket.total_odd.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {ticket.matches.map((match) => (
                <div key={match.match_id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-indigo-500" />
                    {match.match_name}
                  </h4>

                  <div className="space-y-3 pl-1">
                    {match.markets.map((market, mIdx) => (
                      <div key={`${match.match_id}-${mIdx}`} className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Layers className="h-3 w-3" />
                          {market.market_name}
                        </p>
                        <ul className="space-y-1 pl-4">
                          {market.selections.map((selection, sIdx) => (
                            <li key={`${match.match_id}-${mIdx}-${sIdx}`} className="text-xs font-bold text-slate-700">
                              {selection.description}
                              {selection.period && (
                                <span className="text-slate-400 font-semibold"> · {selection.period}</span>
                              )}
                              {selection.team_filter && (
                                <span className="text-slate-400 font-semibold"> · {selection.team_filter}</span>
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
    </div>
  );
}
