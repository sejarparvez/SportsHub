export default function FulltimePopup({
	onDismiss,
}: {
	onDismiss: () => void;
}) {
	return (
		<div
			className="fixed inset-0 flex items-center justify-center z-50 motion-safe:animate-overlay-fade-in bg-white/60 backdrop-blur-sm cursor-pointer select-none"
			onClick={onDismiss}
		>
			<div className="motion-safe:animate-popup-scale bg-white/90 backdrop-blur-2xl text-gray-900 px-20 py-12 rounded-3xl shadow-2xl shadow-black/10 border border-white/60">
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
