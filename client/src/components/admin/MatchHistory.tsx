import type { GameState } from "@shared/types";
import TeamBadge from "../TeamBadge";

interface Props {
	matches: GameState[];
	loading: boolean;
	onSelect: (matchId: number) => void;
	selectLoading: boolean;
}

function formatFinishedDate(iso: string): string {
	const d = new Date(iso);
	const now = new Date();
	const diff = now.getTime() - d.getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MatchHistory({ matches, loading, onSelect, selectLoading }: Props) {
	return (
		<>
			{loading ? (
				<div className="space-y-2">
					{[...Array(2)].map((_, i) => (
						<div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-slate-700 animate-pulse" />
					))}
				</div>
			) : matches.length === 0 ? (
				<div className="text-center py-6">
					<div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-2">
						<span className="text-xl">🏁</span>
					</div>
					<p className="text-gray-500 dark:text-gray-400 text-sm">No completed matches yet.</p>
					<p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
						Finished matches appear here automatically.
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{matches.map((m, idx) => {
						const isManual = m.matchId === null;
						return (
							<div
								key={isManual ? `manual-${idx}` : m.matchId}
								className="group flex items-center justify-between bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm"
							>
								<div className="flex items-center gap-3 min-w-0">
									<TeamBadge name={m.homeTeam.name} crest={m.homeTeam.crest} size="sm" />
									<span className="font-semibold text-sm truncate text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
										{m.homeTeam.name}
									</span>
									<span className="text-gray-400 dark:text-gray-500 text-xs font-bold tabular-nums">
										{m.homeTeam.score} — {m.awayTeam.score}
									</span>
									<span className="font-semibold text-sm truncate text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
										{m.awayTeam.name}
									</span>
									<TeamBadge name={m.awayTeam.name} crest={m.awayTeam.crest} size="sm" />
									<span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
										FT
									</span>
									<span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 hidden sm:inline">
										{formatFinishedDate(m.lastUpdated)}
									</span>
								</div>
								{!isManual && (
									<button
										type="button"
										onClick={() => onSelect(m.matchId!)}
										disabled={selectLoading}
										aria-label={`Re-track ${m.homeTeam.name} vs ${m.awayTeam.name}`}
										className="shrink-0 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-400 active:to-indigo-400 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-150 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
									>
										{selectLoading ? (
											<span className="flex items-center gap-1.5">
												<span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
												Track
											</span>
										) : (
											"Re-track"
										)}
									</button>
								)}
							</div>
						);
					})}
				</div>
			)}
		</>
	);
}
