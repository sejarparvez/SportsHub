# SportsHub — Code Audit & Improvement Plan

Generated: 2026-06-10
Files audited: 22 source files (server, client, shared, config)

---

## How to Use

Each item has:
- **Severity** — 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low / ⚪ Suggestion
- **Effort** — estimate to fix
- **File(s)** — where to change
- **Description** — what's wrong
- **Fix** — what to do

Work through top to bottom, or pick any item.

---

## 🔴 Critical

### 1. Sync `execFileSync` blocks event loop

- **Effort:** 30min
- **File:** `server/footballApi.ts:9-39`
- **Problem:** `execFileSync("curl", ...)` is synchronous. Blocks Node/Bun event loop for 100-500ms every API call. During that time: no SSE pushes, no REST responses, admin panel freezes.
- **Fix:** Replace with async `execFile` from `node:child_process`. Use `AbortController` for timeout.

```ts
// Before
import { execFileSync } from "node:child_process"
const output = execFileSync("curl", args, { encoding: "utf-8" })

// After
import { execFile } from "node:child_process"
import { promisify } from "node:util"
const execFileAsync = promisify(execFile)
const { stdout } = await execFileAsync("curl", args, { timeout: 15000 })
```

Or better: switch to `fetch()` with custom TLS config if Bun's fingerprint issue is resolved.

---

### 2. `stopPolling()` race with in-flight fetch

- **Effort:** 20min
- **File:** `server/index.ts:265-338`
- **Problem:** User clicks "Stop Tracking" while a poll HTTP request is in-flight. The poll completes after state is reset and overwrites the fresh state with stale data.
- **Fix:** Add generation counter. Increment on every `startPolling` call. Each poll iteration checks if its generation is still current before applying state.

```ts
let currentGen = 0

function startPolling(matchId: number): void {
  const gen = ++currentGen
  stopPolling()
  // ...
  const poll = async () => {
    if (isPolling) return
    isPolling = true
    try {
      const match = await fetchMatch(matchId)
      if (gen !== currentGen) return // stale, discard
      // ... rest of poll logic
    }
  }
}
```

---

### 3. Unhandled `JSON.parse` crashes SSE handlers

- **Effort:** 15min
- **File:** `client/src/hooks/useGameState.ts` — lines 36, 41, 46, 57, 63, 74
- **Problem:** Every SSE event listener calls `JSON.parse(e.data)` without try/catch. If server sends malformed JSON, the parse throws and all future events for that event type are silently dropped.
- **Fix:** Wrap every `JSON.parse` in try/catch. Log error and return early on failure.

```ts
function parseSSEData(data: string) {
  try { return JSON.parse(data) }
  catch (e) { console.error("SSE parse error:", e); return null }
}
```

---

### 4. `.env` with real API key committed to git

