import { useState, useRef } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { db, storage, auth } from '../lib/firebase'
import { useGPS } from '../lib/useGPS'
import { stampPhoto } from '../lib/photoUtils'
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

const S = {
  page: { minHeight: '100vh', background: '#f5f5f0', fontFamily: 'system-ui, sans-serif' },
  header: {
    background: '#1a1a2e', color: '#fff', padding: '14px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 10
  },
  card: {
    background: '#fff', borderRadius: 14, padding: '1.25rem',
    margin: '0 12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: {
    width: '100%', padding: '11px 13px', border: '1.5px solid #e0e0e0',
    borderRadius: 9, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    background: '#fafafa'
  },
  photoBox: {
    border: '2px dashed #d0d0d0', borderRadius: 12, minHeight: 150,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', background: '#fafafa',
    position: 'relative', overflow: 'hidden', gap: 8
  },
  submitBtn: {
    width: '100%', padding: '14px', background: '#1a1a2e', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', marginTop: 4
  }
}

export default function SubmitReport() {
  const user = useAuth()
  const { gps, gpsStatus } = useGPS()
  const [store, setStore] = useState('')
  const [service, setService] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState({ before: null, after: null })
  const [previews, setPreviews] = useState({ before: null, after: null })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const beforeRef = useRef()
  const afterRef = useRef()

  async function handlePhoto(e, type) {
    const file = e.target.files[0]
    if (!file) return
    const now = new Date()
    const ts = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const stamped = await stampPhoto(file, ts, gps)
    const previewUrl = URL.createObjectURL(stamped)
    setPhotos(p => ({ ...p, [type]: stamped }))
    setPreviews(p => ({ ...p, [type]: previewUrl }))
  }

  async function handleSubmit() {
    if (!store.trim()) return setError('Please enter the store name.')
    if (!service) return setError('Please select a service type.')
    if (!photos.before && !photos.after) return setError('Please take at least one photo.')
    setError('')
    setSubmitting(true)

    try {
      const reportId = Date.now().toString()
      const urls = {}

      for (const type of ['before', 'after']) {
        if (photos[type]) {
          const storageRef = ref(storage, `reports/${reportId}/${type}.jpg`)
          await uploadBytes(storageRef, photos[type])
          urls[type] = await getDownloadURL(storageRef)
        }
      }

      await addDoc(collection(db, 'reports'), {
        repEmail: user.email,
        repName: user.displayName || user.email,
        store: store.trim(),
        service,
        notes: notes.trim(),
        gps: gps || null,
        photosBefore: urls.before || null,
        photosAfter: urls.after || null,
        submittedAt: serverTimestamp(),
        reportId
      })

      setSubmitted(true)
      setStore(''); setService(''); setNotes('')
      setPhotos({ before: null, after: null })
      setPreviews({ before: null, after: null })
      setTimeout(() => setSubmitted(false), 4000)
    } catch (err) {
      setError('Upload failed. Check your connection and try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const gpsBadge = gpsStatus === 'ready'
    ? { bg: '#e8f5e9', color: '#2e7d32', text: `📍 ${gps?.lat}, ${gps?.lng}` }
    : gpsStatus === 'denied'
    ? { bg: '#fff3e0', color: '#e65100', text: '⚠ GPS unavailable — enable location' }
    : { bg: '#f3f3f3', color: '#666', text: '⏳ Detecting location…' }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>📋 Field Reports</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{user?.email}</div>
        </div>
        <button onClick={() => signOut(auth)} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          borderRadius: 7, padding: '6px 12px', fontSize: 13, cursor: 'pointer'
        }}>Sign out</button>
      </div>

      <div style={{ padding: '16px 0 100px' }}>
        {submitted && (
          <div style={{
            background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 10,
            margin: '0 12px 14px', padding: '12px 16px', color: '#2e7d32',
            fontSize: 14, fontWeight: 600, textAlign: 'center'
          }}>
            ✅ Report submitted successfully!
          </div>
        )}

        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #fcc', borderRadius: 10,
            margin: '0 12px 14px', padding: '12px 16px', color: '#c00', fontSize: 14
          }}>{error}</div>
        )}

        <div style={S.card}>
          <div style={{ ...S.label, fontSize: 11, letterSpacing: '0.08em', color: '#999', textTransform: 'uppercase', marginBottom: 14 }}>
            Visit details
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Store / supermarket</label>
            <input style={S.input} value={store} onChange={e => setStore(e.target.value)}
              placeholder="e.g. Walmart — Bayamón PR" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Service performed</label>
            <select style={{ ...S.input, appearance: 'none' }} value={service} onChange={e => setService(e.target.value)}>
              <option value="">Select service type…</option>
              {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={S.label}>Notes</label>
            <textarea style={{ ...S.input, height: 80, resize: 'vertical' }}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Describe what was done, stock levels, any issues…" />
          </div>
        </div>

        <div style={S.card}>
          <div style={{ ...S.label, fontSize: 11, letterSpacing: '0.08em', color: '#999', textTransform: 'uppercase', marginBottom: 10 }}>
            Location
          </div>
          <div style={{
            background: gpsBadge.bg, color: gpsBadge.color,
            borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 500
          }}>{gpsBadge.text}</div>
        </div>

        <div style={S.card}>
          <div style={{ ...S.label, fontSize: 11, letterSpacing: '0.08em', color: '#999', textTransform: 'uppercase', marginBottom: 12 }}>
            Before & after photos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['before', 'after'].map(type => (
              <div key={type}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'capitalize' }}>
                  {type} photo
                </div>
                <div style={S.photoBox} onClick={() => (type === 'before' ? beforeRef : afterRef).current.click()}>
                  {previews[type] ? (
                    <>
                      <img src={previews[type]} alt={type} style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10
                      }} />
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 600
                      }}>
                        ✓ Tap to retake
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 32 }}>📷</div>
                      <div style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: '0 8px' }}>
                        Tap to take {type} photo
                      </div>
                    </>
                  )}
                </div>
                <input ref={type === 'before' ? beforeRef : afterRef} type="file"
                  accept="image/*" capture="environment" style={{ display: 'none' }}
                  onChange={e => handlePhoto(e, type)} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 10, textAlign: 'center' }}>
            Photos are automatically stamped with time and GPS location
          </p>
        </div>

        <div style={{ margin: '0 12px' }}>
          <button style={{ ...S.submitBtn, opacity: submitting ? 0.6 : 1 }}
            onClick={handleSubmit} disabled={submitting}>
            {submitting ? '⏳ Uploading report…' : '📤 Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
