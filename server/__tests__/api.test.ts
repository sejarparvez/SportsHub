import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test"
import { type Server, createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { resetState } from "../gameState"
import { clearHistory } from "../matchHistory"

// Mock football-data.org API calls to avoid external HTTP requests
mock.module("../footballApi", () => ({
	fetchLiveMatches: async () => [],
	fetchScheduledMatches: async () => [],
	fetchMatch: async (id: number) => ({
		id,
		utcDate: new Date().toISOString(),
		status: "IN_PLAY" as const,
		stage: "REGULAR_SEASON",
		group: null,
		matchday: 1,
		homeTeam: { id: 1, name: "Home Team", crest: "" },
		awayTeam: { id: 2, name: "Away Team", crest: "" },
		score: {
			winner: null,
			fullTime: { home: 1, away: 0 },
			halfTime: { home: 0, away: 0 },
		},
		season: { id: 1, startDate: "2025-01-01", endDate: "2026-06-30", currentMatchday: 34 },
		competition: { id: 2021, name: "Test League", code: "TL", type: "LEAGUE", emblem: "" },
	}),
	fetchIncidents: async () => [],
	toGameState: (event: {
		id: number
		homeTeam: { id: number; name: string; crest: string }
		awayTeam: { id: number; name: string; crest: string }
		score: {
			fullTime: { home: number | null; away: number | null }
			halfTime: { home: number | null; away: number | null }
		}
		competition: { name: string }
		season: { startDate: string; endDate: string }
	}) => ({
		matchId: event.id,
		homeTeam: {
			id: event.homeTeam.id,
			name: event.homeTeam.name,
			crest: event.homeTeam.crest,
			score: event.score.fullTime.home ?? 0,
		},
		awayTeam: {
			id: event.awayTeam.id,
			name: event.awayTeam.name,
			crest: event.awayTeam.crest,
			score: event.score.fullTime.away ?? 0,
		},
		minute: 0,
		status: "IN_PLAY",
		lastUpdated: new Date().toISOString(),
	}),
	toGoalScorers: () => [],
	toUpcomingMatch: (event: {
		id: number
		homeTeam: { id: number; name: string; crest: string }
		awayTeam: { id: number; name: string; crest: string }
		utcDate: string
	}) => ({
		id: event.id,
		homeTeam: { id: event.homeTeam.id, name: event.homeTeam.name, crest: event.homeTeam.crest },
		awayTeam: { id: event.awayTeam.id, name: event.awayTeam.name, crest: event.awayTeam.crest },
		kickoff: event.utcDate,
		status: "SCHEDULED" as const,
	}),
}))

let server: Server
let port: number
let baseUrl: string

beforeAll(async () => {
	process.env.RATE_LIMIT = "1000"
	const { app, httpServer } = await import("../index")

	// Close the module-level server that auto-started on import
	await new Promise<void>((resolve) => httpServer.close(() => resolve()))

	server = createServer(app)
	await new Promise<void>((resolve) => {
		server.listen(0, () => {
			port = (server.address() as AddressInfo).port
			baseUrl = `http://localhost:${port}`
			resolve()
		})
	})
})

afterAll(() => {
	server?.close()
})

afterEach(() => {
	resetState()
	clearHistory()
})

// ──────────────────────────────────────────────
// GET /api/state
// ──────────────────────────────────────────────

describe("GET /api/state", () => {
	it("returns the default state", async () => {
		const res = await fetch(`${baseUrl}/api/state`)
		expect(res.status).toBe(200)
		const state = await res.json()
		expect(state.matchId).toBeNull()
		expect(state.homeTeam.name).toBe("Home")
		expect(state.awayTeam.name).toBe("Away")
		expect(state.minute).toBe(0)
		expect(state.status).toBe("SCHEDULED")
	})
})

// ──────────────────────────────────────────────
// POST /api/match/create
// ──────────────────────────────────────────────

describe("POST /api/match/create", () => {
	it("creates a manual match with all fields", async () => {
		const res = await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				homeTeamName: "Barcelona",
				awayTeamName: "Madrid",
				homeScore: 2,
				awayScore: 1,
				status: "IN_PLAY",
				minute: 30,
			}),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.state.matchId).toBeNull()
		expect(body.state.homeTeam.name).toBe("Barcelona")
		expect(body.state.awayTeam.score).toBe(1)
		expect(body.state.minute).toBe(30)
		expect(body.state.status).toBe("IN_PLAY")
	})

	it("creates a match with minimal required fields", async () => {
		const res = await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeTeamName: "A", awayTeamName: "B" }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.homeTeam.score).toBe(0)
		expect(body.state.minute).toBe(0)
		expect(body.state.status).toBe("IN_PLAY")
	})

	it("rejects empty team name", async () => {
		const res = await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeTeamName: "", awayTeamName: "B" }),
		})
		expect(res.status).toBe(400)
	})

	it("rejects missing team name", async () => {
		const res = await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ awayTeamName: "B" }),
		})
		expect(res.status).toBe(400)
	})

	it("rejects invalid status", async () => {
		const res = await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				homeTeamName: "A",
				awayTeamName: "B",
				status: "BOGUS",
			}),
		})
		expect(res.status).toBe(400)
	})

	it("rejects negative score", async () => {
		const res = await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				homeTeamName: "A",
				awayTeamName: "B",
				homeScore: -1,
			}),
		})
		expect(res.status).toBe(400)
	})

	it("accepts optional crest URLs", async () => {
		const res = await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				homeTeamName: "A",
				homeTeamCrest: "https://example.com/crest.png",
				awayTeamName: "B",
			}),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.homeTeam.crest).toBe("https://example.com/crest.png")
	})
})

