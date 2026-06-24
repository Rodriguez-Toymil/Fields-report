import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'

function formatDate(ts) {
  if (!ts) return '-'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '1rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center'
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || '#1a1a2e' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{label}</div>
    </div>
  )
}

function ReportCard({ r, onExpand, expanded }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, marginBottom: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden'
    }}>
      <div style={{ padding: '1rem 1.25rem', cursor: 'pointer' }} onClick={() => onExpand(r.id)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{r.store}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{r.repEmail}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>{formatDate(r.submittedAt)}</div>
            {r.latitude && <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>GPS: {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{
              background: '#e8eaf6', color: '#3949ab', fontSize: 11,
              fontWeight: 600, padding: '3px 10px', borderRadius: 20
            }}>{r.service}</span>
            <span style={{ fontSize: 18 }}>{expanded ? 'v' : '>'}</span>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #f0f0f0', padding: '1rem 1.25rem' }}>
          {r.notes && (
            <div style={{
              background: '#f9f9f9', borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#444', marginBottom: 14, lineHeight: 1.6
            }}>{r.notes}</div>
          )}
          {(r.photoBefore || r.photoAfter) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {r.photoBefore && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 5 }}>BEFORE</div>
                  <img src={r.photoBefore} alt="Before" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 180 }} />
                </div>
              )}
              {r.photoAfter && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 5 }}>AFTER</div>
                  <img src={r.photoAfter} alt="After" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 180 }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const user = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filterRep, setFilterRep] = useState('')
  const [filterDays, setFilterDays] = useState('7')

  useEffect(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - parseInt(filterDays))
    const q = query(
      collection(db, 'reports'),
      where('submittedAt', '>=', Timestamp.fromDate(cutoff)),
      orderBy('submittedAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [filterDays])

  const filtered = filterRep
    ? reports.filter(r => r.repEmail && r.repEmail.toLowerCase().includes(filterRep.toLowerCase()))
    : reports

  const uniqueReps = [...new Set(reports.map(r => r.repEmail))].filter(Boolean)
  const todayCount = reports.filter(r => {
    if (!r.submittedAt) return false
    const d = r.submittedAt.toDate ? r.submittedAt.toDate() : new Date()
    return d.toDateString() === new Date().toDateString()
  }).length

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#1a1a2e', color: '#fff', padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Manager Dashboard</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{user && user.email}</div>
        </div>
        <button onClick={() => signOut(auth)} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          borderRadius: 7, padding: '6px 12px', fontSize: 13, cursor: 'pointer'
        }}>Sign out</button>
      </div>

      <div style={{ padding: '16px 12px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          <StatCard label="Reports today" value={todayCount} color="#2e7d32" />
          <StatCard label={'Last ' + filterDays + ' days'} value={filtered.length} />
          <StatCard label="Active reps" value={uniqueReps.length} color="#1565c0" />
        </div>

        <div style={{
          background: '#fff', borderRadius: 12, padding: '1rem',
          marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10
        }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>
              Filter by rep
            </label>
            <select style={{
              width: '100%', padding: '8px 10px', border: '1.5px solid #e0e0e0',
              borderRadius: 8, fontSize: 13, background: '#fafafa'
            }} value={filterRep} onChange={e => setFilterRep(e.target.value)}>
              <option value="">All reps</option>
              {uniqueReps.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>
              Time period
            </label>
            <select style={{
              width: '100%', padding: '8px 10px', border: '1.5px solid #e0e0e0',
              borderRadius: 8, fontSize: 13, background: '#fafafa'
            }} value={filterDays} onChange={e => setFilterDays(e.target.value)}>
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>No reports found.</div>
        ) : (
          filtered.map(r => (
            <ReportCard
              key={r.id}
              r={r}
              expanded={expanded === r.id}
              onExpand={id => setExpanded(expanded === id ? null : id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
