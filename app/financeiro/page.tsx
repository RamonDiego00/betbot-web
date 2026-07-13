"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Wallet,
  CheckCircle2,
  FileText,
  Upload,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { financeiroService } from '@/lib/api/services/financeiro';
import { dashboardService } from '@/lib/api/services/dashboard';
import { adminService } from '@/lib/api/services/admin';
import {
  AdminBillingStatement,
  BillingStatement,
  DashboardSummary,
  LucroMensalItem,
  MetaFinanceiraItem,
  SaldoCasaItem,
} from '@/types/api';

// --- TIPOS ---
interface ProgressCircleProps {
  current: number;
  target: number;
  label: string;
  color: string;
}

// --- COMPONENTES AUXILIARES ---

const ProgressCircle = ({ current, target, label, color }: ProgressCircleProps) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-800 shadow-sm">
      <div className="relative h-24 w-24 flex items-center justify-center">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle className="text-slate-100 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
          <circle
            className={cn("stroke-current transition-all duration-1000", color)}
            strokeWidth="8"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (percentage / 100) * 251.2}
            strokeLinecap="round"
            fill="transparent"
            r="40" cx="50" cy="50"
          />
        </svg>
        <span className="absolute text-xs font-black text-slate-900">{Math.round(percentage)}%</span>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-slate-900 uppercase">
          R$ {current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
};

