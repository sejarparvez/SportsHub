interface Props {
	name: string;
	crest: string;
	size?: "sm" | "md" | "lg";
}

const sizeMap = {
	sm: { wrapper: "w-8 h-8", text: "text-sm", icon: "text-base" },
	md: { wrapper: "w-12 h-12", text: "text-lg", icon: "text-2xl" },
	lg: { wrapper: "w-20 h-20 md:w-24 md:h-24", text: "text-2xl md:text-3xl", icon: "text-3xl md:text-4xl" },
};

/**
 * Deterministic hue from a team name — same name always gets the same color.
 */
function teamHue(name: string): number {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return Math.abs(hash) % 360;
}

/**
 * Extract initials from a team name (max 2 chars).
 * "Manchester United" → "MU"
 * "Arsenal" → "A"
 * "FC Barcelona" → "FB"
 */
function teamInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

export default function TeamBadge({ name, crest, size = "md" }: Props) {
	const s = sizeMap[size];

	if (crest) {
		return (
			<div
				className={`${s.wrapper} rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center p-1.5 ring-2 ring-white/20`}
			>
				<img
					src={crest}
					alt={name}
					className="w-full h-full object-contain"
					loading="lazy"
				/>
			</div>
		);
	}

	const hue = teamHue(name);
	const initials = teamInitials(name);

	return (
		<div
			className={`${s.wrapper} rounded-full flex items-center justify-center ring-2 ring-white/10 shadow-inner`}
			style={{
				background: `linear-gradient(135deg, hsl(${hue}, 55%, 35%), hsl(${hue + 30}, 60%, 25%))`,
			}}
			title={name}
		>
			<span className={`${s.text} font-bold text-white/90 select-none`}>
				{initials}
			</span>
		</div>
	);
}
