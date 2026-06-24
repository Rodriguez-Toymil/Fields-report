import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Incorrect email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem',
      backgroundImage: 'url(/logo-butchers.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: '2.5rem 2rem',
        width: '100%', maxWidth: 380, boxShadow: '0 2px 24px rgba(0,0,0,0.18)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/mt-logo.png"
            alt="Mar y Tierra"
            style={{ height: 80, objectFit: 'contain', marginBottom: '1rem' }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>Field Reports</h1>
          <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Sign in to continue</p>
        </div>
        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8,
            padding: '10px 14px', fontSize: 13, color: '#c00', marginBottom: 16
          }}>{error}</div>
        )}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #ddd',
                borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #ddd',
                borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', background: '#1a1a2e', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20 }}>
          Contact your manager if you need access.
        </p>
      </div>
    </div>
  )
}
