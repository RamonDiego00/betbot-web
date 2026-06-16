"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Smartphone, 
  Activity, 
  ShieldCheck, 
  Terminal, 
  Play, 
  Pause, 
  RotateCcw,
  Zap,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { automationService } from '@/lib/api/services/automation';
import {
  AutomationServerStatus,
  AutomationDeviceStatus,
  AutomationLogEvent,
  BetWorkerJsonResponse,
  WorkerBetTicket,
} from '@/types/api';

// --- TYPES ---
interface LogEntry {
  id: number;
  time: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
}

// --- COMPONENTES AUXILIARES ---

type BadgeStatus = 'pending' | 'executing' | 'completed' | 'failed';

const mapTicketStatus = (status: WorkerBetTicket['status']): BadgeStatus => {
  switch (status) {
    case 'IN_PROGRESS': return 'executing';
    case 'SUCCESS': return 'completed';
    case 'FAILED': return 'failed';
    default: return 'pending';
  }
};

const StatusBadge = ({ status }: { status: BadgeStatus }) => {
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

function logLevelColor(level: string) {
  switch (level) {
    case 'INFO':  return 'text-indigo-400';
    case 'DEBUG': return 'text-slate-400';
    case 'WARN':  return 'text-amber-400';
    case 'ERROR': return 'text-rose-400';
    default:      return 'text-slate-400';
  }
}

export default function Automacao() {
  const [isPaused, setIsPaused] = useState(false);
  const [serverStatus, setServerStatus] = useState<AutomationServerStatus | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<AutomationDeviceStatus | null>(null);
  const [dailyBets, setDailyBets] = useState<BetWorkerJsonResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const sseRef = useRef<EventSource | null>(null);
  const logCounter = useRef(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [serverData, deviceData, dailyBetsData, recentLogs] = await Promise.allSettled([
          automationService.getServerStatus(),
          automationService.getDeviceStatus(),
          automationService.getDailyBets(),
          automationService.getRecentLogs(30),
        ]);

        if (serverData.status === 'fulfilled') setServerStatus(serverData.value);
        if (deviceData.status === 'fulfilled') setDeviceStatus(deviceData.value);
        if (dailyBetsData.status === 'fulfilled') setDailyBets(dailyBetsData.value);
        if (recentLogs.status === 'fulfilled') {
          const mapped: LogEntry[] = recentLogs.value.map((e) => ({
            id: ++logCounter.current,
            time: new Date(e.timestamp).toLocaleTimeString('pt-BR'),
            level: e.logType,
            message: e.message,
          }));
          setLogs(mapped);
        }
      } catch (error) {
        console.error('Error fetching automation data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Abre stream SSE para logs ao vivo
    sseRef.current = automationService.streamLogs(
      (log: AutomationLogEvent) => {
        const entry: LogEntry = {
          id: ++logCounter.current,
          time: new Date(log.timestamp).toLocaleTimeString('pt-BR'),
          level: log.logType,
          message: log.message,
        };
        setLogs((prev) => [...prev.slice(-99), entry]); // mantém últimos 100
      },
      () => console.warn('SSE de logs desconectado — reconectando não implementado.'),
    );

    return () => {
      sseRef.current?.close();
    };
  }, []);

  const isServerOnline = serverStatus?.serverStatus === 'alive';
  const isDeviceOnline = deviceStatus?.status === 'connected';

  const stats = [
    {
      label: 'Status do Server',
      value: isServerOnline ? 'Online' : 'Offline',
      icon: Activity,
      color: isServerOnline ? 'text-emerald-700' : 'text-rose-700',
      bg: 'bg-white border border-slate-800',
      subtext: serverStatus?.serverVersion ?? 'N/A',
    },
    {
      label: 'Device Android',
      value: isDeviceOnline ? 'Conectado' : 'Desconectado',
      icon: Smartphone,
      color: isDeviceOnline ? 'text-indigo-600' : 'text-slate-400',
      bg: 'bg-white border border-slate-800',
      subtext: deviceStatus?.model ?? 'Nenhum',
    },
    {
      label: 'Saúde do Fluxo',
      value: isServerOnline && isDeviceOnline ? 'Estável' : 'Atenção',
      icon: ShieldCheck,
      color: isServerOnline && isDeviceOnline ? 'text-emerald-700' : 'text-amber-600',
      bg: 'bg-white border border-slate-800',
      subtext: deviceStatus ? `Bateria: ${deviceStatus.batteryLevel}%` : 'N/D',
    },
    {
      label: 'Execuções Hoje',
      value: (dailyBets?.tickets?.length ?? 0).toString(),
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-white border border-slate-800',
      subtext: 'Total Gerado',
    },
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
              {(dailyBets?.tickets || []).map((ticket) => {
                const firstMatch = ticket.matches[0];
                const firstSelection = firstMatch?.markets[0]?.selections[0];
                return (
                  <div key={ticket.ticket_id} className="p-4 hover:bg-slate-50 transition-colors group cursor-default">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {ticket.category} • {ticket.type}
                      </span>
                      <StatusBadge status={mapTicketStatus(ticket.status)} />
                    </div>
                    <h4 className="text-xs font-black text-slate-900 mb-1">{firstMatch?.match_name || 'Sem jogo'}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {firstSelection?.description || 'N/A'} @ {ticket.total_odd.toFixed(2)}
                    </p>
                  </div>
                );
              })}
              {(!dailyBets || dailyBets.tickets.length === 0) && (
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
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Ao Vivo
            </span>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl min-h-[300px] font-mono text-sm relative">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">betbot-worker-maestro.log</span>
            </div>

            <div className="space-y-2 text-[12px] max-h-60 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aguardando logs...</div>
              ) : logs.map((log) => (
                <div key={log.id} className="flex gap-4 group">
                  <span className="text-slate-600 shrink-0 font-bold">[{log.time}]</span>
                  <span className={cn("font-black uppercase tracking-tighter shrink-0 min-w-[60px]", logLevelColor(log.level))}>
                    {log.level}
                  </span>
                  <span className={cn(
                    "group-hover:text-slate-100 transition-colors",
                    log.level === 'ERROR' ? "text-rose-200" : "text-slate-300"
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
                <p className="text-sm font-black text-slate-900 uppercase">{deviceStatus?.model || 'Sem device'}</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    isDeviceOnline ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {deviceStatus ? `App ${deviceStatus.appVersion} · Uptime ${deviceStatus.uptime}` : 'Desconectado'}
                  </p>
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
