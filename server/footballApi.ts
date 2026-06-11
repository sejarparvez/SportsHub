import { execFile } from "node:child_process"
import type { GameState, MatchStatus, UpcomingMatch } from "../shared/types"

const BASE_URL = "https://api.sofascore.com/api/v1"

// Bun's native HTTP stack has a unique TLS fingerprint (JA3) that gets blocked
// by Sofascore's Varnish WAF. We shell out to curl as a workaround since it
// passes through fine with standard browser-like headers.
function curlFetch(path: string): Promise<Response> {
	return new Promise((resolve, reject) => {
		const url = `${BASE_URL}${path}`
		const args = [
			"-s",
			"--max-time",
			"10",
			"-H",
			"Accept: application/json",
			"-H",
			"User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
			"-H",
			"Referer: https://www.sofascore.com/",
			url,
		]
		execFile("curl", args, { encoding: "utf-8", timeout: 10_000 }, (err, stdout) => {
			if (err) {
				reject(new Error(`Sofascore API error: ${err.message}`))
				return
			}
			resolve(
				new Response(stdout, {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			)
		})
	})
}

interface SofascoreScore {
	current?: number
	period1?: number
}

interface SofascoreTeam {
	id: number
	name: string
	teamColors?: {
		primary?: string
		secondary?: string
		text?: string
	}
}

interface SofascoreRoundInfo {
	round?: number
	name?: string
}

interface SofascoreEvent {
	id: number
	status: {
		code: number
		description: string
		type: string
	}
	homeTeam: SofascoreTeam
	awayTeam: SofascoreTeam
	homeScore: SofascoreScore
	awayScore: SofascoreScore
	time?: {
		currentPeriodStartTimestamp?: number
		injuryTime1?: number
	}
	startTimestamp: number
	tournament: {
		name: string
		uniqueTournament?: {
			name: string
		}
		category?: {
			name: string
		}
	}
	roundInfo?: SofascoreRoundInfo
	season?: {
		name: string
		year: string
	}
}

interface SofascoreIncident {
	id: number
	time: number
	addedTime?: number
	incidentType: string
	isHome: boolean
	player?: {
		name: string
		shortName?: string
	}
	assist1?: {
		name: string
	}
	goalType?: string
}

interface SofascoreIncidentsResponse {
	incidents: SofascoreIncident[]
}

interface SofascoreResponse {
	events: SofascoreEvent[]
}

// --- Helpers ---

function mapStatus(code: number): MatchStatus {
	switch (code) {
		case 0:
			return "SCHEDULED"
		case 6: // 1st half
		case 7: // 2nd half
		case 20: // Started
			return "IN_PLAY"
		case 30: // Extra time
			return "EXTRA_TIME"
		case 31: // Halftime
			return "PAUSED"
		case 50: // Penalty shootout
			return "PENALTY_SHOOTOUT"
		case 60: // Postponed / interrupted
		case 80:
			return "SCHEDULED"
		case 100: // Ended / full time
			return "FINISHED"
		default:
			return "SCHEDULED"
	}
}

function calculateMinute(event: SofascoreEvent): number {
	const statusCode = event.status.code
	const periodStart = event.time?.currentPeriodStartTimestamp
	if (!periodStart) return 0

	const now = Math.floor(Date.now() / 1000)
	const elapsedMinutes = Math.floor((now - periodStart) / 60)

	const MAX_STOPPAGE = 15

	switch (statusCode) {
		case 6: // 1st half
			return Math.min(elapsedMinutes, 45)
		case 7: {
			// 2nd half
			const injury = Math.min(event.time?.injuryTime1 ?? 0, MAX_STOPPAGE)
			return Math.min(45 + elapsedMinutes, 90 + injury)
		}
		case 30: {
			// Extra time
			const injury = Math.min(event.time?.injuryTime1 ?? 0, MAX_STOPPAGE)
			return Math.min(90 + elapsedMinutes, 120 + injury)
		}
		case 31: // Halftime
			return 45
		case 50: // Penalties
			return 90
		default:
			return 0
	}
}

// --- API Fetch (no key needed) ---

async function apiFetch(path: string): Promise<Response> {
	const res = await curlFetch(path)
	if (!res.ok) {
		throw new Error(`Sofascore API error ${res.status}: ${res.statusText}`)
	}
	return res
}

// --- Public functions ---

export async function fetchLiveMatches(): Promise<SofascoreEvent[]> {
	const res = await apiFetch("/sport/football/events/live")
	const data = (await res.json()) as SofascoreResponse
	return data.events ?? []
}

export async function fetchScheduledMatches(): Promise<SofascoreEvent[]> {
	const d = new Date()
	const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
	const res = await apiFetch(`/sport/football/scheduled-events/${today}`)
	const data = (await res.json()) as SofascoreResponse
	// Only return matches that haven't started yet
	return (data.events ?? []).filter((e) => e.status.code === 0)
}

export async function fetchMatch(id: number): Promise<SofascoreEvent> {
	const res = await apiFetch(`/event/${id}`)
	const data = (await res.json()) as { event: SofascoreEvent }
	return data.event
}

export async function fetchIncidents(id: number): Promise<SofascoreIncident[]> {
	const res = await apiFetch(`/event/${id}/incidents`)
	const data = (await res.json()) as SofascoreIncidentsResponse
	return data.incidents ?? []
}

export function toGoalScorers(
	incidents: SofascoreIncident[],
): import("../shared/types").GoalScorer[] {
	return incidents
		.filter((i) => i.incidentType === "goal")
		.map((i) => ({
			playerName: i.player?.shortName ?? i.player?.name ?? "Unknown",
			minute: i.time,
			addedTime: i.addedTime,
			isHome: i.isHome,
			assist: i.assist1?.name,
			isOwnGoal: i.goalType === "own-goal",
			isPenalty: i.goalType === "penalty",
		}))
}

export function toGameState(event: SofascoreEvent): GameState {
	const tournamentName = event.tournament.uniqueTournament?.name ?? event.tournament.name
	return {
		matchId: event.id,
		homeTeam: {
			id: event.homeTeam.id,
			name: event.homeTeam.name,
			crest: `https://api.sofascore.com/api/v1/team/${event.homeTeam.id}/image`,
			score: event.homeScore?.current ?? 0,
			halfTimeScore: event.homeScore?.period1,
			colors: {
				primary: event.homeTeam.teamColors?.primary,
				secondary: event.homeTeam.teamColors?.secondary,
				text: event.homeTeam.teamColors?.text,
			},
		},
		awayTeam: {
			id: event.awayTeam.id,
			name: event.awayTeam.name,
			crest: `https://api.sofascore.com/api/v1/team/${event.awayTeam.id}/image`,
			score: event.awayScore?.current ?? 0,
			halfTimeScore: event.awayScore?.period1,
			colors: {
				primary: event.awayTeam.teamColors?.primary,
				secondary: event.awayTeam.teamColors?.secondary,
				text: event.awayTeam.teamColors?.text,
			},
		},
		minute: calculateMinute(event),
		status: mapStatus(event.status.code),
		lastUpdated: new Date().toISOString(),
		tournament: {
			name: tournamentName,
			round: event.roundInfo?.name,
			roundNumber: event.roundInfo?.round,
		},
		season: event.season?.name,
	}
}

export function toUpcomingMatch(event: SofascoreEvent): UpcomingMatch {
	return {
		id: event.id,
		homeTeam: {
			id: event.homeTeam.id,
			name: event.homeTeam.name,
			crest: `https://api.sofascore.com/api/v1/team/${event.homeTeam.id}/image`,
		},
		awayTeam: {
			id: event.awayTeam.id,
			name: event.awayTeam.name,
			crest: `https://api.sofascore.com/api/v1/team/${event.awayTeam.id}/image`,
		},
		kickoff: new Date(event.startTimestamp * 1000).toISOString(),
		status: "SCHEDULED",
	}
}
