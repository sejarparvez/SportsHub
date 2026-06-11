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
							? "bg-white dark:bg-slate-800 border-green-200 dark:border-green-700 text-green-800 dark:text-green-400 shadow-green-200/50"
							: t.type === "error"
								? "bg-white dark:bg-slate-800 border-red-200 dark:border-red-700 text-red-800 dark:text-red-400 shadow-red-200/50"
								: "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-400 shadow-blue-200/50"
					}`}
				>
					<div className="flex items-center gap-2.5">
						<span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
							t.type === "success" ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
								: t.type === "error" ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
								: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
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
