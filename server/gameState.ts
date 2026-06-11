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

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
	const result = { ...target }
	for (const key of Object.keys(source)) {
		const val = source[key as keyof T]
		if (val !== undefined) {
			if (
				val !== null &&
				typeof val === "object" &&
				!Array.isArray(val) &&
				typeof result[key as keyof T] === "object" &&
				result[key as keyof T] !== null
			) {
				result[key as keyof T] = deepMerge(
					result[key as keyof T] as Record<string, unknown>,
					val as Record<string, unknown>,
				) as T[keyof T]
			} else {
				result[key as keyof T] = val as T[keyof T]
			}
		}
	}
	return result
}

export function getState(): GameState {
	return { ...state }
}

export function setState(update: Partial<GameState>): GameState {
	state = deepMerge(state, update)
	state.lastUpdated = new Date().toISOString()
	return state
}

export function resetState(): void {
	state = { ...defaultState }
}
