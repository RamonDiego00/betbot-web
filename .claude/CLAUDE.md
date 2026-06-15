# BetBot Web — CLAUDE.md

## O que é este projeto

`betbot-web` é o **painel de controle frontend** de um ecossistema de automação de apostas esportivas. É um dashboard Next.js 16 que consome uma API Java e exibe visões operacionais sobre apostas, workers, finanças e estratégias.

Este projeto **não age sozinho** — ele é a camada de visualização de um conjunto maior:

```
betbot-web        ← este projeto (dashboard Next.js)
betbot-api        ← backend Java, porta 8080 (REST API)
betbot-worker     ← worker de automação Android via Maestro
```

O Ramon usa este painel para **monitorar e operar** a automação das apostas em tempo real.

---

## Estrutura do projeto

```
app/
  page.tsx              # Dashboard principal (KPIs, partidas, bankroll)
  layout.tsx            # Root layout + auth guard
  login/page.tsx        # Login Google OAuth + debug login
  auth/callback/page.tsx# Handler do callback OAuth
  automacao/page.tsx    # Status do worker Maestro + fila de comandos
  historico/page.tsx    # Histórico de apostas (tabela com filtro)
  financeiro/page.tsx   # Finanças, gráfico mensal, metas
  analytics/page.tsx    # Performance por estratégia + insights
  settings/page.tsx     # Preferências, integração Maestro, logout

components/
  Sidebar.tsx           # Navegação lateral fixa

lib/
  auth.ts               # Leitura/escrita do token JWT no localStorage
  utils.ts              # cn() para classNames
  api/
    client.ts           # Instância Axios com interceptors JWT e tratamento de erros
    services/
      auth.ts           # POST /api/v1/auth/debug-login
      dashboard.ts      # GET /api/v1/dashboard/{summary,bankrolls,games}
      automation.ts     # GET /api/v1/automation/machines + /api/v1/bets/daily-generation
      ticket.ts         # GET/POST /api/v1/tickets/history
      report.ts         # GET /api/v1/reports/strategy-performance

types/
  api.ts                # Todas as interfaces TypeScript dos DTOs do backend
```

---

## Tech stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2.3 (App Router) |
| UI | React 19 + TailwindCSS 4 |
| HTTP | Axios 1.15 com interceptors |
| Icons | lucide-react |
| Notificações | sonner (toasts) |
| Auth | Google OAuth2 via backend + localStorage JWT |
| Linguagem | TypeScript 5 (modo strict) |

---

## Autenticação

- Token armazenado em `localStorage` com chave `betbot_auth_token`
- Toda request já leva `Authorization: Bearer {token}` via interceptor do Axios
- 401 → toast "Sessão expirada" + logout + redirect para `/login`
- Não há refresh token implementado — 401 faz logout direto
- Debug login disponível em `NODE_ENV === development` (email hardcoded)

---

## API e proxy

O `next.config.ts` reescreve `/api/:path*` → `http://localhost:8080/api/:path*`.

Isso significa que **em desenvolvimento** o backend Java precisa estar rodando na porta 8080 localmente.

Variável de ambiente: `NEXT_PUBLIC_API_BASE_URL` (opcional, fallback para localhost:8080).

---

## Páginas e o que cada uma mostra

### `/` — Dashboard
Visão geral operacional do dia:
- 4 KPIs: Saldo total, Lucro mensal, Win Rate diário, Total apostas do dia
- Partidas do dia agrupadas por liga (accordion), com score ao vivo
- Painel de bankroll por casa de apostas

### `/automacao` — Automação
Monitor do worker Maestro no Android:
- Status do servidor e do dispositivo Android
- Fila de comandos gerados para o dia (batch de apostas)
- Console de logs ao vivo do Maestro
- Controles: pausar/retomar, reiniciar servidor

### `/historico` — Histórico
Tabela de todas as apostas:
- Filtro por texto (mercado/seleção)
- Resultado colorido (WIN/LOSS/VOID/PENDING)
- Paginação

### `/financeiro` — Financeiro
Gestão financeira:
- Gráfico de barras de lucro mensal
- Tabela de bankroll por plataforma
- Círculos de progresso: meta de lucro e limite de perda

### `/analytics` — Analytics
Performance das estratégias:
- ROI e win rate por estratégia (barras de progresso)
- Ranking das top 5 estratégias
- Insights gerados para feedback do engine de apostas

### `/settings` — Configurações
- Perfil do usuário (vem do token/API)
- Toggles de interface (dark mode, notificações)
- IP do servidor Maestro (padrão: 192.168.1.105:4000)
- Logout

---

## Endpoints consumidos

```
GET  /api/v1/dashboard/summary              → KPIs gerais
GET  /api/v1/dashboard/bankrolls            → Saldos por casa
GET  /api/v1/dashboard/games                → Partidas do dia por liga
GET  /api/v1/automation/machines            → Status das máquinas
GET  /api/v1/bets/daily-generation          → Fila de apostas do dia
GET  /api/v1/tickets/history                → Histórico de apostas
POST /api/v1/tickets                        → Criar ticket manual
GET  /api/v1/reports/strategy-performance   → Performance por estratégia
POST /api/v1/auth/debug-login               → Login de desenvolvimento
```

---

## Estado atual de implementação

| Página | Status |
|--------|--------|
| Login | ✅ Completo |
| Dashboard | ✅ Completo (algumas partidas com dados simulados) |
| Automação | ✅ Completo (logs Maestro são mock) |
| Histórico | ✅ Completo |
| Financeiro | ✅ Completo (gráfico mensal com dados hardcoded) |
| Analytics | ✅ Completo |
| Settings | ✅ Completo |

---

## Ecossistema de agentes / automação

Este projeto é parte de uma stack de automação. Entender o papel de cada componente:

### betbot-api (Java, porta 8080)
- Orquestra as apostas e persiste dados
- Expõe a REST API consumida por este frontend
- Gerencia autenticação (OAuth2 Google + JWT)
- Controla o estado das máquinas e das apostas

### betbot-worker (Maestro + Android)
- Worker de automação que executa apostas no dispositivo Android
- Usa Maestro flows para navegar nas casas de apostas
- Reporta status e logs de volta à API
- Este frontend exibe o status e a fila do worker em `/automacao`

### betbot-web (este projeto)
- **Apenas leitura e monitoramento** — não executa apostas diretamente
- Consome a API e exibe o estado atual do sistema
- Permite ao Ramon pausar/retomar o worker via API

---

## Convenções de código

- Sem comentários desnecessários — nomes autoexplicativos
- Sem abstrações prematuras — o código é direto
- Palette: Slate (cinzas) + Indigo (primário) + Emerald/Rose (status)
- Componentes inline nas pages (sem componentização excessiva)
- `cn()` de `lib/utils.ts` para classNames condicionais
- Toasts via `sonner` para feedback de erros

---

## Como rodar

```bash
npm install
npm run dev     # http://localhost:3000
```

Backend Java deve estar rodando em `localhost:8080` para as APIs funcionarem.

---

## O que NÃO mudar sem consultar

- Estrutura de rotas (App Router do Next.js)
- Nomes das chaves dos endpoints (`/api/v1/...`) — espelham o backend Java
- Chave do localStorage: `betbot_auth_token`
- IP padrão do Maestro: `192.168.1.105:4000`
