import type { GameState, GoalEventData, MatchEventType } from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";

const GOAL_POPUP_DURATION = 5000;
const HALFTIME_POPUP_DURATION = 5000;

export function useGameState() {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [goalEvent, setGoalEvent] = useState<GoalEventData | null>(null);
	const [matchEvent, setMatchEvent] = useState<MatchEventType | null>(null);
	const [connected, setConnected] = useState(false);

	const goalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const halftimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

	useEffect(() => {
		const es = new EventSource("/api/events");

		es.onopen = () => setConnected(true);

		es.addEventListener("state:init", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GameState;
			setGameState(data);
		});

		es.addEventListener("state:update", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GameState;
			setGameState(data);
		});

		es.addEventListener("match:goal", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GameState;
			setGameState(data);
			clearGoalTimer();
			setGoalEvent({ matchId: data.matchId!, minute: data.minute });
			goalTimerRef.current = setTimeout(() => {
				setGoalEvent(null);
				goalTimerRef.current = null;
			}, GOAL_POPUP_DURATION);
		});

		es.addEventListener("match:started", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GameState;
			setGameState(data);
			setMatchEvent("started");
		});

		es.addEventListener("match:halftime", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GameState;
			setGameState(data);
			clearHalftimeTimer();
			setMatchEvent("halftime");
			halftimeTimerRef.current = setTimeout(() => {
				setMatchEvent(null);
				halftimeTimerRef.current = null;
			}, HALFTIME_POPUP_DURATION);
		});

		es.addEventListener("match:fulltime", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GameState;
			setGameState(data);
			setMatchEvent("fulltime");
		});

		es.onerror = () => setConnected(false);

		return () => {
			es.close();
			clearGoalTimer();
			clearHalftimeTimer();
		};
	}, [clearGoalTimer, clearHalftimeTimer]);

	return { gameState, goalEvent, matchEvent, connected };
}
