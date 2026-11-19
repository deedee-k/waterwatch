import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/i18n'
import { AlertTriangleIcon, BellIcon, MapPinIcon, CheckCircleIcon } from '../components/Icons'

export default function Notifications({ userId }) {
  const { lang, t } = useLanguage()
  const [alerts, setAlerts] = useState([])
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    // 1. Load WASCO Outage Alerts
    const { data: alertData } = await supabase
      .from('outage_alerts')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
    
    // 2. Load Personal Status Updates
    const { data: updateData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setAlerts(alertData || [])
    setUpdates(updateData || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [userId])

  async function markAsRead(id) {
    // Update the specific notification in Supabase
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    // Reload the list to reflect the change immediately
    loadData()
  }

  return (
    <div className="dash-main" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>{t('nav_notifications')}</h1>
          <p>{lang === 'st' ? 'Lula u tseba ka likhaolo tsa metsi le maemo a litlaleho tsa hau.' : 'Stay updated on water outages and your report statuses.'}</p>
        </div>
      </div>

      {loading && <p>Loading notifications...</p>}

      {/* OUTAGE ALERTS SECTION */}
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <AlertTriangleIcon size={18} color="#DC2626" />
        <span>{lang === 'st' ? 'Litsebiso tsa Bohlokoa tsa Khaolo ea Metsi' : 'Important Outage Alerts'}</span>
      </h3>
      {alerts.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: '2rem' }}>
          {lang === 'st' ? 'Ha ho likhaolo tsa metsi sebakeng sa heno hajoale.' : 'No active outage alerts in your area.'}
        </div>
      ) : (
        <div className="list-group" style={{ marginBottom: '2rem' }}>
          {alerts.map(a => (
            <div key={a.id} style={{ background: '#FEF2F2', borderLeft: '4px solid #DC2626', padding: '1.25rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPinIcon size={14} color="#991B1B" />
                  <span>{a.village}</span>
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600 }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <p style={{ margin: 0, color: '#7F1D1D', fontSize: '0.95rem' }}>{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* PERSONAL UPDATES SECTION */}
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <BellIcon size={18} color="var(--primary)" />
        <span>{lang === 'st' ? 'Liphetoho tsa Litlaleho tsa Hau' : 'Your Report Updates'}</span>
      </h3>
      {updates.length === 0 ? (
        <div className="empty-state">
          {lang === 'st' ? 'Ha u na litsebiso tse ncha mabapi le litlaleho tsa hau.' : 'You have no new status updates on your reports.'}
        </div>
      ) : (
        <div className="list-group">
          {updates.map(u => {
            const isUnread = !u.read; // Assuming 'read' column exists and defaults to false

            return (
              <div 
                key={u.id} 
                className="list-item" 
                style={{ 
                  alignItems: 'flex-start', 
                  // Highlight unread notifications with a subtle blue background and left border
                  background: isUnread ? '#F0F9FF' : 'white',
                  borderLeft: isUnread ? '4px solid var(--primary)' : '1px solid var(--border)'
                }}
              >
                <div className="list-icon" style={{ background: isUnread ? '#E0F2FE' : '#F1F5F9', color: isUnread ? '#0369A1' : '#64748B' }}>
                  {isUnread ? <BellIcon size={18} color="#0369A1" /> : <CheckCircleIcon size={18} color="#64748B" />}
                </div>
                <div className="list-content">
                  <div style={{ 
                    fontSize: '0.95rem', 
                    color: 'var(--text-900)', 
                    marginBottom: '0.25rem',
                    fontWeight: isUnread ? 600 : 400 // Bold text if unread
                  }}>
                    {lang === 'st' && u.message_st ? u.message_st : u.message_en}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-600)', marginTop: '0.25rem' }}>
                    {new Date(u.created_at).toLocaleString()}
                  </div>
                </div>
                
                {/* MARK AS READ BUTTON */}
                {isUnread && (
                  <button 
                    onClick={() => markAsRead(u.id)} 
                    className="btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    {lang === 'st' ? 'Tšoaea e baliloe' : 'Mark Read'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}