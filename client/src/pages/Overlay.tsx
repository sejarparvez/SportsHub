import EventPopup from "../components/EventPopup";
import MatchMinute from "../components/MatchMinute";
import Scoreboard from "../components/Scoreboard";
import StatusBadge from "../components/StatusBadge";
import { useGameState } from "../hooks/useGameState";

export default function Overlay() {
	const { gameState, goalEvent, matchEvent } = useGameState();

	return (
		<div className="fixed inset-0 flex flex-col items-center justify-center text-white overflow-hidden select-none">
			{/* ─── Rich animated background ─── */}
			<div className="absolute inset-0 bg-linear-to-br from-[#080c1a] via-[#0f1629] to-[#060a14] -z-10" />

			{/* Radial glow orbs */}
			<div className="absolute top-1/4 left-1/4 w-125 h-125 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08),transparent_70%)] -z-10" />
			<div className="absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.06),transparent_70%)] -z-10" />

			{/* Subtle grid pattern */}
			<div
				className="absolute inset-0 opacity-[0.03] -z-10"
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
					backgroundSize: "60px 60px",
				}}
			/>

			{/* ═══ Main Content ═══ */}
			<div className="relative flex flex-col items-center gap-6">
				{gameState ? (
					<>
						{/* League / tournament header */}
						<div className="text-xs font-semibold tracking-[0.25em] uppercase text-white/20 mb-2">
							Premier League • Matchweek
						</div>

						{/* Main scoreboard card */}
						<div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 px-10 md:px-16 py-7 md:py-9 w-full max-w-3xl animate-glow-pulse">
							<Scoreboard state={gameState} />
						</div>

						{/* Match status row */}
						{(gameState.status === "SCHEDULED" || gameState.status === "TIMED") &&
						gameState.minute <= 0 ? (
							<div className="flex flex-col items-center gap-3 mt-1">
								<div className="flex gap-2">
									<span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse-dot shadow-sm shadow-amber-400/50" />
									<span
										className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse-dot shadow-sm shadow-amber-400/50"
										style={{ animationDelay: "0.3s" }}
									/>
									<span
										className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse-dot shadow-sm shadow-amber-400/50"
										style={{ animationDelay: "0.6s" }}
									/>
								</div>
								<p className="text-xl font-semibold text-amber-400/70 tracking-wide">
									Match starting soon
								</p>
							</div>
						) : (
							<div className="flex items-center gap-4 mt-1">
								<MatchMinute
									minute={gameState.minute}
									isLive={gameState.status === "IN_PLAY"}
								/>
								<StatusBadge status={gameState.status} />
							</div>
						)}

						{/* Bottom info bar */}
						<div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
							<div className="flex items-center gap-4 text-xs text-white/15 font-mono tracking-wider">
								<span className="flex items-center gap-1.5">
									<span className="w-1 h-1 rounded-full bg-white/20" />
									LIVE
								</span>
								<span className="text-white/10">|</span>
								<span>SportsHub</span>
								<span className="text-white/10">|</span>
								<span>
									{new Date().toLocaleDateString("en-GB", {
										day: "numeric",
										month: "short",
										year: "numeric",
									})}
								</span>
							</div>
						</div>
					</>
				) : (
					/* ─── Waiting state ─── */
					<div className="flex flex-col items-center gap-6">
						<div className="relative animate-float">
							<div className="w-24 h-24 rounded-3xl bg-white/4 backdrop-blur-xl border border-white/8 flex items-center justify-center shadow-xl shadow-black/30">
								<span className="text-5xl">🏟️</span>
							</div>
						</div>
						<div className="flex flex-col items-center gap-3">
							<p className="text-2xl font-semibold text-white/40 tracking-wide">
								Waiting for match
							</p>
							<div className="flex gap-2">
								<span className="w-3 h-3 rounded-full bg-white/30 animate-pulse-dot" />
								<span
									className="w-3 h-3 rounded-full bg-white/30 animate-pulse-dot"
									style={{ animationDelay: "0.3s" }}
								/>
								<span
									className="w-3 h-3 rounded-full bg-white/30 animate-pulse-dot"
									style={{ animationDelay: "0.6s" }}
								/>
							</div>
						</div>
						<p className="text-sm text-white/15 font-mono tracking-[0.3em] uppercase mt-4">
							SportsHub
						</p>
					</div>
				)}
			</div>

			{/* ═══ Event Popups ═══ */}
			<EventPopup goalEvent={goalEvent} matchEvent={matchEvent} />
		</div>
	);
}
