export default function MatchStartedPopup() {
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none select-none">
			<div className="motion-safe:animate-popup-scale bg-linear-to-r from-green-600 to-emerald-500 text-white px-14 py-7 rounded-3xl shadow-2xl shadow-green-500/50 border border-green-400/40">
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
