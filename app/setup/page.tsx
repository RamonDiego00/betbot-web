"use client";

import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  Terminal,
  Smartphone,
  KeyRound,
  ShieldCheck,
  ListChecks,
  Monitor,
  Laptop
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
    <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 my-2">
      <pre className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all select-all">{command}</pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar comando"
        className={cn(
          "shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-all duration-200",
          copied
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-700 dark:hover:text-slate-200"
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
};

const STEP_ORDER = ['token', 'instalacao', 'credenciais', 'execucao'];

export default function Setup() {
  const [token, setToken] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [platform, setPlatform] = useState<'windows' | 'mac'>('windows');
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:8080');
  // Só um passo aberto por vez (estilo wizard) — os 4 abertos ao mesmo tempo
  // era a principal causa da sensação de "complicado" reportada pelo usuário.
  const [openStep, setOpenStep] = useState<string>('token');
  const [visitedSteps, setVisitedSteps] = useState<string[]>(['token']);

  const generateDeviceToken = async () => {
    setIsGenerating(false);
    setIsGenerating(true);
    try {
      const response = await apiClient.post('/api/v1/worker/token', {
        deviceInfo: typeof window !== 'undefined' ? window.navigator.userAgent : 'Web Browser'
      });
      if (response.data && response.data.token) {
        setToken(response.data.token);
        toast.success('Token de dispositivo gerado!');
      }
    } catch (error: any) {
      console.error('Erro ao gerar token via API:', error);
      const fallbackToken = 'device_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setToken(fallbackToken);
      toast.info('API indisponível. Gerado token temporário local.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Ao gerar o token, avança automaticamente pro próximo passo — reduz a
  // ação do usuário de "abrir + fechar manualmente cada etapa" pra zero.
  useEffect(() => {
    if (token && openStep === 'token') {
      setOpenStep('instalacao');
      setVisitedSteps((prev) => (prev.includes('instalacao') ? prev : [...prev, 'instalacao']));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleStep = (id: string) => {
    setOpenStep((prev) => (prev === id ? '' : id));
    setVisitedSteps((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const getPowerShellCommand = () => {
    const activeToken = token || "SEU_TOKEN_AQUI";
    return `powershell -ExecutionPolicy Bypass -File .\\setup.ps1 -Token "${activeToken}" -ApiUrl "${apiBaseUrl}"`;
  };

  const getMacConfigJson = () => {
    const activeToken = token || "SEU_TOKEN_AQUI";
    return JSON.stringify({
      token: activeToken,
      api_url: apiBaseUrl,
      credentials_path: ".env",
      device_id: ""
    }, null, 4);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Configuração do Agente</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-tighter text-xs">
          Instale o executor de apostas local para comunicar o seu celular com a API
        </p>
      </header>

      {/* Caixa de Avisos Críticos baseados nos cards do design system */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-500">
          <ListChecks className="h-5 w-5" />
          <h3 className="text-xs font-black uppercase tracking-widest">Requisitos Críticos do Celular</h3>
        </div>
        <ul className="text-xs font-bold text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside">
          <li>
            <strong className="text-slate-900 dark:text-slate-300">Apenas Celular Android Físico:</strong> Emuladores são detectados pelo Bet365 e geram banimento da conta.
          </li>
          <li>
            <strong className="text-slate-900 dark:text-slate-300">Tela Sempre Ativa:</strong> Ative &quot;Stay awake&quot; nas Opções do Desenvolvedor do Android para que o Maestro consiga simular cliques.
          </li>
          <li>
            <strong className="text-slate-900 dark:text-slate-300">Controle Mãos Livres:</strong> Não toque no aparelho durante a execução da aposta para não corromper o fluxo.
          </li>
        </ul>
      </section>

      {/* Trilha de progresso — dá a sensação de wizard guiado em vez de 4 blocos soltos */}
      <div className="flex items-center gap-2 px-1">
        {STEP_ORDER.map((id, index) => {
          const isDone = id === 'token' ? Boolean(token) : visitedSteps.includes(id) && openStep !== id;
          const isActive = openStep === id;
          return (
            <React.Fragment key={id}>
              <div
                className={cn(
                  'h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black transition-colors',
                  isDone
                    ? 'bg-brand-600 text-white'
                    : isActive
                      ? 'bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border-2 border-brand-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              {index < STEP_ORDER.length - 1 && (
                <div className={cn('h-0.5 flex-1 rounded-full', isDone ? 'bg-brand-600' : 'bg-slate-100 dark:bg-slate-800')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Accordion dos Passos de Instalação */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">

        {/* PASSO 1: Token de Dispositivo */}
        <div>
          <div
            onClick={() => toggleStep('token')}
            className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/50">
                <KeyRound className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">1. Token do Dispositivo</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Entenda e gere sua chave de identificação na API</p>
              </div>
            </div>
            {openStep === 'token' ? (
              <ChevronUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </div>

          {openStep === 'token' && (
            <div className="px-5 pb-5 pl-18 space-y-3.5">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                <p className="mb-2">
                  <strong className="text-slate-900 dark:text-slate-300">O que é este Token?</strong>
                </p>
                O Token de Dispositivo é uma chave persistente que permite ao seu executor de apostas local (agente de background) se autenticar e comunicar com a nossa API com total autonomia.
                Isso protege sua conta, pois <strong className="text-slate-900 dark:text-slate-300">elimina a necessidade de fazer logins manuais interativos no terminal ou armazenar senhas do Google em scripts locais</strong>.
              </div>

              <div className="flex gap-3 items-center">
                <button
                  onClick={generateDeviceToken}
                  disabled={isGenerating}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm shrink-0 disabled:opacity-50"
                >
                  Gerar Token
                </button>
                <input
                  type="text"
                  readOnly
                  placeholder="Seu token aparecerá aqui..."
                  value={token}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs font-mono text-brand-600 dark:text-brand-400 focus:outline-none font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* PASSO 2: Instalação por plataforma */}
        <div>
          <div
            onClick={() => toggleStep('instalacao')}
            className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/50">
                <Download className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">2. Baixar e Configurar Agente</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Instale as ferramentas com base no seu sistema operacional</p>
              </div>
            </div>
            {openStep === 'instalacao' ? (
              <ChevronUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </div>

          {openStep === 'instalacao' && (
            <div className="px-5 pb-5 pl-18 space-y-4">
              {/* Seletor de abas OS */}
              <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <button
                  onClick={() => setPlatform('windows')}
                  className={cn(
                    "px-4 py-1.5 text-xs font-black uppercase tracking-wider border rounded-lg transition-all flex items-center gap-2",
                    platform === 'windows'
                      ? "bg-slate-900 dark:bg-slate-950 border-slate-900 dark:border-slate-800 text-white"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Laptop className="h-4 w-4" /> Windows
                </button>
                <button
                  onClick={() => setPlatform('mac')}
                  className={cn(
                    "px-4 py-1.5 text-xs font-black uppercase tracking-wider border rounded-lg transition-all flex items-center gap-2",
                    platform === 'mac'
                      ? "bg-slate-900 dark:bg-slate-950 border-slate-900 dark:border-slate-800 text-white"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Monitor className="h-4 w-4" /> macOS
                </button>
              </div>

              {platform === 'windows' ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-normal">
                    Baixe o instalador automatizado do PowerShell e execute em um console no seu terminal:
                  </p>
                  <div className="flex items-center gap-4">
                    <a
                      href="/install/setup.ps1"
                      download="setup.ps1"
                      className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-950 hover:bg-slate-900 dark:hover:bg-slate-900 border border-slate-800 dark:border-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Baixar setup.ps1</span>
                    </a>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-tighter">API:</span>
                      <input
                        type="text"
                        value={apiBaseUrl}
                        onChange={(e) => setApiBaseUrl(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-brand-600 focus:outline-none w-40"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Comando para executar no Windows:</span>
                    <CommandBlock command={getPowerShellCommand()} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-normal">
                      1. Instale o ADB (Android Debug Bridge) via Homebrew no Terminal:
                    </p>
                    <CommandBlock command="brew install android-platform-tools" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-normal">
                      2. Instale o Maestro CLI:
                    </p>
                    <CommandBlock command="curl -Ls &quot;https://get.maestro.mobile.dev&quot; | bash" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-normal">
                      3. Crie uma pasta, salve o arquivo do agente e crie o <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs text-slate-900 dark:text-slate-100">config.json</code>:
                    </p>
                    <a
                      href="/install/agent.py"
                      download="agent.py"
                      className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-950 hover:bg-slate-900 dark:hover:bg-slate-900 border border-slate-800 dark:border-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Baixar agent.py</span>
                    </a>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Conteúdo do arquivo config.json local:</span>
                      <CommandBlock command={getMacConfigJson()} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PASSO 3: Credenciais Locais */}
        <div>
          <div
            onClick={() => toggleStep('credenciais')}
            className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/50">
                <ShieldCheck className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">3. Configurar Credenciais Locais</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Credenciais da Bet365 permanecem restritas ao computador</p>
              </div>
            </div>
            {openStep === 'credenciais' ? (
              <ChevronUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </div>

          {openStep === 'credenciais' && (
            <div className="px-5 pb-5 pl-18 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                Crie um arquivo chamado <code className="font-mono bg-slate-100 dark:bg-slate-800 text-xs px-1.5 py-0.5 rounded text-slate-900 dark:text-slate-100">.env</code> na mesma pasta do agente e configure seu acesso:
              </p>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 block font-bold"># Arquivo .env</span>
                <span className="text-brand-600 dark:text-brand-400">BET365_EMAIL</span>=seu_email@provedor.com<br />
                <span className="text-brand-600 dark:text-brand-400">BET365_PASSWORD</span>=sua_senha_segura_da_bet365
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-normal">
                  Privacidade Total: Seus dados de login Bet365 são lidos localmente pelo script do Maestro e jamais trafegam ou passam pelo portal ou pela API em nuvem.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PASSO 4: Executar */}
        <div>
          <div
            onClick={() => toggleStep('execucao')}
            className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/50">
                <Smartphone className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">4. Executar e Conectar Celular</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Inicie a automação do executor local</p>
              </div>
            </div>
            {openStep === 'execucao' ? (
              <ChevronUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </div>

          {openStep === 'execucao' && (
            <div className="px-5 pb-5 pl-18 space-y-4">
              <ol className="space-y-2.5 list-decimal list-inside text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                <li>Conecte o seu celular físico Android no cabo USB do computador.</li>
                <li>Ative a Depuração USB e aceite o prompt de permissão RSA na tela do celular.</li>
                <li>Confirme a conexão executando <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs text-slate-900 dark:text-slate-100">adb devices</code> no terminal.</li>
                <li>Inicie o agente com o comando abaixo no terminal da pasta de trabalho:</li>
              </ol>
              <CommandBlock command="python3 agent.py" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
