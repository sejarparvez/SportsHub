/**
 * Polling intervals per match status (in milliseconds).
 * 0 means polling is stopped for that status.
 */
export const POLL_INTERVALS: Record<string, number> = {
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
export const SSE_INIT_MESSAGE = "state:init"
export const AUTO_DETECT_INTERVAL = 30_000 // 30 seconds — when tracking SCHEDULED, poll frequently to catch start