export default function Financeiro() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [saldos, setSaldos] = useState<SaldoCasaItem[]>([]);
  const [lucroMensal, setLucroMensal] = useState<LucroMensalItem[]>([]);
  const [metas, setMetas] = useState<MetaFinanceiraItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Comprovante de lucro mensal ---
  const [comprovantes, setComprovantes] = useState<BillingStatement[]>([]);
  const [uploadPeriod, setUploadPeriod] = useState('');
  const [uploadProfit, setUploadProfit] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // --- Admin: cobrança de todos os usuários ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminComprovantes, setAdminComprovantes] = useState<AdminBillingStatement[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadComprovantes = async () => {
    try {
      const data = await financeiroService.getMeusComprovantes();
      setComprovantes(data);
    } catch (error) {
      console.error('Error fetching comprovantes:', error);
    }
  };

  const loadAdminComprovantes = async () => {
    try {
      const data = await adminService.getTodosComprovantes();
      setAdminComprovantes(data);
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryData, saldosData, lucroData, metasData] = await Promise.allSettled([
          dashboardService.getSummary(),
          financeiroService.getSaldos(),
          financeiroService.getLucroMensal(),
          financeiroService.getMetas(),
        ]);

        if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
        if (saldosData.status === 'fulfilled') setSaldos(saldosData.value);
        if (lucroData.status === 'fulfilled') setLucroMensal(lucroData.value);
        if (metasData.status === 'fulfilled') setMetas(metasData.value);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    loadComprovantes();
    loadAdminComprovantes();
  }, []);

  const handleUploadComprovante = async () => {
    if (!uploadPeriod || !uploadFile) {
      toast.error('Selecione o período e o arquivo PDF do comprovante.');
      return;
    }
    setUploading(true);
    try {
      const declaredProfit = uploadProfit.trim() !== '' ? Number(uploadProfit) : undefined;
      await financeiroService.uploadComprovante(uploadPeriod, uploadFile, declaredProfit);
      toast.success('Comprovante enviado com sucesso!');
      setUploadPeriod('');
      setUploadProfit('');
      setUploadFile(null);
      await loadComprovantes();
    } catch (error) {
      console.error('Error uploading comprovante:', error);
      toast.error('Falha ao enviar o comprovante. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenComprovante = async (id: string) => {
    setOpeningId(id);
    try {
      const blob = await financeiroService.getComprovanteFile(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening comprovante:', error);
      toast.error('Falha ao abrir o comprovante.');
    } finally {
      setOpeningId(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: 'ACTIVE' | 'SUSPENDED') => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUpdatingUserId(userId);
    try {
      await adminService.updateUserStatus(userId, nextStatus);
      setAdminComprovantes((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, userStatus: nextStatus } : c))
      );
      toast.success(nextStatus === 'ACTIVE' ? 'Usuário reativado.' : 'Usuário bloqueado.');
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Falha ao atualizar o status do usuário.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const maxLucro = lucroMensal.length > 0 ? Math.max(...lucroMensal.map((d) => Math.abs(d.valor)), 1) : 1;

  const metaLucro = metas.find((m) => m.tipo === 'lucro');
  const metaPerda = metas.find((m) => m.tipo === 'perda');

  const overviewCards = summary ? [
    {
      label: 'Saldo Total',
      value: `R$ ${(summary.totalBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-indigo-600',
      bg: 'bg-white border border-slate-800',
    },
    {
      label: 'Lucro Total',
      value: `R$ ${(summary.monthlyProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: ArrowUpRight,
      color: 'text-emerald-700',
      bg: 'bg-white border border-slate-800',
    },
    {
      label: 'ROI Geral',
      value: `${summary.overallRoi || 0}%`,
      icon: ArrowUpRight,
      color: 'text-amber-600',
      bg: 'bg-white border border-slate-800',
    },
  ] : [];

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Financeiro</h2>
          <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-tighter">Gerencie seus depósitos, saques e metas financeiras.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-800 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
            <Plus className="h-4 w-4" /> Novo Registro
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm">
            Exportar Relatório
          </button>
        </div>
      </header>

      {/* BLOCO 1: Overview Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          {overviewCards.map((card, idx) => (
            <div key={idx} className={cn("p-5 rounded-xl flex items-center gap-4 shadow-sm", card.bg)}>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-800/10">
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico de barras — dados reais da API */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Histórico de Lucro por Mês</h3>
          </div>
          {lucroMensal.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-xs text-slate-400 italic font-bold">Sem dados mensais</div>
          ) : (
            <div className="flex items-end justify-between h-40 px-2 gap-4">
              {lucroMensal.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                  <div
                    className={cn(
                      "w-full rounded-t hover:opacity-80 transition-all cursor-help relative group",
                      data.valor >= 0 ? "bg-indigo-500 hover:bg-indigo-600" : "bg-rose-400 hover:bg-rose-500"
                    )}
                    style={{ height: `${(Math.abs(data.valor) / maxLucro) * 100}%`, minHeight: '4px' }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-1.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 uppercase tracking-tighter">
                      R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{data.mes}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 2: Saldos por Casa */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Saldos por Casa</h3>
            <div className="flex items-center gap-3">
              <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Search className="h-4 w-4" /></button>
              <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Filter className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plataforma</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Moeda</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {saldos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-500 italic">Nenhum saldo encontrado.</td>
                    </tr>
                  ) : saldos.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black uppercase text-slate-700">{s.casa}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">BRL</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900">
                        {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">{s.statusSincronizacao}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BLOCO 3: Metas Financeiras — dados reais */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1">Metas e Limites</h3>
          <div className="grid grid-cols-1 gap-4">
            {metaLucro && (
              <ProgressCircle
                current={metaLucro.valorAtual}
                target={metaLucro.metaOuLimite}
                label="Meta de Lucro"
                color="text-emerald-500"
              />
            )}
            {metaPerda && (
              <ProgressCircle
                current={metaPerda.valorAtual}
                target={metaPerda.metaOuLimite}
                label="Limite de Perda"
                color="text-rose-500"
              />
            )}

            <div className="bg-white border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Dica de Gestão</span>
                </div>
                <p className="text-xs font-bold leading-relaxed text-slate-700">
                  {metaLucro && metaLucro.metaOuLimite > metaLucro.valorAtual ? (
                    <>Você está a <span className="font-black text-indigo-600">R$ {(metaLucro.metaOuLimite - metaLucro.valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> de atingir sua meta. Mantenha a disciplina na stake!</>
                  ) : (
                    <>Continue acompanhando suas metas para manter a saúde da banca.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 4: Comprovante de Lucro Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Enviar Comprovante de Lucro Mensal</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Período</label>
              <input
                type="month"
                value={uploadPeriod}
                onChange={(e) => setUploadPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-800 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lucro Declarado (opcional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$ 0,00"
                value={uploadProfit}
                onChange={(e) => setUploadProfit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-800 rounded-lg text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Arquivo PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs font-bold text-slate-700 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-slate-800 file:bg-slate-50 file:text-xs file:font-black file:uppercase file:tracking-wider file:text-slate-900 hover:file:bg-slate-100 file:cursor-pointer cursor-pointer"
              />
            </div>
            <button
              onClick={handleUploadComprovante}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Enviar
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1">Meus Comprovantes</h3>
          <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviado em</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Declarado</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Arquivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comprovantes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-500 italic">Nenhum comprovante enviado ainda.</td>
                    </tr>
                  ) : comprovantes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black uppercase text-slate-700">{c.period}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {new Date(c.uploadedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900">
                        {c.declaredProfit != null
                          ? `R$ ${c.declaredProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenComprovante(c.id)}
                          disabled={openingId === c.id}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-tighter disabled:opacity-50"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {openingId === c.id ? 'Abrindo...' : c.fileName}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 5: Admin — Cobrança (visível apenas para o Ramon) */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Cobrança — Todos os Usuários</h3>
          </div>
          <div className="bg-white rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Declarado</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Arquivo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminComprovantes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-500 italic">Nenhum comprovante enviado ainda.</td>
                    </tr>
                  ) : adminComprovantes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-900">{c.userName}</span>
                        <p className="text-[10px] font-bold text-slate-400">{c.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-slate-700">{c.period}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900">
                        {c.declaredProfit != null
                          ? `R$ ${c.declaredProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenComprovante(c.id)}
                          disabled={openingId === c.id}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-tighter disabled:opacity-50"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {openingId === c.id ? 'Abrindo...' : c.fileName}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {c.userStatus === 'ACTIVE' ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Ativo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Ban className="h-3.5 w-3.5 text-rose-600" />
                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-tighter">Bloqueado</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(c.userId, c.userStatus)}
                          disabled={updatingUserId === c.userId}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50",
                            c.userStatus === 'ACTIVE'
                              ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          )}
                        >
                          {updatingUserId === c.userId
                            ? '...'
                            : c.userStatus === 'ACTIVE' ? 'Bloquear' : 'Reativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


