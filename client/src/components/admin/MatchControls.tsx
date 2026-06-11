import { useState } from "react";
import type { GameState } from "@shared/types";

interface Props {
	gameState: GameState | null;
	onGoal: (team: "home" | "away") => void;
	onSetStatus: (status: string) => void;
	onSetMinute: (minute: number) => void;
}

export default function MatchControls({ gameState, onGoal, onSetStatus, onSetMinute }: Props) {
	const [minuteInput, setMinuteInput] = useState("");

	if (!gameState || gameState.matchId !== null) return null;

	return (
		<div className="space-y-4">
			<div>
				<p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
					Goals
				</p>
				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={() => onGoal("home")}
						className="bg-linear-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:from-yellow-200 active:to-amber-300 text-white font-extrabold px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-amber-300/30"
					>
						<span>⚽</span>
						<span>Home</span>
					</button>
					<button
						type="button"
						onClick={() => onGoal("away")}
						className="bg-linear-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:from-yellow-200 active:to-amber-300 text-white font-extrabold px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-amber-300/30"
					>
						<span>⚽</span>
						<span>Away</span>
					</button>
				</div>
			</div>

			<div>
				<p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
					Match Events
				</p>
				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={() => onSetStatus("PAUSED")}
						className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-400 active:to-indigo-400 text-white font-bold px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-blue-400/20"
					>
						<span>⏸️</span>
						<span>Halftime</span>
					</button>
					<button
						type="button"
						onClick={() => onSetStatus("FINISHED")}
						className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:from-purple-400 active:to-pink-400 text-white font-bold px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-purple-400/20"
					>
						<span>🏁</span>
						<span>Fulltime</span>
					</button>
				</div>
			</div>

			<div>
				<p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
						className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
					/>
					<button
						type="button"
						onClick={() => onSetMinute(Number.parseInt(minuteInput) || 0)}
						className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold px-3 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95 border border-gray-200"
					>
						Set
					</button>
					<button
						type="button"
						onClick={() => onSetMinute(gameState.minute + 1)}
						className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold px-3 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95 border border-gray-200"
					>
						+1
					</button>
					<button
						type="button"
						onClick={() => onSetMinute(gameState.minute + 5)}
						className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold px-3 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95 border border-gray-200"
					>
						+5
					</button>
				</div>
			</div>
		</div>
	);
}
