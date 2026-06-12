import type { GameState, MatchStatus, UpcomingMatch } from "../shared/types"

const BASE_URL = "https://api.football-data.org/v4"

interface FootballDataTeam {
	id: number
	name: string
	shortName: string
	tla: string
	crest: string
}

interface FootballDataScore {
	winner: string | null
	duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT"
	fullTime: { home: number | null; away: number | null }
	halfTime: { home: number | null; away: number | null }
	extraTime?: { home: number | null; away: number | null }
	penalties?: { home: number | null; away: number | null }
}

interface FootballDataCompetition {
	id: number
	name: string
	code: string
	type: string
	emblem: string
}

interface FootballDataSeason {
	id: number
	startDate: string
	endDate: string
	currentMatchday: number
	winner: string | null
}

export interface FootballDataMatch {
	id: number
	utcDate: string
	status: string
	matchday: number
	stage: string | null
	group: string | null
	homeTeam: FootballDataTeam
	awayTeam: FootballDataTeam
	score: FootballDataScore
	season: FootballDataSeason
	competition: FootballDataCompetition
	referees: Array<{ id: number; name: string; type: string; nationality: string }>
}

interface FootballDataMatchesResponse {
	filters: Record<string, unknown>
	resultSet: { count: number; competitions: string; first: string; last: string; played: number }
	matches: FootballDataMatch[]
}

const API_KEY = process.env.FOOTBALL_DATA_API_KEY

async function apiFetch(path: string): Promise<Response> {
	if (!API_KEY) {
		throw new Error("FOOTBALL_DATA_API_KEY environment variable is not set")
	}
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { "X-Auth-Token": API_KEY },
	})
	if (!res.ok) {
		const body = await res.text().catch(() => "")
		throw new Error(`football-data.org API error ${res.status}: ${res.statusText}${body ? ` — ${body}` : ""}`)
	}
	return res
}

function mapStatus(status: string): MatchStatus {
	switch (status) {
		case "SCHEDULED":
			return "SCHEDULED"
		case "TIMED":
			return "TIMED"
		case "IN_PLAY":
			return "IN_PLAY"
		case "PAUSED":
			return "PAUSED"
		case "FINISHED":
			return "FINISHED"
		case "AWARDED":
			return "AWARDED"
		case "SUSPENDED":
		case "POSTPONED":
		case "CANCELLED":
			return "SCHEDULED"
		default:
			return "SCHEDULED"
	}
}

function mapDurationToStatus(duration: string): MatchStatus | null {
	switch (duration) {
		case "EXTRA_TIME":
			return "EXTRA_TIME"
		case "PENALTY_SHOOTOUT":
			return "PENALTY_SHOOTOUT"
		default:
			return null
	}
}

function calculateMinute(match: FootballDataMatch): number {
	const { status, utcDate, score } = match
	if (status !== "IN_PLAY" && status !== "PAUSED") return 0

	const kickoff = new Date(utcDate).getTime()
	const now = Date.now()
	const elapsed = Math.floor((now - kickoff) / 60000)
	if (elapsed < 0) return 0

	if (score.duration === "EXTRA_TIME") {
		return Math.min(Math.max(elapsed - 90, 0), 30)
	}
	if (score.duration === "PENALTY_SHOOTOUT") {
		return 90
	}
	if (elapsed >= 45 && status === "PAUSED") {
		return 45
	}
	return Math.min(elapsed, 90)
}

export async function fetchLiveMatches(): Promise<FootballDataMatch[]> {
	const res = await apiFetch("/matches?status=LIVE")
	const data = (await res.json()) as FootballDataMatchesResponse
	return data.matches ?? []
}

export async function fetchScheduledMatches(): Promise<FootballDataMatch[]> {
	const res = await apiFetch("/matches?status=SCHEDULED")
	const data = (await res.json()) as FootballDataMatchesResponse
	return data.matches ?? []
}

export async function fetchMatch(id: number): Promise<FootballDataMatch> {
	const res = await apiFetch(`/matches/${id}`)
	const data = (await res.json()) as FootballDataMatch
	return data
}

export async function fetchIncidents(_id: number): Promise<never[]> {
	return []
}

export function toGoalScorers(_incidents: never[]): import("../shared/types").GoalScorer[] {
	return []
}

export function toGameState(match: FootballDataMatch): GameState {
	const durationStatus = mapDurationToStatus(match.score.duration)
	return {
		matchId: match.id,
		homeTeam: {
			id: match.homeTeam.id,
			name: match.homeTeam.name,
			crest: match.homeTeam.crest,
			score: match.score.fullTime.home ?? 0,
			halfTimeScore: match.score.halfTime.home ?? undefined,
		},
		awayTeam: {
			id: match.awayTeam.id,
			name: match.awayTeam.name,
			crest: match.awayTeam.crest,
			score: match.score.fullTime.away ?? 0,
			halfTimeScore: match.score.halfTime.away ?? undefined,
		},
		minute: calculateMinute(match),
		status: durationStatus ?? mapStatus(match.status),
		lastUpdated: new Date().toISOString(),
		tournament: {
			name: match.competition.name,
			round: match.stage ? `${match.stage}${match.group ? ` - ${match.group}` : ""}` : undefined,
			roundNumber: match.matchday,
		},
		season: `${match.season.startDate} — ${match.season.endDate}`,
	}
}

export function toUpcomingMatch(match: FootballDataMatch): UpcomingMatch {
	return {
		id: match.id,
		homeTeam: {
			id: match.homeTeam.id,
			name: match.homeTeam.name,
			crest: match.homeTeam.crest,
		},
		awayTeam: {
			id: match.awayTeam.id,
			name: match.awayTeam.name,
			crest: match.awayTeam.crest,
		},
		kickoff: match.utcDate,
		status: "SCHEDULED",
	}
}
