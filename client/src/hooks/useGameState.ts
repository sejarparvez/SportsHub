import type { EventLogEntry, GameState, GoalEventData, MatchEventType } from "@shared/types";
import { FULLTIME_POPUP_DURATION, GOAL_POPUP_DURATION, HALFTIME_POPUP_DURATION } from "@shared/constants";
import { useCallback, useEffect, useRef, useState } from "react";

function parseSSEData(data: string) {
  try { return JSON.parse(data) as GameState }
  catch { console.error("SSE parse error:", data); return null }
}

export function useGameState() {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [goalEvent, setGoalEvent] = useState<GoalEventData | null>(null);
	const [matchEvent, setMatchEvent] = useState<MatchEventType | null>(null);
	const [connected, setConnected] = useState(false);
	const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
	const entryIdRef = useRef(0);

	const addLogEntry = useCallback(
		(type: EventLogEntry["type"], description: string) => {
			setEventLog((prev) => {
				const next = [
					...prev,
					{
						id: ++entryIdRef.current,
						timestamp: new Date().toISOString(),
						type,
						description,
					},
				];
				return next.length > 200 ? next.slice(-200) : next;
			});
		},
		[],
	);

	const prevStateRef = useRef<GameState | null>(null);
	const goalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const halftimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const fulltimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearGoalTimer = useCallback(() => {
		if (goalTimerRef.current) {
			clearTimeout(goalTimerRef.current);
			goalTimerRef.current = null;
		}
	}, []);

	const clearHalftimeTimer = useCallback(() => {
		if (halftimeTimerRef.current) {
			clearTimeout(halftimeTimerRef.current);
			halftimeTimerRef.current = null;
		}
	}, []);

	const clearFulltimeTimer = useCallback(() => {
		if (fulltimeTimerRef.current) {
			clearTimeout(fulltimeTimerRef.current);
			fulltimeTimerRef.current = null;
		}
	}, []);

	useEffect(() => {
		const es = new EventSource("/api/events");

		es.onopen = () => setConnected(true);

		es.addEventListener("state:init", (e: MessageEvent) => {
			const data = parseSSEData(e.data);
			if (!data) return;
			prevStateRef.current = data;
			setGameState(data);
			setEventLog([]);
			entryIdRef.current = 0;
			addLogEntry("status", `Match: ${data.homeTeam.name} vs ${data.awayTeam.name}`);
		});

		es.addEventListener("state:update", (e: MessageEvent) => {
			const data = parseSSEData(e.data);
			if (!data) return;
			const prev = prevStateRef.current;
			if (prev) {
				if (data.status !== prev.status) {
					const labels: Record<string, string> = {
						IN_PLAY: "Match started (IN_PLAY)",
						PAUSED: "Paused (Halftime)",
						FINISHED: "Finished",
						EXTRA_TIME: "Extra time",
						PENALTY_SHOOTOUT: "Penalty shootout",
						SCHEDULED: "Scheduled",
						TIMED: "Timed",
						AWARDED: "Awarded",
					};
					addLogEntry("status", `Status: ${labels[prev.status] || prev.status} → ${labels[data.status] || data.status}`);
				}
				if (data.homeTeam.score !== prev.homeTeam.score || data.awayTeam.score !== prev.awayTeam.score) {
					addLogEntry("override", `Score: ${prev.homeTeam.score}-${prev.awayTeam.score} → ${data.homeTeam.score}-${data.awayTeam.score}`);
				}
				if (Math.abs(data.minute - prev.minute) > 1) {
					addLogEntry("minute", `Minute: ${prev.minute}' → ${data.minute}'`);
				}
			}
			prevStateRef.current = data;
			setGameState(data);
		});

		es.addEventListener("match:goal", (e: MessageEvent) => {
			const data = parseSSEData(e.data) as GameState & { _playerName?: string }
			if (!data) return;
			const prev = prevStateRef.current;
			const team = prev
				? data.homeTeam.score > prev.homeTeam.score
					? ("home" as const)
					: data.awayTeam.score > prev.awayTeam.score
						? ("away" as const)
						: undefined
				: undefined;
			prevStateRef.current = data;
			const teamName = team === "home" ? data.homeTeam.name : team === "away" ? data.awayTeam.name : "Unknown";
			addLogEntry("goal", `⚽ ${teamName} — ${data.homeTeam.score}-${data.awayTeam.score} (${data.minute}')`);
			setGameState(data);
			clearGoalTimer();
			setGoalEvent({ matchId: data.matchId!, minute: data.minute, team, playerName: data._playerName });
			goalTimerRef.current = setTimeout(() => {
				setGoalEvent(null);
				goalTimerRef.current = null;
			}, GOAL_POPUP_DURATION);
		});

		es.addEventListener("match:started", (e: MessageEvent) => {
			const data = parseSSEData(e.data);
			if (!data) return;
			addLogEntry("started", "🔴 Match started");
			setGameState(data);
			setMatchEvent("started");
		});

		es.addEventListener("match:halftime", (e: MessageEvent) => {
			const data = parseSSEData(e.data);
			if (!data) return;
			addLogEntry("halftime", `⏸️ Halftime — ${data.homeTeam.score}-${data.awayTeam.score}`);
			setGameState(data);
			clearHalftimeTimer();
			setMatchEvent("halftime");
			halftimeTimerRef.current = setTimeout(() => {
				setMatchEvent(null);
				halftimeTimerRef.current = null;
			}, HALFTIME_POPUP_DURATION);
		});

		es.addEventListener("match:fulltime", (e: MessageEvent) => {
			const data = parseSSEData(e.data);
			if (!data) return;
			addLogEntry("fulltime", `🏁 Fulltime — ${data.homeTeam.score}-${data.awayTeam.score}`);
			prevStateRef.current = data;
			setGameState(data);
			clearFulltimeTimer();
			setMatchEvent("fulltime");
			fulltimeTimerRef.current = setTimeout(() => {
				setMatchEvent(null);
				fulltimeTimerRef.current = null;
			}, FULLTIME_POPUP_DURATION);
		});

		es.onerror = () => setConnected(false);

		return () => {
			es.close();
			clearGoalTimer();
			clearHalftimeTimer();
			clearFulltimeTimer();
		};
	}, [clearGoalTimer, clearHalftimeTimer, clearFulltimeTimer]);

	return { gameState, goalEvent, matchEvent, connected, eventLog, addLogEntry };
}
