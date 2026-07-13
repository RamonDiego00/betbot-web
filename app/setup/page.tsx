"use client";

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Terminal,
  Smartphone,
  KeyRound,
  ShieldCheck,
  PlayCircle,
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

interface CommandBlockProps {
  command: string;
}

const CommandBlock = ({ command }: CommandBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Falha ao copiar comando:', error);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 my-2">
      <pre className="text-xs font-mono font-bold text-indigo-300 whitespace-pre-wrap break-all select-all">{command}</pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar comando"
        className={cn(
          "shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-all duration-200",
          copied
            ? "bg-emerald-950/30 border-emerald-800 text-emerald-400"
            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        )}
      >
        {copied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
};

export default function Setup() {
  const [token, setToken] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:8080');

  const generateDeviceToken = async () => {
    setIsGenerating(true);
    try {
      // Tenta bater na API real para gerar o token
      const response = await apiClient.post('/api/v1/worker/token', {
        deviceInfo: typeof window !== 'undefined' ? window.navigator.userAgent : 'Web Browser'
      });
      if (response.data && response.data.token) {
        setToken(response.data.token);
        toast.success('Token de dispositivo gerado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao gerar token via API:', error);
      // Fallback amigável de desenvolvimento
      const fallbackToken = 'device_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setToken(fallbackToken);
      toast.info('API indisponível ou offline. Gerado token local para simulação.', {
        description: 'Usando token simulado para fins de demonstração.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPowerShellCommand = () => {
    const activeToken = token || "SUA_CHAVE_AQUI";
    return `powershell -ExecutionPolicy Bypass -File .\\setup.ps1 -Token "${activeToken}" -ApiUrl "${apiBaseUrl}"`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-500 font-semibold tracking-wider uppercase text-xs">
          <Cpu className="h-4 w-4" />
          <span>Automação Integrada</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight font-sans">Configuração do Agente Local</h2>
        <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-2xl">
          Instale o executor de apostas local. O agente se comunica de forma segura com a API para baixar e executar os scripts Maestro no seu celular físico.
        </p>
      </header>

      {/* Alertas Críticos */}
      <section className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
          <h3 className="text-lg font-bold text-amber-400">Instruções Críticas do Dispositivo</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-amber-250">
          <div className="bg-slate-900/50 border border-amber-900/25 p-4 rounded-xl space-y-1">
            <span className="text-amber-400 block font-bold uppercase tracking-wide">1. Apenas Celular Físico</span>
            <p className="text-slate-450 leading-relaxed font-normal text-[11px]">
              Nunca use emuladores (LDPlayer, BlueStacks, etc.). O sistema antifraude da Bet365 os detecta instantaneamente, acarretando no bloqueio da sua conta.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-amber-900/25 p-4 rounded-xl space-y-1">
            <span className="text-amber-400 block font-bold uppercase tracking-wide">2. Tela Sempre Ativa</span>
            <p className="text-slate-450 leading-relaxed font-normal text-[11px]">
              Nas Opções do Desenvolvedor do Android, ative &quot;Permanecer ativa&quot; (Stay awake). O Maestro necessita da tela ligada para simular os cliques.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-amber-900/25 p-4 rounded-xl space-y-1">
            <span className="text-amber-400 block font-bold uppercase tracking-wide">3. Controle de Mãos Livres</span>
            <p className="text-slate-450 leading-relaxed font-normal text-[11px]">
              Não toque na tela do celular e nem faça gestos manuais enquanto o script estiver executando. Interferências humanas causam falhas nos fluxos de odds.
            </p>
          </div>
        </div>
      </section>

      {/* Passos do Setup */}
      <div className="space-y-6">
        {/* Passo 1 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-950 border border-indigo-800 rounded-lg flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">Gerar Token do Dispositivo</h4>
              <p className="text-xs text-slate-400 font-medium">Esse token autoriza a comunicação segura do agente com o portal</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={generateDeviceToken}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              <span>Gerar Token</span>
            </button>
            <div className="flex-1">
              <input
                type="text"
                readOnly
                placeholder="Clique em 'Gerar Token' para obter sua credencial..."
                value={token}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-mono text-indigo-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Passo 2 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-950 border border-indigo-800 rounded-lg flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">Baixar e Executar o Instalador (Windows PowerShell)</h4>
              <p className="text-xs text-slate-400 font-medium">Baixe o script e execute no PowerShell como administrador</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="/install/setup.ps1"
                download="setup.ps1"
                className="inline-flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-sm px-5 py-3 rounded-xl transition-all duration-200"
              >
                <Download className="h-4.5 w-4.5" />
                <span>Baixar setup.ps1</span>
              </a>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold font-mono">API URL:</span>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-indigo-400 w-44 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block font-mono">Execute no diretório onde salvou o script:</span>
              <CommandBlock command={getPowerShellCommand()} />
            </div>
          </div>
        </div>

        {/* Passo 3 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-950 border border-indigo-800 rounded-lg flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">Configurar Credenciais Locais da Bet365</h4>
              <p className="text-xs text-slate-400 font-medium">Preencha suas informações locais de login no computador</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              O instalador criará um arquivo local no caminho <code className="font-mono bg-slate-950 border border-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs">C:\betbot\.env</code>. Edite e preencha as variáveis de login:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-350">
              <span className="text-slate-500 block"># Caminho: C:\betbot\.env</span>
              <span className="text-indigo-400">BET365_EMAIL</span>=seu_email@provedor.com<br />
              <span className="text-indigo-400">BET365_PASSWORD</span>=sua_senha_segura_da_bet365
            </div>

            <div className="p-4 bg-indigo-955/20 border border-indigo-900/30 rounded-xl flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-350 font-bold leading-normal">
                Privacidade Absoluta: Suas credenciais são lidas de forma estritamente local no celular pelo Maestro e nunca são transmitidas para a API ou para o portal.
              </p>
            </div>
          </div>
        </div>

        {/* Passo 4 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-950 border border-indigo-800 rounded-lg flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
              4
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">Conectar Celular e Executar o Agente</h4>
              <p className="text-xs text-slate-400 font-medium">Inicie a orquestração em segundo plano</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <ol className="space-y-3 list-decimal list-inside text-sm text-slate-400 font-medium leading-relaxed">
              <li>Ligue o celular físico no computador com um cabo USB de boa qualidade.</li>
              <li>Permita o acesso de depuração USB na caixa de diálogo que surgir no celular.</li>
              <li>Abra o terminal do Windows (cmd ou powershell) e execute o comando:</li>
            </ol>
            <CommandBlock command="python C:\betbot\agent.py" />
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                O agente local ficará rodando no terminal, enviando heartbeats (visto na aba de Automação) e aguardando o horário agendado de execução (06h ou personalizado em Ajustes) para rodar o Maestro automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
