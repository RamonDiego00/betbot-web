"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  Smartphone,
  Terminal,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
  Clock,
  MonitorSmartphone,
  Target,
  Layers,
  X,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { automationService } from '@/lib/api/services/automation';
import {
  AutomationDeviceStatus,
  AutomationLogEvent,
  BetWorkerJsonResponse,
  WorkerBetTicket,
} from '@/types/api';

// --- MODO DE EXECUÇÃO (Automático x Manual) ---
const AUTOMATION_MODE_KEY = 'betbot_automation_mode';
type AutomationMode = 'AUTO' | 'MANUAL';

// --- AGENDAMENTO (Scheduler) ---
const SCHEDULE_TIME_KEY = 'betbot_schedule_time';
const SCHEDULE_ENABLED_KEY = 'betbot_schedule_enabled';

// --- TYPES ---
interface LogEntry {
  id: number;
  time: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
}

type BadgeStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';

const mapTicketStatus = (status: WorkerBetTicket['status']): BadgeStatus => {
  switch (status) {
    case 'IN_PROGRESS': return 'executing';
    case 'SUCCESS': return 'completed';
    case 'FAILED': return 'failed';
    case 'SKIPPED': return 'skipped';
    default: return 'pending';
  }
};

const StatusBadge = ({ status }: { status: BadgeStatus }) => {
  const styles = {
    pending: "bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    executing: "bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 animate-pulse border-brand-200 dark:border-brand-800",
    completed: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    failed: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    skipped: "bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800",
  };
  const labels = {
    pending: "Aguardando",
    executing: "Executando",
    completed: "Finalizado",
    failed: "Erro",
    skipped: "Ignorado",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", styles[status])}>
      {labels[status]}
    </span>
  );
};

function logLevelColor(level: string) {
  switch (level) {
    case 'INFO':  return 'text-brand-600 dark:text-brand-400';
    case 'DEBUG': return 'text-slate-400';
    case 'WARN':  return 'text-amber-400';
    case 'ERROR': return 'text-rose-400';
    default:      return 'text-slate-400';
  }
}

