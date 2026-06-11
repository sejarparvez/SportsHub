import type { GameState, UpcomingMatch } from "@shared/types";
import { useCallback, useEffect, useState } from "react";
import LivePreview from "../components/LivePreview";
import { useGameState } from "../hooks/useGameState";
import ToastContainer from "../components/admin/ToastContainer";
import LiveMatchList from "../components/admin/LiveMatchList";
import UpcomingMatchList from "../components/admin/UpcomingMatchList";
import MatchControls from "../components/admin/MatchControls";
import ScoreOverride from "../components/admin/ScoreOverride";
import ManualMatchForm from "../components/admin/ManualMatchForm";

// ─── Section Card wrapper ───

function SectionCard({
	title,
	icon,
	children,
	className = "",
}: {
	title: string;
	icon?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden ${className}`}
		>
			<div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
				{icon && <span className="text-base">{icon}</span>}
				<h2 className="text-sm font-bold text-gray-700 tracking-wide">{title}</h2>
			</div>
			<div className="p-4 sm:p-5">{children}</div>
		</div>
	);
}

function kbd(shortcut: string) {
	return (
		<kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-mono text-gray-500 shadow-sm">
			{shortcut}
		</kbd>
	);
}

// ─── Main Admin Component ───

let toastId = 0;

export default function Admin() {
	const { gameState, connected } = useGameState();
	const [liveMatches, setLiveMatches] = useState<GameState[]>([]);
	const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
	const [homeOverride, setHomeOverride] = useState("");
	const [awayOverride, setAwayOverride] = useState("");
	const [error, setError] = useState("");
	const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
	const [loading, setLoading] = useState({
		select: false,
		stop: false,
		override: false,
	});
	const [matchesLoading, setMatchesLoading] = useState(true);
	const [upcomingLoading, setUpcomingLoading] = useState(true);
	const [refreshKey, setRefreshKey] = useState(0);

	const addToast = useCallback((message: string, type: "success" | "error" | "info") => {
		const id = ++toastId;
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	// Load live matches
	useEffect(() => {
		let ignore = false;
		setMatchesLoading(true);
		fetch("/api/matches/live")
			.then((r) => {
				if (!r.ok) throw new Error("Failed to load live matches");
				return r.json();
			})
			.then((data) => {
				if (ignore) return;
				setLiveMatches(data);
				setMatchesLoading(false);
			})
			.catch(() => {
				if (ignore) return;
				setError("Failed to load live matches");
				setMatchesLoading(false);
			});
		return () => {
			ignore = true;
		};
	}, [refreshKey]);

	// Load upcoming matches
	useEffect(() => {
		let ignore = false;
		setUpcomingLoading(true);
		fetch("/api/matches/upcoming")
			.then((r) => {
				if (!r.ok) throw new Error("Failed to load upcoming matches");
				return r.json();
			})
			.then((data) => {
				if (ignore) return;
				setUpcomingMatches(data);
				setUpcomingLoading(false);
			})
			.catch(() => {
				if (ignore) return;
				setError("Failed to load upcoming matches");
				setUpcomingLoading(false);
			});
		return () => {
			ignore = true;
		};
	}, [refreshKey]);

	// ─── API Handlers ───

	const selectMatch = useCallback(
		async (matchId: number) => {
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
		},
		[addToast],
	);

	const stopTracking = useCallback(async () => {
		setLoading((prev) => ({ ...prev, stop: true }));
		try {
			await fetch("/api/match/stop", { method: "POST" });
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
		async (team: "home" | "away") => {
			try {
				const res = await fetch("/api/match/goal", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ team }),
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

	const setStatus = useCallback(
		async (status: string) => {
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
		},
		[addToast],
	);

	const setMinute = useCallback(
		async (minute: number) => {
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
		},
		[addToast],
	);

	// Keyboard shortcuts
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "s" && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				stopTracking();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [stopTracking]);

	// ─── Render ───

	return (
		<div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
			<ToastContainer toasts={toasts} />

			<div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
				{/* ═══ Header ═══ */}
				<header className="flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
							<span className="text-lg">🏟️</span>
						</div>
						<div>
							<h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
								SportsHub
							</h1>
							<p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">
								Admin Dashboard
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-400 bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-1.5">
							{kbd("S")}
							<span>Stop</span>
						</div>
						<div
							className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm ${
								connected
									? "bg-green-50 border-green-200 text-green-700"
									: "bg-red-50 border-red-200 text-red-700"
							}`}
						>
							<span
								className={`w-2 h-2 rounded-full ${
									connected
										? "bg-green-500 animate-pulse shadow-sm shadow-green-400/50"
										: "bg-red-500"
								}`}
							/>
							{connected ? "Live" : "Disconnected"}
						</div>
					</div>
				</header>

				{/* Error banner */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm flex items-center gap-2.5 animate-slide-up shadow-sm">
						<span className="text-lg">⚠️</span>
						<span className="font-medium">{error}</span>
					</div>
				)}

				{/* ═══ Main Grid ═══ */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* ─── Left Column: Matches ─── */}
					<div className="lg:col-span-2 space-y-6">
						<SectionCard title="Live Matches" icon="🔴">
							<LiveMatchList
								matches={liveMatches}
								loading={matchesLoading}
								onSelect={selectMatch}
								selectLoading={loading.select}
							/>
						</SectionCard>

						<SectionCard title="Upcoming Today" icon="📅">
							<UpcomingMatchList
								matches={upcomingMatches}
								loading={upcomingLoading}
								onSelect={selectMatch}
								selectLoading={loading.select}
							/>
						</SectionCard>
					</div>

					{/* ─── Right Column: Controls ─── */}
					<div className="space-y-4">
						{/* Stop Tracking */}
						<button
							type="button"
							onClick={stopTracking}
							disabled={loading.stop}
							className="w-full bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-400 active:to-rose-400 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-4 py-3 rounded-xl transition-all duration-150 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
						>
							{loading.stop ? (
								<>
									<span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
									Stopping...
								</>
							) : (
								<>
									<span>🛑</span>
									<span>Stop Tracking</span>
									<span className="text-red-200/50 text-[10px] font-mono hidden sm:inline">
										S
									</span>
								</>
							)}
						</button>

						{/* Quick Actions (only for manual matches) */}
						{gameState && gameState.matchId === null && (
							<SectionCard title="Quick Actions" icon="⚡" className="animate-slide-up">
								<MatchControls
									gameState={gameState}
									onGoal={triggerGoal}
									onSetStatus={setStatus}
									onSetMinute={setMinute}
								/>
							</SectionCard>
						)}

						{/* Score Override */}
						<SectionCard title="Score Override" icon="✏️">
							<ScoreOverride
								gameState={gameState}
								homeValue={homeOverride}
								awayValue={awayOverride}
								onHomeChange={setHomeOverride}
								onAwayChange={setAwayOverride}
								onApply={overrideScore}
								loading={loading.override}
							/>
						</SectionCard>

						{/* Manual Match */}
						<SectionCard title="Manual Match" icon="🎛️">
							<ManualMatchForm
								addToast={addToast}
								onMatchCreated={() => setRefreshKey((k) => k + 1)}
							/>
						</SectionCard>
					</div>
				</div>

				{/* ═══ Live Preview ═══ */}
				<SectionCard title="Live Preview" icon="📺">
					<LivePreview state={gameState} />
				</SectionCard>
			</div>
		</div>
	);
}
