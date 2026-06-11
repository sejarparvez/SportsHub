import type { GameState } from "@shared/types";
import React, { useEffect, useRef, useState } from "react";
import TeamBadge from "./TeamBadge";

interface Props {
	state: GameState;
	light?: boolean;
}

const Scoreboard = React.memo(
function Scoreboard({ state, light }: Props) {
	const [scorePop, setScorePop] = useState<"home" | "away" | null>(null);
	const prevScoresRef = useRef({
		home: state.homeTeam.score,
		away: state.awayTeam.score,
	});

	useEffect(() => {
		const prev = prevScoresRef.current;
		let pop: "home" | "away" | null = null;
		if (state.homeTeam.score !== prev.home) pop = "home";
		if (state.awayTeam.score !== prev.away) pop = "away";
		prevScoresRef.current = {
			home: state.homeTeam.score,
			away: state.awayTeam.score,
		};

		if (pop) {
			setScorePop(pop);
			const timer = setTimeout(() => setScorePop(null), 600);
			return () => clearTimeout(timer);
		}
	}, [state.homeTeam.score, state.awayTeam.score]);

	return (
		<div className="flex items-center justify-center gap-6 md:gap-12">
			{/* Home Team */}
			<div className="flex flex-col items-center gap-3 w-36 md:w-44">
				<TeamBadge
					name={state.homeTeam.name}
					crest={state.homeTeam.crest}
					size="lg"
				/>
				<span className={`text-lg md:text-2xl font-bold ${light ? "text-gray-800" : "text-white/90"} text-center truncate max-w-full leading-tight`}>
					{state.homeTeam.name}
				</span>
			</div>

			{/* Score */}
			<div className="flex flex-col items-center gap-1">
				<div className="flex items-center gap-4 md:gap-6">
					<span
						className={`text-6xl md:text-8xl font-extrabold tabular-nums ${
							scorePop === "home" ? "animate-score-pop" : ""
						}`}
						style={{
							color: light ? "#1e293b" : "#fff",
							textShadow:
								scorePop === "home"
									? light
										? "0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.15)"
										: "0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(59,130,246,0.4), 0 0 100px rgba(59,130,246,0.2)"
									: light
										? "0 0 8px rgba(0,0,0,0.06)"
										: "0 0 15px rgba(255,255,255,0.15)",
						}}
					>
						{state.homeTeam.score}
					</span>
					<span className={`text-4xl md:text-6xl font-light ${light ? "text-gray-300" : "text-white/30"}`}>—</span>
					<span
						className={`text-6xl md:text-8xl font-extrabold tabular-nums ${
							scorePop === "away" ? "animate-score-pop" : ""
						}`}
						style={{
							color: light ? "#1e293b" : "#fff",
							textShadow:
								scorePop === "away"
									? light
										? "0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.15)"
										: "0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(59,130,246,0.4), 0 0 100px rgba(59,130,246,0.2)"
									: light
										? "0 0 8px rgba(0,0,0,0.06)"
										: "0 0 15px rgba(255,255,255,0.15)",
						}}
					>
						{state.awayTeam.score}
						</span>
					</div>

					{/* Half-time score */}
					{(state.homeTeam.halfTimeScore !== undefined ||
						state.awayTeam.halfTimeScore !== undefined) && (
						<div className={`text-[10px] font-mono ${light ? "text-gray-400" : "text-white/25"} tracking-wider -mt-1`}>
							HT: {state.homeTeam.halfTimeScore ?? 0} — {state.awayTeam.halfTimeScore ?? 0}
						</div>
					)}
				</div>

			{/* Away Team */}
			<div className="flex flex-col items-center gap-3 w-36 md:w-44">
				<TeamBadge
					name={state.awayTeam.name}
					crest={state.awayTeam.crest}
					size="lg"
				/>
				<span className={`text-lg md:text-2xl font-bold ${light ? "text-gray-800" : "text-white/90"} text-center truncate max-w-full leading-tight`}>
					{state.awayTeam.name}
				</span>
			</div>
		</div>
	);
},
(prev: Props, next: Props) =>
	prev.light === next.light &&
	prev.state.homeTeam.score === next.state.homeTeam.score &&
	prev.state.awayTeam.score === next.state.awayTeam.score &&
	prev.state.homeTeam.name === next.state.homeTeam.name &&
	prev.state.awayTeam.name === next.state.awayTeam.name &&
	prev.state.homeTeam.crest === next.state.homeTeam.crest &&
	prev.state.awayTeam.crest === next.state.awayTeam.crest &&
	prev.state.homeTeam.halfTimeScore === next.state.homeTeam.halfTimeScore &&
	prev.state.awayTeam.halfTimeScore === next.state.awayTeam.halfTimeScore
);

export default Scoreboard;
