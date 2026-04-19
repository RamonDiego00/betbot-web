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
import { cn } from '@/lib/utils';
import { authUtils } from '@/lib/auth';

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

  const isRouteActive = (href: string) => {
    if (href === '/' && pathname !== '/') return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-800 bg-white flex flex-col transition-all duration-300 z-50">
      {/* Header com Logo e Status */}
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <span className="text-white font-black text-xl">B</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 font-sans uppercase">
            BetBot
          </h1>
        </div>

        {/* Badge de Status do Servidor */}
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-800 bg-white",
          serverStatus === 'online' 
            ? "text-emerald-700" 
            : "text-rose-700"
        )}>
          <span className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            serverStatus === 'online' ? "bg-emerald-500" : "bg-rose-500"
          )} />
          Server: {serverStatus === 'online' ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = isRouteActive(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all",
                isActive 
                  ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50 border border-slate-800" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer da Sidebar */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all",
            isRouteActive('/settings')
              ? "bg-slate-100 text-slate-900"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings className={cn(
            "h-4 w-4",
            isRouteActive('/settings') ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
          )} />
          Ajustes
        </Link>
        <button
          onClick={() => authUtils.logout()}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-all"
        >
          <LogOut className="h-4 w-4 text-slate-400 group-hover:text-rose-500" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
