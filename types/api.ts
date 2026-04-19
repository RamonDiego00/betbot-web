// --- Auth & Generic ---
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// --- Dashboard & Financeiro ---
export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO String
  league: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
}

export interface SummaryKPIs {
  totalProfit: number;
  totalBets: number;
  winRate: number;
  roi: number;
  currentBankroll: number;
}

export interface Bankroll {
  id: string;
  name: string;
  balance: number;
  currency: string;
  platform: string;
}

export interface FinancialSetupPayload {
  initialBankroll: number;
  riskPercentage: number;
  stopLoss: number;
  takeProfit: number;
}

// --- Automação & Máquinas ---
export interface Machine {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen: string; // ISO String
  type: 'SERVER' | 'DEVICE';
  ip?: string;
}

export interface WorkerBetEntry {
  matchName: string;
  market: string;
  selection: string;
  odd: number;
  league: string;
  confidence: number;
}

export interface BetWorkerJsonResponse {
  batchId: string;
  generatedAt: string; // ISO String
  totalSelections: number;
  matches: WorkerBetEntry[];
}

// --- Histórico (Tickets) ---
export interface Ticket {
  id: string;
  date: string;
  gameId: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  profit: number;
  result: 'WIN' | 'LOSS' | 'VOID' | 'PENDING';
}

// --- Estratégia & Analytics ---
export interface StrategyPerformance {
  strategyName: string;
  totalBets: number;
  profit: number;
  roi: number;
  ranking: number;
  winRate: number;
}
