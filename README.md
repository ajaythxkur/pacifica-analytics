# Pacifica Analytics

> Real-time trader intelligence for [Pacifica](https://pacifica.fi). Discover the top performers, track your watchlists, compare wallets side-by-side, and monitor live whale activity — all powered by Pacifica mainnet data and Elfa AI social sentiment.

Built for the **Pacifica Hackathon** (Track 2: Analytics & Data).

---

## What it does

Pacifica has thousands of active traders. Picking out the ones who actually win — and understanding *how* they trade — is hard. Pacifica Analytics turns the public Pacifica API into a fast, beautiful explorer that any trader can use to:

- **Browse the full live leaderboard** of ~8,000 mainnet wallets, sortable by PnL / volume / equity across daily / weekly / monthly / all-time windows.
- **Inspect any trader's portfolio** — open positions with liquidation prices, open orders, full trade history with per-fill PnL, and liquidation events flagged in red.
- **Compare up to five wallets side-by-side** with persistent localStorage baskets that survive page navigation.
- **Group traders into custom "watchlists"** stored in localStorage (rename addresses with personal nicknames, see aggregate group PnL).
- **Watch whale alerts in real time** — large fills as they happen on Pacifica across all **63 markets** (BTC, ETH, SOL, HYPE, gold, oil, NVDA, TSLA, forex pairs and more), filterable by symbol and minimum notional.
- **Read social sentiment** for any token via Elfa AI integration — top mentions, engagement stats, trending tickers.
- **Generate shareable "flex cards"** — one-click PNG snapshots of any trader's stats, ready to post on X.
- **Subscribe to a Telegram bot** for personalised, **attributed** whale alerts — get DM'd when one of the top 50 whales opens a large position, with their profile link and one-click Long / Short buttons that jump straight to Pacifica's trade UI.

Plus a no-flash light/dark theme system, full WCAG AA color contrast, and a copytrade page placeholder for the next iteration.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · TypeScript |
| Backend  | FastAPI · httpx · aiosqlite |
| Data sources | [Pacifica REST API](https://pacifica.gitbook.io/docs/api-documentation/api) · [Elfa AI v2 API](https://docs.elfa.ai) · Telegram Bot API |
| Hosting hints | Vercel (frontend) · Render / Railway / Fly.io (backend) |
| Persistence | SQLite (Telegram subscribers only). Watchlists, nicknames, compare basket, theme: all `localStorage`. |

The backend is a thin caching proxy in front of Pacifica + Elfa AI. The Pacifica leaderboard is refreshed in the background every 60 s so user requests always serve from memory.

---

## Architecture

```
┌─────────────────────────────┐         ┌─────────────────────────┐
│        Browser              │         │      FastAPI            │
│                             │         │                         │
│  Next.js (App Router)       │         │  /api/leaderboard       │
│   ├─ /                      │ /api/*  │  /api/trader/{addr}     │
│   ├─ /leaderboard           │────────▶│  /api/trader/{addr}/... │
│   ├─ /trader/[address]      │ rewrite │  /api/whale-alerts      │
│   ├─ /alerts                │         │  /api/compare           │
│   ├─ /compare               │         │  /api/sentiment/*       │
│   ├─ /sentiment             │         │                         │
│   ├─ /groups                │         │  ┌────────────────┐     │
│   └─ /copytrade             │         │  │  In-mem cache  │     │
│                             │         │  │  (60s refresh) │     │
│  localStorage:              │         │  └───────┬────────┘     │
│   • groups                  │         │          │              │
│   • nicknames               │         └──────────┼──────────────┘
│   • compare basket          │                    │
│   • theme                   │                    ▼
└─────────────────────────────┘         ┌─────────────────────────┐
                                         │  Pacifica REST API      │
                                         │  Elfa AI v2 API         │
                                         └─────────────────────────┘
```

---

## Run locally

### Prerequisites
- Node.js 20+ and npm
- Python 3.11+
- A free [Elfa AI API key](https://go.elfa.ai/dev) *(optional — sentiment page will be empty without it, everything else works)*

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and paste your ELFA_API_KEY (optional)

uvicorn app.main:app --reload --port 8000
```

The backend kicks off a background task that fetches the Pacifica leaderboard once at startup and then every 60 seconds. First-ever request may take ~2 seconds for the cache warm-up; everything after is instant.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# edit .env.local if your backend isn't on localhost:8000

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `ELFA_API_KEY` | optional | _(empty)_ | Free key from https://go.elfa.ai/dev. Without it, `/api/sentiment/*` returns empty arrays — the rest of the app continues to work. |
| `TELEGRAM_BOT_TOKEN` | optional | _(empty)_ | From [@BotFather](https://t.me/BotFather). Enables the whale-alerts bot. Without it, the bot is disabled and the frontend CTA hides automatically. |
| `TELEGRAM_BOT_USERNAME` | optional | _(empty)_ | Bot username (no `@`). Used by the frontend CTA to deep-link to `t.me/<username>`. |
| `APP_PUBLIC_URL` | optional | `http://localhost:3000` | Used by Telegram alerts to build "View Trader Profile" buttons. **Set this to your Vercel URL in production**, otherwise alert buttons will link to localhost. |
| `SUBSCRIBERS_DB_PATH` | optional | `subscribers.db` | SQLite file path. Point at a persistent disk mount on your host (e.g. `/data/subscribers.db` on Render). |
| `ALLOWED_ORIGINS` | optional | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated CORS origins. Use `*` to allow any (auto-disables credentials). |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `BACKEND_URL` | optional | `http://127.0.0.1:8000` | Used by Next.js rewrites to proxy `/api/*` to the FastAPI deployment. Set this to your deployed backend URL when deploying to Vercel. |

---

## Deploying

### Frontend → Vercel

1. Push the repo to GitHub.
2. Import the project on Vercel, set the **Root Directory** to `frontend`.
3. Set environment variable `BACKEND_URL=https://your-backend.example.com`.
4. Deploy.

### Backend → Render / Railway / Fly.io

The backend is a stock FastAPI + uvicorn app. Any Python host works. Example for Render:

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Env vars:** `ELFA_API_KEY`, `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app`

---

## Project layout

```
pacifica-analytics/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI routes
│   │   ├── services/
│   │   │   ├── pacifica.py            # Pacifica API client + cache + bg refresh
│   │   │   └── elfa.py                # Elfa AI client
│   │   └── models/schemas.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/                       # Next.js routes
    │   │   ├── page.tsx               # Home — hero search + top traders
    │   │   ├── leaderboard/           # Full leaderboard with filters
    │   │   ├── trader/[address]/      # Trader detail + tabs + charts
    │   │   ├── alerts/                # Live whale alerts
    │   │   ├── compare/               # Side-by-side comparison
    │   │   ├── sentiment/             # Elfa AI social sentiment
    │   │   ├── groups/                # Watchlist groups
    │   │   ├── copytrade/             # Coming soon
    │   │   ├── layout.tsx             # Root layout + theme init script
    │   │   └── globals.css            # Theme tokens, semantic colors
    │   ├── components/
    │   │   ├── layout/Navbar.tsx
    │   │   ├── trader/TraderDetailTabs.tsx
    │   │   ├── ui/                    # StatCard, TierBadge, ThemeToggle, etc.
    │   │   └── flex-card/FlexCard.tsx # Lazy-loaded
    │   ├── lib/
    │   │   ├── api.ts                 # API client + types
    │   │   ├── compare-store.ts       # localStorage compare basket
    │   │   ├── groups-store.ts        # localStorage watchlists
    │   │   └── nicknames-store.ts     # localStorage address nicknames
    │   └── hooks/
    └── .env.example
```

---

## Notable engineering decisions

- **Background-refreshed cache.** The Pacifica leaderboard upstream returns ~8,000 records and takes ~1.7 s to fetch. A background task warms it on startup and refreshes it every 60 s, so user requests always hit memory (~1 ms).
- **No framer-motion.** Animations are pure CSS (`fade-in`, `fade-in-stagger` with `nth-child` delays). Saved ~40 kB gzipped on every page.
- **Two-layer theme system.** Each theme is one selector block (`:root.theme-dark`, `:root.theme-light`) of raw CSS variables; semantic Tailwind tokens map to those vars once. Adding a new theme = paste one block, no refactoring. WCAG AA verified — every text/background ratio is documented inline.
- **No-flash theme switch.** A small inline script in `<head>` reads `localStorage.theme` synchronously before paint. SSR ships with `theme-dark` so users with JS disabled still see a fully-styled page.
- **Lazy-loaded heavy components.** `FlexCard` (uses `html2canvas-pro`) is `next/dynamic` since it only renders inside a click-triggered modal.
- **Inline SVG charts.** `PeriodBarChart` is ~120 lines of zero-dependency SVG. Replaces what Recharts would do for a 4-bar comparison.
- **Persistent compare basket.** Compare list lives in localStorage and a custom event is fired on change so the navbar badge updates instantly across tabs.

---

## Hackathon track

**Track 2: Analytics & Data** — primary.
Also touches **Track 3: Social & Gamification** through watchlists, nicknames, flex cards, and the trader comparison feature.

---

## Telegram bot

The backend ships with a built-in Telegram bot for **attributed whale alerts** — meaning every alert tells you *which* trader made the move and links to their profile. Try the live one: [@pacifica_analytics_bot](https://t.me/pacifica_analytics_bot).

### Setup

1. Talk to [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → follow prompts.
2. Paste the token into `backend/.env` as `TELEGRAM_BOT_TOKEN`.
3. Set `TELEGRAM_BOT_USERNAME` to the bot's username (without the `@`).
4. Set `APP_PUBLIC_URL` to your deployed Vercel URL so the bot's "View Profile" button links there instead of localhost.
5. Restart the backend. You'll see `[telegram] Bot started` in the logs.

### Commands

| Command | Description |
|---|---|
| `/start`, `/help` | Welcome message + command list |
| `/subscribe` | Start receiving whale alerts |
| `/unsubscribe` | Pause alerts (subscriber row is kept; you can resume later) |
| `/setmin <usd>` | Minimum notional, e.g. `/setmin 50000` (default $10,000) |
| `/symbols <list>` | Filter by symbol — accepts any of Pacifica's 63 markets, e.g. `/symbols BTC,ETH,HYPE,SUI` |
| `/status` | Show your current settings |

### How it works

- The broadcaster polls the **top 50 whale wallets by 7d volume** (from the cached leaderboard) every 60 s and fetches their fill history via `/positions/history?account=ADDR`.
- Each wallet's last seen `history_id` is tracked in SQLite (`bot_state` table) so we never replay the same fill twice — and a first-time visit to a new whale records the high-water mark *without* sending a backlog of historical alerts.
- For each wallet, the **single biggest new fill** in each cycle is the only candidate (this naturally throttles bursty markets where one whale fires off ten orders in 30 seconds).
- Each candidate is broadcast to subscribers whose `min_notional` and `symbols` filters match — and only if the user isn't being throttled.

### Three throttling layers (so no one gets spammed)

1. **Per-cycle aggregation** — only the biggest qualifying fill per whale per cycle.
2. **Per-symbol cooldown per user** — 5 minutes between alerts for the same symbol to the same user.
3. **Hourly hard cap per user** — max 12 alerts per rolling hour.

So worst case is 12 messages/hour, typical case is 2–4/hour during normal market activity. Liquidations are detected via the `cause` field on the fill and rendered with a 💀 LIQUIDATION header instead of the normal 🐋 WHALE ALERT.

### Alert message format

Each alert message includes a 4-button inline keyboard:

- 👤 **View Trader Profile** → `${APP_PUBLIC_URL}/trader/<address>` (your deployed app)
- 📈 **Long {SYMBOL}** + 📉 **Short {SYMBOL}** → `https://app.pacifica.fi/trade/{SYMBOL}` (one-click jump to Pacifica)
- 🔗 **Open in Pacifica** → `https://app.pacifica.fi/portfolio/<address>` (the whale's full Pacifica portfolio)

### Persistence

Subscriber data lives in SQLite (`subscribers.db` by default). Two background tasks run inside the FastAPI process: an update poller for incoming commands, and the broadcaster described above. On Render/Railway/Fly mount a persistent disk and set `SUBSCRIBERS_DB_PATH=/data/subscribers.db` so subscribers survive redeploys.

If you don't set `TELEGRAM_BOT_TOKEN`, the bot is silently disabled and the frontend CTA hides itself — every other feature works normally.

---

## Roadmap

- **Copytrade** — already stubbed at `/copytrade`. Will use Pacifica builder code to mirror trades.
- **Funding history tab** — endpoint isn't currently exposed by Pacifica; will revisit when available.
- **Real-time WebSocket alerts** — currently polled every 10 s; Pacifica WS support is planned.
- **Telegram bot** for whale alerts — easy add-on once a stable wallet identifier is settled.

---

## License

MIT
