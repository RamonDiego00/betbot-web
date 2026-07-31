import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PeriodPreset = 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'custom';

/** Mesma regra de resolução de período usada no backend (TicketPeriodAggregator.resolveRange),
 * replicada aqui só para exibição — a chamada real à API já manda o period/customRange como
 * parâmetro e o backend resolve a data de verdade. */
export function resolvePeriodRangeForDisplay(
  periodPreset: PeriodPreset,
  customRange: { start: string; end: string } | null,
): { start: string; end: string } {
  if (customRange) return customRange;

  // IMPORTANTE: usar getFullYear()/getMonth()/getDate() (hora LOCAL do navegador), nunca
  // toISOString() (que converte pra UTC e já causou bug de "dia errado" nesse projeto antes).
  const toLocalISO = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const today = new Date();
  switch (periodPreset) {
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const iso = toLocalISO(y);
      return { start: iso, end: iso };
    }
    case 'weekly': {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { start: toLocalISO(s), end: toLocalISO(today) };
    }
    case 'monthly': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: toLocalISO(s), end: toLocalISO(today) };
    }
    default: {
      const iso = toLocalISO(today);
      return { start: iso, end: iso };
    }
  }
}

/** Formata pra exibição: "DD/MM" se início=fim, senão "DD/MM até DD/MM". Espera strings "YYYY-MM-DD". */
export function formatPeriodRangeLabel(range: { start: string; end: string }): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  };
  return range.start === range.end ? fmt(range.start) : `${fmt(range.start)} até ${fmt(range.end)}`;
}