- **Effort:** 15min
- **Files:** `.env`, `.gitignore`
- **Problem:** `.env` contains `FOOTBALL_DATA_API_KEY` and is tracked in git. The key is exposed in commit history.
- **Fix:**
  1. Verify `.gitignore` includes `.env`
  2. `git rm --cached .env`
  3. Rotate the key at football-data.org (if it's actually used — the code uses Sofascore, not Football-Data.org)
  4. Commit

Note: The code never reads `FOOTBALL_DATA_API_KEY`. It uses Sofascore's public API (no key needed). Consider removing the env var entirely or documenting that it's unused.

---

## 🟠 High Priority

### 5. README vs reality (multiple discrepancies)

- **Effort:** 30min
- **Files:** `README.md`, `doc/PLAN.md` (if exists)
- **Problems:**

| README says | Actual |
|---|---|
| Uses Football-Data.org API | Uses Sofascore API (`api.sofascore.com`) |
| Route `/overlay` | Route `/` |
| File `Overlay.tsx` | File `Home.tsx` |
| `FOOTBALL_DATA_API_KEY` needed | No key needed (Sofascore is public) |

- **Fix:** Update README to match actual codebase. Fix architecture diagram, API ref, route table, file tree, and env docs.

---

### 6. Broken image fallback — crest load failure

- **Effort:** 10min
- **File:** `client/src/components/TeamBadge.tsx:47-53`
- **Problem:** When crest URL fails to load (broken link, rate limit, network), the `<img>` shows default broken icon. Fallback gradient initials exist for `crest=""` but not for runtime load failures.
- **Fix:** Add `onError` handler:

```tsx
const [imgFailed, setImgFailed] = useState(false)

{crest && !imgFailed ? (
  <img
    src={crest}
    alt={name}
    onError={() => setImgFailed(true)}
    className="..."
  />
) : (
  <div className="...">{initials}</div>
)}
```

---

### 7. CSS `overflow: hidden` on `body` breaks admin scrolling

- **Effort:** 5min
- **File:** `client/src/index.css:131`
- **Problem:** `body { overflow: hidden }` prevents scrolling on admin page. If content exceeds viewport (small screens, many toasts), it becomes unreachable.
- **Fix:** Move to overlay-specific class or apply conditionally:

```css
body { overflow: hidden; }

/* In Admin.tsx or a page-level wrapper */
.admin-page { overflow: auto; height: 100vh; }
```

---

### 8. Missing `favicon.svg` — 404 on every page load

- **Effort:** 2min
- **File:** `client/index.html:21`
- **Problem:** `<link rel="icon" ... href="/favicon.svg">` but no file exists at that path.
- **Fix:** Either:
  - Create `client/public/favicon.svg` (or `favicon.ico`)
  - Or remove the `<link>` tag entirely

---

## 🟡 Medium Priority

### 9. `getState()` returns mutable internal object

- **Effort:** 5min
- **File:** `server/gameState.ts:14-16`
- **Problem:** `getState()` returns direct reference to internal `state` object. Callers can mutate it, corrupting the singleton.
- **Fix:** Return shallow copy:

```ts
export function getState(): GameState {
  return { ...state }
}
```

---

### 10. `setState()` shallow merge loses nested fields

- **Effort:** 10min
- **File:** `server/gameState.ts:18-20`
- **Problem:** `setState({ homeTeam: { score: 2 } })` replaces entire `homeTeam`, losing `name`, `crest`, `id`. Currently all callers spread manually before calling, but the API invites this bug.
- **Fix:** Add deep merge helper or document that callers must spread nested objects:

```ts
export function setState(update: Partial<GameState>): GameState {
  state = {
    ...state,
    ...update,
    // Deep merge known nested objects
    homeTeam: update.homeTeam ? { ...state.homeTeam, ...update.homeTeam } : state.homeTeam,
    awayTeam: update.awayTeam ? { ...state.awayTeam, ...update.awayTeam } : state.awayTeam,
    lastUpdated: new Date().toISOString(),
  }
  return state
}
```

---

### 11. Dead CSS — unused animation classes

- **Effort:** 5min
- **File:** `client/src/index.css`
- **Problem:** These classes are defined but never referenced in any component:
  - `.animate-slide-up-out` (line 269)
  - `.animate-slide-down-in` (line 273)
  - `.animate-slide-down-out` (line 277)
  - `.animate-pulse-live` (line 257)
  - `.animate-shimmer` (line 292)
  - `.live-badge` (line 311)
- **Fix:** Delete unused CSS blocks.

---

### 12. Unused `undici` dependency

- **Effort:** 2min
- **File:** `package.json:16`
- **Problem:** `"undici"` listed in dependencies but never imported anywhere.
- **Fix:** `bun remove undici`

---

### 13. `lightStyles` object allocated on every `StatusBadge` render

- **Effort:** 5min
- **File:** `client/src/components/StatusBadge.tsx:35-48`
- **Problem:** `lightStyles` is an 8-entry object created inside the component body. Every render allocates garbage. Since SSE updates trigger re-renders, this adds unnecessary GC pressure.
- **Fix:** Move to module-level constant:

```ts
const styles: Record<MatchStatus, string> = { ... }
const lightStyles: Record<MatchStatus, string> = { ... }
const labels: Record<MatchStatus, string> = { ... }
```

---

### 14. `Scoreboard` lacks `React.memo` — re-renders on every SSE event

- **Effort:** 5min
- **File:** `client/src/pages/Home.tsx:54` and `client/src/components/Scoreboard.tsx`
- **Problem:** `useGameState` creates new state object on every SSE event. Passed as prop to `Scoreboard` → new reference → re-render. Even on "state:update" where only `lastUpdated` changed.
- **Fix:** Wrap `Scoreboard` in `React.memo` with shallow comparison.

```tsx
const Scoreboard = React.memo(function Scoreboard({ state }: { state: GameState }) {
  // ... component body
})
```

---

### 15. `Admin.tsx` is 1075 lines — decompose into files

- **Effort:** 60min
- **File:** `client/src/pages/Admin.tsx`
- **Problem:** Single component handles ~20 features: live match list, upcoming list, stop tracking, goals, HT/FT, minute control, score override, manual match form, presets, toast system, keyboard shortcuts, error banner, live preview.
- **Fix:** Extract into separate files:

```
client/src/
├── pages/Admin.tsx                   # Main page (orchestration only)
├── components/admin/
│   ├── LiveMatchList.tsx
│   ├── UpcomingMatchList.tsx
│   ├── MatchControls.tsx            # Goals, HT/FT, Minute
│   ├── ScoreOverride.tsx
│   ├── ManualMatchForm.tsx
│   ├── PresetManager.tsx
│   └── ToastContainer.tsx
```

---

### 16. Non-null assertions on `matchId`

- **Effort:** 15min
- **Files:** `useGameState.ts:49`, `Admin.tsx:517`, `shared/types.ts:55`
- **Problem:** `data.matchId!` and `m.matchId!` assume `matchId` is never null. For manual matches (`matchId: null`), this passes `null` where `number` is expected. Currently used only for display (`"#null"` shown in preview), but type violation.
- **Fix:** Handle null case properly:

```ts
// Admin.tsx:517
if (m.matchId == null) return // skip or handle
selectMatch(m.matchId)
```

---

## 🟢 Low Priority

### 17. Index as key in goal list

- **Effort:** 5min
- **File:** `client/src/components/GoalScorers.tsx:27,74`
- **Problem:** Uses `key={i}` (array index). If goals are reordered/filtered/used with animations, React DOM reconciliation breaks. Fine for current usage (append-only), but not idiomatic.
- **Fix:** Use unique key:

```tsx
key={`${g.minute}-${g.playerName}`}
```

---

### 18. Unused `SSE_INIT_MESSAGE` constant

- **Effort:** 2min
- **File:** `server/constants.ts:16-17`
- **Problem:** `SSE_INIT_MESSAGE` defined but never imported or used anywhere.
- **Fix:** Delete the constant.

---

### 19. `POLL_INTERVALS` typed as `Record<string, number>`

- **Effort:** 5min
- **File:** `server/constants.ts:5`
- **Problem:** Key type is `string`, not `MatchStatus`. Callers can pass invalid status keys without type error. The runtime `?? 60_000` fallback masks the issue.
- **Fix:** Type as `Record<MatchStatus, number>`.

```ts
import type { MatchStatus } from "../shared/types"

export const POLL_INTERVALS: Record<MatchStatus, number> = {
  IN_PLAY: 60_000,
  // ...
} as const
```

---

### 20. `"penality"` typo in Sofascore incident parsing

- **Effort:** 5min
- **File:** `server/footballApi.ts:229`
- **Problem:** `i.goalType === "penality"` — should be `"penalty"`. Penalty goals never flagged with `isPenalty: true`.
- **Fix:** Change to `"penalty"`. Verify against actual Sofascore API response to confirm the correct value.

---

### 21. Stoppage time discarded (90+3' shows as 90')

- **Effort:** 10min
- **File:** `server/footballApi.ts:167`
- **Problem:** `calculateMinute` caps 2nd half at `90`. `event.time?.injuryTime1` contains stoppage time but is unused.
- **Fix:** Append injury time:

```ts
if (period === 2) {
  const base = Math.min(estimatedMinutes, 90)
  const injury = event.time?.injuryTime1 ?? 0
  return base + injury
}
```

---

### 22. Float minute accepted (45.5' shown on overlay)

- **Effort:** 5min
- **File:** `server/index.ts:182-191`
- **Problem:** `/api/match/set-minute` validates `minute >= 0` but not that it's an integer.
- **Fix:** Add integer check:

```ts
if (!Number.isInteger(minute) || minute < 0) {
  res.status(400).json({ error: "minute must be a positive integer" })
  return
}
```

---

### 23. `useEffect` fetch with no cleanup — sets state after unmount

- **Effort:** 10min
- **File:** `client/src/pages/Admin.tsx:148-181`
- **Problem:** Live matches and upcoming matches `useEffect` do not return cleanup. If component unmounts before fetch completes, `setState` is called on unmounted component.
- **Fix:** Use `AbortController` + ignore flag:

```ts
useEffect(() => {
  let ignore = false
  fetchLiveMatches()
    .then(data => { if (!ignore) setLiveMatches(data) })
    .catch(...)
  return () => { ignore = true }
}, [])
```

---

### 24. `localStorage.setItem` can throw

- **Effort:** 5min
- **File:** `client/src/pages/Admin.tsx:40-41`
- **Problem:** `localStorage.setItem` throws `QuotaExceededError` when storage is full. Unhandled error crashes the save action.
- **Fix:** Wrap in try/catch:

```ts
try {
  localStorage.setItem("sportshub-presets", JSON.stringify(presets))
} catch {
  console.warn("Failed to save presets: storage full")
}
```

---

## ⚪ Suggestions / Long-term

### 25. Add Dockerfile

- **Effort:** 30min
- **File:** `Dockerfile` (new)
- **Why:** Reproducible deploys to Railway, Fly.io, or any VPS. Eliminates runtime surprises.

```dockerfile
FROM oven/bun:1.2 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1.2
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/package.json ./
RUN apt-get update && apt-get install -y curl
EXPOSE 3000
CMD ["bun", "start"]
```

---

### 26. Add systemd service file

- **Effort:** 10min
- **File:** `sportshub.service` (new, for VPS deploy)
- **Why:** Auto-restart on crash, boot-time start, log management.

```ini
[Unit]
Description=SportsHub live score server
After=network.target

[Service]
Type=simple
User=sportshub
WorkingDirectory=/opt/sportshub
ExecStart=/usr/local/bin/bun start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

### 27. Replace `curl` with `fetch()` entirely

- **Effort:** 60min
- **File:** `server/footballApi.ts`
- **Why:** Removes curl dependency from deploy. Faster (no child process). Portable across runtimes. Use `undici` (already a dep) or Node's built-in fetch with custom TLS socket to bypass WAF.

---

### 28. Replace manual fetch in Admin with TanStack Query

- **Effort:** 2h
- **Files:** `client/src/pages/Admin.tsx`, new hooks
- **Why:** Eliminates manual loading/error state management. Built-in caching, dedup, refetch, retry. Smaller `Admin.tsx`.

---

### 29. Fix `setState` broadcast duplicate on `SCHEDULED → IN_PLAY` with simultaneous goal

- **Effort:** 15min
- **File:** `server/index.ts:281-311`
- **Problem:** When match transitions from SCHEDULED to IN_PLAY and score also changes (kickoff + goal), two `state:update` broadcasts fire in same poll cycle. Causes double re-render on overlay.
- **Fix:** Batch changes — detect all events first, apply state once, broadcast once.

---

## Appendix: Quick Wins Summary

| # | What | Est. time | Files |
|---|---|---|---|
| 4 | Remove `.env` from git | 15min | `.env`, `.gitignore` |
| 6 | Add `onError` to crest `<img>` | 10min | `TeamBadge.tsx` |
| 7 | Fix `overflow:hidden` | 5min | `index.css` |
| 8 | Remove favicon link or add SVG | 2min | `index.html` |
| 11 | Delete unused CSS | 5min | `index.css` |
| 12 | Remove `undici` dep | 2min | `package.json` |
| 18 | Delete `SSE_INIT_MESSAGE` | 2min | `constants.ts` |
| 24 | Wrap `localStorage.setItem` in try/catch | 5min | `Admin.tsx` |

Total quick wins: ~45 min
