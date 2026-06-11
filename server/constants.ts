/**
 * Polling intervals per match status (in milliseconds).
 * 0 means polling is stopped for that status.
 */
import type { MatchStatus } from "../shared/types"

export const POLL_INTERVALS: Record<MatchStatus, number> = {
	SCHEDULED: 5 * 60 * 1000,
	TIMED: 5 * 60 * 1000,
	IN_PLAY: 60 * 1000,
	PAUSED: 2 * 60 * 1000,
	EXTRA_TIME: 60 * 1000,
	PENALTY_SHOOTOUT: 60 * 1000,
	FINISHED: 0,
	AWARDED: 0,
} as const

export const SSE_KEEPALIVE_INTERVAL = 30_000 // 30 seconds
export const AUTO_DETECT_INTERVAL = 30_000 // 30 seconds — when tracking SCHEDULED, poll frequently to catch start
