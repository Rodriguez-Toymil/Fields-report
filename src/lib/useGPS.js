import { useState, useEffect } from 'react'

export function useGPS() {
  const [gps, setGps] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('detecting') // detecting | ready | denied

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          accuracy: Math.round(pos.coords.accuracy)
        })
        setGpsStatus('ready')
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  return { gps, gpsStatus }
}
