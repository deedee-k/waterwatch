import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { INTAKE_CHANNELS, getSlaStatus } from '../lib/dispatch'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function hashOffset(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const offLat = (((hash & 0xffff) / 0xffff) - 0.5) * 0.02
  const offLng = ((((hash >>> 16) & 0xffff) / 0xffff) - 0.5) * 0.02
  return [offLat, offLng]
}

export default function MapView({ reports = [], categories = {} }) {
  // Exact coordinates for Maseru West
  const center = [-29.3150, 27.4750]

  return (
    <div style={{ height: '450px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', zIndex: 1, boxShadow: 'var(--shadow-sm)' }}>
      <MapContainer key="maseru-fixed-map" center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((r) => {
          const [offLat, offLng] = hashOffset(r.id || r.ref || '')
          const lat = r.lat || (center[0] + offLat)
          const lng = r.lng || (center[1] + offLng)
          const cat = categories[r.category_id] || {}
          const channelInfo = INTAKE_CHANNELS[r.source_channel] || INTAKE_CHANNELS.mobile_app
          const sla = getSlaStatus(r.sla_deadline)

          return (
            <Marker key={r.id} position={[lat, lng]}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '170px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>{r.ref}</strong>
                    <span style={{ fontSize: '10px', background: channelInfo.bg, color: channelInfo.color, padding: '2px 5px', borderRadius: '4px', fontWeight: 600 }}>
                      {channelInfo.icon} {channelInfo.label}
                    </span>
                  </div>
                  {r.work_order_ref && (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#7C3AED', borderRadius: '50%' }}></span>
                      WO: {r.work_order_ref}
                    </div>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{cat.name_en || 'Water Fault'}</span><br />
                  <span style={{ fontSize: '12px', color: '#666' }}>{r.location_text || 'Maseru West'}</span><br />

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                      fontSize: '10px', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', fontWeight: 700,
                      background: r.status === 'resolved' ? '#DCFCE7' : (r.status === 'in_progress' ? '#FFEDD5' : '#FEF3C7'),
                      color: r.status === 'resolved' ? '#166534' : (r.status === 'in_progress' ? '#9A3412' : '#92400E')
                    }}>
                      {r.status.replace('_', ' ').toUpperCase()}
                    </div>
                    {r.sla_deadline && r.status !== 'resolved' && (
                      <span style={{ fontSize: '10px', color: sla.color, fontWeight: 700 }}>
                        {sla.text}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
