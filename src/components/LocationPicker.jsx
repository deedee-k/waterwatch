import { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useLanguage } from '../lib/i18n'
import { MapPinIcon, CheckCircleIcon } from './Icons'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
L.Marker.prototype.options.icon = DefaultIcon

export default function LocationPicker({ position, setPosition }) {
  const { lang, t } = useLanguage()
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')

  // Centered on Maseru West
  const center = position ? [position.lat, position.lng] : [-29.3150, 27.4750]

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError(lang === 'st' ? 'Sebaka sa GPS ha se sebetse sebatling sena sa hau.' : 'Geolocation is not supported by your browser.')
      return
    }

    setGpsLoading(true)
    setGpsError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })
        setGpsLoading(false)
      },
      (err) => {
        console.error(err)
        setGpsError(lang === 'st' ? 'Re hlotsoe ho fumana sebaka. Netefatsa hore GPS e buletsoe.' : 'Could not get location. Please ensure GPS is on and permissions are allowed.')
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
          background: position ? 'var(--green)' : 'var(--text-900)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        {gpsLoading ? (
          <span>{t('report_gps_getting')}</span>
        ) : position ? (
          <>
            <CheckCircleIcon size={16} color="white" />
            <span>{t('report_gps_captured')}</span>
          </>
        ) : (
          <>
            <MapPinIcon size={16} color="white" />
            <span>{t('report_gps_btn')}</span>
          </>
        )}
      </button>

      {gpsError && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{gpsError}</div>}

      <div style={{ height: '250px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
        <MapContainer center={center} zoom={position ? 15 : 13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>
    </div>
  )
}
