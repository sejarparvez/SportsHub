import type { GameState } from "@shared/types";

interface Props {
	gameState: GameState | null;
	homeValue: string;
	awayValue: string;
	onHomeChange: (value: string) => void;
	onAwayChange: (value: string) => void;
	onApply: () => void;
	loading: boolean;
}

export default function ScoreOverride({
	gameState,
	homeValue,
	awayValue,
	onHomeChange,
	onAwayChange,
	onApply,
	loading,
}: Props) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<div>
					<label
						htmlFor="home-score"
						className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5"
					>
						Home
					</label>
					<input
						id="home-score"
						type="number"
						min="0"
						value={homeValue}
						onChange={(e) => onHomeChange(e.target.value)}
						placeholder={gameState ? String(gameState.homeTeam.score) : "0"}
						className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all placeholder:text-gray-400"
					/>
				</div>
				<div>
					<label
						htmlFor="away-score"
						className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5"
					>
						Away
					</label>
					<input
						id="away-score"
						type="number"
						min="0"
						value={awayValue}
						onChange={(e) => onAwayChange(e.target.value)}
						placeholder={gameState ? String(gameState.awayTeam.score) : "0"}
						className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all placeholder:text-gray-400"
					/>
				</div>
			</div>
			<button
				type="button"
				onClick={onApply}
				disabled={loading}
				className="w-full bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:from-amber-300 active:to-orange-400 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm hover:shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2"
			>
				{loading ? (
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
	);
}
