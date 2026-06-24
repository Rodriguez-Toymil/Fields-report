import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'

const SERVICE_TYPES = [
  'Shelf restocking',
  'Product display setup',
  'Promotional display',
  'Price tag update',
  'Inventory check',
  'Competitor analysis',
  'New product placement',
  'Other'
]

export default function SubmitReport() {
  const user = useAuth()
  const [store, setStore] = useState('')
  const [service, setService] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!store.trim()) return setError('Please enter the store name.')
    if (!service) return setError('Please select a service type.')
    setError('')
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'reports'), {
        repEmail: user.email,
        repName: user.displayName || user.email,
        store: store.trim(),
        service,
        notes: notes.trim(),
        submittedAt: serverTimestamp(),
      })
      setSubmitted(true)
      setStore('')
      setService('')
      setNotes('')
      setTimeout(() => setSubmitted(false), 4000)
    } catch (err) {
      setError('Submission failed. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#1a1a2e', color: '#fff', padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Field Reports</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{user && user.email}</div>
        </div>
        <button onClick={() => signOut(auth)} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          borderRadius: 7, padding: '6px 12px', fontSize: 13, cursor: 'pointer'
        }}>Sign out</button>
      </div>

      <div style={{ padding: '16px 12px 100px' }}>
        {submitted && (
          <div style={{
            background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 10,
            padding: '12px 16px', color: '#2e7d32', fontSize: 14,
            fontWeight: 600, textAlign: 'center', marginBottom: 14
          }}>Report submitted successfully!</div>
        )}
        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #fcc', borderRadius: 10,
            padding: '12px 16px', color: '#c00', fontSize: 14, marginBottom: 14
          }}>{error}</div>
        )}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '1.25rem',
          marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
              Store / supermarket
            </label>
            <input
              style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#fafafa' }}
              value={store}
              onChange={e => setStore(e.target.value)}
              placeholder="e.g. Walmart - Bayamon PR"
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
              Service performed
            </label>
            <select
              style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#fafafa' }}
              value={service}
              onChange={e => setService(e.target.value)}
            >
              <option value="">Select service type...</option>
              {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
              Notes
            </label>
            <textarea
              style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#fafafa', height: 80, resize: 'vertical' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Describe what was done, stock levels, any issues..."
            />
          </div>
        </div>
        <button
          style={{ width: '100%', padding: '14px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}
