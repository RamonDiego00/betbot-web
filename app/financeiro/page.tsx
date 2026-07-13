"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Search,
  Filter,
  Loader2,
  Wallet,
  CheckCircle2,
  FileText,
  Upload,
  ShieldCheck,
  Ban,
  Percent,
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
  SaldoCasaItem,
} from '@/types/api';

export default function Financeiro() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [saldos, setSaldos] = useState<SaldoCasaItem[]>([]);
  const [lucroMensal, setLucroMensal] = useState<LucroMensalItem[]>([]);
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
        const [summaryData, saldosData, lucroData] = await Promise.allSettled([
          dashboardService.getSummary(),
          financeiroService.getSaldos(),
          financeiroService.getLucroMensal(),
        ]);

        if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
        if (saldosData.status === 'fulfilled') setSaldos(saldosData.value);
        if (lucroData.status === 'fulfilled') setLucroMensal(lucroData.value);
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
      toast.error('Selecione o período e o arquivo do comprovante (print ou PDF).');
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

  // Repasse da plataforma: 20% do lucro declarado no comprovante do mês corrente
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const comprovanteDoMes = comprovantes.find((c) => c.period === currentPeriod);
  const lucroDeclaradoDoMes = comprovanteDoMes?.declaredProfit ?? null;
  const repasseDoMes = lucroDeclaradoDoMes != null ? Math.max(lucroDeclaradoDoMes, 0) * 0.20 : null;

  const overviewCards = summary ? [
    {
      label: 'Saldo Total',
      value: `R$ ${(summary.totalBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    },
    {
      label: 'Lucro do Mês',
      value: `R$ ${(summary.monthlyProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: ArrowUpRight,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    },
    {
      label: 'ROI Geral',
      value: `${summary.overallRoi || 0}%`,
      icon: ArrowUpRight,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
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
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Financeiro</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-tighter">Acompanhe seus saldos, lucros e o repasse da plataforma.</p>
        </div>
      </header>

      {/* BLOCO 1: Overview Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          {overviewCards.map((card, idx) => (
            <div key={idx} className={cn("p-5 rounded-xl flex items-center gap-4 shadow-sm", card.bg)}>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/50">
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">{card.label}</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{card.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico de barras — dados reais da API */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Histórico de Lucro por Mês</h3>
          </div>
          {lucroMensal.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-xs text-slate-400 dark:text-slate-500 italic font-bold">Sem dados mensais</div>
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
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-black py-1.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 uppercase tracking-tighter">
                      R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{data.mes}</span>
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
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Saldos por Casa</h3>
            <div className="flex items-center gap-3">
              <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Search className="h-4 w-4" /></button>
              <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Filter className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Plataforma</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Moeda</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saldo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {saldos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">Nenhum saldo encontrado.</td>
                    </tr>
                  ) : saldos.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">{s.casa}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">BRL</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-slate-100">
                        {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-450" />
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-450 uppercase tracking-tighter">{s.statusSincronizacao}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BLOCO 3: Repasse da Plataforma */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest px-1">Repasse da Plataforma (20%)</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            {repasseDoMes != null ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-450">{currentMonthLabel}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lucro Declarado</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    R$ {(lucroDeclaradoDoMes ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Valor do Repasse</p>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                    R$ {repasseDoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-xs font-bold leading-relaxed text-slate-500 dark:text-slate-400">
                  20% do lucro declarado no comprovante de {currentMonthLabel}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <Percent className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-xs font-bold leading-relaxed text-slate-500 dark:text-slate-400">
                  {comprovanteDoMes
                    ? 'O comprovante deste mês foi enviado sem lucro declarado. Reenvie informando o lucro para calcular o repasse.'
                    : 'Envie o comprovante do mês na seção abaixo para calcular o repasse.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOCO 4: Comprovante de Lucro Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Enviar Comprovante de Lucro</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Período</label>
              <input
                type="month"
                value={uploadPeriod}
                onChange={(e) => setUploadPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Lucro Declarado (opcional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$ 0,00"
                value={uploadProfit}
                onChange={(e) => setUploadProfit(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Arquivo (print ou PDF)</label>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs font-bold text-slate-700 dark:text-slate-400 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-slate-200 dark:file:border-slate-800 file:bg-slate-50 dark:file:bg-slate-800 file:text-xs file:font-black file:uppercase file:tracking-wider file:text-slate-900 dark:file:text-slate-100 hover:file:bg-slate-100 dark:hover:file:bg-slate-700 file:cursor-pointer cursor-pointer"
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
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest px-1">Meus Comprovantes</h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Período</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Enviado em</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lucro Declarado</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Arquivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comprovantes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">Nenhum comprovante enviado ainda.</td>
                    </tr>
                  ) : comprovantes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">{c.period}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {new Date(c.uploadedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-slate-100">
                        {c.declaredProfit != null
                          ? `R$ ${c.declaredProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenComprovante(c.id)}
                          disabled={openingId === c.id}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-tighter disabled:opacity-50"
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
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Cobrança — Todos os Usuários</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Usuário</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Período</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lucro Declarado</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Arquivo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adminComprovantes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">Nenhum comprovante enviado ainda.</td>
                    </tr>
                  ) : adminComprovantes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">{c.userName}</span>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{c.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-slate-700 dark:text-slate-300">{c.period}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-slate-100">
                        {c.declaredProfit != null
                          ? `R$ ${c.declaredProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenComprovante(c.id)}
                          disabled={openingId === c.id}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-tighter disabled:opacity-50"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {openingId === c.id ? 'Abrindo...' : c.fileName}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {c.userStatus === 'ACTIVE' ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-450" />
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-455 uppercase tracking-tighter">Ativo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Ban className="h-3.5 w-3.5 text-rose-600 dark:text-rose-450" />
                            <span className="text-[10px] font-black text-rose-700 dark:text-rose-455 uppercase tracking-tighter">Bloqueado</span>
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
                              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
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


