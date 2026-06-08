# 🏟️ SportsHub

**Live football score broadcast for Facebook Live.**  
Pick a match (or create your own), control it from a beautiful dashboard, and stream the score to your audience — no video game needed.

<p align="center">
  <code>Bun</code> • <code>React 19</code> • <code>TypeScript</code> • <code>Express</code> • <code>SSE</code> • <code>Tailwind CSS 4</code>
</p>

---

## 📺 What It Looks Like

When you open the overlay, this is what your stream sees — full-screen 1920×1080:

```
┌──────────────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░  PREMIER LEAGUE • MATCHWEEK  ░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░  ┌──────────────────────────────────────┐  ░░░░░░░│
│░░░░░░░░░░  │  [CREST]  ARSENAL  2 — 1  CHELSEA   │  ░░░░░░░│
│░░░░░░░░░░  │                         34'  🔴LIVE  │  ░░░░░░░│
│░░░░░░░░░░  └──────────────────────────────────────┘  ░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░  ⚽ GOAL! (34')  ░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░  LIVE  │  SportsHub  │  08 Jun 2025  ░░░░░░░░│
└──────────────────────────────────────────────────────────────┘
```

Rich dark gradient background, glowing glass scoreboard, animated goal/HT/FT popups — it's a **broadcast-ready score graphic**, not a transparent overlay.

---

## 🎯 Admin Workflow (Zero to Stream)

Here's the complete workflow from a fresh machine to a live score on Facebook:

```
┌─ Step 1 ──────────────────────┐
│  Install Bun                   │
│  https://bun.sh                │
└──────────────┬─────────────────┘
               ↓
┌─ Step 2 ──────────────────────┐
│  Clone & install dependencies  │
│  git clone <repo>              │
│  cd SportsHub                  │
│  bun install                   │
│  cd client && bun install      │
└──────────────┬─────────────────┘
               ↓
┌─ Step 3 ──────────────────────┐
│  Configure (see .env)          │
│  ┌─────────────────────────┐   │
│  │ Have API key?           │   │
│  │   → echo "KEY=..." > .env│  │
│  │ No API key?             │   │
│  │   → Create manual match │   │
│  └─────────────────────────┘   │
└──────────────┬─────────────────┘
               ↓
┌─ Step 4 ──────────────────────┐
│  Start the server              │
│  bun dev:server                │
│  (or bun start for production) │
└──────────────┬─────────────────┘
               ↓
┌─ Step 5 ──────────────────────┐
│  Open Admin Panel              │
│  http://localhost:5173/admin   │
│  (or :3000/admin in production)│
└──────────────┬─────────────────┘
               ↓
┌─ Step 6 ──────────────────────┐
│  Pick or create a match        │
│  ┌──────────────────────────┐  │
│  │ Have API key?            │  │
│  │  → Click "Track" on any  │  │
│  │    live or upcoming match│  │
│  ├──────────────────────────┤  │
│  │ No API key?              │  │
│  │  → Open "Manual Match"   │  │
│  │    section, enter teams, │  │
│  │    click "Create Match"  │  │
│  └──────────────────────────┘  │
└──────────────┬─────────────────┘
               ↓
┌─ Step 7 ──────────────────────┐
│  Control the match             │
│  - Trigger goals (⚽ Home/Away)│
│  - Set halftime / fulltime     │
│  - Adjust minute (+1, +5)      │
│  - Override scores             │
└──────────────┬─────────────────┘
               ↓
┌─ Step 8 ──────────────────────┐
│  Open Overlay in OBS           │
│  http://localhost:3000/overlay │
│  1920×1080, Browser Source     │
└──────────────┬─────────────────┘
               ↓
┌─ Step 9 ──────────────────────┐
│  Stream to Facebook Live       │
│  Paste stream key → Go Live    │
└────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.2
- A free API key from [Football-Data.org](https://www.football-data.org) _(optional — manual mode works without it)_

### Setup

```bash
# 1. Clone and install
cd SportsHub
bun install
cd client && bun install && cd ..

# 2. Set your API key (skip this for manual-only mode)
echo "FOOTBALL_DATA_API_KEY=your_key_here" > .env
echo "PORT=3000" >> .env
```

### Development (two terminals)

```bash
# Terminal 1 — Start the server
bun dev:server

