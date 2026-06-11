import { describe, expect, it } from "bun:test"
import { getState, resetState, setState } from "../gameState"

describe("gameState", () => {
	it("getState returns default state", () => {
		resetState()
		const state = getState()
		expect(state.matchId).toBeNull()
		expect(state.homeTeam.name).toBe("Home")
		expect(state.awayTeam.name).toBe("Away")
		expect(state.minute).toBe(0)
		expect(state.status).toBe("SCHEDULED")
	})

	it("setState updates partial fields", () => {
		resetState()
		setState({ minute: 45, status: "PAUSED" })
		const state = getState()
		expect(state.minute).toBe(45)
		expect(state.status).toBe("PAUSED")
		expect(state.homeTeam.name).toBe("Home")
	})

	it("setState deep merges team", () => {
		resetState()
		setState({ homeTeam: { score: 1 } })
		const state = getState()
		expect(state.homeTeam.name).toBe("Home")
		expect(state.homeTeam.score).toBe(1)
		expect(state.awayTeam.score).toBe(0)
	})

	it("resetState restores defaults", () => {
		setState({ minute: 90, homeTeam: { score: 3 } })
		resetState()
		const state = getState()
		expect(state.minute).toBe(0)
		expect(state.homeTeam.score).toBe(0)
		expect(state.homeTeam.name).toBe("Home")
		expect(state.matchId).toBeNull()
	})

	it("deep merges nested tournament field", () => {
		resetState()
		setState({ tournament: { name: "Premier League", round: "Matchweek 1" } })
		const after = getState()
		expect(after.tournament?.name).toBe("Premier League")
		expect(after.tournament?.round).toBe("Matchweek 1")

		setState({ tournament: { name: "Champions League" } })
		const merged = getState()
		expect(merged.tournament?.name).toBe("Champions League")
		expect(merged.tournament?.round).toBe("Matchweek 1")
	})

	it("replaces arrays, does not merge them", () => {
		resetState()
		const g1 = [{ playerName: "A", minute: 10, isHome: true }]
		const g2 = [{ playerName: "B", minute: 20, isHome: false }]
		setState({ goals: g1 })
		setState({ goals: g2 })
		const state = getState()
		expect(state.goals).toHaveLength(1)
		expect(state.goals?.[0].playerName).toBe("B")
	})

	it("getState returns a copy (immutable)", () => {
		resetState()
		const a = getState()
		const b = getState()
		expect(a).toEqual(b)
		expect(a).not.toBe(b)
	})
})
