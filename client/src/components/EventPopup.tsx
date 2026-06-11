import type { GoalEventData, MatchEventType } from "@shared/types";

interface Props {
	goalEvent: GoalEventData | null;
	matchEvent: MatchEventType | null;
}

const TEAM_LABELS: Record<string, string> = {
	home: "Home",
	away: "Away",
};

function GoalPopup({ data }: { data: GoalEventData }) {
	const teamLabel = data.team ? TEAM_LABELS[data.team] : "A team";
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none select-none">
			<div className="animate-popup-scale bg-linear-to-r from-yellow-400 via-yellow-500 to-amber-500 text-black px-14 py-7 rounded-3xl shadow-2xl shadow-yellow-500/50 border border-yellow-300/60">
				<div className="flex items-center gap-5">
					<span className="text-5xl">⚽</span>
					<div className="text-left">
						<p className="text-5xl font-black tracking-tight">GOAL!</p>
						<p className="text-lg font-semibold opacity-80">
							{data.minute}&apos; — {data.playerName ? `${data.playerName} — ` : ""}{teamLabel} team scored!
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function HalftimePopup() {
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none select-none">
			<div className="animate-popup-scale bg-linear-to-r from-blue-600 to-indigo-600 text-white px-14 py-7 rounded-3xl shadow-2xl shadow-blue-500/40 border border-blue-400/40">
				<div className="flex items-center gap-5">
					<span className="text-5xl">⏸️</span>
					<div className="text-left">
						<p className="text-5xl font-black tracking-tight">HALF TIME</p>
						<p className="text-lg font-semibold opacity-80">
							The first half has concluded
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function MatchStartedPopup() {
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none select-none">
			<div className="animate-popup-scale bg-linear-to-r from-green-600 to-emerald-500 text-white px-14 py-7 rounded-3xl shadow-2xl shadow-green-500/50 border border-green-400/40">
				<div className="flex items-center gap-5">
					<span className="text-5xl">🔴</span>
					<div className="text-left">
						<p className="text-5xl font-black tracking-tight">MATCH IS LIVE!</p>
						<p className="text-lg font-semibold opacity-80">
							Kickoff detected — the match has started
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function FulltimePopup({ onDismiss }: { onDismiss: () => void }) {
	return (
		<div
			className="fixed inset-0 flex items-center justify-center z-50 animate-overlay-fade-in bg-white/60 backdrop-blur-sm cursor-pointer select-none"
			onClick={onDismiss}
		>
			<div className="animate-popup-scale bg-white/90 backdrop-blur-2xl text-gray-900 px-20 py-12 rounded-3xl shadow-2xl shadow-black/10 border border-white/60">
				<div className="flex flex-col items-center gap-4">
					<span className="text-7xl">🏁</span>
					<p className="text-7xl font-black tracking-tight">FULL TIME</p>
					<p className="text-xl font-medium text-gray-500">
						The match has ended
					</p>
					<p className="text-sm text-gray-400 mt-2">Click anywhere to dismiss</p>
				</div>
			</div>
		</div>
	);
}

export default function EventPopup({ goalEvent, matchEvent }: Props) {
	if (matchEvent === "fulltime") return <FulltimePopup onDismiss={() => {}} />;
	if (matchEvent === "halftime") return <HalftimePopup />;
	if (matchEvent === "started") return <MatchStartedPopup />;
	if (goalEvent) return <GoalPopup data={goalEvent} />;
	return null;
}
