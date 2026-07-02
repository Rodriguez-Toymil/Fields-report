import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore'
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

function formatDate(ts) {
  if (!ts) return '-'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

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

function ExtraPhotos({ photos, setPhotos }) {
  function addPhoto(file) {
    if (file) setPhotos(prev => [...prev, file])
  }
  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
        Additional photos (optional)
      </label>
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={URL.createObjectURL(p)}
                alt={'Extra ' + (i + 1)}
                style={{ width: '100%', borderRadius: 9, height: 120, objectFit: 'cover' }}
              />
              <button
                onClick={() => removePhoto(i)}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(0,0,0,0.6)', color: '#fff',
                  border: 'none', borderRadius: 20, padding: '3px 9px',
                  fontSize: 11, cursor: 'pointer'
                }}>Remove</button>
            </div>
          ))}
        </div>
      )}
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', border: '2px dashed #d0d0d0',
        borderRadius: 9, padding: '18px 16px', cursor: 'pointer',
        background: '#fafafa', color: '#999', fontSize: 13
      }}>
        <span style={{ fontSize: 26, marginBottom: 4 }}>+</span>
        <span>Add another photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => { addPhoto(e.target.files[0] || null); e.target.value = '' }}
        />
      </label>
    </div>
  )
}

function RepReportCard({ r, expanded, onExpand }) {
  const extras = r.extraPhotos || []
  return (
    <div style={{
      background: '#fff', borderRadius: 14, marginBottom: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden'
    }}>
      <div style={{ padding: '1rem 1.25rem', cursor: 'pointer' }} onClick={() => onExpand(r.id)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{r.store}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>{formatDate(r.submittedAt)}</div>
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
          {extras.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 5 }}>MORE PHOTOS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {extras.map((url, i) => (
                  <img key={i} src={url} alt={'Extra ' + (i + 1)} style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 180 }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MyReports({ user }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'reports'), where('repEmail', '==', user.email))
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => {
        const ta = a.submittedAt && a.submittedAt.toMillis ? a.submittedAt.toMillis() : 0
        const tb = b.submittedAt && b.submittedAt.toMillis ? b.submittedAt.toMillis() : 0
        return tb - ta
      })
      setReports(list)
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [user.email])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Loading your reports...</div>
  }
  if (reports.length === 0) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>You have not submitted any reports yet.</div>
  }
  return (
    <div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
        {reports.length} report{reports.length === 1 ? '' : 's'} total
      </div>
      {reports.map(r => (
        <RepReportCard
          key={r.id}
          r={r}
          expanded={expanded === r.id}
          onExpand={id => setExpanded(expanded === id ? null : id)}
        />
      ))}
    </div>
  )
}

export default function SubmitReport() {
  const user = useAuth()
  const [tab, setTab] = useState('new')
  const [store, setStore] = useState('')
  const [service, setService] = useState('')
  const [notes, setNotes] = useState('')
  const [photoBefore, setPhotoBefore] = useState(null)
  const [photoAfter, setPhotoAfter] = useState(null)
  const [extraPhotos, setExtraPhotos] = useState([])
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
      const extraURLs = []
      for (let i = 0; i < extraPhotos.length; i++) {
        const url = await uploadPhoto(extraPhotos[i], base + '/extra_' + i + '.jpg')
        extraURLs.push(url)
      }
      await addDoc(collection(db, 'reports'), {
        repEmail: user.email,
        repName: user.displayName || user.email,
        store: store.trim(),
        service,
        notes: notes.trim(),
        photoBefore: beforeURL,
        photoAfter: afterURL,
        extraPhotos: extraURLs,
        latitude: gps ? gps.latitude : null,
        longitude: gps ? gps.longitude : null,
        submittedAt: serverTimestamp(),
      })
      setSubmitted(true)
      setStore('')
      setService('')
      setNotes('')
      setPhotoBefore(null)
      setPhotoAfter(null)
      setExtraPhotos([])
      setTimeout(() => setSubmitted(false), 4000)
    } catch (err) {
      setError('Submission failed. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const tabBtn = active => ({
    flex: 1, padding: '10px', borderRadius: 9, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', border: 'none',
    background: active ? '#1a1a2e' : '#e7e7e2',
    color: active ? '#fff' : '#555'
  })

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

      <div style={{ display: 'flex', gap: 8, padding: '12px 12px 0' }}>
        <button style={tabBtn(tab === 'new')} onClick={() => setTab('new')}>New Report</button>
        <button style={tabBtn(tab === 'mine')} onClick={() => setTab('mine')}>My Reports</button>
      </div>

      <div style={{ padding: '16px 12px 100px' }}>
        {tab === 'mine' ? (
          <MyReports user={user} />
        ) : (
          <div>
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
              <ExtraPhotos photos={extraPhotos} setPhotos={setExtraPhotos} />

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
        )}
      </div>
    </div>
  )
}
