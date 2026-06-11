import { createServer } from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import cors from "cors"
import express from "express"
import type { MatchStatus } from "../shared/types"
import { AUTO_DETECT_INTERVAL, POLL_INTERVALS, POLL_RETRY_INTERVAL } from "./constants"
import {
	fetchIncidents,
	fetchLiveMatches,
	fetchMatch,
	fetchScheduledMatches,
	toGameState,
	toGoalScorers,
	toUpcomingMatch,
} from "./footballApi"
import { getState, resetState, setState } from "./gameState"
import { addToHistory, getHistory, loadHistory } from "./matchHistory"
import { addClient, broadcast, removeClient } from "./sse"

const app = express()
const httpServer = createServer(app)

const envPort = process.env.PORT
if (envPort !== undefined) {
	const parsed = Number.parseInt(envPort, 10)
	if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
		console.warn(`Warning: Invalid PORT "${envPort}", falling back to 3000`)
	}
}
const PORT = Number.parseInt(envPort || "3000", 10)

app.use(cors())
app.use(express.json())

// Reject non-JSON POST/PUT/PATCH requests with a clear 415
app.use((req, res, next) => {
	if (["POST", "PUT", "PATCH"].includes(req.method) && !req.is("application/json")) {
		res.status(415).json({ error: "Content-Type must be application/json" })
		return
	}
	next()
})

// ─── Rate limiting (admin API) ───

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60_000

setInterval(() => {
	const now = Date.now()
	for (const [key, val] of rateLimitMap) {
		if (val.resetTime <= now) rateLimitMap.delete(key)
	}
}, 300_000)

app.use((req, res, next) => {
	if (["POST", "PUT", "PATCH"].includes(req.method) && req.path.startsWith("/api/")) {
		const ip: string = req.ip ?? req.socket.remoteAddress ?? "unknown"
		const now = Date.now()
		const entry = rateLimitMap.get(ip)
		if (!entry || entry.resetTime <= now) {
			rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
			next()
			return
		}
		entry.count++
		if (entry.count > RATE_LIMIT) {
			res.set("Retry-After", String(Math.ceil((entry.resetTime - now) / 1000)))
			res.status(429).json({ error: "Too many requests. Try again later." })
			return
		}
		next()
		return
	}
	next()
})

// Serve production build
const __filename = fileURLToPath(import.meta.url)
const distPath = path.resolve(path.dirname(__filename), "..", "dist")
app.use(express.static(distPath))

// --- Helpers ---

function getErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message
	return String(err)
}

// --- REST API ---

app.get("/api/matches/live", async (_req, res) => {
	try {
		const matches = await fetchLiveMatches()
		res.json(matches.map(toGameState))
	} catch (err) {
		res.status(500).json({ error: getErrorMessage(err) })
	}
})

app.get("/api/matches/upcoming", async (_req, res) => {
	try {
		const matches = await fetchScheduledMatches()
		res.json(matches.map(toUpcomingMatch))
	} catch (err) {
		res.status(500).json({ error: getErrorMessage(err) })
	}
})

app.post("/api/match/select", async (req, res) => {
	const { matchId } = req.body as { matchId: number }
	if (!matchId) {
		res.status(400).json({ error: "matchId is required" })
		return
	}

	try {
		const match = await fetchMatch(matchId)
		const state = toGameState(match)

		// Fetch incidents for goal timeline
		try {
			const incidents = await fetchIncidents(matchId)
			state.goals = toGoalScorers(incidents)
		} catch {
			// Incidents are optional; continue without them
		}

		setState(state)
		broadcast("state:init", state)
		startPolling(matchId)
		res.json({ ok: true, state })
	} catch (err) {
		res.status(500).json({ error: getErrorMessage(err) })
	}
})

app.post("/api/match/stop", (_req, res) => {
	stopPolling()
	resetState()
	broadcast("state:init", getState())
	res.json({ ok: true })
})

