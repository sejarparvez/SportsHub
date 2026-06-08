import { createServer } from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import cors from "cors"
import express from "express"
import type { MatchStatus } from "../shared/types"
import { AUTO_DETECT_INTERVAL, POLL_INTERVALS } from "./constants"
import {
	fetchLiveMatches,
	fetchMatch,
	fetchScheduledMatches,
	toGameState,
	toUpcomingMatch,
} from "./footballApi"
import { getState, resetState, setState } from "./gameState"
import { addClient, broadcast, removeClient } from "./sse"

const app = express()
const httpServer = createServer(app)

const PORT = Number.parseInt(process.env.PORT || "3000", 10)

app.use(cors())
app.use(express.json())

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
	res.json({ ok: true, state })
})

app.post("/api/match/goal", (req, res) => {
	const { team } = req.body as { team: "home" | "away" }
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
	broadcast("match:goal", updated)
	broadcast("state:update", updated)
	res.json({ ok: true, state: updated })
})

app.post("/api/match/set-minute", (req, res) => {
	const { minute } = req.body as { minute: number }
	if (typeof minute !== "number" || minute < 0) {
		res.status(400).json({ error: "minute must be a positive number" })
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

app.use((_req, res) => {
	res.sendFile(path.join(distPath, "index.html"))
})

// --- Polling ---

let pollTimer: ReturnType<typeof setTimeout> | null = null
let isPolling = false

function getInterval(status: string): number {
	// For SCHEDULED/TIMED matches, use auto-detect interval to catch kickoff quickly
	if (status === "SCHEDULED" || status === "TIMED") {
		return AUTO_DETECT_INTERVAL
	}
	return POLL_INTERVALS[status] ?? 60_000
}

function startPolling(matchId: number): void {
	stopPolling()

	const poll = async () => {
		if (isPolling) return // Guard against overlapping calls
		isPolling = true

		try {
			const match = await fetchMatch(matchId)
			const newState = toGameState(match)
			const oldState = getState()

			// Match just started (SCHEDULED → IN_PLAY)
			if (
				newState.status === "IN_PLAY" &&
				(oldState.status === "SCHEDULED" || oldState.status === "TIMED")
			) {
				setState(newState)
				broadcast("match:started", newState)
				broadcast("state:update", newState)
				// Schedule next poll — will continue with normal IN_PLAY interval
			} else if (newState.status === "FINISHED" || newState.status === "AWARDED") {
				setState(newState)
				broadcast("match:fulltime", newState)
				broadcast("state:update", newState)
				stopPolling()
				return
			}

			// Halftime detected
			if (newState.status === "PAUSED" && oldState.status === "IN_PLAY") {
				setState(newState)
				broadcast("match:halftime", newState)
				broadcast("state:update", newState)
			} else if (
				newState.homeTeam.score !== oldState.homeTeam.score ||
				newState.awayTeam.score !== oldState.awayTeam.score
			) {
				setState(newState)
				broadcast("match:goal", newState)
				broadcast("state:update", newState)
			} else if (newState.minute !== oldState.minute || newState.status !== oldState.status) {
				setState(newState)
				broadcast("state:update", newState)
			}

			// Schedule next poll with appropriate interval
			const interval = getInterval(newState.status)
			if (interval > 0) {
				pollTimer = setTimeout(poll, interval)
			}
		} catch (err) {
			console.error("Poll error:", getErrorMessage(err))
			// Retry after 30s on error
			pollTimer = setTimeout(poll, 30_000)
		} finally {
			isPolling = false
		}
	}

	// Fire first poll immediately, then schedule subsequent ones
	poll()
}

function stopPolling(): void {
	isPolling = false
	if (pollTimer) {
		clearTimeout(pollTimer)
		pollTimer = null
	}
}

// --- Start ---

httpServer.listen(PORT, () => {
	console.log(`SportsHub server running on http://localhost:${PORT}`)
})
