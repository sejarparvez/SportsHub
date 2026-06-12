import type { GoalEventData } from "@shared/types";

const TEAM_LABELS: Record<string, string> = {
	home: "Home",
	away: "Away",
};

export default function GoalPopup({ data }: { data: GoalEventData }) {
	const teamLabel = data.team ? TEAM_LABELS[data.team] : "A team";
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none select-none">
			<div className="motion-safe:animate-popup-scale bg-linear-to-r from-yellow-400 via-yellow-500 to-amber-500 text-black px-14 py-7 rounded-3xl shadow-2xl shadow-yellow-500/50 border border-yellow-300/60">
				<div className="flex items-center gap-5">
					<span className="text-5xl">⚽</span>
					<div className="text-left">
						<p className="text-5xl font-black tracking-tight">GOAL!</p>
						<p className="text-lg font-semibold opacity-80">
							{data.minute}&apos; —{" "}
							{data.playerName ? `${data.playerName} — ` : ""}
							{teamLabel} team scored!
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
