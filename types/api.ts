// --- Auth & Generic ---
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// --- Dashboard & Financeiro ---

export interface DailyStats {
  total: number;
  won: number;
  lost: number;
  pending: number;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyProfit: number;
  monthlyLoss: number;
  overallRoi: number;
  dailyStats: DailyStats;
}

export interface Bankroll {
  id: string;
  provider: string;
  balance: number;
  lastSync: string; // ISO String
}

export interface FinancialSummary {
  totalProfit: number;
  totalLoss: number;
  roiPercentage: number;
  averageStake: number;
  bookmakerBalances: {
    bookmakerName: string;
    currentBalance: number;
  }[];
}

export interface FinancialSetupPayload {
  initialBalance: number;
  defaultStake: number;
  targetRoi: number;
}

// --- Games & Matches ---

export interface Game {
  fixtureId: number;
  homeTeam: string;
  homeTeamLogo?: string;
  awayTeam: string;
  awayTeamLogo?: string;
  league: string;
  leagueLogo?: string;
  matchTime: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  odds?: Record<string, number>;
}

export interface DashboardLeagueMatch {
  home: string;
  away: string;
  match_id: number;
  date: string; // ISO String
  status: string;
  homeScore?: number;
  awayScore?: number;
}

export interface DashboardLeagueGames {
  league: string;
  matches: DashboardLeagueMatch[];
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

export interface WorkerBetSelection {
  visual_target: string;
  previous_visual_target: string;
  column_index: number;
  description: string;
  odd?: number; // @JsonIgnore in API but maybe present in some contexts
  confidence?: number;
}

export interface WorkerBetMarket {
  market_name: string;
  selections: WorkerBetSelection[];
}

export interface WorkerBetMatch {
  match_id: number;
  match_name: string;
  markets: WorkerBetMarket[];
  league?: string;
  eventStart?: string;
}

export interface BetWorkerJsonResponse {
  batch_id: string;
  global_stake: number;
  matches: WorkerBetMatch[];
  generatedAt?: string; // ISO String
  totalSelections?: number;
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

export interface CreateTicketPayload {
  matchId: number;
  stake: number;
  odd: number;
  status: 'WIN' | 'LOSS' | 'PENDING';
  type: string; // GOALS, CORNERS, BTTS, etc.
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