app.post("/api/match/override", (req, res) => {
	const { homeScore, awayScore } = req.body as {
		homeScore: number
		awayScore: number
	}
	const current = getState()
	if (current.matchId === null && current.homeTeam.name === "Home") {
		res.status(400).json({ error: "No active match" })
		return
	}
	const updated = setState({
		homeTeam: { ...current.homeTeam, score: homeScore },
		awayTeam: { ...current.awayTeam, score: awayScore },
	})
	broadcast("state:update", updated)
	res.json({ ok: true, state: updated })
})

app.post("/api/match/create", (req, res) => {
	const {
		homeTeamName,
		homeTeamCrest,
		awayTeamName,
		awayTeamCrest,
		homeScore,
		awayScore,
		status,
		minute,
	} = req.body as {
		homeTeamName: string
		homeTeamCrest?: string
		awayTeamName: string
		awayTeamCrest?: string
		homeScore?: number
		awayScore?: number
		status?: string
		minute?: number
	}

	if (!homeTeamName || !awayTeamName) {
		res.status(400).json({ error: "homeTeamName and awayTeamName are required" })
		return
	}

	// Stop any existing polling (manual matches don't poll)
	stopPolling()

	const state = {
		matchId: null,
		homeTeam: {
			id: 0,
			name: homeTeamName,
			crest: homeTeamCrest ?? "",
			score: homeScore ?? 0,
		},
		awayTeam: {
			id: 0,
			name: awayTeamName,
			crest: awayTeamCrest ?? "",
			score: awayScore ?? 0,
		},
		minute: minute ?? 0,
		status: (status as MatchStatus) ?? "IN_PLAY",
		lastUpdated: new Date().toISOString(),
	}

	setState(state)
	broadcast("state:init", state)
	if (state.status === "IN_PLAY" || state.status === "EXTRA_TIME") {
		broadcast("match:started", state)
	}
	res.json({ ok: true, state })
})

app.post("/api/match/goal", (req, res) => {
	const { team, playerName } = req.body as { team: "home" | "away"; playerName?: string }
	if (!team || (team !== "home" && team !== "away")) {
		res.status(400).json({ error: "team must be 'home' or 'away'" })
		return
	}

	const current = getState()
	const updated = setState({
		[team === "home" ? "homeTeam" : "awayTeam"]: {
			...current[team === "home" ? "homeTeam" : "awayTeam"],
			score: current[team === "home" ? "homeTeam" : "awayTeam"].score + 1,
		},
	})
	broadcast("match:goal", { ...updated, _playerName: playerName })
	broadcast("state:update", updated)
	res.json({ ok: true, state: updated })
})

app.post("/api/match/set-minute", (req, res) => {
	const { minute } = req.body as { minute: number }
	if (typeof minute !== "number" || !Number.isInteger(minute) || minute < 0) {
		res.status(400).json({ error: "minute must be a positive integer" })
		return
	}

	const updated = setState({ minute })
	broadcast("state:update", updated)
	res.json({ ok: true, state: updated })
})

app.post("/api/match/set-status", (req, res) => {
	const { status } = req.body as { status: string }
	const valid = [
		"SCHEDULED",
		"TIMED",
		"IN_PLAY",
		"PAUSED",
		"FINISHED",
		"EXTRA_TIME",
		"PENALTY_SHOOTOUT",
		"AWARDED",
	]
	if (!valid.includes(status)) {
		res.status(400).json({ error: `invalid status: ${status}` })
		return
	}

	const current = getState()
	const matchStatus = status as MatchStatus
	const updated = setState({ status: matchStatus })

	if (matchStatus === "PAUSED" && current.status === "IN_PLAY") {
		broadcast("match:halftime", updated)
	} else if (matchStatus === "FINISHED" || matchStatus === "AWARDED") {
		addToHistory(updated)
		broadcast("match:fulltime", updated)
	} else if (
		matchStatus === "IN_PLAY" &&
		(current.status === "SCHEDULED" || current.status === "TIMED")
	) {
		broadcast("match:started", updated)
	}

	broadcast("state:update", updated)
	res.json({ ok: true, state: updated })
})

