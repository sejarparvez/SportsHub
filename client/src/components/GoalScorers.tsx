import type { GoalScorer } from "@shared/types";

interface Props {
	goals: GoalScorer[];
	homeTeam?: string;
	awayTeam?: string;
}

export default function GoalScorers({ goals, homeTeam, awayTeam }: Props) {
	if (goals.length === 0) return null;

	const homeGoals = goals.filter((g) => g.isHome);
	const awayGoals = goals.filter((g) => !g.isHome);

	return (
		<div className="flex items-start justify-center gap-8 md:gap-12 mt-3">
			<div className="flex flex-col items-start gap-1.5 min-w-0">
				{homeTeam && (
					<div className="text-[9px] font-semibold tracking-[0.15em] uppercase mb-0.5 text-gray-400">
						{homeTeam}
					</div>
				)}
				{homeGoals.length > 0 ? (
					homeGoals.map((g) => (
						<div key={`${g.minute}-${g.playerName}`} className="flex items-center gap-2 text-sm font-mono">
							<span className="text-amber-500">⚽</span>
							<span className="text-gray-700">
								{g.playerName}
							</span>
							<span className="text-gray-400">
								{g.minute}
								{g.addedTime ? `+${g.addedTime}` : ""}&apos;
							</span>
							{g.isOwnGoal && (
								<span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
									OG
								</span>
							)}
							{g.isPenalty && (
								<span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
									PEN
								</span>
							)}
							{g.assist && (
								<span className="text-[10px] text-gray-400">
									(assist: {g.assist})
								</span>
							)}
						</div>
					))
				) : (
					<span className="text-xs text-gray-300">
						—
					</span>
				)}
			</div>

			{homeGoals.length > 0 && awayGoals.length > 0 && (
				<div className="w-px self-stretch bg-gray-200" />
			)}

			<div className="flex flex-col items-start gap-1.5 min-w-0">
				{awayTeam && (
					<div className="text-[9px] font-semibold tracking-[0.15em] uppercase mb-0.5 text-gray-400">
						{awayTeam}
					</div>
				)}
				{awayGoals.length > 0 ? (
					awayGoals.map((g) => (
						<div key={`${g.minute}-${g.playerName}`} className="flex items-center gap-2 text-sm font-mono">
							<span className="text-amber-500">⚽</span>
							<span className="text-gray-500">
								{g.playerName}
							</span>
							<span className="text-gray-400">
								{g.minute}
								{g.addedTime ? `+${g.addedTime}` : ""}&apos;
							</span>
							{g.isOwnGoal && (
								<span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
									OG
								</span>
							)}
							{g.isPenalty && (
								<span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
									PEN
								</span>
							)}
							{g.assist && (
								<span className="text-[10px] text-gray-400">
									(assist: {g.assist})
								</span>
							)}
						</div>
					))
				) : (
					<span className="text-xs text-gray-300">
						—
					</span>
				)}
			</div>
		</div>
	);
}
