import { useState } from "react";
import SearchInput from "./SearchInput";

interface MatchListProps<
	T extends { homeTeam: { name: string }; awayTeam: { name: string } },
> {
	matches: T[];
	loading: boolean;
	onSelect: (matchId: number) => void;
	selectLoading: boolean;
	getKey: (item: T) => string | number;
	renderItem: (item: T) => React.ReactNode;
	getMatchId: (item: T) => number | null;
	emptyState: React.ReactNode;
	skeletonCount: number;
	searchPlaceholder: string;
}

export default function MatchList<
	T extends { homeTeam: { name: string }; awayTeam: { name: string } },
>({
	matches,
	loading,
	onSelect,
	selectLoading,
	getKey,
	renderItem,
	getMatchId,
	emptyState,
	skeletonCount,
	searchPlaceholder,
}: MatchListProps<T>) {
	const [query, setQuery] = useState("");
	const filtered = query
		? matches.filter(
				(m) =>
					m.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
					m.awayTeam.name.toLowerCase().includes(query.toLowerCase()),
			)
		: matches;

	return (
		<>
			{loading ? (
				<div className="space-y-2">
					{[...Array(skeletonCount)].map((_, i) => (
						<div
							key={i}
							className="h-14 rounded-xl bg-gray-100 dark:bg-slate-700 motion-safe:animate-pulse"
						/>
					))}
				</div>
			) : matches.length === 0 ? (
				<div className="text-center py-8">{emptyState}</div>
			) : (
				<>
					<SearchInput
						value={query}
						onChange={setQuery}
						placeholder={searchPlaceholder}
					/>
					<div className="space-y-2">
						{filtered.length === 0 ? (
							<div className="text-center py-6">
								<p className="text-gray-500 dark:text-gray-400 text-sm">
									No matches matching{" "}
									<span className="font-mono text-gray-700 dark:text-gray-300">
										&ldquo;{query}&rdquo;
									</span>
								</p>
							</div>
						) : (
							filtered.map((m) => (
								<div
									key={getKey(m)}
									className="group flex items-center justify-between bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm"
								>
									<div className="flex items-center gap-3 min-w-0">
										{renderItem(m)}
									</div>
									<button
										type="button"
										onClick={() => {
											const id = getMatchId(m);
											if (id != null) onSelect(id);
										}}
										disabled={selectLoading}
										aria-label={`Track ${m.homeTeam.name} vs ${m.awayTeam.name}`}
										className="shrink-0 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-400 active:to-indigo-400 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-150 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
									>
										{selectLoading ? (
											<span className="flex items-center gap-1.5">
												<span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin" />
												Track
											</span>
										) : (
											"Track"
										)}
									</button>
								</div>
							))
						)}
					</div>
				</>
			)}
		</>
	);
}