app.get("/api/state", (_req, res) => {
	res.json(getState())
})

app.get("/api/matches/history", (_req, res) => {
	res.json(getHistory())
})

// --- SSE ---

app.get("/api/events", (req, res) => {
	const id = addClient(res)
	// Send current state immediately
	const state = getState()
	res.write(`event: state:init\ndata: ${JSON.stringify(state)}\n\n`)

	req.on("close", () => {
		removeClient(id)
	})
})

// --- SPA fallback ---

app.use((req, res) => {
	if (req.path.startsWith("/api")) {
		res.status(404).json({ error: "not found" })
		return
	}
	res.sendFile(path.join(distPath, "index.html"))
})

// --- Polling ---

let pollTimer: ReturnType<typeof setTimeout> | null = null
let isPolling = false
let currentGen = 0

function getInterval(status: string): number {
	// For SCHEDULED/TIMED matches, use auto-detect interval to catch kickoff quickly
	if (status === "SCHEDULED" || status === "TIMED") {
		return AUTO_DETECT_INTERVAL
	}
	return POLL_INTERVALS[status] ?? 60_000
}

function startPolling(matchId: number): void {
	stopPolling()
	const gen = currentGen

	const poll = async () => {
		if (isPolling) return
		isPolling = true

		try {
			const match = await fetchMatch(matchId)
			if (gen !== currentGen) return // Stale — discard
			const newState = toGameState(match)
			const oldState = getState()

			// Fetch goal timeline — refresh on each poll to catch new goals
			try {
				const incidents = await fetchIncidents(matchId)
				newState.goals = toGoalScorers(incidents)
			} catch {
				newState.goals = oldState.goals
			}

			// Detect all events before any broadcast
			const justStarted =
				newState.status === "IN_PLAY" &&
				(oldState.status === "SCHEDULED" || oldState.status === "TIMED")

			const justFinished = newState.status === "FINISHED" || newState.status === "AWARDED"

			const justHalftime = newState.status === "PAUSED" && oldState.status === "IN_PLAY"

			const scoreChanged =
				newState.homeTeam.score !== oldState.homeTeam.score ||
				newState.awayTeam.score !== oldState.awayTeam.score

			const stateChanged =
				newState.minute !== oldState.minute || newState.status !== oldState.status

			// Apply state once
			setState(newState)

			// Broadcast event-specific messages (may fire multiple)
			if (justStarted) {
				broadcast("match:started", newState)
			}
			if (justHalftime) {
				broadcast("match:halftime", newState)
			}
			if (scoreChanged) {
				broadcast("match:goal", newState)
			}
			if (justFinished) {
				addToHistory(newState)
				broadcast("match:fulltime", newState)
				stopPolling()
			}

			// Broadcast state update once
			if (justStarted || justHalftime || scoreChanged || stateChanged || justFinished) {
				broadcast("state:update", newState)
			}

			if (justFinished) {
				return
			}

			// Schedule next poll with appropriate interval
			const interval = getInterval(newState.status)
			if (interval > 0) {
				pollTimer = setTimeout(poll, interval)
			}
		} catch (err) {
			console.error("Poll error:", getErrorMessage(err))
			// Retry after 30s on error
			pollTimer = setTimeout(poll, POLL_RETRY_INTERVAL)
		} finally {
			isPolling = false
		}
	}

	// Fire first poll immediately, then schedule subsequent ones
	poll()
}

function stopPolling(): void {
	currentGen++
	isPolling = false
	if (pollTimer) {
		clearTimeout(pollTimer)
		pollTimer = null
	}
}

// --- Start ---

loadHistory()

httpServer.listen(PORT, () => {
	console.log(`SportsHub server running on http://localhost:${PORT}`)
})
