// --- Auth & Generic ---
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  size: number;
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

// --- Financeiro (endpoints /api/v1/financeiro) ---

export interface LucroMensalItem {
  mes: string;
  valor: number;
}

export interface MetaFinanceiraItem {
  tipo: string; // 'lucro' | 'perda'
  valorAtual: number;
  metaOuLimite: number;
  periodo: string; // 'mensal' | 'semanal' | 'diario'
}

export interface SaldoCasaItem {
  casa: string;
  valor: number;
  statusSincronizacao: string; // 'SINCRONIZADO' | 'MANUAL'
}

export interface PontoSaldo {
  data: string; // "YYYY-MM-DD"
  saldo: number;
}

export interface TopMercadoItem {
  mercado: string;
  linha: string;
  totalPernas: number;
  pernasGanhas: number;
  winRate: number; // 0-100
}

export interface FluxoCaixaItem {
  saldoInicial: number;
  depositos: number;
  saques: number;
  ganhos: number;
  perdas: number;
  stakesEmAberto: number;
  saldoFinal: number;
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
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}

export interface DashboardLeagueGames {
  league: string;
  matches: DashboardLeagueMatch[];
}

// Shape real de GET /api/v1/dashboard/matches/{fixtureId}
export interface MatchBetLeg {
  market: string | null;
  selection: string | null;
  odds: number | null;
  modelProb: number | null;
  fairOdd: number | null;
  edge: number | null;
  stake: number | null;
  won: boolean | null;
  status: string | null;
}

export interface MatchDetail {
  fixtureId: number;
  archetype: string | null;
  archetypeConfidence: number | null;
  legs: MatchBetLeg[];
}

// Shape real de GET /api/v1/dashboard/matches/{fixtureId}/insights
export interface RecentFormEntry {
  fixtureId: number;
  date: string;
  opponentName: string;
  teamScore: number | null;
  opponentScore: number | null;
  result: 'W' | 'D' | 'L';
}

export interface TeamAverages {
  goalsForAverage: number;
  goalsAgainstAverage: number;
  cornersAverage: number;
}

export interface TeamInsights {
  teamId: number | null;
  teamName: string | null;
  recentForm: RecentFormEntry[];
  averages: TeamAverages | null;
}

export interface MarketSelection {
  selection: string;
  odd: number;
  bookmakerName: string;
}

export interface MarketOdds {
  marketType: string;
  marketLabel: string;
  selections: MarketSelection[];
}

export interface MatchInsights {
  fixtureId: number;
  homeTeam: TeamInsights;
  awayTeam: TeamInsights;
  markets: MarketOdds[];
}

// --- Automação & Máquinas ---

// Shape real de GET /api/v1/automation/machines
export interface MachineStatusDTO {
  machineId: string;
  name: string;
  status: string; // "alive" | "connected" | "disconnected"
  lastPing: string; // ISO String
  currentTask: string | null;
}

export interface MachineStatusResponse {
  machines: MachineStatusDTO[];
}

// Shape real de GET /api/v1/automation/mini-server/status
export interface AutomationServerStatus {
  serverStatus: string; // "alive" | "disconnected" | "busy"
  heartbeat: string;    // ISO String
  lastSeen: string;     // ISO String
  serverVersion: string;
}

// Shape real de GET /api/v1/automation/device/status
export interface AutomationDeviceStatus {
  status: string;       // "connected" | "disconnected"
  model: string;
  appVersion: string;
  batteryLevel: number;
  uptime: string;
}

// Shape real de GET /api/v1/automation/logs/recent e SSE /logs/stream
export interface AutomationLogEvent {
  logType: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
  jobId: string;
  timestamp: string; // ISO String
}

// Tipo legado mantido por compatibilidade com o arquivo automation.ts existente
export interface Machine {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen: string;
  type: 'SERVER' | 'DEVICE';
  ip?: string;
}

// Shape canônico do contrato: GET /api/v1/bets/daily-generation
// A API só envia `description` nas seleções. `visual_target`,
// `previous_visual_target` e `column_index` são derivados no worker
// (mapper.py) e NÃO trafegam no JSON.
export interface WorkerBetSelection {
  description: string;
  period?: string;
  team_filter?: string;
}

export interface WorkerBetMarket {
  market_name: string;
  selections: WorkerBetSelection[];
}

export interface WorkerBetMatch {
  match_id: number;
  match_name: string;
  markets: WorkerBetMarket[];
}

export interface WorkerBetTicket {
  ticket_id: string;
  category: 'SAFE' | 'MEDIUM' | 'RISKY';
  type: 'SINGLE' | 'MULTIPLE';
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  stake: number;
  total_odd: number;
  matches: WorkerBetMatch[];
}

export interface BetWorkerJsonResponse {
  batch_id: string;
  global_stake: number;
  tickets: WorkerBetTicket[];
}

// --- Histórico (Tickets) ---

export type TicketHistoryPeriod = 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'custom';

// Shape real de GET /api/v1/tickets/history (granularidade de 1 linha por TICKET,
// não por perna/mercado — não existe paginação nesse endpoint).
export interface TicketHistoryItem {
  ticketId: string;
  date: string; // "YYYY-MM-DD"
  amountWagered: number;
  result: 'WIN' | 'LOSS' | 'VOID' | 'PENDING';
  profitLoss: number;
}

export interface TicketHistoryResponse {
  period: TicketHistoryPeriod;
  totalTickets: number;
  tickets: TicketHistoryItem[];
}

export interface CreateTicketPayload {
  matchId: number;
  stake: number;
  odd: number;
  status: 'WIN' | 'LOSS' | 'PENDING';
  type: string; // GOALS, CORNERS, BTTS, etc.
}
