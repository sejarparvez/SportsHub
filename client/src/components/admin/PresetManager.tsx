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
			<p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
				Load Preset
			</p>
			<div className="flex flex-wrap gap-2">
				{presets.map((p) => (
					<button
						key={p.name}
						type="button"
						onClick={() => onLoad(p.name)}
						className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
							selectedPreset === p.name
								? "bg-indigo-50 border-indigo-200 text-indigo-700"
								: "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						<span>{p.name}</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(p.name);
							}}
							className="ml-1 text-gray-400 hover:text-red-500 transition-colors text-sm leading-none"
						>
							×
						</button>
					</button>
				))}
			</div>
		</div>
	);
}
