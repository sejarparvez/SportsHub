import { useState } from "react";
import type { UpcomingMatch } from "@shared/types";
import TeamBadge from "../TeamBadge";
import SearchInput from "./SearchInput";

interface Props {
	matches: UpcomingMatch[];
	loading: boolean;
	onSelect: (matchId: number) => void;
	selectLoading: boolean;
}

export default function UpcomingMatchList({ matches, loading, onSelect, selectLoading }: Props) {
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
					{[...Array(2)].map((_, i) => (
						<div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-slate-700 animate-pulse" />
					))}
				</div>
			) : matches.length === 0 ? (
				<div className="text-center py-6">
					<div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-2">
						<span className="text-xl">🗓️</span>
					</div>
					<p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming matches scheduled.</p>
				</div>
			) : (
				<>
					<SearchInput value={query} onChange={setQuery} placeholder="Search upcoming matches..." />
					<div className="space-y-2">
						{filtered.length === 0 ? (
							<div className="text-center py-6">
								<p className="text-gray-500 dark:text-gray-400 text-sm">
									No matches matching <span className="font-mono text-gray-700 dark:text-gray-300">&ldquo;{query}&rdquo;</span>
								</p>
							</div>
						) : (
							filtered.map((m) => {
						const kickoffTime = m.kickoff
							? new Date(m.kickoff).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})
							: "TBD";
						return (
							<div
								key={m.id}
								className="group flex items-center justify-between bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm"
							>
								<div className="flex items-center gap-3 min-w-0">
									<TeamBadge name={m.homeTeam.name} crest={m.homeTeam.crest} size="sm" />
									<span className="font-medium text-sm truncate text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
										{m.homeTeam.name}
									</span>
									<span className="text-gray-300 dark:text-gray-600 text-xs">vs</span>
									<span className="font-medium text-sm truncate text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
										{m.awayTeam.name}
									</span>
									<TeamBadge name={m.awayTeam.name} crest={m.awayTeam.crest} size="sm" />
									<span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-2 py-0.5 rounded-md">
										{kickoffTime}
									</span>
								</div>
								<button
									type="button"
									onClick={() => onSelect(m.id)}
									disabled={selectLoading}
									aria-label={`Track ${m.homeTeam.name} vs ${m.awayTeam.name}`}
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
						);
					}))}
					</div>
				</>
			)}
		</>
	);
}
