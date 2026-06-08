export type MatchStatus =
	| "SCHEDULED"
	| "TIMED"
	| "IN_PLAY"
	| "PAUSED"
	| "FINISHED"
	| "EXTRA_TIME"
	| "PENALTY_SHOOTOUT"
	| "AWARDED"

export interface Team {
	id: number
	name: string
	crest: string
	score: number
}

export interface GameState {
	matchId: number | null
	homeTeam: Team
	awayTeam: Team
	minute: number
	status: MatchStatus
	lastUpdated: string
}

export interface GoalEventData {
	matchId: number
	minute: number
}

export interface UpcomingMatch {
	id: number
	homeTeam: {
		id: number
		name: string
		crest: string
	}
	awayTeam: {
		id: number
		name: string
		crest: string
	}
	kickoff: string
	status: MatchStatus
}

export type MatchEventType = "halftime" | "fulltime" | "started"

export type SSEEventType =
	| "state:init"
	| "state:update"
	| "match:goal"
	| "match:halftime"
	| "match:fulltime"
	| "match:started"
