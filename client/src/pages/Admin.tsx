import type { GameState, UpcomingMatch } from "@shared/types";
import { useCallback, useEffect, useState } from "react";
import TeamBadge from "../components/TeamBadge";
import LivePreview from "../components/LivePreview";
import { useGameState } from "../hooks/useGameState";

// ─── Types ───

type ToastType = "success" | "error" | "info";

interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

interface Preset {
	name: string;
	homeTeamName: string;
	homeTeamCrest: string;
	awayTeamName: string;
	awayTeamCrest: string;
}

// ─── Constants ───

let toastId = 0;
const PRESETS_KEY = "sportshub-presets";

// ─── Helpers ───

function loadPresets(): Preset[] {
	try {
		return JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
	} catch {
		return [];
	}
}

function savePresets(presets: Preset[]) {
	localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

function kbd(shortcut: string) {
	return (
		<kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-mono text-gray-500">
			{shortcut}
		</kbd>
	);
}

// ─── Mini badge for status colors ───

const statusColors: Record<string, string> = {
	SCHEDULED: "bg-gray-500/30 text-gray-300 border-gray-500/30",
	TIMED: "bg-gray-500/30 text-gray-300 border-gray-500/30",
	IN_PLAY: "bg-green-500/20 text-green-400 border-green-500/30",
	PAUSED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
	FINISHED: "bg-gray-600/30 text-gray-400 border-gray-500/30",
	EXTRA_TIME: "bg-orange-500/20 text-orange-400 border-orange-500/30",
	PENALTY_SHOOTOUT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
	AWARDED: "bg-gray-600/30 text-gray-400 border-gray-500/30",
};

const statusLabels: Record<string, string> = {
	SCHEDULED: "SCHEDULED",
	TIMED: "TIMED",
	IN_PLAY: "LIVE",
	PAUSED: "HT",
	FINISHED: "FT",
	EXTRA_TIME: "ET",
	PENALTY_SHOOTOUT: "PENS",
	AWARDED: "FT",
};

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
			className={`bg-white/4 backdrop-blur-sm rounded-2xl border border-white/8 overflow-hidden ${className}`}
		>
			<div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/6">
				{icon && <span className="text-base">{icon}</span>}
				<h2 className="text-sm font-bold text-white/80 tracking-wide">{title}</h2>
			</div>
			<div className="p-4 sm:p-5">{children}</div>
		</div>
	);
}

// ─── Main Admin Component ───

