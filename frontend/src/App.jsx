import { useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Settings from './pages/Settings.jsx'
import './App.css'

function App() {
  const [page, setPage] = useState('dashboard')

  if (page === 'settings') {
    return <Settings onBack={() => setPage('dashboard')} />
  }

  return <Dashboard onOpenSettings={() => setPage('settings')} />
}

export default App
