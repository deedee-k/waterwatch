import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import { INTAKE_CHANNELS, getSlaStatus } from '../lib/dispatch'
import { useLanguage } from '../lib/i18n'
import { 
  WaterDropIcon, 
  ZapIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon
} from '../components/Icons'

export default function MyReports({ userId }) {
  const { lang, t } = useLanguage()
  const [rows, setRows] = useState([])
  const [cats, setCats] = useState({})

  // Modal states
  const [ratingModal, setRatingModal] = useState(null)
  const [escalationModal, setEscalationModal] = useState(null)
  
  // Form states
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [escalationReason, setEscalationReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  async function load() {
    const r = await db.reports.where('reporter_id').equals(userId).reverse().sortBy('created_at')
    setRows(r || [])
    const c = await db.categories.toArray()
    setCats(Object.fromEntries(c.map(x => [x.id, x])))
  }

  useEffect(() => {
    load()
    const tInterval = setInterval(load, 4000)
    return () => clearInterval(tInterval)
  }, [userId])

  async function submitRating(e) {
    e.preventDefault()
    setActionLoading(true)
    
    // 1. Update Supabase
    await supabase.from('reports').update({
      satisfaction_rating: rating,
      satisfaction_feedback: feedback
    }).eq('id', ratingModal.id)

    // 2. Update local Dexie cache
    await db.reports.update(ratingModal.id, { satisfaction_rating: rating, satisfaction_feedback: feedback })
    
    setActionLoading(false)
    setRatingModal(null)
    setRating(5)
    setFeedback('')
    load()
  }

  async function submitEscalation(e) {
    e.preventDefault()
    setActionLoading(true)

    // 1. Insert into Supabase escalations table
    await supabase.from('escalations').insert({
      report_id: escalationModal.id,
      reporter_id: userId,
      reason: escalationReason
    })
    
    setActionLoading(false)
    setEscalationModal(null)
    setEscalationReason('')
    alert(lang === 'st' ? "✅ Tlaleho ea hau e rometsoe ho mookamedi." : "✅ Your escalation has been sent to WASCO supervisors. They will review it shortly.")
  }

  // Check if a report is "overdue" (e.g., more than 3 days old and not resolved)
  function isOverdue(report) {
    if (['resolved', 'closed'].includes(report.status)) return false
    const daysOld = (new Date() - new Date(report.created_at)) / (1000 * 60 * 60 * 24)
    return daysOld > 3
  }

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
            const isResolved = ['resolved', 'closed'].includes(r.status)
            const overdue = isOverdue(r)

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
                      {overdue && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#DC2626', fontWeight: 700 }}>Overdue</span>
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

                    {/* RATING & ESCALATION ACTIONS */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {isResolved && !r.satisfaction_rating && (
                        <button className="btn-hero" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#F59E0B' }} onClick={() => setRatingModal(r)}>
                          ⭐ Rate Repair
                        </button>
                      )}
                      {isResolved && r.satisfaction_rating && (
                        <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#DCFCE7', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)' }}>
                          <CheckCircleIcon size={16} color="#166534" /> You rated this {r.satisfaction_rating}/5 stars
                        </div>
                      )}
                      {!isResolved && (
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#DC2626', color: '#DC2626' }} onClick={() => setEscalationModal(r)}>
                          ⚠️ Escalate Delay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* RATING MODAL */}
      {ratingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{lang === 'st' ? 'Lekanya Tokiso' : 'Rate Your Repair'}</h3>
              <button className="close-btn" onClick={() => setRatingModal(null)}>&times;</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-600)', marginBottom: '1.5rem' }}>
              {lang === 'st' ? 'U khotsofetse joang ka ts\'ebetso ea WASCO?' : 'How satisfied are you with how WASCO handled your report?'}
            </p>
            <form onSubmit={submitRating}>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2.5rem', color: star <= rating ? '#F59E0B' : '#E5E7EB', transition: 'color 0.2s' }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label>{lang === 'st' ? 'Maikutlo a eketsehileng (Ha e hlokehe)' : 'Any additional comments? (Optional)'}</label>
                <textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder={lang === 'st' ? 'Mohlophisi o ne a le kapele...' : 'e.g. The technician was very fast and friendly.'} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-hero" style={{ background: 'var(--primary)' }} disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : (lang === 'st' ? 'Romela Maikutlo' : 'Submit Feedback')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESCALATION MODAL */}
      {escalationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{lang === 'st' ? 'Romela ho Mookamedi' : 'Escalate to Supervisor'}</h3>
              <button className="close-btn" onClick={() => setEscalationModal(null)}>&times;</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-600)', marginBottom: '1.5rem' }}>
              {lang === 'st' ? 'Haeba tlaleho ea hau e na le nako e telele e sa sebetsoa, u ka e romela ho mookamedi.' : 'If your report has been open for a long time, you can escalate it directly to a WASCO supervisor.'}
            </p>
            <form onSubmit={submitEscalation}>
              <div className="form-group">
                <label>{lang === 'st' ? 'Lebaka la ho Romela (Hlokehang) *' : 'Reason for escalation *'}</label>
                <textarea 
                  rows={4} 
                  value={escalationReason} 
                  onChange={e => setEscalationReason(e.target.value)} 
                  placeholder={lang === 'st' ? 'Metsi a dutla matsatsi a mane...' : 'e.g. The water has been leaking for 4 days and no one has arrived.'}
                  required 
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-hero" style={{ background: '#DC2626' }} disabled={actionLoading}>
                  {actionLoading ? 'Sending...' : (lang === 'st' ? '⚠️ Romela ho Mookamedi' : '⚠️ Escalate to Supervisor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}