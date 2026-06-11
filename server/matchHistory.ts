import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import type { GameState } from "../shared/types"

const DATA_DIR = path.resolve(import.meta.dirname, "data")
const HISTORY_FILE = path.join(DATA_DIR, "history.json")
const MAX_ENTRIES = 100

let cache: GameState[] | null = null

function ensureDataDir(): void {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true })
	}
}

function readFileSafe(): GameState[] {
	try {
		if (!existsSync(HISTORY_FILE)) return []
		const raw = readFileSync(HISTORY_FILE, "utf-8")
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) {
			console.warn("matchHistory: history.json is not an array, resetting")
			return []
		}
		return parsed as GameState[]
	} catch (err) {
		console.warn("matchHistory: failed to read history.json, resetting:", err)
		return []
	}
}

function writeFileSafe(entries: GameState[]): void {
	ensureDataDir()
	const tmp = `${HISTORY_FILE}.tmp`
	writeFileSync(tmp, JSON.stringify(entries, null, 2), "utf-8")
	renameSync(tmp, HISTORY_FILE)
}

function isDuplicate(entry: GameState, existing: GameState[]): boolean {
	return existing.some(
		(e) =>
			e.matchId !== null &&
			entry.matchId !== null &&
			e.matchId === entry.matchId &&
			e.homeTeam.score === entry.homeTeam.score &&
			e.awayTeam.score === entry.awayTeam.score,
	)
}

export function loadHistory(): GameState[] {
	cache = readFileSafe()
	return cache
}

export function getHistory(): GameState[] {
	if (cache === null) {
		cache = loadHistory()
	}
	return [...cache]
}

export function addToHistory(entry: GameState): void {
	const current = getHistory()

	if (isDuplicate(entry, current)) return

	const updated = [entry, ...current].slice(0, MAX_ENTRIES)
	cache = updated
	writeFileSafe(updated)
}

export function clearHistory(): void {
	cache = []
	ensureDataDir()
	writeFileSafe([])
}
