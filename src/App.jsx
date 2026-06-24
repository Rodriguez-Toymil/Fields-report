import { useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import SubmitReport from './pages/SubmitReport'
import Dashboard from './pages/Dashboard'
import { MANAGER_EMAILS } from './pages/Dashboard'

export default function App() {
  const user = useAuth()

  // Still loading auth state
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f5f5f0'
      }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div>Loading…</div>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  const isManager = MANAGER_EMAILS.includes(user.email?.toLowerCase())
  return isManager ? <Dashboard /> : <SubmitReport />
}
