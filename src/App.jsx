import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SubmitReport from './pages/SubmitReport'

const ADMIN_EMAILS = ['rrodriguez@marytierrapr.com']
const MANAGER_EMAILS = ['fssales@marytierrapr.com']

function getRole(user) {
  if (!user) return null
  if (ADMIN_EMAILS.includes(user.email)) return 'admin'
  if (MANAGER_EMAILS.includes(user.email)) return 'manager'
  return 'rep'
}

function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  if (user === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  const role = getRole(user)

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            !user ? <Login /> :
            role === 'rep' ? <Navigate to="/submit" replace /> :
            <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="/dashboard"
          element={
            !user ? <Navigate to="/" replace /> :
            role === 'rep' ? <Navigate to="/submit" replace /> :
            <Dashboard />
          }
        />
        <Route
          path="/submit"
          element={
            !user ? <Navigate to="/" replace /> :
            <SubmitReport />
          }
        />
      </Routes>
    </Router>
  )
}

export default App
