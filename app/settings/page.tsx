"use client";

import React, { useState } from 'react';
import { 
  User, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  LogOut, 
  Key, 
  Smartphone,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Settings() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configurações</h2>
        <p className="text-slate-500 mt-1 font-medium">Gerencie sua conta, preferências e integrações de automação.</p>
      </header>

      {/* SEÇÃO 1: Perfil do Usuário */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-inner">
            R
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">Ramon Diego</h3>
            <p className="text-sm text-slate-400 font-medium">ramon.diego@example.com</p>
            <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full border border-emerald-100">
              Plano Pro
            </span>
          </div>
          <button className="ml-auto px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">
            Editar Perfil
          </button>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700">Autenticação em 2 Etapas</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Ativado</span>
          </div>
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700">Chaves de API</span>
            </div>
            <button className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">Gerenciar</button>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: Preferências de Interface */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          Interface e Preferências
        </h3>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50 shadow-sm">
          {/* Tema Dark/Light */}
          <div className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                {isDarkMode ? <Moon className="h-5 w-5 text-slate-600" /> : <Sun className="h-5 w-5 text-amber-500" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Modo Escuro (Dark Mode)</p>
                <p className="text-xs text-slate-400 font-medium">Alterar o tema visual da aplicação</p>
              </div>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                isDarkMode ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isDarkMode ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>

          {/* Notificações */}
          <div className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                <Bell className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Notificações Push</p>
                <p className="text-xs text-slate-400 font-medium">Receber alertas de apostas efetuadas</p>
              </div>
            </div>
            <button 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                notificationsEnabled ? "bg-emerald-500" : "bg-slate-200"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                notificationsEnabled ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>

          {/* Idioma */}
          <div className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                <span className="text-xs font-black text-slate-500">PT</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Idioma do Sistema</p>
                <p className="text-xs text-slate-400 font-medium">Selecione o idioma de visualização</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Português (BR)</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Configurações de Automação */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          Integração & Automação
        </h3>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Endereço do Server Local</p>
                  <p className="text-xs text-slate-400 font-medium">IP para conexão com o Maestro</p>
                </div>
              </div>
              <input 
                type="text" 
                defaultValue="192.168.1.105:4000" 
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 text-right"
              />
            </div>
            
            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-500">Teste de conexão bem-sucedido</span>
              </div>
              <button className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-tight transition-colors">
                Refazer Teste
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Logout */}
      <div className="pt-6 flex justify-center">
        <button 
          onClick={() => console.log('logout')}
          className="flex items-center gap-3 px-10 py-4 bg-white border border-rose-100 hover:bg-rose-50 rounded-2xl text-rose-600 text-sm font-black transition-all shadow-sm hover:shadow group"
        >
          <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Encerrar Sessão da Conta
        </button>
      </div>
    </div>
  );
}
