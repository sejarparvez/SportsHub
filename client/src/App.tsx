import { Routes, Route } from 'react-router-dom'
import Overlay from './pages/Overlay'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/overlay" element={<Overlay />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
