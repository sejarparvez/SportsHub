import type { GameState } from "@shared/types";
import TeamBadge from "../TeamBadge";

const statusColors: Record<string, string> = {
	SCHEDULED: "bg-gray-100 text-gray-500 border-gray-200",
	TIMED: "bg-gray-100 text-gray-500 border-gray-200",
	IN_PLAY: "bg-green-100 text-green-700 border-green-200",
	PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200",
	FINISHED: "bg-gray-100 text-gray-500 border-gray-200",
	EXTRA_TIME: "bg-orange-100 text-orange-700 border-orange-200",
	PENALTY_SHOOTOUT: "bg-purple-100 text-purple-700 border-purple-200",
	AWARDED: "bg-gray-100 text-gray-500 border-gray-200",
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

interface Props {
	matches: GameState[];
	loading: boolean;
	onSelect: (matchId: number) => void;
	selectLoading: boolean;
}

export default function LiveMatchList({ matches, loading, onSelect, selectLoading }: Props) {
	return (
		<>
			{loading ? (
				<div className="space-y-2">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
					))}
				</div>
			) : matches.length === 0 ? (
				<div className="text-center py-8">
					<div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
						<span className="text-2xl">📭</span>
					</div>
					<p className="text-gray-500 text-sm font-medium">No live matches found</p>
					<p className="text-gray-400 text-xs mt-1">
						Matches appear here when they&apos;re in play.
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{matches.map((m) => (
						<div
							key={m.matchId}
							className="group flex items-center justify-between bg-white hover:bg-gray-50 transition-all duration-200 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm"
						>
							<div className="flex items-center gap-3 min-w-0">
								<TeamBadge name={m.homeTeam.name} crest={m.homeTeam.crest} size="sm" />
								<span className="font-semibold text-sm truncate text-gray-700 group-hover:text-gray-900 transition-colors">
									{m.homeTeam.name}
								</span>
								<span className="text-gray-400 text-xs font-medium tabular-nums">
									{m.homeTeam.score} — {m.awayTeam.score}
								</span>
								<span className="font-semibold text-sm truncate text-gray-700 group-hover:text-gray-900 transition-colors">
									{m.awayTeam.name}
								</span>
								<TeamBadge name={m.awayTeam.name} crest={m.awayTeam.crest} size="sm" />
								<span
									className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[m.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}
								>
									{statusLabels[m.status] || m.status}
								</span>
							</div>
							<button
								type="button"
								onClick={() => { if (m.matchId != null) onSelect(m.matchId) }}
								disabled={selectLoading}
								className="shrink-0 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-400 active:to-indigo-400 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-150 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
							>
								{selectLoading ? (
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
		</>
	);
}
