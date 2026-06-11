import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

const Home = lazy(() => import('./pages/Home'))
const Admin = lazy(() => import('./pages/Admin'))

function PageLoader() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
		</div>
	)
}

export default function App() {
	return (
		<ErrorBoundary>
			<Suspense fallback={<PageLoader />}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/admin" element={<Admin />} />
				</Routes>
			</Suspense>
		</ErrorBoundary>
	)
}
