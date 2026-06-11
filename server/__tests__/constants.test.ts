import { describe, expect, it } from "bun:test"
import {
	AUTO_DETECT_INTERVAL,
	POLL_INTERVALS,
	POLL_RETRY_INTERVAL,
	SSE_KEEPALIVE_INTERVAL,
} from "../constants"

describe("constants", () => {
	it("POLL_INTERVALS has entries for all statuses", () => {
		expect(POLL_INTERVALS.IN_PLAY).toBe(60_000)
		expect(POLL_INTERVALS.FINISHED).toBe(0)
		expect(POLL_INTERVALS.PAUSED).toBe(2 * 60 * 1000)
		expect(POLL_INTERVALS.SCHEDULED).toBe(5 * 60 * 1000)
	})

	it("SSE_KEEPALIVE_INTERVAL is 30s", () => {
		expect(SSE_KEEPALIVE_INTERVAL).toBe(30_000)
	})

	it("AUTO_DETECT_INTERVAL is 30s", () => {
		expect(AUTO_DETECT_INTERVAL).toBe(30_000)
	})

	it("POLL_RETRY_INTERVAL is 30s", () => {
		expect(POLL_RETRY_INTERVAL).toBe(30_000)
	})
})
