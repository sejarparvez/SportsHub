import React from "react";

interface State {
	hasError: boolean;
	error: Error | null;
}

export default class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	State
> {
	state: State = { hasError: false, error: null };

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error("ErrorBoundary caught:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
					<div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-10 py-12 max-w-md text-center">
						<div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
							<span className="text-3xl">⚠️</span>
						</div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">
							Something went wrong
						</h2>
						<p className="text-sm text-gray-500 mb-6">
							{this.state.error?.message || "An unexpected error occurred"}
						</p>
						<button
							type="button"
							onClick={() => this.setState({ hasError: false, error: null })}
							className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-150 active:scale-95"
						>
							Try Again
						</button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}
