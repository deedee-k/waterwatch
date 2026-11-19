import { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
L.Marker.prototype.options.icon = DefaultIcon

export default function LocationPicker({ position, setPosition }) {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const center = position ? [position.lat, position.lng] : [-29.3150, 27.4750]

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }
    setGpsLoading(true)
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      (err) => {
        console.error(err)
        setGpsError('Could not get location. Please ensure GPS is on.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button 
        type="button" 
        onClick={handleGetLocation}
        disabled={gpsLoading}
        className="btn-primary-pro" 
        style={{ 
          marginBottom: '1rem', 
          width: '100%', 
          justifyContent: 'center', 
          // FIXED: Uses theme variables instead of hardcoded white
          background: position ? 'var(--green)' : 'var(--bg-surface)', 
          color: position ? 'white' : 'var(--text-900)',
          border: position ? 'none' : '1px solid var(--border)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        {gpsLoading ? '📡 Getting GPS...' : position ? '✅ Location Captured' : '📍 Use My Current Location'}
      </button>

      {gpsError && <div style={{ color: '#F87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{gpsError}</div>}

      <div style={{ height: '250px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', background: 'var(--bg-base)' }}>
        <MapContainer center={center} zoom={position ? 15 : 13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
        
        {!position && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, pointerEvents: 'none' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-900)', background: 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: '50px', boxShadow: 'var(--shadow-sm)' }}>Click the button above to find your location</span>
          </div>
        )}
      </div>
    </div>
  )
}