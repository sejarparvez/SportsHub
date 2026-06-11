export interface TeamColors {
	primary?: string
	secondary?: string
	text?: string
}

export interface TournamentInfo {
	name: string
	round?: string
	roundNumber?: number
}

export interface GoalScorer {
	playerName: string
	minute: number
	addedTime?: number
	isHome: boolean
	assist?: string
	isOwnGoal?: boolean
	isPenalty?: boolean
}

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
	halfTimeScore?: number
	colors?: TeamColors
}

export interface GameState {
	matchId: number | null
	homeTeam: Team
	awayTeam: Team
	minute: number
	status: MatchStatus
	lastUpdated: string
	tournament?: TournamentInfo
	season?: string
	goals?: GoalScorer[]
}

export interface GoalEventData {
	matchId: number
	minute: number
	team?: "home" | "away"
	playerName?: string
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

export interface EventLogEntry {
	id: number
	timestamp: string
	type: "goal" | "halftime" | "fulltime" | "started" | "minute" | "status" | "override"
	description: string
}

export type MatchEventType = "halftime" | "fulltime" | "started"

export type SSEEventType =
	| "state:init"
	| "state:update"
	| "match:goal"
	| "match:halftime"
	| "match:fulltime"
	| "match:started"
