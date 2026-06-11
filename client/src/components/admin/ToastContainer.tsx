type ToastType = "success" | "error" | "info";

interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

interface Props {
	toasts: Toast[];
}

export default function ToastContainer({ toasts }: Props) {
	if (toasts.length === 0) return null;

	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
			{toasts.map((t) => (
				<div
					key={t.id}
					className={`animate-slide-up px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
						t.type === "success"
							? "bg-white border-green-200 text-green-800 shadow-green-200/50"
							: t.type === "error"
								? "bg-white border-red-200 text-red-800 shadow-red-200/50"
								: "bg-white border-blue-200 text-blue-800 shadow-blue-200/50"
					}`}
				>
					<div className="flex items-center gap-2.5">
						<span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
							t.type === "success" ? "bg-green-100 text-green-600"
								: t.type === "error" ? "bg-red-100 text-red-600"
								: "bg-blue-100 text-blue-600"
						}`}>
							{t.type === "success"
								? "✓"
								: t.type === "error"
									? "✕"
									: "ℹ"}
						</span>
						<span>{t.message}</span>
					</div>
				</div>
			))}
		</div>
	);
}
