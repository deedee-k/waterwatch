import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import { supabase } from '../lib/supabase'
import MapView from '../components/MapView'
import { useLanguage } from '../lib/i18n'
import { 
  WaterDropIcon, 
  TapIcon, 
  ZapIcon, 
  AlertTriangleIcon, 
  MapPinIcon, 
  CheckCircleIcon, 
  PlusCircleIcon, 
  ArrowRightIcon, 
  InfoIcon, 
  GlobeIcon 
} from '../components/Icons'

export default function CommunityDashboard({ userId, onOpenLang }) {
  const { lang, setLang, t } = useLanguage()
  const [reports, setReports] = useState([])
  const [categories, setCategories] = useState({})
  const [activeAlerts, setActiveAlerts] = useState([])

  const loadData = useCallback(async () => {
    // Load user reports from local Dexie
    const rows = await db.reports.where('reporter_id').equals(userId).reverse().sortBy('created_at')
    setReports(rows || [])
    const cats = await db.categories.toArray()
    setCategories(Object.fromEntries(cats.map(c => [c.id, c])))
    
    // Fetch active outage alerts from Supabase
    try {
      const { data } = await supabase.from('outage_alerts').select('*').eq('active', true).order('created_at', { ascending: false })
      if (data) setActiveAlerts(data)
    } catch {
      // Offline fallback
    }
  }, [userId])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  const stats = {
    total: reports.length,
    pending: reports.filter(r => ['submitted', 'acknowledged'].includes(r.status)).length,
    inProgress: reports.filter(r => ['assigned', 'in_progress'].includes(r.status)).length,
    resolved: reports.filter(r => ['resolved', 'closed'].includes(r.status)).length
  }

  return (
    <div className="dash-grid">
      <div className="dash-main">
        
        {/* TOP BILINGUAL TOGGLE PANEL STRIP */}
        <div style={{ 
          background: 'white', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '0.75rem 1.25rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GlobeIcon size={18} color="var(--primary)" />
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-900)' }}>
                {lang === 'st' ? 'Puo: Sesotho sa Lesotho' : 'Language: English (UK)'}
              </strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-600)' }}>
                {lang === 'st' ? 'Setsi sa Sechaba sa Metsi' : 'Community Water Reporting Portal'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-base)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button 
              type="button"
              onClick={() => setLang('en')}
              style={{
                background: lang === 'en' ? 'white' : 'transparent',
                border: lang === 'en' ? '1px solid var(--border)' : 'none',
                color: lang === 'en' ? 'var(--primary)' : 'var(--text-600)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: lang === 'en' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: lang === 'en' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <span>🇬🇧</span> English Side
            </button>
            <button 
              type="button"
              onClick={() => setLang('st')}
              style={{
                background: lang === 'st' ? 'white' : 'transparent',
                border: lang === 'st' ? '1px solid var(--border)' : 'none',
                color: lang === 'st' ? 'var(--green)' : 'var(--text-600)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: lang === 'st' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: lang === 'st' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <span>🇱🇸</span> Sesotho Side
            </button>
            {onOpenLang && (
              <button
                type="button"
                onClick={onOpenLang}
                title="Open Bilingual Selection Panel"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-600)',
                  padding: '0.35rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                ⚙️
              </button>
            )}
          </div>
        </div>

        {/* OUTAGE ALERTS BANNER (IF ACTIVE) */}
        {activeAlerts.length > 0 && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeAlerts.map(alert => (
              <div 
                key={alert.id} 
                style={{ 
                  background: '#FEF2F2', 
                  borderLeft: '4px solid #DC2626', 
                  border: '1px solid #FECACA',
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-lg)', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '1rem', 
                  boxShadow: 'var(--shadow-sm)' 
                }}
              >
                <div style={{ background: '#FEE2E2', padding: '0.5rem', borderRadius: '50%', color: '#DC2626' }}>
                  <AlertTriangleIcon size={24} color="#DC2626" />
                </div>
                <div>
                  <strong style={{ color: '#991B1B', display: 'block', marginBottom: '0.25rem', fontSize: '1rem' }}>
                    {t('alert_outage_title')}: {alert.village}
                  </strong>
                  <span style={{ color: '#7F1D1D', fontSize: '0.92rem', lineHeight: 1.5 }}>
                    {alert.message}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '0.4rem' }}>
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LIVE NETWORK SUPPLY STATUS CARD */}
        <div style={{ 
          background: 'white', 
          border: '1px solid #BBF7D0', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.25rem 1.5rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', background: '#DCFCE7', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
              <CheckCircleIcon size={24} color="#166534" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                  ● LIVE
                </span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-900)' }}>
                  {t('supply_status_title')}
                </strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-600)', marginTop: '0.2rem' }}>
                {t('supply_status_desc')}
              </div>
            </div>
          </div>

          <div style={{ background: '#F0FDF4', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid #86EFAC', textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700 }}>
              {t('supply_status_ok')}
            </span>
          </div>
        </div>

        {/* HERO CALL TO ACTION BANNER */}
        <div className="hero-banner" style={{ background: 'linear-gradient(135deg, #00AEEF 0%, #00A651 100%)' }}>
          <div className="hero-text">
            <h2>{t('hero_title')}</h2>
            <p>{t('hero_desc')}</p>
          </div>
          <Link to="/report" className="btn-hero" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <PlusCircleIcon size={20} color="var(--primary)" />
            <span>{t('btn_report_now')}</span>
            <ArrowRightIcon size={16} color="var(--primary)" />
          </Link>
        </div>

        {/* FAULTS MAP VIEW */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPinIcon size={18} color="var(--primary)" />
              <span>{t('faults_near_you')}</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-600)' }}>
              Maseru West & Surrounding Districts
            </span>
          </div>
          <MapView reports={reports} categories={categories} />
        </div>

        {/* RECENT ACTIVITY & WORK ORDERS */}
        <div className="section-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ZapIcon size={18} color="#7C3AED" />
            <span>{t('recent_activity')}</span>
          </h3>
          <Link to="/my-reports" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            {t('view_all')} &rarr;
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="card" style={{ background: 'white', padding: '2.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', background: '#F0F9FF', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 1rem auto' }}>
              <WaterDropIcon size={24} color="var(--primary)" />
            </div>
            <p style={{ color: 'var(--text-600)', margin: '0 0 1rem 0' }}>{t('no_reports_yet')}</p>
            <Link to="/report" className="btn-primary-pro" style={{ display: 'inline-flex', margin: '0 auto' }}>
              <PlusCircleIcon size={16} color="white" />
              <span>{t('btn_report_now')}</span>
            </Link>
          </div>
        ) : (
          <div className="list-group" style={{ marginBottom: '1.5rem' }}>
            {reports.slice(0, 4).map(r => {
              const cat = categories[r.category_id]
              return (
                <div key={r.id} className="list-item" style={{ alignItems: 'center' }}>
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
                      </div>
                      <span className={`status-pill ${r.status}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="list-meta">
                      <strong>{r.ref}</strong>
                      <span>•</span>
                      <span>📍 {r.location_text || 'Maseru West'}</span>
                      <span>•</span>
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* WATER CONSERVATION & HEALTH TIP */}
        <div style={{ background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ color: '#16A34A', marginTop: '2px' }}>
            <InfoIcon size={22} color="#16A34A" />
          </div>
          <div>
            <strong style={{ color: '#15803D', fontSize: '0.9rem', display: 'block', marginBottom: '0.25rem' }}>
              💡 {t('tip_title')}
            </strong>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#14532D', lineHeight: 1.5 }}>
              {t('tip_text')}
            </p>
          </div>
        </div>
      </div>

      {/* SIDEBAR METRICS */}
      <div className="dash-side">
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>{t('metric_total')}</h3>
        <div className="metric-card blue">
          <div className="metric-label">{t('metric_total')}</div>
          <div className="metric-value">{stats.total}</div>
        </div>
        <div className="metric-card orange">
          <div className="metric-label">{t('metric_pending')}</div>
          <div className="metric-value">{stats.pending}</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-label">{t('metric_in_progress')}</div>
          <div className="metric-value">{stats.inProgress}</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">{t('metric_resolved')}</div>
          <div className="metric-value">{stats.resolved}</div>
        </div>

        {/* QUICK LINK TO MONITORING */}
        <div className="card" style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TapIcon size={18} color="var(--primary)" />
            <strong style={{ fontSize: '0.9rem' }}>{t('nav_monitoring')}</strong>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-600)', margin: '0 0 1rem 0' }}>
            Check real-time health and status of public taps and boreholes across Maseru.
          </p>
          <Link to="/monitoring" className="btn-secondary" style={{ display: 'block', textAlign: 'center', fontSize: '0.85rem' }}>
            View Water Points
          </Link>
        </div>
      </div>
    </div>
  )
}
