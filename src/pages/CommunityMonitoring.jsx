import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/db'
import MapView from '../components/MapView'
import { useLanguage } from '../lib/i18n'
import { MapPinIcon, AlertTriangleIcon, TapIcon } from '../components/Icons'

export default function CommunityMonitoring() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [waterPoints, setWaterPoints] = useState([])
  const [reports, setReports] = useState([])
  const [cats, setCats] = useState({})

  useEffect(() => {
    async function load() {
      const wps = await db.waterPoints.toArray()
      const reps = await db.reports.toArray()
      const c = await db.categories.toArray()
      
      setWaterPoints(wps)
      setReports(reps)
      setCats(Object.fromEntries(c.map(x => [x.id, x])))
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dash-main">
      <div className="page-header">
        <div>
          <h1>{t('nav_monitoring')}</h1>
          <p>{lang === 'st' ? 'Sheba maemo a lipompo tsa sechaba Maseru West le libakeng tse haufi.' : 'View the real-time status of water points in Maseru West.'}</p>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
        
        {/* MAP OF WATER POINTS */}
        <div className="card" style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TapIcon size={18} color="var(--primary)" />
            <span>{lang === 'st' ? 'Mmepa oa Metsi a Sechaba' : 'Community Water Map'}</span>
          </h3>
          <MapView 
            reports={waterPoints.map(w => ({
              id: w.id,
              ref: w.name,
              location_text: w.village,
              status: w.status === 'operational' ? 'resolved' : (w.status === 'maintenance' ? 'in_progress' : 'submitted'),
              lat: w.lat,
              lng: w.lng,
              category_id: 'water_point' 
            }))} 
            categories={{ 'water_point': { name_en: 'Water Point' }, ...cats }} 
          />
        </div>

        {/* LIST OF WATER POINTS */}
        <div>
          <h3 style={{ marginTop: 0 }}>
            {lang === 'st' ? 'Maemo a Lintlha tsa Metsi' : 'Water Point Statuses'}
          </h3>
          <div className="list-group">
            {waterPoints.map(wp => {
              const activeReports = reports.filter(r => r.water_point_id === wp.id && ['submitted', 'assigned', 'in_progress'].includes(r.status))
              
              return (
                <div key={wp.id} className="card" style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{wp.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-600)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPinIcon size={14} color="var(--text-600)" />
                        {wp.village}
                      </span>
                      <span className={`status-pill ${wp.status === 'operational' ? 'resolved' : wp.status === 'broken' ? 'reopened' : 'assigned'}`}>
                        {wp.status.toUpperCase()}
                      </span>
                    </div>
                    {activeReports.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertTriangleIcon size={14} color="#DC2626" />
                        <span>{activeReports.length} {lang === 'st' ? 'litlaleho tse ntseng li sebetsanoa mona' : 'active fault(s) reported here'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <button 
                      className="btn-secondary" 
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      onClick={() => navigate('/report', { state: { waterPointId: wp.id } })}
                    >
                      {lang === 'st' ? 'Tlaleha Bothata Mona' : 'Report Issue Here'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}