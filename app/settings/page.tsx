"use client";

import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  LogOut,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authUtils } from '@/lib/auth';
import { userService, UserProfile } from '@/lib/api/services/user';
import { automationService } from '@/lib/api/services/automation';
import { AutomationDeviceStatus } from '@/types/api';

const THEME_KEY = 'betbot_theme';

export default function Settings() {
  // O layout só renderiza as páginas protegidas depois do mount,
  // então é seguro ler o localStorage no inicializador (com guard SSR).
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(THEME_KEY) === 'dark';
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState<AutomationDeviceStatus | null>(null);

  useEffect(() => {
    userService.getMe()
      .then(setProfile)
      .catch((error) => console.error('Erro ao carregar perfil:', error))
      .finally(() => setProfileLoading(false));
    automationService.getDeviceStatus()
      .then(setDeviceStatus)
      .catch((error) => console.error('Erro ao carregar status do device:', error));
  }, []);

  const isDeviceConnected = deviceStatus?.status === 'connected';

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const displayName = profile?.name || profile?.email || '';
  const avatarInitial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">Configurações</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Gerencie sua conta, preferências e integrações de automação.</p>
      </header>

      {/* SEÇÃO 1: Perfil do Usuário (dados reais de /api/v1/user/me) */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-6 flex items-center gap-4">
          {profileLoading ? (
            <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Carregando perfil...</span>
            </div>
          ) : (
            <>
              <div className="h-16 w-16 bg-brand-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-inner">
                {avatarInitial}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {profile?.name || 'Usuário'}
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{profile?.email || '—'}</p>
                {profile?.status && (
                  <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-100 dark:border-emerald-500/20">
                    {profile.status}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* SEÇÃO 2: Preferências de Interface */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          Interface e Preferências
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Tema Dark/Light */}
          <div className="p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                {isDarkMode ? <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" /> : <Sun className="h-5 w-5 text-amber-500" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Modo Escuro (Dark Mode)</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Alterar o tema visual da aplicação</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              aria-label="Alternar modo escuro"
              onClick={toggleDarkMode}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
                isDarkMode ? "bg-brand-600" : "bg-slate-200"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isDarkMode ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Integração & Automação */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          Integração & Automação
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {isDeviceConnected ? (
            <div className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{deviceStatus?.model || 'Dispositivo Android'}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Conectado · {deviceStatus?.batteryLevel != null ? `${deviceStatus.batteryLevel}% de bateria · ` : ''}{deviceStatus?.uptime || 'Ativo'}
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-100 dark:border-emerald-500/20">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                Online
              </span>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Nenhum dispositivo conectado</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium max-w-sm leading-relaxed">
                Quando o agente local estiver configurado na máquina onde o worker roda,
                o dispositivo Android conectado aparecerá aqui automaticamente.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botão de Logout */}
      <div className="pt-6 flex justify-center">
        <button
          type="button"
          onClick={() => authUtils.logout()}
          className="flex items-center gap-3 px-10 py-4 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-black transition-all shadow-sm hover:shadow group"
        >
          <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Encerrar Sessão da Conta
        </button>
      </div>
    </div>
  );
}
