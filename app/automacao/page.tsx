"use client";

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Smartphone, 
  Activity, 
  ShieldCheck, 
  Terminal, 
  ListOrdered, 
  Play, 
  Pause, 
  RotateCcw,
  Clock,
  Zap,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { automationService } from '@/lib/api/services/automation';
import { Machine, BetWorkerJsonResponse } from '@/types/api';

// --- TYPES ---
interface LogEntry {
  id: number;
  time: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

const LIVE_LOGS: LogEntry[] = [
  { id: 1, time: '16:02:11', level: 'info', message: 'Recebido JSON do backend: TX-9021' },
  { id: 2, time: '16:02:15', level: 'info', message: 'Iniciando Maestro: flow.yaml' },
  { id: 3, time: '16:02:20', level: 'info', message: 'Chrome aberto com sucesso' },
  { id: 4, time: '16:02:45', level: 'success', message: 'Login efetuado na Bet365' },
  { id: 5, time: '16:03:10', level: 'info', message: 'Navegando para o confronto: Real Madrid vs Man. City' },
  { id: 6, time: '16:03:30', level: 'warn', message: 'Odds variando: Tentativa 2 de 3' },
];

// --- COMPONENTES AUXILIARES ---

const StatusBadge = ({ status }: { status: 'pending' | 'executing' | 'completed' | 'failed' }) => {
  const styles = {
    pending: "bg-slate-50 text-slate-500 border-slate-800/10",
    executing: "bg-indigo-50 text-indigo-600 animate-pulse border-indigo-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const labels = {
    pending: "Aguardando",
    executing: "Executando",
    completed: "Finalizado",
    failed: "Erro",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", styles[status])}>
      {labels[status]}
    </span>
  );
};

export default function Automacao() {
  const [isPaused, setIsPaused] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [dailyBets, setDailyBets] = useState<BetWorkerJsonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [machinesData, dailyBetsData] = await Promise.all([
          automationService.getMachines(),
          automationService.getDailyBets()
        ]);
        setMachines(machinesData);
        setDailyBets(dailyBetsData);
      } catch (error) {
        console.error("Error fetching automation data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { 
      label: 'Status do Server', 
      value: machines.find(m => m.type === 'SERVER')?.status === 'ONLINE' ? 'Online' : 'Offline', 
      icon: Activity, 
      color: machines.find(m => m.type === 'SERVER')?.status === 'ONLINE' ? 'text-emerald-700' : 'text-rose-700', 
      bg: 'bg-white border border-slate-800', 
      subtext: machines.find(m => m.type === 'SERVER')?.ip || 'N/A' 
    },
    { 
      label: 'Device Android', 
      value: machines.find(m => m.type === 'DEVICE')?.status === 'ONLINE' ? 'Conectado' : 'Desconectado', 
      icon: Smartphone, 
      color: machines.find(m => m.type === 'DEVICE')?.status === 'ONLINE' ? 'text-indigo-600' : 'text-slate-400', 
      bg: 'bg-white border border-slate-800', 
      subtext: machines.find(m => m.type === 'DEVICE')?.name || 'Nenhum' 
    },
    { label: 'Saúde do Fluxo', value: 'Estável', icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-white border border-slate-800', subtext: '98% de sucesso' },
    { label: 'Execuções Hoje', value: dailyBets?.totalSelections.toString() || '0', icon: Zap, color: 'text-amber-500', bg: 'bg-white border border-slate-800', subtext: 'Total Gerado' },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header com Controles Master */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Automação Mobile</h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 font-bold uppercase tracking-tighter">
            <Cpu className="h-4 w-4 text-indigo-600" />
            Controlando Server Local via Maestro Flow
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm",
              isPaused ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Retomar Fluxo' : 'Pausar Automação'}
          </button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm">
            <RotateCcw className="h-4 w-4" /> Reiniciar Server
          </button>
        </div>
      </header>

      {/* BLOCO 1: Status & Estabilidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={cn("p-5 rounded-xl shadow-sm", stat.bg)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-800/10">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{stat.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 2: Fila de Execução (JSONs) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Fila de Comandos</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {dailyBets?.selections.map((item, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group cursor-default">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {item.matchId}</span>
                    <StatusBadge status={idx === 0 ? 'executing' : idx === 1 ? 'pending' : 'completed'} />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mb-1">{item.home} vs {item.away}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.market}: {item.selection} @ {item.odd.toFixed(2)}</p>
                </div>
              ))}
              {(!dailyBets || dailyBets.selections.length === 0) && (
                <div className="p-8 text-center text-xs text-slate-500 font-bold uppercase italic">Nenhum comando na fila</div>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO 3: Console Logs (Maestro) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Maestro Live Logs
            </h3>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl min-h-[300px] font-mono text-sm relative">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">betbot-worker-maestro.log</span>
            </div>

            <div className="space-y-2 text-[12px]">
              {LIVE_LOGS.map(log => (
                <div key={log.id} className="flex gap-4 group">
                  <span className="text-slate-600 shrink-0 font-bold">[{log.time}]</span>
                  <span className={cn(
                    "font-black uppercase tracking-tighter shrink-0 min-w-[60px]",
                    log.level === 'info' ? "text-indigo-400" : 
                    log.level === 'warn' ? "text-amber-400" : 
                    log.level === 'error' ? "text-rose-400" : "text-emerald-400"
                  )}>
                    {log.level}
                  </span>
                  <span className={cn(
                    "group-hover:text-slate-100 transition-colors",
                    log.level === 'error' ? "text-rose-200" : "text-slate-300"
                  )}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <span className="text-emerald-500 animate-pulse font-bold">$</span>
                <span className="text-slate-500 animate-pulse uppercase text-[10px] font-black tracking-widest">Aguardando próximo comando...</span>
              </div>
            </div>
          </div>

          {/* Device Preview */}
          <div className="bg-white p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm transition-all hover:border-indigo-400 group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                <Smartphone className="h-6 w-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-black text-slate-900 uppercase">{machines.find(m => m.type === 'DEVICE')?.name || 'Pixel 6 Pro - Emulator'}</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    machines.find(m => m.type === 'DEVICE')?.status === 'ONLINE' ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chrome Beta v124.x</p>
                </div>
              </div>
            </div>
            <button type="button" className="px-3 py-1.5 bg-slate-50 border border-slate-800/10 hover:border-slate-800 text-slate-900 rounded text-[10px] font-black uppercase transition-all flex items-center gap-2">
              Espelhar Tela <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
