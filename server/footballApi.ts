import { execFileSync } from "node:child_process"
import type { GameState, MatchStatus, UpcomingMatch } from "../shared/types"

const BASE_URL = "https://api.sofascore.com/api/v1"

// Bun's native HTTP stack has a unique TLS fingerprint (JA3) that gets blocked
// by Sofascore's Varnish WAF. We shell out to curl as a workaround since it
// passes through fine with standard browser-like headers.
function curlFetch(path: string): Promise<Response> {
	return new Promise((resolve, reject) => {
		try {
			const url = `${BASE_URL}${path}`
			const args = [
				"curl",
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
			const output = execFileSync(args[0], args.slice(1), {
				encoding: "utf-8",
				timeout: 10_000,
			})
			resolve(
				new Response(output, {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			)
		} catch (err) {
			reject(new Error(`Sofascore API error: ${err instanceof Error ? err.message : String(err)}`))
		}
	})
}

interface SofascoreScore {
	current?: number
	display?: number
	period1?: number
	period2?: number
	normaltime?: number
}

interface SofascoreTeam {
	id: number
	name: string
	shortName?: string
	nameCode?: string
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
		initial?: number
		max?: number
		extra?: number
	}
	startTimestamp: number
	tournament: {
		name: string
		category?: {
			name: string
		}
	}
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

	switch (statusCode) {
		case 6: // 1st half
			return Math.min(elapsedMinutes, 45)
		case 7: // 2nd half
			return Math.min(45 + elapsedMinutes, 90)
		case 30: // Extra time
			return 90 + Math.min(elapsedMinutes, 30)
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
	const today = new Date().toISOString().split("T")[0]
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

export function toGameState(event: SofascoreEvent): GameState {
	return {
		matchId: event.id,
		homeTeam: {
			id: event.homeTeam.id,
			name: event.homeTeam.name,
			crest: `https://api.sofascore.com/api/v1/team/${event.homeTeam.id}/image`,
			score: event.homeScore?.current ?? 0,
		},
		awayTeam: {
			id: event.awayTeam.id,
			name: event.awayTeam.name,
			crest: `https://api.sofascore.com/api/v1/team/${event.awayTeam.id}/image`,
			score: event.awayScore?.current ?? 0,
		},
		minute: calculateMinute(event),
		status: mapStatus(event.status.code),
		lastUpdated: new Date().toISOString(),
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
