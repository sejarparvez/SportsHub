interface Preset {
	name: string;
	homeTeamName: string;
	homeTeamCrest: string;
	awayTeamName: string;
	awayTeamCrest: string;
}

interface Props {
	presets: Preset[];
	selectedPreset: string;
	onLoad: (name: string) => void;
	onDelete: (name: string) => void;
}

export type { Preset };

export default function PresetManager({ presets, selectedPreset, onLoad, onDelete }: Props) {
	if (presets.length === 0) return null;

	return (
		<div>
			<p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
				Load Preset
			</p>
			<div className="flex flex-wrap gap-2">
				{presets.map((p) => (
					<button
						key={p.name}
						type="button"
						onClick={() => onLoad(p.name)}
						aria-label={`Load preset ${p.name}`}
						className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
							selectedPreset === p.name
								? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400"
								: "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600"
						}`}
					>
						<span>{p.name}</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(p.name);
							}}
							aria-label={`Delete preset ${p.name}`}
							className="ml-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors text-sm leading-none"
						>
							×
						</button>
					</button>
				))}
			</div>
		</div>
	);
}
