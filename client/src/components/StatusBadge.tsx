import type { MatchStatus } from "@shared/types";

interface Props {
	status: MatchStatus;
}

const labels: Record<MatchStatus, string> = {
	SCHEDULED: "SCHEDULED",
	TIMED: "TIMED",
	IN_PLAY: "LIVE",
	PAUSED: "HT",
	FINISHED: "FT",
	EXTRA_TIME: "ET",
	PENALTY_SHOOTOUT: "PENS",
	AWARDED: "FT",
};

const styles: Record<MatchStatus, string> = {
	SCHEDULED: "bg-gray-500/30 text-gray-300 border-gray-500/40",
	TIMED: "bg-gray-500/30 text-gray-300 border-gray-500/40",
	IN_PLAY:
		"bg-gradient-to-r from-red-600/80 to-red-500/80 text-white border-red-400/50 shadow-lg shadow-red-500/25",
	PAUSED:
		"bg-gradient-to-r from-yellow-600/80 to-amber-500/80 text-white border-yellow-400/50",
	FINISHED: "bg-gray-600/40 text-gray-300 border-gray-500/40",
	EXTRA_TIME:
		"bg-gradient-to-r from-orange-600/80 to-red-500/80 text-white border-orange-400/50 shadow-lg shadow-orange-500/25",
	PENALTY_SHOOTOUT:
		"bg-gradient-to-r from-purple-600/80 to-pink-500/80 text-white border-purple-400/50",
	AWARDED: "bg-gray-600/40 text-gray-300 border-gray-500/40",
};

export default function StatusBadge({ status }: Props) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${styles[status]}`}
		>
			{status === "IN_PLAY" && (
				<span className="relative flex h-2 w-2">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
					<span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
				</span>
			)}
			{labels[status]}
		</span>
	);
}
