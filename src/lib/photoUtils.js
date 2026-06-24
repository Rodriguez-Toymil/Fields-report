// Compresses a photo File to ~300KB max before uploading
// Saves ~70% Firebase storage cost
export async function compressPhoto(file, maxWidthPx = 1200, qualityJpeg = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width)
        width = maxWidthPx
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        qualityJpeg
      )
    }
    img.onerror = reject
    img.src = url
  })
}

// Draws timestamp + GPS onto photo using canvas and returns a blob
export async function stampPhoto(file, timestamp, gps) {
  const blob = await compressPhoto(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      // Stamp background
      const pad = 10
      const lineH = 20
      const lines = [
        timestamp,
        gps ? `GPS: ${gps.lat}, ${gps.lng}` : 'GPS: unavailable'
      ]
      const boxH = lines.length * lineH + pad * 2
      const boxW = 320
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(pad, canvas.height - boxH - pad, boxW, boxH)

      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${lineH - 4}px monospace`
      lines.forEach((line, i) => {
        ctx.fillText(line, pad * 2, canvas.height - boxH - pad + pad + (i + 1) * lineH - 4)
      })

      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Stamp failed')),
        'image/jpeg',
        0.85
      )
    }
    img.onerror = reject
    img.src = url
  })
}