export default function Automacao() {
  const [isPaused, setIsPaused] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<AutomationDeviceStatus | null>(null);
  const [dailyBets, setDailyBets] = useState<BetWorkerJsonResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [automationMode, setAutomationMode] = useState<AutomationMode>('MANUAL');
  const [isMirrorModalOpen, setIsMirrorModalOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('06:00');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [frameTimestamp, setFrameTimestamp] = useState(Date.now());
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [expandedTicketIds, setExpandedTicketIds] = useState<Set<string>>(new Set());
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  // Enquanto o modal de espelhamento está aberto, força o <img> a rebuscar o
  // frame a cada 2s — incondicional (não depende de deviceStatus, que só
  // atualiza a cada 15s): senão, se o device conectar DEPOIS do modal abrir,
  // o espelho ficava travado até o usuário fechar/reabrir manualmente.
  useEffect(() => {
    if (!isMirrorModalOpen) return;
    const interval = setInterval(() => setFrameTimestamp(Date.now()), 2000);
    return () => clearInterval(interval);
  }, [isMirrorModalOpen]);

  useEffect(() => {
    if (!isMirrorModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMirrorModalOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMirrorModalOpen]);

  const logCounter = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(AUTOMATION_MODE_KEY);
    if (stored === 'AUTO' || stored === 'MANUAL') {
      setAutomationMode(stored);
    }
    const storedTime = window.localStorage.getItem(SCHEDULE_TIME_KEY);
    if (storedTime) setScheduleTime(storedTime);
    setScheduleEnabled(window.localStorage.getItem(SCHEDULE_ENABLED_KEY) === 'true');
  }, []);

  // Sincroniza a seleção local (modo Manual) sempre que a fila do dia é
  // (re)carregada — tickets já travados ou PENDING começam marcados.
  useEffect(() => {
    if (!dailyBets) return;
    const initial = new Set<string>();
    dailyBets.tickets.forEach((t) => {
      const isLocked = t.status === 'IN_PROGRESS' || t.status === 'SUCCESS' || t.status === 'FAILED';
      if (isLocked || t.status === 'PENDING') initial.add(t.ticket_id);
    });
    setSelectedTicketIds(initial);
  }, [dailyBets]);

  const handleScheduleTimeChange = useCallback((time: string) => {
    setScheduleTime(time);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SCHEDULE_TIME_KEY, time);
    }
  }, []);

  const handleScheduleEnabledToggle = useCallback(() => {
    setScheduleEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SCHEDULE_ENABLED_KEY, String(next));
      }
      return next;
    });
  }, []);

  const handleSelectionToggle = useCallback((ticketId: string, checked: boolean) => {
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(ticketId); else next.delete(ticketId);
      return next;
    });
  }, []);

  const toggleTicketExpanded = useCallback((ticketId: string) => {
    setExpandedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId); else next.add(ticketId);
      return next;
    });
  }, []);

  const handleExecuteSelected = useCallback(async () => {
    if (!dailyBets) return;
    setIsSubmittingSelection(true);
    const changed = dailyBets.tickets.filter((t) => {
      const isLocked = t.status === 'IN_PROGRESS' || t.status === 'SUCCESS' || t.status === 'FAILED';
      if (isLocked) return false;
      const desiredSelected = selectedTicketIds.has(t.ticket_id);
      const currentSelected = t.status !== 'SKIPPED';
      return desiredSelected !== currentSelected;
    });
    if (changed.length === 0) {
      toast.info('Nenhuma alteração para enviar.');
      setIsSubmittingSelection(false);
      return;
    }
    const results = await Promise.allSettled(
      changed.map((t) => automationService.updateTicketStatus(
        t.ticket_id, selectedTicketIds.has(t.ticket_id) ? 'PENDING' : 'SKIPPED'
      ))
    );
    const failures = results.filter((r) => r.status === 'rejected').length;
    if (failures === 0) toast.success(`${changed.length} ticket(s) atualizado(s).`);
    else if (failures < changed.length) toast.warning(`${changed.length - failures} de ${changed.length} atualizados, ${failures} falharam.`);
    else toast.error('Falha ao atualizar os tickets selecionados.');
    try {
      setDailyBets(await automationService.getDailyBets());
    } catch { /* mantém dailyBets atual, próximo poll resincroniza */ }
    setIsSubmittingSelection(false);
  }, [dailyBets, selectedTicketIds]);

  const handleModeChange = useCallback((mode: AutomationMode) => {
    setAutomationMode(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTOMATION_MODE_KEY, mode);
    }

    if (mode === 'AUTO') {
      const skippedTickets = (dailyBets?.tickets ?? []).filter((t) => t.status === 'SKIPPED');
      if (skippedTickets.length === 0) return;

      setDailyBets((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tickets: prev.tickets.map((t) =>
            t.status === 'SKIPPED' ? { ...t, status: 'PENDING' } : t
          ),
        };
      });

      Promise.allSettled(
        skippedTickets.map((t) => automationService.updateTicketStatus(t.ticket_id, 'PENDING'))
      ).then((results) => {
        const hasFailure = results.some((r) => r.status === 'rejected');
        if (hasFailure) {
          toast.error('Alguns tickets não puderam ser reativados. Verifique a fila.');
        }
      });
    }
  }, [dailyBets]);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [deviceData, dailyBetsData, recentLogs] = await Promise.allSettled([
          automationService.getDeviceStatus(),
          automationService.getDailyBets(),
          automationService.getRecentLogs(30),
        ]);

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

    // Status do device é uma foto do momento — sem isso, "Status do
    // Dispositivo" e o espelhamento ficam presos ao estado de quando a
    // página abriu.
    const statusInterval = setInterval(async () => {
      try {
        const deviceData = await automationService.getDeviceStatus();
        setDeviceStatus(deviceData);
      } catch {
        // mantém o último status conhecido; próximo ciclo tenta de novo
      }
    }, 15000);

    sseRef.current = automationService.streamLogs(
      (log: AutomationLogEvent) => {
        const entry: LogEntry = {
          id: ++logCounter.current,
          time: new Date(log.timestamp).toLocaleTimeString('pt-BR'),
          level: log.logType,
          message: log.message,
        };
        setLogs((prev) => [...prev.slice(-99), entry]);
      },
      () => console.warn('SSE de logs desconectado — reconectando não implementado.'),
    );

    return () => {
      clearInterval(statusInterval);
      sseRef.current?.close();
    };
  }, []);

  const isDeviceOnline = deviceStatus?.status === 'connected';

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
          {/* Header com Controles Master */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Automação Mobile</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-bold uppercase tracking-tighter">
                <Cpu className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Controlando Server Local via Maestro Flow
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 shadow-sm">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  automationMode === 'AUTO' ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-slate-500"
                )}>
                  Automático
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={automationMode === 'MANUAL'}
                  aria-label="Alternar entre modo automático e manual"
                  onClick={() => handleModeChange(automationMode === 'AUTO' ? 'MANUAL' : 'AUTO')}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2",
                    automationMode === 'MANUAL' ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    automationMode === 'MANUAL' ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  automationMode === 'MANUAL' ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-slate-500"
                )}>
                  Manual
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className={cn(
                    "w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-white transition-all shadow-sm",
                    isPaused
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-brand-600 hover:bg-brand-700"
                  )}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Retomar Fluxo' : 'Pausar Automação'}
                </button>
              </div>
            </div>
          </header>

          {/* BLOCO 1: Agendamento + Status do Dispositivo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agendamento da Automação */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Agendamento da Automação
                </h3>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border shrink-0",
                  scheduleEnabled
                    ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800"
                    : "text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                )}>
                  {scheduleEnabled ? `Ativo às ${scheduleTime}` : 'Desativado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ligar agendamento</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={scheduleEnabled}
                  aria-label="Ativar ou desativar o agendamento da automação"
                  onClick={handleScheduleEnabledToggle}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2",
                    scheduleEnabled ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    scheduleEnabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="schedule-time" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Rodar às
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  disabled={!scheduleEnabled}
                  onChange={(e) => handleScheduleTimeChange(e.target.value)}
                  className={cn(
                    "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
                    !scheduleEnabled && "opacity-40 cursor-not-allowed"
                  )}
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
                Horário local do dispositivo em que o agente inicia as apostas do dia.
              </p>
            </div>

            {/* Status do Dispositivo */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Status do Dispositivo
              </h3>
              {isDeviceOnline ? (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800">
                    <Smartphone className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Conectado</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase">{deviceStatus?.model}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      App {deviceStatus?.appVersion} · Uptime {deviceStatus?.uptime}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800/40 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800">
                    <Smartphone className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Nenhum dispositivo Android conectado
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* BLOCO 2: Tickets do Dia */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Tickets do Dia</h3>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(dailyBets?.tickets || []).map((ticket) => {
                    const isLocked = ticket.status === 'IN_PROGRESS' || ticket.status === 'SUCCESS' || ticket.status === 'FAILED';
                    const isExpanded = expandedTicketIds.has(ticket.ticket_id);
                    const checked = automationMode === 'AUTO' ? true : selectedTicketIds.has(ticket.ticket_id);
                    const disabled = automationMode === 'AUTO' ? true : isLocked;
                    const isMultiple = ticket.type === 'MULTIPLE';
                    const oddLabel = isMultiple ? 'Odd Combinada' : 'Odd';
                    const stakeLabel = isMultiple ? 'Stake do Bilhete' : 'Stake';
                    return (
                      <div key={ticket.ticket_id}>
                        <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={(e) => handleSelectionToggle(ticket.ticket_id, e.target.checked)}
                                aria-label={`Incluir ticket ${ticket.ticket_id} na execução`}
                                className={cn(
                                  "h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-brand-600 focus:ring-2 focus:ring-brand-500/40 accent-brand-600 shrink-0",
                                  disabled && "opacity-40 cursor-not-allowed"
                                )}
                              />
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate">
                                {ticket.category} • {ticket.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={mapTicketStatus(ticket.status)} />
                              <button
                                type="button"
                                onClick={() => toggleTicketExpanded(ticket.ticket_id)}
                                aria-label={isExpanded ? 'Recolher detalhes do ticket' : 'Expandir detalhes do ticket'}
                                aria-expanded={isExpanded}
                                className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-400 dark:text-slate-500"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3">
                            <div className="space-y-3">
                              {ticket.matches.map((match) => (
                                <div key={match.match_id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-3 space-y-2">
                                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                                    <Target className="h-3 w-3 text-brand-600 dark:text-brand-400 shrink-0" />
                                    {match.match_name}
                                  </h4>

                                  <div className="space-y-2 pl-1">
                                    {match.markets.map((market, mIdx) => (
                                      <div key={`${match.match_id}-${mIdx}`} className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                          <Layers className="h-2.5 w-2.5 shrink-0" />
                                          {market.market_name}
                                        </p>
                                        <ul className="space-y-0.5 pl-3.5">
                                          {market.selections.map((selection, sIdx) => (
                                            <li key={`${match.match_id}-${mIdx}-${sIdx}`} className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                              {selection.description}
                                              {selection.period && (
                                                <span className="text-slate-400 dark:text-slate-400 font-semibold"> · {selection.period}</span>
                                              )}
                                              {selection.team_filter && (
                                                <span className="text-slate-400 dark:text-slate-400 font-semibold"> · {selection.team_filter}</span>
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

                            <div className="flex items-center justify-between pt-1">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stakeLabel}</p>
                                <p className="text-xs font-black text-slate-900 dark:text-slate-100">R$ {ticket.stake.toFixed(2)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Casa</p>
                                <p className="text-xs font-black text-slate-900 dark:text-slate-100">Bet365</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{oddLabel}</p>
                                <p className="text-xs font-black text-brand-600 dark:text-brand-400">{ticket.total_odd.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!dailyBets || dailyBets.tickets.length === 0) && (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 font-bold uppercase italic">Nenhum comando na fila</div>
                  )}
                </div>
                {automationMode === 'MANUAL' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleExecuteSelected}
                      disabled={isSubmittingSelection}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-white transition-all shadow-sm",
                        isSubmittingSelection ? "bg-brand-600/60 cursor-not-allowed" : "bg-brand-600 hover:bg-brand-700"
                      )}
                    >
                      {isSubmittingSelection ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {isSubmittingSelection ? 'Executando...' : 'Executar Selecionados'}
                    </button>
                  </div>
                )}
              </div>

              <p className="flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold px-1 leading-relaxed">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-500" />
                As credenciais das casas de aposta ficam salvas localmente na máquina onde o worker roda — nunca são enviadas pra este portal.
              </p>
            </div>

            {/* BLOCO 3: Console Logs (Maestro) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> Maestro Live Logs
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 uppercase tracking-widest transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Limpar Logs
                  </button>
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Ao Vivo
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6 shadow-xl min-h-[300px] font-mono text-sm relative">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">betbot-worker-maestro.log</span>
                </div>

                <div className="space-y-2 text-[12px] max-h-60 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aguardando logs...</div>
                  ) : logs.map((log) => (
                    <div key={log.id} className="flex flex-wrap gap-x-3 gap-y-1 group">
                      <span className="text-slate-500 shrink-0 font-bold">[{log.time}]</span>
                      <span className={cn("font-black uppercase tracking-tighter shrink-0 min-w-[52px] sm:min-w-[60px]", logLevelColor(log.level))}>
                        {log.level}
                      </span>
                      <span className={cn(
                        "break-words group-hover:text-slate-100 transition-colors",
                        log.level === 'ERROR' ? "text-rose-200" : "text-slate-400"
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
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm transition-all hover:border-brand-400 dark:hover:border-brand-500 group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800">
                    <Smartphone className="h-6 w-6 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase">{deviceStatus?.model || 'Sem device'}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full animate-pulse",
                        isDeviceOnline ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {deviceStatus ? `App ${deviceStatus.appVersion} · Uptime ${deviceStatus.uptime}` : 'Desconectado'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMirrorModalOpen(true)}
                  className="px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all flex items-center gap-2 border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 text-slate-900 dark:text-slate-100"
                >
                  Espelhar Tela <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
      </div>

      {/* Modal de Espelhamento */}
      {isMirrorModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Espelhamento do dispositivo">
          <div onClick={() => setIsMirrorModalOpen(false)} aria-hidden="true" className="fixed inset-0 bg-black/50" />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-4 z-[71]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <MonitorSmartphone className="h-3.5 w-3.5" /> Espelho do Dispositivo
              </span>
              <button
                type="button"
                onClick={() => setIsMirrorModalOpen(false)}
                aria-label="Fechar espelhamento"
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-400 dark:text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-[9/19] w-full bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative">
              {isDeviceOnline ? (
                <img
                  key={frameTimestamp}
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/v1/worker/screen-frame?t=${frameTimestamp}`}
                  alt="Tela do dispositivo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Device conectado mas nenhum frame chegou ainda (agente local não
                    // envia screenshot até a próxima execução) — não some a imagem,
                    // deixa o fundo escuro do container comunicar "ainda sem frame".
                    e.currentTarget.style.visibility = 'hidden';
                  }}
                />
              ) : (
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center leading-relaxed p-4">
                  Nenhum agente local conectado.
                  <br />
                  Configure-o na aba Setup.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
