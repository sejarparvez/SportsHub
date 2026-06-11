import { afterAll, beforeEach, describe, expect, it } from "bun:test"
import type { GameState } from "../../shared/types"
import { addToHistory, clearHistory, getHistory, loadHistory } from "../matchHistory"

function makeMatch(overrides: Partial<GameState> = {}): GameState {
	return {
		matchId: 1,
		homeTeam: { id: 1, name: "Home", crest: "", score: 2 },
		awayTeam: { id: 2, name: "Away", crest: "", score: 1 },
		minute: 90,
		status: "FINISHED",
		lastUpdated: new Date().toISOString(),
		...overrides,
	}
}

beforeEach(() => {
	clearHistory()
})

afterAll(() => {
	clearHistory()
})

describe("matchHistory", () => {
	it("loadHistory returns empty array when no file exists", () => {
		clearHistory()
		const history = loadHistory()
		expect(history).toEqual([])
	})

	it("addToHistory and getHistory round-trip", () => {
		const match = makeMatch()
		addToHistory(match)
		const history = getHistory()
		expect(history.length).toBeGreaterThanOrEqual(1)
		expect(history[0].matchId).toBe(match.matchId)
		expect(history[0].homeTeam.score).toBe(match.homeTeam.score)
	})

	it("does not duplicate identical finished match", () => {
		const match = makeMatch({ matchId: 42 })
		addToHistory(match)
		addToHistory(match)
		const entries = getHistory().filter((m) => m.matchId === 42)
		expect(entries.length).toBe(1)
	})

	it("duplicates with different scores are allowed", () => {
		addToHistory(
			makeMatch({
				matchId: 5,
				homeTeam: { id: 1, name: "A", crest: "", score: 2 },
				awayTeam: { id: 2, name: "B", crest: "", score: 1 },
			}),
		)
		addToHistory(
			makeMatch({
				matchId: 5,
				homeTeam: { id: 1, name: "A", crest: "", score: 3 },
				awayTeam: { id: 2, name: "B", crest: "", score: 2 },
			}),
		)
		const entries = getHistory().filter((m) => m.matchId === 5)
		expect(entries.length).toBe(2)
	})

	it("caps at 100 entries", () => {
		for (let i = 0; i < 110; i++) {
			addToHistory(
				makeMatch({ matchId: i, homeTeam: { id: i, name: `Team${i}`, crest: "", score: i } }),
			)
		}
		const history = getHistory()
		expect(history.length).toBe(100)
		expect(history[0].matchId).toBe(109)
	})

	it("clearHistory removes all entries", () => {
		addToHistory(makeMatch())
		clearHistory()
		expect(getHistory()).toEqual([])
	})

	it("preserves manual matches (matchId === null)", () => {
		const manual = makeMatch({
			matchId: null,
			homeTeam: { id: 0, name: "Manual Home", crest: "", score: 3 },
		})
		addToHistory(manual)
		const history = getHistory()
		expect(history.length).toBe(1)
		expect(history[0].matchId).toBeNull()
	})
})
