interface Props {
	minute: number;
	isLive?: boolean;
	light?: boolean;
}

export default function MatchMinute({ minute, isLive, light }: Props) {
	if (minute <= 0) return null;

	return (
		<span className={`inline-flex items-center gap-3 text-4xl font-mono font-bold tabular-nums ${light ? "text-gray-800" : "text-white/90"}`}>
			{isLive && (
				<span className="relative flex h-4 w-4">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
					<span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
				</span>
			)}
			{minute}&apos;
		</span>
	);
}
