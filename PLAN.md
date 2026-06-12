# SportsHub — Code Improvement Plan

Priorities: 🔴 High | 🟡 Medium | 🔵 Low

---

## Phase 1 — Bug Fixes & Quick Wins

| # | Pri | Task | Files |
|---|---|---|---|
| 1 | 🔴 | **Fix `matchId = 0` bug** — `!matchId` rejects `0`, should check `== null` | `server/index.ts:114` |
| 2 | 🔵 | **Add `aria-label` to SearchInput** | `admin/SearchInput.tsx` |
| 3 | 🔴 | **Fix Toast timeout cleanup** — store timeout IDs in `useRef`, clear on unmount | `Admin.tsx:95-101` |
| 4 | 🟡 | **`_playerName` → proper typed event** — add `PlayerNameEvent` interface to shared types | `shared/types.ts`, `useGameState.ts:112` |
| 5 | 🟡 | **Add `motion-safe:` to all animations** — wrap with Tailwind variant for reduced motion | `Home.tsx`, `StatusBadge.tsx`, `EventPopup.tsx`, `MatchMinute.tsx`, `Scoreboard.tsx` |

---

## Phase 2 — Code Quality

| # | Pri | Task | Files |
|---|---|---|---|
| 6 | 🔴 | **Extract `fetchData` utility in Admin.tsx** — single reusable fetch function eliminates 3 duplicate effects | `Admin.tsx:104-172` |
| 7 | 🟡 | **Fix Scoreboard memo** — destructure `GameState` into individual primitive props so shallow compare works | `Scoreboard.tsx:10-124` |
| 8 | 🟡 | **Fix keyboard shortcut re-binding** — move `gameState.minute` into a `useRef` | `Admin.tsx:313-354` |
| 9 | 🟡 | **Add Zod validation to all POST/PUT routes** — replace `as` casts with runtime schema validation | `server/index.ts` (install `zod` in root) |
| 10 | 🟡 | **Fix `curlFetch` HTTP error masking** — use `--write-out "%{http_code}"` flag and reject non-2xx | `footballApi.ts:24-36` |
| 11 | 🔵 | **Move `toastId` to `useRef`** — eliminate module-level mutable variable | `Admin.tsx:73` |

---

## Phase 3 — Extract & Refactor

| # | Pri | Task | Files |
|---|---|---|---|
| 12 | 🟡 | **Extract `useAdminAPI` hook** — move all fetch logic + SSE handlers out of `Admin.tsx` | `Admin.tsx` → new `hooks/useAdminAPI.ts` |
| 13 | 🟡 | **Unify LiveMatchList + UpcomingMatchList** — parameterized `<MatchList>` component | `admin/LiveMatchList.tsx`, new `admin/MatchList.tsx` |
| 14 | 🔵 | **Extract `<GoalScorerRow>`** — eliminate duplicated home/away rendering | `GoalScorers.tsx:23-100` |
| 15 | 🔵 | **Extract `detectEvents` function** — separate poll-derived event logic from `startPolling` | `server/index.ts:334-416` |
| 16 | 🔵 | **Split EventPopup into per-event components** or extract each popup type | `EventPopup.tsx` |

---

## Phase 4 — Developer Experience

| # | Pri | Task | Files |
|---|---|---|---|
| 17 | 🟡 | **Add `vite` to client devDependencies** — explicit dep, not just transitive | `client/package.json` |
| 18 | 🟡 | **Add `concurrently` + `dev` root script** — `bun run dev` starts both server + client | root `package.json` |
| 19 | 🔵 | **Add server test to root** — `"test": "bun test --cwd server"` | root `package.json` |
| 20 | 🔵 | **Enable Biome VCS integration** — only lint changed files | `biome.json` |
| 21 | 🟡 | **Add SSE exponential backoff** — progressive reconnect delays | `useGameState.ts:169` |
| 22 | 🔵 | **Add `--inspect` script for debug** — `"dev:server:debug": "bun --inspect --hot server/index.ts"` | root `package.json` |

---

## Phase 5 — Testing

| # | Pri | Task | Files |
|---|---|---|---|
| 23 | 🟡 | **Add API route tests** — test all 10 REST endpoints using `bun:test` + `fetch` | `server/__tests__/api.test.ts` |
| 24 | 🔵 | **Add client tests** — test SSE hook, popup rendering, Scoreboard | `client/src/__tests__/` |
