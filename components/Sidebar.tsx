"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  Cpu, 
  BarChart3, 
  Settings, 
  LogOut,
  Circle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário para mesclar classes Tailwind de forma segura
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  serverStatus?: 'online' | 'offline';
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Financeiro', href: '/financeiro', icon: Wallet },
  { label: 'Histórico', href: '/historico', icon: History },
  { label: 'Automação', href: '/automacao', icon: Cpu },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export const Sidebar: React.FC<SidebarProps> = ({ serverStatus = 'online' }) => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white flex flex-col transition-all duration-300">
      {/* Header com Logo e Status */}
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            BetBot
          </h1>
        </div>

        {/* Badge de Status do Servidor */}
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium w-fit border",
          serverStatus === 'online' 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-rose-50 text-rose-700 border-rose-200"
        )}>
          <Circle className={cn(
            "h-2 w-2 fill-current",
            serverStatus === 'online' ? "text-emerald-500" : "text-rose-500"
          )} />
          Servidor: {serverStatus === 'online' ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-slate-100 text-indigo-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer da Sidebar - Configurações e Logout */}
      <div className="p-4 border-t border-slate-100 space-y-1">
        <Link
          href="/settings"
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Settings className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
          Configurações
        </Link>
        <button
          onClick={() => console.log('logout')}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-rose-500" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
