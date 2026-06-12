import type { GameState } from "../shared/types"

export interface DetectedEvents {
	justStarted: boolean
	justFinished: boolean
	justHalftime: boolean
	scoreChanged: boolean
	stateChanged: boolean
}

export function detectEvents(newState: GameState, oldState: GameState): DetectedEvents {
	return {
		justStarted:
			newState.status === "IN_PLAY" &&
			(oldState.status === "SCHEDULED" || oldState.status === "TIMED"),
		justFinished: newState.status === "FINISHED" || newState.status === "AWARDED",
		justHalftime: newState.status === "PAUSED" && oldState.status === "IN_PLAY",
		scoreChanged:
			newState.homeTeam.score !== oldState.homeTeam.score ||
			newState.awayTeam.score !== oldState.awayTeam.score,
		stateChanged: newState.minute !== oldState.minute || newState.status !== oldState.status,
	}
}
