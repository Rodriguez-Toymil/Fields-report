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
            {r.latitude && (
              
               href={"https://maps.google.com/?q=" + r.latitude + "," + r.longitude}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, color: '#1565c0', marginTop: 3, display: 'block' }}
              >
                View on map: {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
              </a>
            )}
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
