import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { db, auth, storage } from '../lib/firebase'
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

function PhotoPicker({ label, photo, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
        {label}
      </label>
      {photo ? (
        <div style={{ position: 'relative' }}>
          <img
            src={URL.createObjectURL(photo)}
            alt={label}
            style={{ width: '100%', borderRadius: 9, maxHeight: 200, objectFit: 'cover' }}
          />
          <button
            onClick={() => onChange(null)}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.6)', color: '#fff',
              border: 'none', borderRadius: 20, padding: '4px 10px',
              fontSize: 12, cursor: 'pointer'
            }}>Remove</button>
        </div>
      ) : (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', border: '2px dashed #d0d0d0',
          borderRadius: 9, padding: '28px 16px', cursor: 'pointer',
          background: '#fafafa', color: '#999', fontSize: 13
        }}>
          <span style={{ fontSize: 32, marginBottom: 8 }}>+</span>
          <span>Tap to take photo or upload</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => onChange(e.target.files[0] || null)}
          />
        </label>
      )}
    </div>
  )
}

export default function SubmitReport() {
  const user = useAuth()
  const [store, setStore] = useState('')
  const [service, setService] = useState('')
  const [notes, setNotes] = useState('')
  const [photoBefore, setPhotoBefore] = useState(null)
  const [photoAfter, setPhotoAfter] = useState(null)
  const [gps, setGps] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => setGps(null)
      )
    }
  }, [])

  async function uploadPhoto(file, path) {
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return getDownloadURL(storageRef)
  }

  async function handleSubmit() {
    if (!store.trim()) return setError('Please enter the store name.')
    if (!service) return setError('Please select a service type.')
    if (!photoBefore) return setError('Please add a BEFORE photo.')
    if (!photoAfter) return setError('Please add an AFTER photo.')
    if (!gps) return setError('Please enable GPS location on your device to submit a report.')
    setError('')
    setSubmitting(true)
    try {
      const timestamp = Date.now()
      const base = 'reports/' + user.uid + '/' + timestamp
      const [beforeURL, afterURL] = await Promise.all([
        uploadPhoto(photoBefore, base + '/before.jpg'),
        uploadPhoto(photoAfter, base + '/after.jpg')
      ])
      await addDoc(collection(db, 'reports'), {
        repEmail: user.email,
        repName: user.displayName || user.email,
        store: store.trim(),
        service,
        notes: notes.trim(),
        photoBefore: beforeURL,
        photoAfter: afterURL,
        latitude: gps.latitude,
        longitude: gps.longitude,
        submittedAt: serverTimestamp(),
      })
      setSubmitted(true)
      setStore('')
      setService('')
      setNotes('')
      setPhotoBefore(null)
      setPhotoAfter(null)
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

          <PhotoPicker label="Photo BEFORE" photo={photoBefore} onChange={setPhotoBefore} />
          <PhotoPicker label="Photo AFTER" photo={photoAfter} onChange={setPhotoAfter} />

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
          {submitting ? 'Uploading...' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}
