import type { GoalScorer } from "@shared/types";

interface Props {
	goals: GoalScorer[];
	homeTeam?: string;
	awayTeam?: string;
	light?: boolean;
}

export default function GoalScorers({ goals, homeTeam, awayTeam, light }: Props) {
	if (goals.length === 0) return null;

	const homeGoals = goals.filter((g) => g.isHome);
	const awayGoals = goals.filter((g) => !g.isHome);

	return (
		<div className="flex items-start justify-center gap-8 md:gap-12 mt-3">
			{/* Home Team Goals */}
			<div className="flex flex-col items-start gap-1.5 min-w-0">
				{homeTeam && (
					<div className={`text-[9px] font-semibold tracking-[0.15em] uppercase mb-0.5 ${light ? "text-gray-400" : "text-white/30"}`}>
						{homeTeam}
					</div>
				)}
				{homeGoals.length > 0 ? (
					homeGoals.map((g) => (
						<div key={`${g.minute}-${g.playerName}`} className="flex items-center gap-2 text-sm font-mono">
							<span className={light ? "text-amber-500" : "text-yellow-400/90"}>⚽</span>
							<span className={light ? "text-gray-700" : "text-white/80"}>
								{g.playerName}
							</span>
							<span className={light ? "text-gray-400" : "text-white/40"}>
								{g.minute}
								{g.addedTime ? `+${g.addedTime}` : ""}&apos;
							</span>
							{g.isOwnGoal && (
								<span className={`text-[10px] font-semibold uppercase tracking-wider ${light ? "text-red-500" : "text-red-400/70"}`}>
									OG
								</span>
							)}
							{g.isPenalty && (
								<span className={`text-[10px] font-semibold uppercase tracking-wider ${light ? "text-amber-600" : "text-amber-400/70"}`}>
									PEN
								</span>
							)}
							{g.assist && (
								<span className={`text-[10px] ${light ? "text-gray-400" : "text-white/30"}`}>
									(assist: {g.assist})
								</span>
							)}
						</div>
					))
				) : (
					<span className={`text-xs ${light ? "text-gray-300" : "text-white/15"}`}>
						—
					</span>
				)}
			</div>

			{/* Vertical divider */}
			{homeGoals.length > 0 && awayGoals.length > 0 && (
				<div className={`w-px self-stretch ${light ? "bg-gray-200" : "bg-white/10"}`} />
			)}

			{/* Away Team Goals */}
			<div className="flex flex-col items-start gap-1.5 min-w-0">
				{awayTeam && (
					<div className={`text-[9px] font-semibold tracking-[0.15em] uppercase mb-0.5 ${light ? "text-gray-400" : "text-white/30"}`}>
						{awayTeam}
					</div>
				)}
				{awayGoals.length > 0 ? (
					awayGoals.map((g) => (
						<div key={`${g.minute}-${g.playerName}`} className="flex items-center gap-2 text-sm font-mono">
							<span className={light ? "text-amber-500" : "text-yellow-400/90"}>⚽</span>
							<span className={light ? "text-gray-500" : "text-white/60"}>
								{g.playerName}
							</span>
							<span className={light ? "text-gray-400" : "text-white/40"}>
								{g.minute}
								{g.addedTime ? `+${g.addedTime}` : ""}&apos;
							</span>
							{g.isOwnGoal && (
								<span className={`text-[10px] font-semibold uppercase tracking-wider ${light ? "text-red-500" : "text-red-400/70"}`}>
									OG
								</span>
							)}
							{g.isPenalty && (
								<span className={`text-[10px] font-semibold uppercase tracking-wider ${light ? "text-amber-600" : "text-amber-400/70"}`}>
									PEN
								</span>
							)}
							{g.assist && (
								<span className={`text-[10px] ${light ? "text-gray-400" : "text-white/30"}`}>
									(assist: {g.assist})
								</span>
							)}
						</div>
					))
				) : (
					<span className={`text-xs ${light ? "text-gray-300" : "text-white/15"}`}>
						—
					</span>
				)}
			</div>
		</div>
	);
}