# Terminal 2 — Start the Vite dev server
bun dev:client
```

Then open:

| Page            | URL                             | Purpose                                           |
| --------------- | ------------------------------- | ------------------------------------------------- |
| **Admin Panel** | `http://localhost:5173/admin`   | Select matches, control scores, manage presets    |
| **Overlay**     | `http://localhost:5173/overlay` | The score broadcast — this is what goes on stream |

### Production

```bash
# Build the client
bun run build

# Start the production server (serves everything on :3000)
bun start
```

Production URLs: `http://localhost:3000/admin` and `http://localhost:3000/overlay`

---

## 🎛️ Admin Panel Guide

The admin dashboard is your command center. Here's every section explained:

### Live Matches (Left Column)

Shows currently live matches from Football-Data.org.

```
┌─ Live Matches ────────────────────────────────────┐
│                                                    │
│  [CREST]  Arsenal   2 — 1  Chelsea   [CR]  🔴LIVE │
│                                       [ Track ]   │
│                                                    │
│  [CREST]  Man City  0 — 0  Liverpool  [CR]  🔴LIVE│
│                                       [ Track ]   │
└────────────────────────────────────────────────────┘
```

- Each match shows team crests, names, live score, and a **LIVE** badge
- Click **Track** to start following that match — the overlay updates in real-time via SSE
- Loading state: shimmer skeleton placeholders
- Empty state: friendly "No live matches found" with icon

### Upcoming Today (Left Column, below Live)

Scheduled matches for today with kickoff times.

```
┌─ Upcoming Today ──────────────────────────────────┐
│                                                    │
│  [CREST]  Arsenal  vs  Chelsea   [CR]  🕐 15:00   │
│                                       [ Track ]   │
│                                                    │
│  [CREST]  Man Utd  vs  Spurs     [CR]  🕐 17:30   │
│                                       [ Track ]   │
└────────────────────────────────────────────────────┘
```

- Click **Track** on a scheduled match — the server polls every 30 seconds
- When the match switches from `SCHEDULED` → `IN_PLAY`, a **"MATCH IS LIVE!"** popup fires automatically on the overlay
- Kickoff time shown in amber monospace

### Controls (Right Column)

#### Stop Tracking

Big red button. Stops polling, resets the game state, clears the overlay.  
**Keyboard shortcut:** press `S` at any time.

#### Quick Actions (appears only for manual matches)

Once you create a manual match, this panel slides in:

| Section          | Buttons                   | What Happens                                      |
| ---------------- | ------------------------- | ------------------------------------------------- |
| **Goals**        | ⚽ Home / ⚽ Away         | +1 score, fires goal popup on overlay             |
| **Match Events** | ⏸️ Halftime / 🏁 Fulltime | Sets PAUSED or FINISHED status, fires HT/FT popup |
| **Minute**       | `[input]` Set / +1 / +5   | Updates the match clock on the overlay            |

#### Score Override

Manually set home/away scores to any value. Useful for correcting a wrong score or setting up a specific scenario.

#### Manual Match

Opens a form to create a match **without an API key**:

```
┌─ Manual Match ────────────────────────────────────┐
│  [+ Create Match]                                 │
│                                                    │
│  (when expanded)                                   │
│  ┌────────────────┐ ┌────────────────┐            │
│  │ Home Team      │ │ Away Team      │            │
│  │ [ Arsenal    ] │ │ [ Chelsea    ] │            │
│  ├────────────────┤ ├────────────────┤            │
│  │ Home Crest URL │ │ Away Crest URL │            │
│  │ (optional)     │ │ (optional)     │            │
│  ├────────────────┤ ├────────────────┤            │
│  │ Home Score     │ │ Away Score     │            │
│  │ [ 2 ]          │ │ [ 1 ]          │            │
│  ├────────────────┤ ├────────────────┤            │
│  │ Minute         │ │                │            │
│  │ [ 34 ]         │ │                │            │
│  ├────────────────┴────────────────┤               │
│  │ Status: [IN PLAY ▼]             │               │
│  ├──────────────────────────────────┤               │
│  │        [ Create Match ]         │               │
│  │  Preset name: [________] [Save] │               │
│  └──────────────────────────────────┘               │
└────────────────────────────────────────────────────┘
```

