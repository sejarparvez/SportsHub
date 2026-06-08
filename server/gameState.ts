import type { GameState } from "../shared/types"

const defaultState: GameState = {
	matchId: null,
	homeTeam: { id: 0, name: "Home", crest: "", score: 0 },
	awayTeam: { id: 0, name: "Away", crest: "", score: 0 },
	minute: 0,
	status: "SCHEDULED",
	lastUpdated: new Date().toISOString(),
}

let state: GameState = { ...defaultState }

export function getState(): GameState {
	return state
}

export function setState(update: Partial<GameState>): GameState {
	state = { ...state, ...update, lastUpdated: new Date().toISOString() }
	return state
}

export function resetState(): void {
	state = { ...defaultState }
}
