"use client";

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ListChecks,
  Download,
  Terminal,
  Smartphone,
  KeyRound,
  ShieldCheck,
  PlayCircle,
  Rocket,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandBlockProps {
  command: string;
}

const CommandBlock = ({ command }: CommandBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Falha ao copiar comando:', error);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
      <pre className="text-xs font-mono font-bold text-slate-700 whitespace-pre-wrap break-all">{command}</pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar comando"
        className={cn(
          "shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-colors",
          copied
            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
};

interface Step {
  id: string;
  icon: React.ElementType;
  title: string;
  summary: string;
  content: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: 'prerequisitos',
    icon: ListChecks,
    title: '1. Pré-requisitos',
    summary: 'O que você precisa antes de começar',
    content: (
      <ul className="space-y-3">
        <li className="flex items-start gap-3">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-sm text-slate-600 font-medium">Python 3.9 ou superior instalado</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-sm text-slate-600 font-medium">
            macOS ou Linux — <strong className="text-slate-800">não há suporte documentado para Windows</strong>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-sm text-slate-600 font-medium">Maestro CLI (instalação no próximo passo)</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-sm text-slate-600 font-medium">ADB (Android Debug Bridge) instalado e no PATH</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-sm text-slate-600 font-medium">Um device Android físico, versão 10 ou superior</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-sm text-slate-600 font-medium">Chrome instalado no device</span>
        </li>
      </ul>
    ),
  },
  {
    id: 'clonar',
    icon: Download,
    title: '2. Clonar e instalar dependências',
    summary: 'Baixe o repositório e instale os pacotes Python',
    content: (
      <div className="space-y-3">
        <CommandBlock command="git clone https://github.com/RamonDiego00/betbot-worker.git" />
        <CommandBlock command="cd betbot-worker" />
        <CommandBlock command="pip install -r requirements.txt" />
      </div>
    ),
  },
  {
    id: 'maestro',
    icon: Terminal,
    title: '3. Instalar o Maestro CLI',
    summary: 'Ferramenta que executa os flows de automação no device',
    content: (
      <div className="space-y-3">
        <CommandBlock command={'curl -Ls "https://get.maestro.mobile.dev" | bash'} />
        <p className="text-xs text-slate-400 font-medium">
          O instalador adiciona o binário <code className="font-mono">maestro</code> ao seu PATH. Abra um novo terminal depois de instalar.
        </p>
      </div>
    ),
  },
  {
    id: 'android',
    icon: Smartphone,
    title: '4. Conectar o Android',
    summary: 'Ativar depuração USB e autorizar o device',
    content: (
      <div className="space-y-4">
        <ol className="space-y-3 list-decimal list-inside">
          <li className="text-sm text-slate-600 font-medium">
            Ative as <strong className="text-slate-800">Opções do Desenvolvedor</strong> — toque 7 vezes em &quot;Número da versão&quot; nas Configurações do Android.
          </li>
          <li className="text-sm text-slate-600 font-medium">
            Dentro de Opções do Desenvolvedor, ative a <strong className="text-slate-800">Depuração USB</strong>.
          </li>
          <li className="text-sm text-slate-600 font-medium">Conecte o device ao computador via cabo USB.</li>
          <li className="text-sm text-slate-600 font-medium">
            Autorize a impressão digital RSA que aparece na tela do celular.
          </li>
          <li className="text-sm text-slate-600 font-medium">
            Confirme rodando o comando abaixo — o device deve aparecer como <code className="font-mono">device</code>, não <code className="font-mono">unauthorized</code>.
          </li>
        </ol>
        <CommandBlock command="adb devices" />
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-black text-amber-700 uppercase tracking-wide">Dicas práticas</span>
          </div>
          <ul className="space-y-1.5 pl-1">
            <li className="text-xs text-amber-800 font-medium">Desative o bloqueio de tela do device.</li>
            <li className="text-xs text-amber-800 font-medium">
              Ou ative &quot;Stay awake&quot; nas Opções do Desenvolvedor — mantém a tela ligada enquanto o device está carregando.
            </li>
            <li className="text-xs text-amber-800 font-medium">
              Deixe o Chrome aberto no bet365, já logado, numa aba só.
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'credenciais',
    icon: KeyRound,
    title: '5. Configurar credenciais',
    summary: 'Copiar o .env.example e preencher com seus dados',
    content: (
      <div className="space-y-3">
        <CommandBlock command="cp .env.example .env" />
        <p className="text-sm text-slate-600 font-medium">
          Preencha o arquivo <code className="font-mono">.env</code> com email, senha e código de acesso do bet365.
        </p>
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-800 font-bold leading-snug">
            Essas credenciais ficam salvas só na sua máquina — nunca são enviadas para este portal nem para a API.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'teste',
    icon: PlayCircle,
    title: '6. Teste seguro (sem apostar)',
    summary: 'Validar Maestro + device + Chrome + bet365 sem apostar de verdade',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-600 font-medium">
          Rode um flow isolado de login para confirmar que toda a cadeia — Maestro, device, Chrome e bet365 — está funcionando, sem chegar a colocar nenhuma aposta.
        </p>
        <CommandBlock command="./run_flow.sh login/login-credentials.yaml" />
      </div>
    ),
  },
  {
    id: 'rodar',
    icon: Rocket,
    title: '7. Rodar de verdade',
    summary: 'Iniciar o worker e conectar com a API',
    content: (
      <div className="space-y-3">
        <CommandBlock command="python worker.py" />
        <p className="text-xs text-slate-400 font-medium">
          Por padrão o worker conecta em <code className="font-mono">http://localhost:8080</code>. Para apontar para produção,
          defina <code className="font-mono">BETBOT_API_BASE_URL</code> no <code className="font-mono">.env</code> como{' '}
          <code className="font-mono">https://betbotapi.onrender.com</code>.
        </p>
      </div>
    ),
  },
];

export default function Setup() {
  const [openSteps, setOpenSteps] = useState<string[]>([STEPS[0].id]);

  const toggleStep = (id: string) =>
    setOpenSteps((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Guia de Setup</h2>
        <p className="text-slate-500 mt-1 font-medium">
          Instale e configure o <code className="font-mono text-slate-700">betbot-worker</code> — o executor que roda no seu Android via Maestro.
        </p>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-50">
        {STEPS.map((step) => {
          const isOpen = openSteps.includes(step.id);
          const Icon = step.icon;

          return (
            <div key={step.id}>
              <div
                onClick={() => toggleStep(step.id)}
                className="p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{step.title}</p>
                    <p className="text-xs text-slate-400 font-medium">{step.summary}</p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </div>

              {isOpen && <div className="px-6 pb-6 pl-[4.5rem]">{step.content}</div>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
