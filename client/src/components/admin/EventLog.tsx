import type { EventLogEntry } from "@shared/types";
import { useEffect, useRef } from "react";

interface Props {
	events: EventLogEntry[];
}

const TYPE_STYLES: Record<string, string> = {
	goal: "bg-yellow-100 text-yellow-700 border-yellow-200",
	halftime: "bg-blue-100 text-blue-700 border-blue-200",
	fulltime: "bg-purple-100 text-purple-700 border-purple-200",
	started: "bg-green-100 text-green-700 border-green-200",
	minute: "bg-gray-100 text-gray-600 border-gray-200",
	status: "bg-indigo-100 text-indigo-700 border-indigo-200",
	override: "bg-amber-100 text-amber-700 border-amber-200",
};

function formatTime(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function EventLog({ events }: Props) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [events.length]);

	if (events.length === 0) {
		return (
			<div className="text-center py-8">
				<div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
					<span className="text-2xl">📋</span>
				</div>
				<p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No events yet</p>
				<p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
					Events appear here as they happen during the match.
				</p>
			</div>
		);
	}

	return (
		<div className="max-h-80 overflow-y-auto -mx-1">
			<div className="space-y-1">
				{events.map((e) => (
					<div
						key={e.id}
						className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
					>
						<code className="text-[11px] font-mono text-gray-400 dark:text-gray-500 tabular-nums mt-0.5 shrink-0 w-16">
							{formatTime(e.timestamp)}
						</code>
						<span
							className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${TYPE_STYLES[e.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}
						>
							{e.type.toUpperCase()}
						</span>
						<span className="text-sm text-gray-700 dark:text-gray-200 leading-snug min-w-0">
							{e.description}
						</span>
					</div>
				))}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}
