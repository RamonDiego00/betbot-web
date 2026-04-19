"use client";

import React, { useState } from 'react';
import { Bug, Loader2 } from 'lucide-react';
import { authService } from '@/lib/api/services/auth';
import { authUtils } from '@/lib/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const [isDebugLoading, setIsDebugLoading] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  const handleGoogleLogin = () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  const handleDebugLogin = async () => {
    setIsDebugLoading(true);
    try {
      const response = await authService.debugLogin('ramondiego856@gmail.com');
      const token = response.token || response.access_token;
      
      if (token) {
        authUtils.setToken(token);
        toast.success('Login em modo Debug realizado!');
        window.location.href = '/';
      } else {
        console.error('No token found in response:', response);
        toast.error('Falha no login debug: Token não recebido');
      }
    } catch (error) {
      toast.error('Falha no login debug');
      console.error(error);
    } finally {
      setIsDebugLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-3xl">B</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bem-vindo ao BetBot</h2>
          <p className="text-slate-500">Sua central inteligente de apostas e automação.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Entrar com Google
          </button>

          {isDev && (
            <button
              onClick={handleDebugLogin}
              disabled={isDebugLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm group"
            >
              {isDebugLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bug className="h-5 w-5" />}
              Entrar em modo Debug
            </button>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400 font-medium leading-relaxed">
            Ao entrar, você concorda com nossos <br />
            <span className="text-indigo-600 hover:underline cursor-pointer">Termos de Uso</span> e <span className="text-indigo-600 hover:underline cursor-pointer">Política de Privacidade</span>.
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-black text-slate-300">100%</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguro</span>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-black text-slate-300">24/7</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monitorado</span>
        </div>
      </div>
    </div>
  );
}
