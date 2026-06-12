import { z } from "zod"

const MatchStatusEnum = z.enum([
	"SCHEDULED",
	"TIMED",
	"IN_PLAY",
	"PAUSED",
	"FINISHED",
	"EXTRA_TIME",
	"PENALTY_SHOOTOUT",
	"AWARDED",
])

export type MatchStatusEnum = z.infer<typeof MatchStatusEnum>

export const selectMatchSchema = z.object({
	matchId: z.number().int().positive(),
})

export const overrideScoreSchema = z.object({
	homeScore: z.number().int().min(0),
	awayScore: z.number().int().min(0),
})

export const createMatchSchema = z.object({
	homeTeamName: z.string().min(1).max(100),
	homeTeamCrest: z.string().optional(),
	awayTeamName: z.string().min(1).max(100),
	awayTeamCrest: z.string().optional(),
	homeScore: z.number().int().min(0).optional(),
	awayScore: z.number().int().min(0).optional(),
	status: MatchStatusEnum.optional(),
	minute: z.number().int().min(0).max(999).optional(),
})

export const goalSchema = z.object({
	team: z.enum(["home", "away"]),
	playerName: z.string().max(100).optional(),
})

export const setMinuteSchema = z.object({
	minute: z.number().int().min(0).max(999),
})

export const setStatusSchema = z.object({
	status: MatchStatusEnum,
})
