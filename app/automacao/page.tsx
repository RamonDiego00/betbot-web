"use client";

import React, { useState } from 'react';
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
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- TYPES ---
interface ExecutionItem {
  id: string;
  match: string;
  market: string;
  odds: string;
  stake: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timeSent: string;
}

interface LogEntry {
  id: number;
  time: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

// --- MOCK DATA ---
const AUTOMATION_STATS = [
  { label: 'Status do Server', value: 'Online', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', subtext: 'Latência: 42ms' },
  { label: 'Device Android', value: 'Conectado', icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50', subtext: 'ID: emulator-5554' },
  { label: 'Saúde do Fluxo', value: 'Estável', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', subtext: '98% de sucesso' },
  { label: 'Execuções Hoje', value: '142', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', subtext: 'Média 12/hora' },
];

const EXECUTION_QUEUE: ExecutionItem[] = [
  { id: 'TX-9021', match: 'Real Madrid vs Man. City', market: 'ML Real Madrid', odds: '2.10', stake: 'R$ 100', status: 'executing', timeSent: '16:02:11' },
  { id: 'TX-9022', match: 'Bayern vs Arsenal', market: 'Over 2.5 Gols', odds: '1.85', stake: 'R$ 150', status: 'pending', timeSent: '16:05:30' },
  { id: 'TX-9020', match: 'Liverpool vs Chelsea', market: 'BTTS Yes', odds: '1.72', stake: 'R$ 200', status: 'completed', timeSent: '15:45:00' },
];

const LIVE_LOGS: LogEntry[] = [
  { id: 1, time: '16:02:11', level: 'info', message: 'Recebido JSON do backend: TX-9021' },
  { id: 2, time: '16:02:15', level: 'info', message: 'Iniciando Maestro: flow.yaml' },
  { id: 3, time: '16:02:20', level: 'info', message: 'Chrome aberto com sucesso' },
  { id: 4, time: '16:02:45', level: 'success', message: 'Login efetuado na Bet365' },
  { id: 5, time: '16:03:10', level: 'info', message: 'Navegando para o confronto: Real Madrid vs Man. City' },
  { id: 6, time: '16:03:30', level: 'warn', message: 'Odds variando: Tentativa 2 de 3' },
];

// --- COMPONENTES AUXILIARES ---

const StatusBadge = ({ status }: { status: ExecutionItem['status'] }) => {
  const styles = {
    pending: "bg-slate-100 text-slate-500",
    executing: "bg-indigo-50 text-indigo-600 animate-pulse",
    completed: "bg-emerald-50 text-emerald-600",
    failed: "bg-rose-50 text-rose-600",
  };
  const labels = {
    pending: "Aguardando",
    executing: "Executando",
    completed: "Finalizado",
    failed: "Erro",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-transparent", styles[status])}>
      {labels[status]}
    </span>
  );
};

export default function Automacao() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header com Controles Master */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Automação Mobile</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Controlando Server Local via Maestro Flow
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm",
              isPaused ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Retomar Fluxo' : 'Pausar Automação'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-sm">
            <RotateCcw className="h-4 w-4" /> Reiniciar Server
          </button>
        </div>
      </header>

      {/* BLOCO 1: Status & Estabilidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {AUTOMATION_STATS.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-xl font-black text-slate-900">{stat.value}</h4>
              <span className="text-[10px] font-medium text-slate-400">{stat.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 2: Fila de Execução (JSONs) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-indigo-500" />
              Fila de Comandos
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">3 Pendentes</span>
          </div>

          <div className="space-y-3">
            {EXECUTION_QUEUE.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">ID: {item.id}</span>
                  <StatusBadge status={item.status} />
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-sm font-bold text-slate-900">{item.match}</p>
                  <p className="text-xs text-slate-500 font-medium">{item.market} @ {item.odds}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className="text-xs font-black text-indigo-600">{item.stake}</span>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <Clock className="h-3 w-3" /> {item.timeSent}
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:border-indigo-300 hover:text-indigo-500 transition-all">
              Ver Histórico de Execução
            </button>
          </div>
        </div>

        {/* BLOCO 3: Terminal de Logs em Tempo Real */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-400" />
              Logs do Maestro Flow
            </h3>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streaming em Tempo Real</span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
            {/* Console Header */}
            <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 ml-2">bash --local-server-maestro</span>
            </div>

            {/* Console Body */}
            <div className=\"p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-[460px] space-y-1.5\">
              {LIVE_LOGS.map((log) => (
                <div key={log.id} className="flex gap-3 group">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={cn(
                    "font-bold uppercase text-[10px] min-w-[50px]",
                    log.level === 'info' ? "text-blue-400" :
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
                <span className="text-slate-500 animate-pulse">Aguardando próximo comando...</span>
              </div>
            </div>
          </div>

          {/* Device Preview (Simulado/Informativo) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700">
                <Smartphone className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Pixel 6 Pro - Emulator</p>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Chrome Beta v124.x</p>
                </div>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-2">
              Espelhar Tela <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