### Presets (within Manual Match)

Save team lineups so you can reuse them in one click:

```
  [Arsenal vs Chelsea] [×]   [Man Utd vs Liverpool] [×]
```

- Click a preset name to auto-fill the form
- Click `×` to delete it
- Stored in `localStorage` — persists across browser sessions

### Live Preview (Bottom, Full Width)

```
┌─ Live Preview ────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐ │
│  │   [CREST]  Arsenal  2 — 1  Chelsea  [CREST] │ │
│  │                     34'  🔴LIVE              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │Match │  │Score │  │Minute│  │Status│          │
│  │ #123 │  │2 — 1 │  │ 34'  │  │IN_PL │          │
│  └──────┘  └──────┘  └──────┘  └──────┘          │
└────────────────────────────────────────────────────┘
```

- Shows exactly what the overlay looks like right now, rendered live inside the admin panel
- Includes a 4-column stat summary (Match ID, Score, Minute, Status)
- Empty state: "No match selected" with stadium icon

---

## 📺 Facebook Live Setup

Once the overlay is running, getting it to Facebook is straightforward:

### 1. Start the production server

```bash
bun run build
bun start
```

The server now serves everything on `http://localhost:3000`.

### 2. OBS — Add Browser Source

| Setting                                   | Value                           |
| ----------------------------------------- | ------------------------------- |
| Source type                               | **Browser Source**              |
| URL                                       | `http://localhost:3000/overlay` |
| Width                                     | **1920**                        |
| Height                                    | **1080**                        |
| Control audio via OBS                     | As needed                       |
| Refresh browser when scene becomes active | ✅ Recommended                  |

The overlay fills the entire frame — no extra background source needed.

### 3. OBS — Recommended Settings

| Setting                    | Value                                          |
| -------------------------- | ---------------------------------------------- |
| Base (Canvas) Resolution   | 1920×1080                                      |
| Output (Scaled) Resolution | 1920×1080 (or 1280×720 for slower connections) |
| FPS                        | 30                                             |
| Rate Control               | CBR                                            |
| Bitrate                    | 4500 Kbps (1080p) / 3000 Kbps (720p)           |
| Keyframe Interval          | 2 seconds                                      |

### 4. Facebook Live — Stream Key

1. Go to **Facebook Live** → go to your profile/page → click "Live Video"
2. Copy the **Stream Key**
3. In OBS: **Settings → Stream** → Service: **Facebook Live** → Paste stream key
4. Click **Start Streaming**

> **Tip:** In the admin panel, keep the match score updated in real-time. Every goal, status change, and minute update reflects instantly on the overlay for your viewers.

---

## 🖥️ Overlay Design

