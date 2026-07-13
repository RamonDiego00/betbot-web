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

// Shape real de GET /api/v1/historico-apostas (campo por campo do BetHistoryItemDTO)
export interface BetHistoryItem {
  id: string;
  date: string;         // ISO String (OffsetDateTime serializado)
  match: string;        // "Home vs Away"
  homeTeam: string | null;
  awayTeam: string | null;
  league: string | null;
  market: string;
  selection: string;
  odd: number;          // atenção: API usa "odd" (sem 's')
  stake: number;
  stakeDisplay: string;
  status: 'WIN' | 'LOSS' | 'PENDING' | 'VOID'; // BetStatus da API
  profit: number | null;
  profitDisplay: string | null;
}

// Tipo normalizado para consumo nas páginas (evita `odd` vs `odds` e `status` vs `result`)
export interface Ticket {
  id: string;
  date: string;
  market: string;
  selection: string;
  odds: number;         // normalizado de `odd`
  stake: number;
  profit: number;
  result: 'WIN' | 'LOSS' | 'VOID' | 'PENDING'; // normalizado de `status`
}

export interface CreateTicketPayload {
  matchId: number;
  stake: number;
  odd: number;
  status: 'WIN' | 'LOSS' | 'PENDING';
  type: string; // GOALS, CORNERS, BTTS, etc.
}

// --- Estratégia & Analytics ---

// Shape real de GET /api/v1/analytics/markets (MarketStatsDTO)
export interface MarketStatsRaw {
  market: string;
  roi: number;
  lucroTotal: number;
  winRate: number;
  quantidadeApostas: number;
}

// Tipo normalizado para consumo na página de analytics
export interface StrategyPerformance {
  strategyName: string;
  totalBets: number;
  profit: number;
  roi: number;
  ranking: number;
  winRate: number;
}
