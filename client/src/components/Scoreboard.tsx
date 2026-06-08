import type { GameState } from "@shared/types";
import { useEffect, useRef, useState } from "react";
import TeamBadge from "./TeamBadge";

interface Props {
	state: GameState;
}

export default function Scoreboard({ state }: Props) {
	const [scorePop, setScorePop] = useState<"home" | "away" | null>(null);
	const prevScoresRef = useRef({
		home: state.homeTeam.score,
		away: state.awayTeam.score,
	});

	useEffect(() => {
		const prev = prevScoresRef.current;
		if (state.homeTeam.score !== prev.home) {
			setScorePop("home");
		} else if (state.awayTeam.score !== prev.away) {
			setScorePop("away");
		}
		prevScoresRef.current = {
			home: state.homeTeam.score,
			away: state.awayTeam.score,
		};

		if (scorePop) {
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
				<span className="text-lg md:text-2xl font-bold text-white/90 text-center truncate max-w-full leading-tight">
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
							color: "#fff",
							textShadow:
								scorePop === "home"
									? "0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(59,130,246,0.4), 0 0 100px rgba(59,130,246,0.2)"
									: "0 0 15px rgba(255,255,255,0.15)",
						}}
					>
						{state.homeTeam.score}
					</span>
					<span className="text-4xl md:text-6xl font-light text-white/30">—</span>
					<span
						className={`text-6xl md:text-8xl font-extrabold tabular-nums ${
							scorePop === "away" ? "animate-score-pop" : ""
						}`}
						style={{
							color: "#fff",
							textShadow:
								scorePop === "away"
									? "0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(59,130,246,0.4), 0 0 100px rgba(59,130,246,0.2)"
									: "0 0 15px rgba(255,255,255,0.15)",
						}}
					>
						{state.awayTeam.score}
					</span>
				</div>
			</div>

			{/* Away Team */}
			<div className="flex flex-col items-center gap-3 w-36 md:w-44">
				<TeamBadge
					name={state.awayTeam.name}
					crest={state.awayTeam.crest}
					size="lg"
				/>
				<span className="text-lg md:text-2xl font-bold text-white/90 text-center truncate max-w-full leading-tight">
					{state.awayTeam.name}
				</span>
			</div>
		</div>
	);
}
