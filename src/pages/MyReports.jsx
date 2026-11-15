import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { INTAKE_CHANNELS, getSlaStatus } from '../lib/dispatch'
import { useLanguage } from '../lib/i18n'
import { 
  WaterDropIcon, 
  ZapIcon, 
  MapPinIcon, 
  ClockIcon 
} from '../components/Icons'

export default function MyReports({ userId }) {
  const { lang, t } = useLanguage()
  const [rows, setRows] = useState([])
  const [cats, setCats] = useState({})

  useEffect(() => {
    async function load() {
      const r = await db.reports.where('reporter_id').equals(userId).reverse().sortBy('created_at')
      setRows(r || [])
      const c = await db.categories.toArray()
      setCats(Object.fromEntries(c.map(x => [x.id, x])))
    }
    load()
    const tInterval = setInterval(load, 4000)
    return () => clearInterval(tInterval)
  }, [userId])

  return (
    <div className="dash-main">
      <div className="page-header">
        <div>
          <h1>{t('nav_my_reports')}</h1>
          <p>{lang === 'st' ? 'Lethathamo la mathata a metsi ao u a tlalehileng le ditaelo tsa tokiso.' : 'Track your submitted water faults and automated repair work orders.'}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-600)', margin: 0 }}>
            {lang === 'st' ? 'Ha u e-s\'o kenye litlaleho tsa mathata a metsi.' : "You haven't submitted any reports yet."}
          </p>
        </div>
      ) : (
        <div className="list-group">
          {rows.map(r => {
            const cat = cats[r.category_id]
            const channelInfo = INTAKE_CHANNELS[r.source_channel] || INTAKE_CHANNELS.mobile_app
            const sla = getSlaStatus(r.sla_deadline)

            return (
              <div key={r.id} className="list-item" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'flex-start' }}>
                  <div className="list-icon" style={{ background: '#F0F9FF', color: 'var(--primary)' }}>
                    <WaterDropIcon size={20} color="var(--primary)" />
                  </div>
                  
                  <div className="list-content">
                    <div className="list-title">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>{lang === 'st' && cat?.name_st ? cat.name_st : (cat?.name_en || 'Water Fault')}</span>
                        {r.work_order_ref && (
                          <span style={{ fontSize: '0.75rem', background: '#F3E8FF', color: '#7C3AED', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <ZapIcon size={12} color="#7C3AED" />
                            {r.work_order_ref}
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', background: channelInfo.bg, color: channelInfo.color, padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          {channelInfo.label}
                        </span>
                      </div>
                      <span className={`status-pill ${r.status}`}>{r.status.replace('_', ' ')}</span>
                    </div>

                    <div style={{ fontSize: '0.9rem', margin: '0.4rem 0', color: 'var(--text-900)' }}>{r.description}</div>
                    
                    <div className="list-meta" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                      <strong>{r.ref}</strong>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MapPinIcon size={13} color="var(--text-600)" />
                        {r.location_text || 'Maseru West'}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ClockIcon size={13} color="var(--text-600)" />
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                      {r.sla_deadline && r.status !== 'resolved' && (
                        <>
                          <span>•</span>
                          <span style={{ color: sla.color, fontWeight: 600 }}>SLA: {sla.text}</span>
                        </>
                      )}
                    </div>

                    {/* STATUS TIMELINE BAR */}
                    <div style={{ marginTop: '0.75rem', background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-600)', flexWrap: 'wrap' }}>
                      <span style={{ color: '#00A651', fontWeight: 600 }}>{lang === 'st' ? 'E Kentswe' : 'Reported'}</span>
                      <span>➔</span>
                      <span style={{ color: r.status !== 'submitted' ? '#00A651' : 'var(--text-400)', fontWeight: 600 }}>{lang === 'st' ? 'Taelo e Lokollotsoe' : 'Work Order Issued'}</span>
                      <span>➔</span>
                      <span style={{ color: ['in_progress', 'resolved', 'closed'].includes(r.status) ? '#00A651' : 'var(--text-400)', fontWeight: 600 }}>{lang === 'st' ? 'E Ntse e Lokisoa' : 'Field Repair'}</span>
                      <span>➔</span>
                      <span style={{ color: ['resolved', 'closed'].includes(r.status) ? '#00A651' : 'var(--text-400)', fontWeight: 600 }}>{lang === 'st' ? 'E Lokisitsoe' : 'Resolved'}</span>
                    </div>

                    {r.photo_url && (
                      <img src={r.photo_url} alt="" style={{ maxWidth: '120px', marginTop: '0.75rem', borderRadius: 'var(--radius-md)' }} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
