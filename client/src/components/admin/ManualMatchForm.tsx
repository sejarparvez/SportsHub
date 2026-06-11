import { useState } from "react";
import PresetManager from "./PresetManager";
import type { Preset } from "./PresetManager";

interface Props {
	addToast: (message: string, type: "success" | "error" | "info") => void;
	onMatchCreated: () => void;
}

const PRESETS_KEY = "sportshub-presets";

function loadPresets(): Preset[] {
	try {
		return JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
	} catch {
		return [];
	}
}

function savePresets(presets: Preset[]) {
	try {
		localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
	} catch {
		console.warn("Failed to save presets: storage full");
	}
}

export default function ManualMatchForm({ addToast, onMatchCreated }: Props) {
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({
		homeTeamName: "",
		homeTeamCrest: "",
		awayTeamName: "",
		awayTeamCrest: "",
		homeScore: "0",
		awayScore: "0",
		status: "IN_PLAY",
		minute: "0",
	});
	const [presets, setPresets] = useState<Preset[]>(loadPresets);
	const [presetName, setPresetName] = useState("");
	const [selectedPreset, setSelectedPreset] = useState("");

	const updateForm = (field: string, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSavePreset = () => {
		const name =
			presetName.trim() ||
			`${form.homeTeamName} vs ${form.awayTeamName}`;
		const newPreset: Preset = {
			name,
			homeTeamName: form.homeTeamName,
			homeTeamCrest: form.homeTeamCrest,
			awayTeamName: form.awayTeamName,
			awayTeamCrest: form.awayTeamCrest,
		};
		const updated = [...presets.filter((p) => p.name !== name), newPreset];
		setPresets(updated);
		savePresets(updated);
		setPresetName("");
		addToast(`Preset "${name}" saved`, "success");
	};

	const handleLoadPreset = (name: string) => {
		const preset = presets.find((p) => p.name === name);
		if (preset) {
			setForm((prev) => ({
				...prev,
				homeTeamName: preset.homeTeamName,
				homeTeamCrest: preset.homeTeamCrest,
				awayTeamName: preset.awayTeamName,
				awayTeamCrest: preset.awayTeamCrest,
			}));
			setSelectedPreset(name);
			addToast(`Preset "${name}" loaded`, "info");
		}
	};

	const handleDeletePreset = (name: string) => {
		const updated = presets.filter((p) => p.name !== name);
		setPresets(updated);
		savePresets(updated);
		setSelectedPreset("");
		addToast(`Preset "${name}" deleted`, "info");
	};

	const createMatch = async () => {
		try {
			const res = await fetch("/api/match/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					homeTeamName: form.homeTeamName,
					homeTeamCrest: form.homeTeamCrest || undefined,
					awayTeamName: form.awayTeamName,
					awayTeamCrest: form.awayTeamCrest || undefined,
					homeScore: Number.parseInt(form.homeScore) || 0,
					awayScore: Number.parseInt(form.awayScore) || 0,
					status: form.status,
					minute: Number.parseInt(form.minute) || 0,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				addToast(data.error || "Failed to create match", "error");
			} else {
				addToast("Manual match created", "success");
				setShowForm(false);
				onMatchCreated();
			}
		} catch {
			addToast("Network error creating match", "error");
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setShowForm(!showForm)}
				className="w-full bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 active:from-indigo-300 active:to-blue-400 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm hover:shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
			>
				<span>{showForm ? "−" : "+"}</span>
				<span>{showForm ? "Hide Form" : "Create Match"}</span>
			</button>

			{showForm && (
				<div className="mt-4 space-y-4 animate-slide-up">
					<PresetManager
						presets={presets}
						selectedPreset={selectedPreset}
						onLoad={handleLoadPreset}
						onDelete={handleDeletePreset}
					/>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
								Home Team
							</label>
							<input
								type="text"
								placeholder="e.g. Arsenal"
								value={form.homeTeamName}
								onChange={(e) => updateForm("homeTeamName", e.target.value)}
								className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
								Away Team
							</label>
							<input
								type="text"
								placeholder="e.g. Chelsea"
								value={form.awayTeamName}
								onChange={(e) => updateForm("awayTeamName", e.target.value)}
								className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
								Home Crest <span className="text-gray-300 font-normal normal-case">(opt)</span>
							</label>
							<input
								type="text"
								placeholder="https://..."
								value={form.homeTeamCrest}
								onChange={(e) => updateForm("homeTeamCrest", e.target.value)}
								className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-400 font-mono"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
								Away Crest <span className="text-gray-300 font-normal normal-case">(opt)</span>
							</label>
							<input
								type="text"
								placeholder="https://..."
								value={form.awayTeamCrest}
								onChange={(e) => updateForm("awayTeamCrest", e.target.value)}
								className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-400 font-mono"
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
								Home Score
							</label>
							<input
								type="number"
								min="0"
								value={form.homeScore}
								onChange={(e) => updateForm("homeScore", e.target.value)}
								className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
								Away Score
							</label>
							<input
								type="number"
								min="0"
								value={form.awayScore}
								onChange={(e) => updateForm("awayScore", e.target.value)}
								className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
								Minute
							</label>
							<input
								type="number"
								min="0"
								max="120"
								value={form.minute}
								onChange={(e) => updateForm("minute", e.target.value)}
								className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
							/>
						</div>
					</div>

					<div>
						<label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
							Status
						</label>
						<select
							value={form.status}
							onChange={(e) => updateForm("status", e.target.value)}
							className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
						>
							<option value="SCHEDULED">SCHEDULED</option>
							<option value="TIMED">TIMED</option>
							<option value="IN_PLAY">IN PLAY</option>
							<option value="PAUSED">PAUSED (HT)</option>
							<option value="FINISHED">FINISHED (FT)</option>
							<option value="EXTRA_TIME">EXTRA TIME</option>
							<option value="PENALTY_SHOOTOUT">PENALTIES</option>
						</select>
					</div>

					<div className="space-y-2">
						<button
							type="button"
							onClick={createMatch}
							disabled={!form.homeTeamName || !form.awayTeamName}
							className="w-full bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 active:from-indigo-300 active:to-blue-400 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] text-sm hover:shadow-lg hover:shadow-indigo-500/20"
						>
							Create Match
						</button>

						{form.homeTeamName && form.awayTeamName && (
							<div className="flex gap-2 pt-1">
								<input
									type="text"
									placeholder="Preset name (optional)"
									value={presetName}
									onChange={(e) => setPresetName(e.target.value)}
									className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
								/>
								<button
									type="button"
									onClick={handleSavePreset}
									className="bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95 shadow-sm hover:shadow-md hover:shadow-indigo-400/20"
								>
									Save
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