The overlay is a full-screen 1920×1080 broadcast graphic. It is NOT a transparent OBS overlay — it IS the content.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              PREMIER LEAGUE • MATCHWEEK                      │
│                                                              │
│        ┌──────────────────────────────────────┐              │
│        │  [CREST]  ARSENAL  2 — 1  CHELSEA   │              │
│        │                     34'  🔴LIVE      │              │
│        └──────────────────────────────────────┘              │
│                                                              │
│                        34'  🔴LIVE                           │
│                                                              │
│                                                              │
│                                                              │
│              LIVE  │  SportsHub  │  08 Jun 2025              │
└──────────────────────────────────────────────────────────────┘
```

### States

| State                           | What's Shown                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **No match selected**           | Floating stadium icon (animated float), "Waiting for match" with pulsing dots, "SPORTSHUB" watermark |
| **SCHEDULED / TIMED**           | Full scoreboard + amber pulsing dots + "Match starting soon"                                         |
| **IN_PLAY** (live auto-tracked) | Full scoreboard + minute with red pulsing dot + **LIVE** gradient badge                              |
| **IN_PLAY** (manual match)      | Same as above + Quick Actions appear in admin                                                        |
| **Goal scored**                 | Centered `⚽ GOAL!` scale-in popup with minute + "A goal has been scored!" — auto-dismisses after 5s |
| **Kickoff detected**            | Centered `🔴 MATCH IS LIVE!` scale-in popup with "Kickoff detected — the match has started"          |
| **Halftime**                    | Centered `⏸️ HALF TIME` scale-in popup with "The first half has concluded" — auto-dismisses after 5s |
| **Fulltime**                    | Full dark overlay dim + `🏁 FULL TIME` large scale-in card — persistent                              |

### Design System

- **Background** — Rich dark gradient (`#080c1a → #0f1629 → #060a14`) with subtle 60px grid pattern (3% opacity) and two colored radial glow orbs (blue top-left, purple bottom-right)
- **Scoreboard card** — Frosted glass (`bg-white/[0.05] backdrop-blur-2xl`), rounded-3xl, white border at 10% opacity, breathing glow animation
- **Scores** — Pure white `text-8xl` with **CSS text-shadow glow** (subtle base glow, intense 3-layer glow burst on goal)
- **Team crests** — Large circular badges with ring border; falls back to deterministic gradient initials when no crest URL provided
- **Typography** — Inter (headings/body), JetBrains Mono (scores/timestamps) — loaded from Google Fonts
- **Match minute** — 4xl monospace with large pulsing red dot when live
- **Status badges** — Gradient pill badges with matching shadow colors (LIVE=red, HT=yellow, FT=gray, ET=orange, PENS=purple)
- **Pre-match indicator** — Three amber pulsing dots with glow shadow + "Match starting soon"
- **Bottom bar** — "LIVE • SportsHub • 08 Jun 2025" at 15% opacity
- **Event popups** — All centered, `animate-popup-scale` entrance, `pointer-events-none`, `select-none`
- **Goal score animation** — `animate-score-pop` = scale 1 → 1.35 → 1 with text-shadow glow burst

---

## 🏗️ Architecture

```
Football-Data.org API (optional)
        ↓
Bun + Express Server (localhost:3000)
  — polls API at smart intervals (60s in play, 5min scheduled)
  — detects state changes (goal, halftime, fulltime, kickoff)
  — supports manual match creation (no API key needed)
  — pushes events via SSE with 30s keepalive heartbeat
        ↓
SSE (/api/events)          REST (/api/*)
  — pushes updates           — admin controls
  to all clients             (select, override, goal, etc.)
        ↓                            ↓
React Client (Vite)
  ┌──────────────┐    ┌──────────────┐
  │  /overlay     │    │  /admin      │
  │  Broadcast    │    │  Dashboard   │
  └──────────────┘    └──────────────┘
        ↓
OBS Browser Source → Facebook Live
```

### Project Structure

```
SportsHub/
├── server/
│   ├── index.ts          # Express server, REST routes, SSE, polling
│   ├── sse.ts            # SSE client manager + keepalive heartbeat
│   ├── gameState.ts      # In-memory game state singleton
│   ├── footballApi.ts    # Football-Data.org API client
│   └── constants.ts      # Poll intervals, SSE keepalive, auto-detect interval
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Overlay.tsx        # Full-screen score broadcast graphic
│   │   │   └── Admin.tsx          # Dashboard with controls, presets, live preview
│   │   ├── components/
│   │   │   ├── Scoreboard.tsx     # Glass card with glow scores, team crests
│   │   │   ├── MatchMinute.tsx    # Live match clock with pulsing dot
│   │   │   ├── StatusBadge.tsx    # Gradient pill badges with live dot
│   │   │   ├── EventPopup.tsx     # Goal/HT/FT/kickoff centered scale-in popups
│   │   │   ├── TeamBadge.tsx      # Crest image or auto-generated gradient initials
│   │   │   └── LivePreview.tsx    # Admin panel overlay preview + state summary
│   │   ├── hooks/
│   │   │   └── useGameState.ts    # SSE connection + timeout management
│   │   ├── App.tsx                # React Router (/overlay, /admin)
│   │   ├── index.css              # Tailwind + custom animations
│   │   └── main.tsx               # Entry point
│   ├── index.html                 # Google Fonts (Inter, JetBrains Mono)
│   └── vite.config.ts             # Proxy /api/* to Express, outDir ../dist
├── shared/
│   └── types.ts            # GameState, Team, UpcomingMatch, GoalEventData, etc.
├── doc/
│   └── PLAN.md             # Detailed project plan
├── biome.json              # Biome linter + formatter config
├── .gitignore              # node_modules, dist, .env
├── .env                    # FOOTBALL_DATA_API_KEY, PORT — gitignored
├── README.md               # This file
└── package.json
```

