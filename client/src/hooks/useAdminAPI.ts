import { useCallback, useEffect, useRef, useState } from "react";
import { useGameState } from "./useGameState";

export function useAdminAPI(homeOverride: string, awayOverride: string) {
	const { gameState, connected, eventLog } = useGameState();
	const [error, setError] = useState("");
	const [toasts, setToasts] = useState<
		{ id: number; message: string; type: "success" | "error" | "info" }[]
	>([]);
	const [loading, setLoading] = useState({
		select: false,
		stop: false,
		override: false,
	});
	const [refreshKey, setRefreshKey] = useState(0);
	const toastIdRef = useRef(0);
	const toastTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
	const minuteRef = useRef(0);
	const hasMatchRef = useRef(false);

	const addToast = useCallback(
		(message: string, type: "success" | "error" | "info") => {
			const id = ++toastIdRef.current;
			setToasts((prev) => [...prev, { id, message, type }]);
			const timeout = setTimeout(() => {
				toastTimeoutsRef.current.delete(timeout);
				setToasts((prev) => prev.filter((t) => t.id !== id));
			}, 4000);
			toastTimeoutsRef.current.add(timeout);
		},
		[],
	);

	useEffect(() => {
		return () => {
			toastTimeoutsRef.current.forEach(clearTimeout);
			toastTimeoutsRef.current.clear();
		};
	}, []);

	useEffect(() => {
		hasMatchRef.current = gameState !== null;
		if (gameState) minuteRef.current = gameState.minute;
	}, [gameState]);

	const selectMatch = useCallback(async (matchId: number) => {
		setError("");
		setLoading((prev) => ({ ...prev, select: true }));
		try {
			const res = await fetch("/api/match/select", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ matchId }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Failed to select match");
				addToast(data.error || "Failed to select match", "error");
			} else {
				addToast("Match selected successfully", "success");
				setRefreshKey((k) => k + 1);
			}
		} catch {
			const msg = "Network error selecting match";
			setError(msg);
			addToast(msg, "error");
		} finally {
			setLoading((prev) => ({ ...prev, select: false }));
		}
	}, [addToast]);

	const stopTracking = useCallback(async () => {
		if (!window.confirm("Stop tracking this match? All state will be lost."))
			return;
		setLoading((prev) => ({ ...prev, stop: true }));
		try {
			await fetch("/api/match/stop", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			addToast("Tracking stopped", "info");
			setRefreshKey((k) => k + 1);
		} catch {
			addToast("Failed to stop tracking", "error");
		} finally {
			setLoading((prev) => ({ ...prev, stop: false }));
		}
	}, [addToast]);

	const overrideScore = useCallback(async () => {
		setLoading((prev) => ({ ...prev, override: true }));
		try {
			const res = await fetch("/api/match/override", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					homeScore: Number.parseInt(homeOverride) || 0,
					awayScore: Number.parseInt(awayOverride) || 0,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				addToast(data.error || "Failed to override score", "error");
			} else {
				addToast("Score overridden", "success");
			}
		} catch {
			addToast("Network error overriding score", "error");
		} finally {
			setLoading((prev) => ({ ...prev, override: false }));
		}
	}, [homeOverride, awayOverride, addToast]);

	const triggerGoal = useCallback(
		async (team: "home" | "away", playerName?: string) => {
			try {
				const res = await fetch("/api/match/goal", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ team, playerName }),
				});
				if (res.ok) {
					addToast(`⚽ ${team === "home" ? "Home" : "Away"} goal!`, "success");
				}
			} catch {
				addToast("Failed to trigger goal", "error");
			}
		},
		[addToast],
	);

	const setStatus = useCallback(async (status: string) => {
		try {
			const res = await fetch("/api/match/set-status", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status }),
			});
			const data = await res.json();
			if (!res.ok) {
				addToast(data.error || "Failed to set status", "error");
			} else {
				const labels: Record<string, string> = {
					PAUSED: "Halftime",
					FINISHED: "Fulltime",
					IN_PLAY: "Match started",
				};
				addToast(labels[status] || `Status: ${status}`, "info");
			}
		} catch {
			addToast("Failed to set status", "error");
		}
	}, [addToast]);

	const setMinute = useCallback(async (minute: number) => {
		try {
			const res = await fetch("/api/match/set-minute", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ minute }),
			});
			if (!res.ok) {
				const data = await res.json();
				addToast(data.error || "Failed to set minute", "error");
			}
		} catch {
			addToast("Failed to set minute", "error");
		}
	}, [addToast]);

	return {
		addToast,
		toasts,
		error,
		setError,
		selectMatch,
		stopTracking,
		overrideScore,
		triggerGoal,
		setStatus,
		setMinute,
		loading,
		minuteRef,
		hasMatchRef,
		refreshKey,
		setRefreshKey,
		gameState,
		connected,
		eventLog,
	};
}
