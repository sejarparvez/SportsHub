import type { GameState } from "@shared/types";
import MatchMinute from "./MatchMinute";
import Scoreboard from "./Scoreboard";
import StatusBadge from "./StatusBadge";

interface Props {
	state: GameState | null;
}

export default function LivePreview({ state }: Props) {
	if (!state) {
		return (
			<div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
				<div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
					<span className="text-2xl">🏟️</span>
				</div>
				<p className="text-gray-500 text-sm font-medium">No match selected</p>
				<p className="text-gray-400 text-xs mt-1">
					Select a match from the list to see a live preview here.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{/* Simulation frame — shows what the overlay looks like on stream */}
			<div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-50 via-white to-gray-50 border border-gray-200 shadow-inner">
				{/* Subtle ambient glow */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.03),transparent_60%)]" />

				{/* Overlay preview */}
				<div className="relative px-4 pt-6 pb-8 flex flex-col items-center">
					{/* The scoreboard card exactly as it would appear on stream */}
					<div className="bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-lg shadow-black/5 px-6 sm:px-10 py-4 sm:py-5 w-full max-w-lg">
						<Scoreboard state={state} light />
					</div>

					{/* Match info below */}
					<div className="flex items-center gap-3 mt-3">
						<MatchMinute
							minute={state.minute}
							isLive={state.status === "IN_PLAY"}
							light
						/>
						<StatusBadge status={state.status} light />
					</div>
				</div>

				{/* Label */}
				<div className="absolute top-2 right-3 text-[10px] font-mono text-gray-400 tracking-wider uppercase">
					Preview
				</div>
			</div>

			{/* State debug info */}
			<div className="grid grid-cols-4 gap-2 text-xs">
				<div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
					<span className="text-gray-400 block">Match</span>
					<span className="text-gray-700 font-mono font-medium">
						{state.matchId ? `#${state.matchId}` : "Manual"}
					</span>
				</div>
				<div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
					<span className="text-gray-400 block">Score</span>
					<span className="text-gray-700 font-mono font-medium">
						{state.homeTeam.score} — {state.awayTeam.score}
					</span>
				</div>
				<div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
					<span className="text-gray-400 block">Minute</span>
					<span className="text-gray-700 font-mono font-medium">
						{state.minute}&apos;
					</span>
				</div>
				<div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
					<span className="text-gray-400 block">Status</span>
					<span className="text-gray-700 font-mono font-medium">{state.status}</span>
				</div>
			</div>
		</div>
	);
}