// ──────────────────────────────────────────────
// POST /api/match/goal
// ──────────────────────────────────────────────

describe("POST /api/match/goal", () => {
	async function createMatch() {
		await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeTeamName: "A", awayTeamName: "B" }),
		})
	}

	it("increments home score", async () => {
		await createMatch()
		const res = await fetch(`${baseUrl}/api/match/goal`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team: "home" }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.homeTeam.score).toBe(1)
		expect(body.state.awayTeam.score).toBe(0)
	})

	it("increments away score", async () => {
		await createMatch()
		const res = await fetch(`${baseUrl}/api/match/goal`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team: "away" }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.awayTeam.score).toBe(1)
	})

	it("accepts optional playerName", async () => {
		await createMatch()
		const res = await fetch(`${baseUrl}/api/match/goal`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team: "home", playerName: "Messi" }),
		})
		expect(res.status).toBe(200)
	})

	it("rejects invalid team value", async () => {
		const res = await fetch(`${baseUrl}/api/match/goal`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team: "invalid" }),
		})
		expect(res.status).toBe(400)
	})

	it("rejects missing team field", async () => {
		const res = await fetch(`${baseUrl}/api/match/goal`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		})
		expect(res.status).toBe(400)
	})
})

// ──────────────────────────────────────────────
// POST /api/match/set-minute
// ──────────────────────────────────────────────

describe("POST /api/match/set-minute", () => {
	async function createMatch() {
		await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeTeamName: "A", awayTeamName: "B" }),
		})
	}

	it("sets the minute", async () => {
		await createMatch()
		const res = await fetch(`${baseUrl}/api/match/set-minute`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ minute: 45 }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.minute).toBe(45)
	})

	it("rejects negative minute", async () => {
		const res = await fetch(`${baseUrl}/api/match/set-minute`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ minute: -1 }),
		})
		expect(res.status).toBe(400)
	})

	it("rejects non-integer minute", async () => {
		const res = await fetch(`${baseUrl}/api/match/set-minute`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ minute: 1.5 }),
		})
		expect(res.status).toBe(400)
	})

	it("rejects missing minute", async () => {
		const res = await fetch(`${baseUrl}/api/match/set-minute`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		})
		expect(res.status).toBe(400)
	})
})

// ──────────────────────────────────────────────
// POST /api/match/set-status
// ──────────────────────────────────────────────

describe("POST /api/match/set-status", () => {
	async function createMatch(status = "IN_PLAY") {
		await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeTeamName: "A", awayTeamName: "B", status }),
		})
	}

	it("sets PAUSED (halftime)", async () => {
		await createMatch()
		const res = await fetch(`${baseUrl}/api/match/set-status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "PAUSED" }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.status).toBe("PAUSED")
	})

	it("sets FINISHED", async () => {
		await createMatch()
		const res = await fetch(`${baseUrl}/api/match/set-status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "FINISHED" }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.status).toBe("FINISHED")
	})

	it("transitions SCHEDULED → IN_PLAY", async () => {
		await createMatch("SCHEDULED")
		const res = await fetch(`${baseUrl}/api/match/set-status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "IN_PLAY" }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.status).toBe("IN_PLAY")
	})

	it("rejects invalid status", async () => {
		const res = await fetch(`${baseUrl}/api/match/set-status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "INVALID" }),
		})
		expect(res.status).toBe(400)
	})
})

// ──────────────────────────────────────────────
// POST /api/match/override
// ──────────────────────────────────────────────