---

## 📡 API Reference

### REST Endpoints

| Method | Route                   | Description                                |
| ------ | ----------------------- | ------------------------------------------ |
| `GET`  | `/api/matches/live`     | List currently live matches                |
| `GET`  | `/api/matches/upcoming` | List today's scheduled matches             |
| `POST` | `/api/match/select`     | Start tracking a match by ID               |
| `POST` | `/api/match/stop`       | Stop tracking and reset state              |
| `POST` | `/api/match/create`     | Create a manual match (no API needed)      |
| `POST` | `/api/match/goal`       | Trigger a goal for `home` or `away` team   |
| `POST` | `/api/match/set-minute` | Set match minute                           |
| `POST` | `/api/match/set-status` | Set match status (fires appropriate event) |
| `POST` | `/api/match/override`   | Override home/away scores                  |
| `GET`  | `/api/state`            | Get current game state                     |

### `POST /api/match/create`

```json
{
  "homeTeamName": "Arsenal",
  "homeTeamCrest": "https://crests.football-data.org/57.png",
  "awayTeamName": "Chelsea",
  "awayTeamCrest": "https://crests.football-data.org/61.png",
  "homeScore": 2,
  "awayScore": 1,
  "status": "IN_PLAY",
  "minute": 34
}
```

### `POST /api/match/goal`

```json
{ "team": "home" }
```

### `POST /api/match/set-minute`

```json
{ "minute": 45 }
```

### `POST /api/match/set-status`

```json
{ "status": "PAUSED" }
```

Valid statuses: `SCHEDULED`, `TIMED`, `IN_PLAY`, `PAUSED`, `FINISHED`, `EXTRA_TIME`, `PENALTY_SHOOTOUT`, `AWARDED`

### SSE Endpoint

| Route             | Event Types                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `GET /api/events` | `state:init`, `state:update`, `match:goal`, `match:halftime`, `match:fulltime`, `match:started` |

Clients receive `state:init` immediately on connect, then real-time typed events. SSE auto-reconnects natively.

---

## 🔧 Scripts

| Script           | Description                           |
| ---------------- | ------------------------------------- |
| `bun dev:server` | Start Express server with hot reload  |
| `bun dev:client` | Start Vite dev server (port 5173)     |
| `bun run build`  | Build React app for production        |
| `bun start`      | Start production server (port 3000)   |
| `bun run check`  | Lint + check formatting with Biome    |
| `bun run format` | Auto-fix formatting & lint with Biome |

---

## ⚙️ Environment Variables (`.env`)

| Variable                | Default | Required                          | Description                |
| ----------------------- | ------- | --------------------------------- | -------------------------- |
| `FOOTBALL_DATA_API_KEY` | —       | ❌ (manual mode works without it) | Your football-data.org key |
| `PORT`                  | `3000`  | ❌                                | Server listen port         |

---

## 💰 Cost

| Service                       | Cost   |
| ----------------------------- | ------ |
| Football-Data.org (free tier) | $0     |
| Bun + Express + Vite + OBS    | $0     |
| **Total**                     | **$0** |

Football-Data.org free tier: **10 requests/min, 600 req/hour** — more than enough for live match tracking. Manual mode uses zero API calls.

---

## 🔒 Error Handling

- **API failures** — Server keeps last known state, logs error, retries after 30s
- **SSE disconnects** — `EventSource` auto-reconnects natively
- **Missing API key** — Server logs clear error at startup; manual mode still works fine
- **Invalid match ID** — Admin panel shows error toast
- **Network errors** — All fetch calls wrapped in try/catch with toast feedback
- **Type safety** — Shared TypeScript types guarantee server/client agreement across the stack

---

## 📄 License

MIT
