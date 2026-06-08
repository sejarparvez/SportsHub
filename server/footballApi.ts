import type { GameState, MatchStatus, UpcomingMatch } from "../shared/types"

const BASE_URL = "https://api.football-data.org/v4"

interface FootballMatch {
	id: number
	status: string
	homeTeam: { id: number; name: string; crest: string }
	awayTeam: { id: number; name: string; crest: string }
	score: {
		fullTime: { home: number | null; away: number | null }
	}
	minute?: string | null
	utcDate?: string
}

function getApiKey(): string {
	const key = process.env.FOOTBALL_DATA_API_KEY
	if (!key || key === "your_key_here") {
		throw new Error("FOOTBALL_DATA_API_KEY is not set in .env")
	}
	return key
}

async function apiFetch(path: string): Promise<Response> {
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { "X-Auth-Token": getApiKey() },
	})
	if (!res.ok) {
		throw new Error(`API error ${res.status}: ${res.statusText}`)
	}
	return res
}

export async function fetchLiveMatches(): Promise<FootballMatch[]> {
	const res = await apiFetch("/matches?status=LIVE")
	const data = (await res.json()) as { matches: FootballMatch[] }
	return data.matches
}

export async function fetchScheduledMatches(): Promise<FootballMatch[]> {
	const res = await apiFetch("/matches?status=SCHEDULED")
	const data = (await res.json()) as { matches: FootballMatch[] }
	return data.matches
}

export async function fetchMatch(id: number): Promise<FootballMatch> {
	const res = await apiFetch(`/matches/${id}`)
	const data = (await res.json()) as FootballMatch
	return data
}

export function toGameState(match: FootballMatch): GameState {
	const minute = match.minute ? Number.parseInt(match.minute, 10) : 0
	const homeScore = match.score.fullTime.home ?? 0
	const awayScore = match.score.fullTime.away ?? 0

	let status: MatchStatus = "SCHEDULED"
	switch (match.status) {
		case "SCHEDULED":
			status = "SCHEDULED"
			break
		case "TIMED":
			status = "TIMED"
			break
		case "IN_PLAY":
			status = "IN_PLAY"
			break
		case "PAUSED":
			status = "PAUSED"
			break
		case "FINISHED":
			status = "FINISHED"
			break
		case "EXTRA_TIME":
			status = "EXTRA_TIME"
			break
		case "PENALTY_SHOOTOUT":
			status = "PENALTY_SHOOTOUT"
			break
		case "AWARDED":
			status = "AWARDED"
			break
	}

	return {
		matchId: match.id,
		homeTeam: {
			id: match.homeTeam.id,
			name: match.homeTeam.name,
			crest: match.homeTeam.crest,
			score: homeScore,
		},
		awayTeam: {
			id: match.awayTeam.id,
			name: match.awayTeam.name,
			crest: match.awayTeam.crest,
			score: awayScore,
		},
		minute,
		status,
		lastUpdated: new Date().toISOString(),
	}
}

export function toUpcomingMatch(match: FootballMatch): UpcomingMatch {
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
		kickoff: match.utcDate ?? "",
		status: "SCHEDULED",
	}
}
