export default function HalftimePopup() {
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none select-none">
			<div className="motion-safe:animate-popup-scale bg-linear-to-r from-blue-600 to-indigo-600 text-white px-14 py-7 rounded-3xl shadow-2xl shadow-blue-500/40 border border-blue-400/40">
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