describe("POST /api/match/override", () => {
	async function createMatch() {
		await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeTeamName: "A", awayTeamName: "B" }),
		})
	}

	it("overrides the score", async () => {
		await createMatch()
		const res = await fetch(`${baseUrl}/api/match/override`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeScore: 5, awayScore: 3 }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.state.homeTeam.score).toBe(5)
		expect(body.state.awayTeam.score).toBe(3)
	})

	it("rejects negative score", async () => {
		await createMatch()
		const res = await fetch(`${baseUrl}/api/match/override`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeScore: -1, awayScore: 0 }),
		})
		expect(res.status).toBe(400)
	})

	it("returns 400 when no active match", async () => {
		const res = await fetch(`${baseUrl}/api/match/override`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ homeScore: 1, awayScore: 0 }),
		})
		expect(res.status).toBe(400)
		const body = await res.json()
		expect(body.error).toBe("No active match")
	})
})

// ──────────────────────────────────────────────
// POST /api/match/stop
// ──────────────────────────────────────────────

describe("POST /api/match/stop", () => {
	it("stops tracking and resets state to default", async () => {
		await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				homeTeamName: "A",
				awayTeamName: "B",
				status: "IN_PLAY",
			}),
		})

		const res = await fetch(`${baseUrl}/api/match/stop`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
		})
		expect(res.status).toBe(200)
		expect((await res.json()).ok).toBe(true)

		const stateRes = await fetch(`${baseUrl}/api/state`)
		const state = await stateRes.json()
		expect(state.matchId).toBeNull()
		expect(state.homeTeam.name).toBe("Home")
		expect(state.status).toBe("SCHEDULED")
	})
})

// ──────────────────────────────────────────────
// GET /api/matches/live
// ──────────────────────────────────────────────

describe("GET /api/matches/live", () => {
	it("returns an empty array (mocked)", async () => {
		const res = await fetch(`${baseUrl}/api/matches/live`)
		expect(res.status).toBe(200)
		const matches = await res.json()
		expect(Array.isArray(matches)).toBe(true)
		expect(matches).toHaveLength(0)
	})
})

// ──────────────────────────────────────────────
// GET /api/matches/upcoming
// ──────────────────────────────────────────────

describe("GET /api/matches/upcoming", () => {
	it("returns an empty array (mocked)", async () => {
		const res = await fetch(`${baseUrl}/api/matches/upcoming`)
		expect(res.status).toBe(200)
		const matches = await res.json()
		expect(Array.isArray(matches)).toBe(true)
		expect(matches).toHaveLength(0)
	})
})

// ──────────────────────────────────────────────
// POST /api/match/select
// ──────────────────────────────────────────────

describe("POST /api/match/select", () => {
	it("selects a match by id", async () => {
		const res = await fetch(`${baseUrl}/api/match/select`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ matchId: 12345 }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.state.matchId).toBe(12345)
		expect(body.state.homeTeam.name).toBe("Home Team")
	})

	it("rejects matchId = 0", async () => {
		const res = await fetch(`${baseUrl}/api/match/select`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ matchId: 0 }),
		})
		expect(res.status).toBe(400)
	})

	it("rejects negative matchId", async () => {
		const res = await fetch(`${baseUrl}/api/match/select`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ matchId: -5 }),
		})
		expect(res.status).toBe(400)
	})

	it("rejects missing matchId", async () => {
		const res = await fetch(`${baseUrl}/api/match/select`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		})
		expect(res.status).toBe(400)
	})

	it("rejects non-integer matchId", async () => {
		const res = await fetch(`${baseUrl}/api/match/select`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ matchId: 12.5 }),
		})
		expect(res.status).toBe(400)
	})
})

// ──────────────────────────────────────────────
// GET /api/matches/history
// ──────────────────────────────────────────────

describe("GET /api/matches/history", () => {
	it("returns an empty array initially", async () => {
		const res = await fetch(`${baseUrl}/api/matches/history`)
		expect(res.status).toBe(200)
		const history = await res.json()
		expect(Array.isArray(history)).toBe(true)
		expect(history).toHaveLength(0)
	})

	it("includes a match after set-status FINISHED", async () => {
		await fetch(`${baseUrl}/api/match/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				homeTeamName: "A",
				awayTeamName: "B",
				status: "IN_PLAY",
			}),
		})

		await fetch(`${baseUrl}/api/match/set-status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "FINISHED" }),
		})

		const res = await fetch(`${baseUrl}/api/matches/history`)
		const history = await res.json()
		expect(history.length).toBeGreaterThanOrEqual(1)
		expect(history[0].status).toBe("FINISHED")
	})
})

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────

describe("Middleware", () => {
	it("rejects non-JSON POST with 415", async () => {
		const res = await fetch(`${baseUrl}/api/match/goal`, {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: "hello",
		})
		expect(res.status).toBe(415)
	})

	it("returns 404 for unknown /api routes", async () => {
		const res = await fetch(`${baseUrl}/api/nonexistent`)
		expect(res.status).toBe(404)
		const body = await res.json()
		expect(body.error).toBe("not found")
	})
})
