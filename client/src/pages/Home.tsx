import EventPopup from "../components/EventPopup";
import GoalScorers from "../components/GoalScorers";
import MatchMinute from "../components/MatchMinute";
import Scoreboard from "../components/Scoreboard";
import StatusBadge from "../components/StatusBadge";
import { useGameState } from "../hooks/useGameState";
import { Link } from "react-router-dom";

export default function Home() {
	const { gameState, goalEvent, matchEvent } = useGameState();

	return (
		<div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden select-none">
			{/* ─── Light broadcast studio background ─── */}
			<div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-stone-50 -z-10" />

			{/* Warm ambient glow — stadium lighting */}
			<div className="absolute top-1/3 -left-1/3 w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(204,0,0,0.04),transparent_70%)] -z-10" />
			<div className="absolute bottom-0 -right-1/4 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.02),transparent_70%)] -z-10" />

			{/* Subtle grid texture — broadcast studio floor */}
			<div
				className="absolute inset-0 opacity-[0.03] -z-10"
				style={{
					backgroundImage:
						"linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
					backgroundSize: "60px 60px",
				}}
			/>

			{/* ─── Top bar — sportcast header ─── */}
			<div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-10 py-4">
				{/* Brand */}
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold tracking-[0.15em] text-gray-400 font-headline">
						SPORTSHUB
					</span>
				</div>

				{/* Live indicator */}
				{gameState?.status === "IN_PLAY" && (
					<div className="live-badge">LIVE</div>
				)}

				{/* Admin link — glass pill */}
				<Link
					to="/admin"
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-xs text-[11px] font-medium text-gray-400 hover:text-gray-700 hover:bg-white hover:border-gray-300 transition-all duration-200"
				>
					<span>⚙️</span>
					<span>Admin</span>
				</Link>
			</div>

			{/* ═══ Main Content ═══ */}
			<div className="relative flex flex-col items-center gap-4 md:gap-5">
				{gameState ? (
					<>
						{/* Tournament header — broadcast lower-third style */}
						<div className="flex flex-col items-center gap-1">
							<div className="text-[10px] md:text-[11px] font-semibold tracking-[0.3em] uppercase font-headline text-gray-400/80">
								{gameState.tournament
									? `${gameState.tournament.name}${gameState.tournament.round ? ` • ${gameState.tournament.round}` : ""}`
									: gameState.season
										? gameState.season
										: "International Friendly"}
							</div>
							<div className="text-[9px] md:text-[10px] font-mono tracking-wider text-gray-300">
								{new Date().toLocaleDateString("en-GB", {
									day: "numeric",
									month: "short",
									year: "numeric",
								})}
							</div>
						</div>

						{/* Scoreboard card — frosted glass */}
						<div className="relative">
							{/* Red glow behind scoreboard */}
							<div className="absolute -inset-4 rounded-3xl bg-[radial-gradient(circle,rgba(204,0,0,0.06),transparent_70%)] blur-2xl" />

							<div className="relative bg-white/80 backdrop-blur-2xl rounded-2xl md:rounded-[20px] border border-white/70 shadow-lg shadow-black/5 px-8 md:px-14 py-6 md:py-8 w-full max-w-3xl">
								<Scoreboard state={gameState} light />
							</div>
						</div>

						{/* Match status row */}
						{(gameState.status === "SCHEDULED" || gameState.status === "TIMED") &&
						gameState.minute <= 0 ? (
							<div className="flex flex-col items-center gap-3 mt-1">
								<div className="flex gap-2">
									<span className="w-2 h-2 rounded-full bg-red-400/70 animate-pulse-dot" />
									<span
										className="w-2 h-2 rounded-full bg-red-400/70 animate-pulse-dot"
										style={{ animationDelay: "0.3s" }}
									/>
									<span
										className="w-2 h-2 rounded-full bg-red-400/70 animate-pulse-dot"
										style={{ animationDelay: "0.6s" }}
									/>
								</div>
								<p className="text-sm font-semibold text-red-500/60 tracking-wide font-headline">
									Match starting soon
								</p>
							</div>
						) : (
							<>
								<div className="flex items-center justify-center gap-4 mt-1">
									<MatchMinute
										minute={gameState.minute}
										isLive={gameState.status === "IN_PLAY"}
										light
									/>
									<StatusBadge status={gameState.status} light />
								</div>

								{/* Goal scorers */}
								{gameState.goals && gameState.goals.length > 0 && (
									<div className="mt-3">
										<GoalScorers goals={gameState.goals} homeTeam={gameState.homeTeam.name} awayTeam={gameState.awayTeam.name} light />
									</div>
								)}
							</>
						)}

						{/* Bottom broadcast bar */}
						<div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
							<div className="flex items-center gap-3 text-[9px] text-gray-300 font-mono tracking-[0.3em] uppercase">
								<span className="w-8 h-px bg-gray-200" />
								<span>Live Broadcast</span>
								<span className="w-8 h-px bg-gray-200" />
							</div>
						</div>
					</>
				) : (
					/* ─── Waiting state ─── */
					<div className="flex flex-col items-center gap-5 animate-slide-up">
						<div className="relative">
							<div className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(204,0,0,0.06),transparent_70%)] blur-xl" />
							<div className="relative w-20 h-20 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-lg shadow-black/5 flex items-center justify-center">
								<span className="text-3xl">🏟️</span>
							</div>
						</div>
						<div className="flex flex-col items-center gap-2.5">
							<p className="text-lg font-semibold text-gray-400 tracking-wide font-headline">
								Waiting for match
							</p>
							<div className="flex gap-1.5">
								<span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse-dot" />
								<span
									className="w-2 h-2 rounded-full bg-gray-300 animate-pulse-dot"
									style={{ animationDelay: "0.3s" }}
								/>
								<span
									className="w-2 h-2 rounded-full bg-gray-300 animate-pulse-dot"
									style={{ animationDelay: "0.6s" }}
								/>
							</div>
						</div>
						<div className="text-[9px] text-gray-300 font-mono tracking-[0.4em] uppercase mt-1">
							Live Broadcast Center
						</div>
					</div>
				)}
			</div>

			{/* ═══ Event Popups ═══ */}
			<EventPopup goalEvent={goalEvent} matchEvent={matchEvent} />
		</div>
	);
}