export default function Admin() {
	const { gameState, connected } = useGameState();
	const [liveMatches, setLiveMatches] = useState<GameState[]>([]);
	const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
	const [homeOverride, setHomeOverride] = useState("");
	const [awayOverride, setAwayOverride] = useState("");
	const [error, setError] = useState("");
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [loading, setLoading] = useState({
		select: false,
		stop: false,
		override: false,
	});
	const [matchesLoading, setMatchesLoading] = useState(true);
	const [upcomingLoading, setUpcomingLoading] = useState(true);
	const [minuteInput, setMinuteInput] = useState("");

	// Manual match form state
	const [showManualForm, setShowManualForm] = useState(false);
	const [manualForm, setManualForm] = useState({
		homeTeamName: "",
		homeTeamCrest: "",
		awayTeamName: "",
		awayTeamCrest: "",
		homeScore: "0",
		awayScore: "0",
		status: "IN_PLAY",
		minute: "0",
	});

	// Presets state
	const [presets, setPresets] = useState<Preset[]>(loadPresets);
	const [presetName, setPresetName] = useState("");
	const [selectedPreset, setSelectedPreset] = useState("");

	const addToast = useCallback((message: string, type: ToastType) => {
		const id = ++toastId;
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	// Load live matches
	useEffect(() => {
		setMatchesLoading(true);
		fetch("/api/matches/live")
			.then((r) => r.json())
			.then((data) => {
				setLiveMatches(data);
				setMatchesLoading(false);
			})
			.catch(() => {
				setError("Failed to load live matches");
				setMatchesLoading(false);
			});
	}, []);

	// Load upcoming matches
	useEffect(() => {
		setUpcomingLoading(true);
		fetch("/api/matches/upcoming")
			.then((r) => r.json())
			.then((data) => {
				setUpcomingMatches(data);
				setUpcomingLoading(false);
			})
			.catch(() => {
				setUpcomingLoading(false);
			});
	}, []);

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

	const createMatch = useCallback(async () => {
		try {
			const res = await fetch("/api/match/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					homeTeamName: manualForm.homeTeamName,
					homeTeamCrest: manualForm.homeTeamCrest || undefined,
					awayTeamName: manualForm.awayTeamName,
					awayTeamCrest: manualForm.awayTeamCrest || undefined,
					homeScore: Number.parseInt(manualForm.homeScore) || 0,
					awayScore: Number.parseInt(manualForm.awayScore) || 0,
					status: manualForm.status,
					minute: Number.parseInt(manualForm.minute) || 0,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				addToast(data.error || "Failed to create match", "error");
			} else {
				addToast("Manual match created", "success");
				setShowManualForm(false);
			}
		} catch {
			addToast("Network error creating match", "error");
		}
	}, [manualForm, addToast]);

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

	const handleSavePreset = useCallback(() => {
		const name =
			presetName.trim() ||
			`${manualForm.homeTeamName} vs ${manualForm.awayTeamName}`;
		const newPreset: Preset = {
			name,
			homeTeamName: manualForm.homeTeamName,
			homeTeamCrest: manualForm.homeTeamCrest,
			awayTeamName: manualForm.awayTeamName,
			awayTeamCrest: manualForm.awayTeamCrest,
		};
		const updated = [...presets.filter((p) => p.name !== name), newPreset];
		setPresets(updated);
		savePresets(updated);
		setPresetName("");
		addToast(`Preset "${name}" saved`, "success");
	}, [presetName, manualForm, presets, addToast]);

	const handleLoadPreset = useCallback(
		(name: string) => {
			const preset = presets.find((p) => p.name === name);
			if (preset) {
				setManualForm((prev) => ({
					...prev,
					homeTeamName: preset.homeTeamName,
					homeTeamCrest: preset.homeTeamCrest,
					awayTeamName: preset.awayTeamName,
					awayTeamCrest: preset.awayTeamCrest,
				}));
				setSelectedPreset(name);
				addToast(`Preset "${name}" loaded`, "info");
			}
		},
		[presets, addToast],
	);

	const handleDeletePreset = useCallback(
		(name: string) => {
			const updated = presets.filter((p) => p.name !== name);
			setPresets(updated);
			savePresets(updated);
			setSelectedPreset("");
			addToast(`Preset "${name}" deleted`, "info");
		},
		[presets, addToast],
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
		<div className="min-h-screen bg-linear-to-br from-gray-950 via-slate-900 to-gray-950 text-white antialiased">
			{/* Toast notifications */}
			<div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
				{toasts.map((t) => (
					<div
						key={t.id}
						className={`animate-slide-up px-4 py-3 rounded-xl shadow-lg text-sm font-medium backdrop-blur-md border ${
							t.type === "success"
								? "bg-green-600/90 border-green-400/30 text-green-50"
								: t.type === "error"
									? "bg-red-600/90 border-red-400/30 text-red-50"
									: "bg-blue-600/90 border-blue-400/30 text-blue-50"
						}`}
					>
						<div className="flex items-center gap-2.5">
							<span>
								{t.type === "success"
									? "✓"
									: t.type === "error"
										? "✕"
										: "ℹ"}
							</span>
							<span>{t.message}</span>
						</div>
					</div>
				))}
			</div>

			<div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
				{/* ═══ Header ═══ */}
				<header className="flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
							<span className="text-lg">🏟️</span>
						</div>
						<div>
							<h1 className="text-xl sm:text-2xl font-black tracking-tight">
								<span className="bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">
									SportsHub
								</span>
							</h1>
							<p className="text-[11px] text-gray-500 font-medium tracking-wide uppercase">
								Admin Dashboard
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500 bg-white/4 border border-white/6 rounded-lg px-3 py-1.5">
							{kbd("S")}
							<span>Stop</span>
						</div>
						<div
							className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
								connected
									? "bg-green-600/15 border-green-500/25 text-green-400"
									: "bg-red-600/15 border-red-500/25 text-red-400"
							}`}
						>
							<span
								className={`w-2 h-2 rounded-full ${
									connected
										? "bg-green-400 animate-pulse shadow-sm shadow-green-400/50"
										: "bg-red-400"
								}`}
							/>
							{connected ? "Live" : "Disconnected"}
						</div>
					</div>
				</header>

				{/* Error banner */}
				{error && (
					<div className="bg-red-600/15 border border-red-500/25 text-red-300 px-5 py-3 rounded-xl text-sm flex items-center gap-2.5 animate-slide-up">
						<span className="text-lg">⚠️</span>
						<span className="font-medium">{error}</span>
					</div>
				)}

				{/* ═══ Main Grid ═══ */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* ─── Left Column: Matches ─── */}
					<div className="lg:col-span-2 space-y-6">
						{/* Live Matches */}
						<SectionCard title="Live Matches" icon="🔴">
							{matchesLoading ? (
								<div className="space-y-2">
									{[...Array(3)].map((_, i) => (
										<div
											key={i}
											className="h-14 rounded-xl bg-white/4 animate-shimmer"
										/>
									))}
								</div>
							) : liveMatches.length === 0 ? (
								<div className="text-center py-8">
									<div className="w-12 h-12 rounded-xl bg-white/4 flex items-center justify-center mx-auto mb-3">
										<span className="text-2xl">📭</span>
									</div>
									<p className="text-gray-400 text-sm font-medium">
										No live matches found
									</p>
									<p className="text-gray-600 text-xs mt-1">
										Matches appear here when they&apos;re in play.
									</p>
								</div>
							) : (
								<div className="space-y-2">
									{liveMatches.map((m) => (
										<div
											key={m.matchId}
											className="group flex items-center justify-between bg-white/3 hover:bg-white/6 transition-all duration-200 px-4 py-3 rounded-xl border border-white/6 hover:border-white/12"
										>
											<div className="flex items-center gap-3 min-w-0">
												<TeamBadge
													name={m.homeTeam.name}
													crest={m.homeTeam.crest}
													size="sm"
												/>
												<span className="font-semibold text-sm truncate text-white/80 group-hover:text-white transition-colors">
													{m.homeTeam.name}
												</span>
												<span className="text-white/30 text-xs font-medium">
													{m.homeTeam.score} — {m.awayTeam.score}
												</span>
												<span className="font-semibold text-sm truncate text-white/80 group-hover:text-white transition-colors">
													{m.awayTeam.name}
												</span>
												<TeamBadge
													name={m.awayTeam.name}
													crest={m.awayTeam.crest}
													size="sm"
												/>
												<span
													className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[m.status] || "bg-gray-500/20 text-gray-400 border-gray-500/20"}`}
												>
													{statusLabels[m.status] || m.status}
												</span>
											</div>
											<button
												type="button"
												onClick={() => selectMatch(m.matchId!)}
												disabled={loading.select}
												className="shrink-0 bg-blue-600 hover:bg-blue-500 active:bg-blue-400 disabled:bg-blue-800/40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-150 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
											>
												{loading.select ? (
													<span className="flex items-center gap-1.5">
														<span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
														Track
													</span>
												) : (
													"Track"
												)}
											</button>
										</div>
									))}
								</div>
							)}
						</SectionCard>

						{/* Upcoming Matches */}
						<SectionCard title="Upcoming Today" icon="📅">
							{upcomingLoading ? (
								<div className="space-y-2">
									{[...Array(2)].map((_, i) => (
										<div
											key={i}
											className="h-14 rounded-xl bg-white/4 animate-shimmer"
										/>
									))}
								</div>
							) : upcomingMatches.length === 0 ? (
								<div className="text-center py-6">
									<div className="w-10 h-10 rounded-xl bg-white/4 flex items-center justify-center mx-auto mb-2">
										<span className="text-xl">🗓️</span>
									</div>
									<p className="text-gray-500 text-sm">
										No upcoming matches scheduled.
									</p>
								</div>
							) : (
								<div className="space-y-2">
									{upcomingMatches.map((m) => {
										const kickoffTime = m.kickoff
											? new Date(m.kickoff).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})
											: "TBD";
										return (
											<div
												key={m.id}
												className="group flex items-center justify-between bg-white/3 hover:bg-white/6 transition-all duration-200 px-4 py-3 rounded-xl border border-white/6 hover:border-white/12"
											>
												<div className="flex items-center gap-3 min-w-0">
													<TeamBadge
														name={m.homeTeam.name}
														crest={m.homeTeam.crest}
														size="sm"
													/>
													<span className="font-medium text-sm truncate text-white/70 group-hover:text-white/90 transition-colors">
														{m.homeTeam.name}
													</span>
													<span className="text-white/20 text-xs">vs</span>
													<span className="font-medium text-sm truncate text-white/70 group-hover:text-white/90 transition-colors">
														{m.awayTeam.name}
													</span>
													<TeamBadge
														name={m.awayTeam.name}
														crest={m.awayTeam.crest}
														size="sm"
													/>
													<span className="text-[11px] font-mono font-bold text-amber-400/70 bg-amber-400/10 px-2 py-0.5 rounded-md">
														{kickoffTime}
													</span>
												</div>
												<button
													type="button"
													onClick={() => selectMatch(m.id)}
													disabled={loading.select}
													className="shrink-0 bg-blue-600 hover:bg-blue-500 active:bg-blue-400 disabled:bg-blue-800/40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-150 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
												>
													{loading.select ? (
														<span className="flex items-center gap-1.5">
															<span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
															Track
														</span>
													) : (
														"Track"
													)}
												</button>
											</div>
										);
									})}
								</div>
							)}
						</SectionCard>
					</div>

					{/* ─── Right Column: Controls ─── */}
					<div className="space-y-4">
						{/* Stop Tracking */}
						<button
							type="button"
							onClick={stopTracking}
							disabled={loading.stop}
							className="w-full bg-red-600 hover:bg-red-500 active:bg-red-400 disabled:bg-red-800/40 disabled:cursor-not-allowed text-white font-bold px-4 py-3 rounded-xl transition-all duration-150 hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
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
									<span className="text-red-300/50 text-[10px] font-mono hidden sm:inline">
										S
									</span>
								</>
							)}
						</button>

						{/* Quick Actions (only for manual matches) */}
						{gameState && gameState.matchId === null && (
							<SectionCard title="Quick Actions" icon="⚡" className="animate-slide-up">
								<div className="space-y-4">
									{/* Goal buttons */}
									<div>
										<p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
											Goals
										</p>
										<div className="grid grid-cols-2 gap-2">
											<button
												type="button"
												onClick={() => triggerGoal("home")}
												className="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-300 text-black font-extrabold px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
											>
												<span>⚽</span>
												<span>Home</span>
											</button>
											<button
												type="button"
												onClick={() => triggerGoal("away")}
												className="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-300 text-black font-extrabold px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
											>
												<span>⚽</span>
												<span>Away</span>
											</button>
										</div>
									</div>

									{/* Status buttons */}
									<div>
										<p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
											Match Events
										</p>
										<div className="grid grid-cols-2 gap-2">
											<button
												type="button"
												onClick={() => setStatus("PAUSED")}
												className="bg-blue-600 hover:bg-blue-500 active:bg-blue-400 text-white font-bold px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
											>
												<span>⏸️</span>
												<span>Halftime</span>
											</button>
											<button
												type="button"
												onClick={() => setStatus("FINISHED")}
												className="bg-purple-600 hover:bg-purple-500 active:bg-purple-400 text-white font-bold px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
											>
												<span>🏁</span>
												<span>Fulltime</span>
											</button>
										</div>
									</div>

									{/* Minute control */}
									<div>
										<p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
											Minute
										</p>
										<div className="flex gap-2">
											<input
												type="number"
												min="0"
												max="120"
												value={minuteInput}
												onChange={(e) => setMinuteInput(e.target.value)}
												placeholder={String(gameState.minute)}
												className="flex-1 bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all placeholder:text-gray-600"
											/>
											<button
												type="button"
												onClick={() =>
													setMinute(Number.parseInt(minuteInput) || 0)
												}
												className="bg-gray-600 hover:bg-gray-500 active:bg-gray-400 text-white font-bold px-3 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95"
											>
												Set
											</button>
											<button
												type="button"
												onClick={() => setMinute(gameState.minute + 1)}
												className="bg-gray-600 hover:bg-gray-500 active:bg-gray-400 text-white font-bold px-3 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95"
											>
												+1
											</button>
											<button
												type="button"
												onClick={() => setMinute(gameState.minute + 5)}
												className="bg-gray-600 hover:bg-gray-500 active:bg-gray-400 text-white font-bold px-3 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95"
											>
												+5
											</button>
										</div>
									</div>
								</div>
							</SectionCard>
						)}

						{/* Score Override */}
						<SectionCard title="Score Override" icon="✏️">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label
											htmlFor="home-score"
											className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
										>
											Home
										</label>
										<input
											id="home-score"
											type="number"
											min="0"
											value={homeOverride}
											onChange={(e) => setHomeOverride(e.target.value)}
											placeholder={gameState ? String(gameState.homeTeam.score) : "0"}
											className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all placeholder:text-gray-600"
										/>
									</div>
									<div>
										<label
											htmlFor="away-score"
											className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
										>
											Away
										</label>
										<input
											id="away-score"
											type="number"
											min="0"
											value={awayOverride}
											onChange={(e) => setAwayOverride(e.target.value)}
											placeholder={gameState ? String(gameState.awayTeam.score) : "0"}
											className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all placeholder:text-gray-600"
										/>
									</div>
								</div>
								<button
									type="button"
									onClick={overrideScore}
									disabled={loading.override}
									className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-400 disabled:bg-amber-800/40 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm hover:shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2"
								>
									{loading.override ? (
										<>
											<span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
											Applying...
										</>
									) : (
										<>
											<span>✓</span>
											<span>Apply Override</span>
										</>
									)}
								</button>
							</div>
						</SectionCard>

						{/* Manual Match */}
						<SectionCard title="Manual Match" icon="🎛️">
							<button
								type="button"
								onClick={() => setShowManualForm(!showManualForm)}
								className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-400 disabled:bg-indigo-800/40 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm hover:shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
							>
								<span>{showManualForm ? "−" : "+"}</span>
								<span>{showManualForm ? "Hide Form" : "Create Match"}</span>
							</button>

							{showManualForm && (
								<div className="mt-4 space-y-4 animate-slide-up">
									{/* Presets */}
									{presets.length > 0 && (
										<div>
											<p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
												Load Preset
											</p>
											<div className="flex flex-wrap gap-2">
												{presets.map((p) => (
													<button
														key={p.name}
														type="button"
														onClick={() => handleLoadPreset(p.name)}
														className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
															selectedPreset === p.name
																? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
																: "bg-white/5 border-white/8 text-gray-400 hover:bg-white/8 hover:text-gray-300"
														}`}
													>
														<span>{p.name}</span>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																handleDeletePreset(p.name);
															}}
															className="ml-1 text-gray-600 hover:text-red-400 transition-colors text-sm leading-none"
														>
															×
														</button>
													</button>
												))}
											</div>
										</div>
									)}

									{/* Team names */}
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
												Home Team
											</label>
											<input
												type="text"
												placeholder="e.g. Arsenal"
												value={manualForm.homeTeamName}
												onChange={(e) =>
													setManualForm({
														...manualForm,
														homeTeamName: e.target.value,
													})
												}
												className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-gray-600"
											/>
										</div>
										<div>
											<label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
												Away Team
											</label>
											<input
												type="text"
												placeholder="e.g. Chelsea"
												value={manualForm.awayTeamName}
												onChange={(e) =>
													setManualForm({
														...manualForm,
														awayTeamName: e.target.value,
													})
												}
												className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-gray-600"
											/>
										</div>
									</div>

									{/* Crest URLs */}
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
												Home Crest <span className="text-gray-600 font-normal normal-case">(opt)</span>
											</label>
											<input
												type="text"
												placeholder="https://..."
												value={manualForm.homeTeamCrest}
												onChange={(e) =>
													setManualForm({
														...manualForm,
														homeTeamCrest: e.target.value,
													})
												}
												className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-gray-600 font-mono"
											/>
										</div>
										<div>
											<label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
												Away Crest <span className="text-gray-600 font-normal normal-case">(opt)</span>
											</label>
											<input
												type="text"
												placeholder="https://..."
												value={manualForm.awayTeamCrest}
												onChange={(e) =>
													setManualForm({
														...manualForm,
														awayTeamCrest: e.target.value,
													})
												}
												className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-gray-600 font-mono"
											/>
										</div>
									</div>

									{/* Score, Minute */}
									<div className="grid grid-cols-3 gap-3">
										<div>
											<label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
												Home Score
											</label>
											<input
												type="number"
												min="0"
												value={manualForm.homeScore}
												onChange={(e) =>
													setManualForm({
														...manualForm,
														homeScore: e.target.value,
													})
												}
												className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-gray-600"
											/>
										</div>
										<div>
											<label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
												Away Score
											</label>
											<input
												type="number"
												min="0"
												value={manualForm.awayScore}
												onChange={(e) =>
													setManualForm({
														...manualForm,
														awayScore: e.target.value,
													})
												}
												className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-gray-600"
											/>
										</div>
										<div>
											<label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
												Minute
											</label>
											<input
												type="number"
												min="0"
												max="120"
												value={manualForm.minute}
												onChange={(e) =>
													setManualForm({
														...manualForm,
														minute: e.target.value,
													})
												}
												className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-gray-600"
											/>
										</div>
									</div>

									{/* Status */}
									<div>
										<label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
											Status
										</label>
										<select
											value={manualForm.status}
											onChange={(e) =>
												setManualForm({
													...manualForm,
													status: e.target.value,
												})
											}
											className="w-full bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all appearance-none cursor-pointer"
										>
											<option value="SCHEDULED">SCHEDULED</option>
											<option value="TIMED">TIMED</option>
											<option value="IN_PLAY">IN PLAY</option>
											<option value="PAUSED">PAUSED (HT)</option>
											<option value="FINISHED">FINISHED (FT)</option>
											<option value="EXTRA_TIME">EXTRA TIME</option>
											<option value="PENALTY_SHOOTOUT">PENALTIES</option>
										</select>
									</div>

									{/* Create + Save Preset */}
									<div className="space-y-2">
										<button
											type="button"
											onClick={createMatch}
											disabled={
												!manualForm.homeTeamName || !manualForm.awayTeamName
											}
											className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-400 disabled:bg-indigo-800/40 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm hover:shadow-lg hover:shadow-indigo-500/25"
										>
											Create Match
										</button>

										{manualForm.homeTeamName && manualForm.awayTeamName && (
											<div className="flex gap-2 pt-1">
												<input
													type="text"
													placeholder="Preset name (optional)"
													value={presetName}
													onChange={(e) => setPresetName(e.target.value)}
													className="flex-1 bg-white/[0.07] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-gray-600"
												/>
												<button
													type="button"
													onClick={handleSavePreset}
													className="bg-indigo-600/60 hover:bg-indigo-500/80 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95"
												>
													Save
												</button>
											</div>
										)}
									</div>
								</div>
							)}
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
