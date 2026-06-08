# 🎙️ SportsHub — Complete Project Plan

---

## 🎯 Goal

Build a **local web app** that pulls live football scores from the internet, displays them on a browser overlay, captured by OBS, and streamed to Facebook Live.

---

## ✅ Tech Stack

| Layer              | Tool                         |
| ------------------ | ---------------------------- |
| Runtime            | Bun                          |
| Server             | Express + Node `http`        |
| Real-time (push)   | SSE (Server-Sent Events)     |
| Admin → Server     | REST API (fetch POST)        |
| Frontend framework | React 19 + TypeScript        |
| Styling            | Tailwind CSS 4               |
| Linting/Formatting | [Biome](https://biomejs.dev) |
| Bundler            | Vite                         |
| API                | Football-Data.org            |
| Stream capture     | OBS Studio                   |
| Stream output      | Facebook Live                |

---

## 🏗️ Architecture Overview

```
Football-Data.org API
        ↓
Bun + Express Server (localhost:3000)
  — polls API on smart interval (recursive setTimeout)
  — caches last response in memory
  — detects state changes (goal, halftime, fulltime)
  — emits typed SSE events
  — keepalive heartbeat every 30s
        ↓
SSE (/api/events)          REST (/api/*)
  — pushes updates           — admin controls
        ↓                            ↓
React Client (Vite — localhost:5173 in dev)
  ┌──────────────┐    ┌──────────────┐
  │  /overlay     │    │  /admin      │
  │  OBS captures │    │  Dashboard   │
  └──────────────┘    └──────────────┘
        ↓
OBS Browser Source (points to localhost:3000/overlay in production)
        ↓
Facebook Live
```

---

## 📁 Project Structure

```
SportsHub/
├── server/
│   ├── index.ts               # Express server, REST routes, SSE, polling
│   ├── sse.ts                 # SSE client manager + keepalive heartbeat
│   ├── gameState.ts           # In-memory game state singleton
│   ├── footballApi.ts         # Football-Data.org API client
│   └── constants.ts           # Poll intervals, SSE keepalive interval
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Overlay.tsx        # OBS-captured — glassmorphism scoreboard
│   │   │   └── Admin.tsx          # Dashboard with toasts, loading, keyboard shortcuts
│   │   ├── components/
│   │   │   ├── Scoreboard.tsx     # Glass card, gradient text, score pop animation
│   │   │   ├── MatchMinute.tsx    # Living clock with pulsing dot
│   │   │   ├── StatusBadge.tsx    # Gradient pill badges with live dot
│   │   │   └── EventPopup.tsx     # Custom animated goal/HT/FT popups
│   │   ├── hooks/
│   │   │   └── useGameState.ts    # SSE + timeout cleanup via refs
│   │   ├── App.tsx                # React Router (/overlay, /admin)
│   │   ├── index.css              # Tailwind + custom animations (score-pop, slide-up, etc.)
│   │   └── main.tsx               # Entry point
│   ├── index.html                 # Google Fonts (Inter, JetBrains Mono)
│   └── vite.config.ts             # Proxy /api/* to Express, outDir ../dist
├── shared/
│   └── types.ts               # GameState, Team, GoalEventData, MatchEventType, SSEEventType
├── doc/
│   └── PLAN.md                # This file
├── biome.json                 # Biome linter + formatter config
├── .gitignore                 # node_modules, dist, .env
├── .env                       # FOOTBALL_DATA_API_KEY, PORT — gitignored
├── README.md                  # Full project documentation
└── package.json               # Scripts: dev:server, dev:client, build, start
```

---

## 🔄 Event Flow

| What                            | How       | Direction        |
| ------------------------------- | --------- | ---------------- |
| Server → Overlay (score update) | SSE       | One-way push     |
| Server → Admin (score update)   | SSE       | One-way push     |
| Admin → Server (select match)   | REST POST | Request/response |
| Admin → Server (stop tracking)  | REST POST | Request/response |
| Admin → Server (override score) | REST POST | Request/response |
| Admin loads current state       | REST GET  | Request/response |

---

## 🔐 Environment Variables (`.env`)

```
FOOTBALL_DATA_API_KEY=your_key_here
PORT=3000
```

Bun reads `.env` automatically — no `dotenv` package needed.

---

## 📡 REST API Routes

| Method | Route                 | Purpose                                       |
| ------ | --------------------- | --------------------------------------------- |
| `GET`  | `/api/matches/live`   | Return list of currently live matches         |
| `POST` | `/api/match/select`   | Set which match to track, start polling       |
| `POST` | `/api/match/stop`     | Stop polling                                  |
| `POST` | `/api/match/override` | Manually override home/away score             |
| `GET`  | `/api/state`          | Return current game state (for admin on load) |

## 📡 SSE Endpoint

| Route             | Event Types                                                                    |
| ----------------- | ------------------------------------------------------------------------------ |
| `GET /api/events` | `state:init`, `state:update`, `match:goal`, `match:halftime`, `match:fulltime` |

SSE clients receive `state:init` on connect, then typed real-time events.

---

## ⚙️ Server Architecture

### Polling (recursive setTimeout — no setInterval)

1. Admin calls `POST /api/match/select` with match ID
2. Server calls `poll()` **immediately** (no wait), then schedules next via `setTimeout`
3. Uses `isPolling` guard flag to prevent overlapping calls
4. On each poll:
   - **Score changed** → `match:goal` + `state:update`
   - **Status → PAUSED** → `match:halftime` + `state:update`
   - **Status → FINISHED** → `match:fulltime` + `state:update` + stop
   - **Minute/status changed** → `state:update`
   - **API error** → retry after 30s

### Smart Polling Intervals

| Match Status       | Poll Every | Why                   |
| ------------------ | ---------- | --------------------- |
| Before match       | 5 minutes  | Nothing happening yet |
| IN_PLAY (1st half) | 60 seconds | Active play           |
| PAUSED (Halftime)  | 2 minutes  | Slow period           |
| IN_PLAY (2nd half) | 60 seconds | Active play           |
| FINISHED           | Stop       | No need               |

### SSE Keepalive

- 30-second heartbeat (`: keepalive\n\n` per SSE spec)
- Prevents proxies/firewalls from dropping idle connections
- Timer cleared on client disconnect

---

## 🖥️ Overlay Page (`/overlay`)

1920×1080 fullscreen — OBS captures this.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐│
│  │  [Crest]  Arsenal   2 — 1   Chelsea  [Crest]   ││  ← Glass card
│  │                                                 ││
│  │                   34'  🔴LIVE                   ││  ← Minute + badge
│  └─────────────────────────────────────────────────┘│
│                                                     │
│              ⚽ GOAL! (34')                         │  ← Animated popup
└─────────────────────────────────────────────────────┘
```

### Design

- Glassmorphism card (`backdrop-blur-xl`, `bg-white/5`, border)
- Gradient text scores with animated pop on goal
- Custom animations: `score-pop`, `slide-up-out`, `popup-scale`
- Animated background with radial gradient
- Pulsing "Waiting for match..." state with 3 dots

---

## 🎛️ Admin Panel (`/admin`)

Modern dashboard with:

- **Live match list** (with crest thumbnails, hover states, loading shimmer)
- **Track button** with loading state and response check
- **Stop Tracking** button (`S` keyboard shortcut)
- **Score Override** inputs with proper focus rings
- **Toast notifications** (success/error/info, auto-dismiss)
- **Connection indicator** (Live / Disconnected with pulsing dot)
- **Error banner** for persistent errors
- **Current state JSON viewer** with empty state

---

## 🪝 useGameState Hook

- Opens `EventSource` to `/api/events` on mount
- Uses `useRef` + `useCallback` for timeout cleanup
- On `match:goal` → sets goal event, auto-clears after 5s
- On `match:halftime` → shows HT popup, auto-clears after 5s
- On `match:fulltime` → shows FT popup (persistent)
- Cleans up all timers and closes EventSource on unmount
- Returns: `gameState`, `goalEvent`, `matchEvent`, `connected`

---

## 🎨 Design System

- **Glassmorphism** — Frosted glass panels (`backdrop-blur-xl`, `bg-white/5`)
- **Gradients** — Deep navy backgrounds (`#0a0e1a` → `#111827`), radial highlights
- **Inter font** — Clean sans-serif from Google Fonts
- **JetBrains Mono** — Monospace for scores/timestamps
- **Custom animations** — score-pop, slide-up, slide-up-out, popup-scale, pulse-dot, shimmer
- **Dark theme** — OBS overlay background is transparent

---

## 🔧 Scripts

| Script                        | Description                          |
| ----------------------------- | ------------------------------------ |
| `bun dev:server`              | Start Express server with hot reload |
| `bun dev:client`              | Start Vite dev server (port 5173)    |
| `bun run build`               | Build React app for production       |
| `bun start`                   | Start production server (port 3000)  |
| `cd client && bun run lint`   | Lint with Biome                      |
| `cd client && bun run format` | Format with Biome                    |

---

## ⚠️ Error Handling

- API call fails → keep showing last known state, log error, retry after 30s
- SSE disconnects → `EventSource` auto-reconnects natively
- API key missing → clear error logged at startup
- Match ID not found → toast error in admin
- Score override fails → toast error in admin
- All API calls wrapped in try/catch with typed error helper

---

## 💰 Cost Summary

| Service                       | Cost   |
| ----------------------------- | ------ |
| Football-Data.org (free tier) | $0     |
| Bun + Express + Vite + OBS    | $0     |
| **Total**                     | **$0** |

---

## 📺 OBS Setup

### Production

1. `bun run build` — Vite builds React into root `dist/`
2. `bun start` — Express serves everything on port 3000
3. OBS → Add **Browser Source** → `http://localhost:3000/overlay`
4. Width: `1920`, Height: `1080`
5. Check **"Shutdown source when not visible"**
6. Set background behind overlay (video/image/game capture)

---

## 🐛 Known Fixes Applied (v2)

| Bug                                               | Fix                                                      |
| ------------------------------------------------- | -------------------------------------------------------- |
| React memory leak — `setTimeout` not cleaned up   | Stored timeout IDs in refs, cleaned in useEffect return  |
| First poll call delayed by one interval           | `poll()` called immediately in `startPolling()`          |
| Race condition with overlapping polls             | Recursive `setTimeout` + `isPolling` guard flag          |
| No SSE keepalive → connections dropped by proxies | 30s keepalive heartbeat per client                       |
| Admin `overrideScore` silently fails              | Response check + toast feedback                          |
| `GoalEvent` / `GoalData` type drift               | Unified types in `shared/types.ts`                       |
| ESLint → Biome migration                          | Removed ESLint deps, added `biome.json`, updated scripts |
| Flat basic design                                 | Full glassmorphism redesign with custom animations       |

---

_Simple. Free. Beautiful. Production-ready._
