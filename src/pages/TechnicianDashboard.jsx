import { useEffect, useState, useCallback } from 'react'
import { db, enqueue } from '../lib/db'
import { flushOutbox } from '../lib/sync'
import MapView from '../components/MapView'
import { INTAKE_CHANNELS, getSlaStatus } from '../lib/dispatch'
import CategoryStats from '../components/CategoryStats'
import {
  ZapIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon
} from '../components/Icons'

export default function TechnicianDashboard({ userId }) {
  const [jobs, setJobs] = useState([])
  const [cats, setCats] = useState({})
  const [open, setOpen] = useState(null)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    const rows = await db.reports.where('technician_id').equals(userId).reverse().sortBy('created_at')
    setJobs(rows)
    const c = await db.categories.toArray()
    setCats(Object.fromEntries(c.map(x => [x.id, x])))
  }, [userId])

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  async function updateStatus(report, newStatus) {
    const patch = { status: newStatus, updated_at: new Date().toISOString() }
    await db.reports.update(report.id, patch)

    await enqueue('report.status_change', {
      report_id: report.id,
      from_status: report.status,
      to_status: newStatus,
      changed_by: userId,
      note: note || (newStatus === 'in_progress' ? 'Technician started field repairs' : 'Technician completed repairs')
    })

    if (note) {
      await enqueue('repair.note', {
        report_id: report.id,
        technician_id: userId,
        note
      })
    }

    setNote('')
    setOpen(null)
    flushOutbox()
    load()
  }

  const active = jobs.filter(j => ['assigned', 'in_progress'].includes(j.status))
  const done = jobs.filter(j => ['resolved', 'closed'].includes(j.status))

  return (
    <div className="dash-main">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Technician Work Orders &amp; Field Tasks</h1>
          <p>Instant automated work orders dispatched across WASCO supply zones.</p>
        </div>
      </div>

      {/* Category Statistics */}
      <CategoryStats reports={jobs} categories={cats} />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="metric-card orange">
          <div className="metric-label">Active Work Orders</div>
          <div className="metric-value">{active.length}</div>
        </div>
        <div className="metric-card green">
          <div className="metric-label">Completed Repairs</div>
          <div className="metric-value">{done.length}</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-label">Avg Auto-Dispatch Speed</div>
          <div className="metric-value">&lt; 5s</div>
        </div>
      </div>

      {/* Active Work Orders */}
      <h3 style={{ marginTop: 0 }}>Active Assigned Work Orders ({active.length})</h3>
      {active.length === 0 && (
        <div className="card" style={{ background: 'white', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-600)', margin: 0 }}>No active work orders right now. You are ready for new dispatches!</p>
        </div>
      )}

      <div className="list-group" style={{ marginBottom: '2rem' }}>
        {active.map(j => {
          const channelInfo = INTAKE_CHANNELS[j.source_channel] || INTAKE_CHANNELS.mobile_app
          const sla = getSlaStatus(j.sla_deadline)

          return (
            <div key={j.id} className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: '1rem' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-900)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      {j.work_order_ref && <ZapIcon size={16} color="#7C3AED" />}
                      {j.work_order_ref || j.ref} — {cats[j.category_id]?.name_en || 'Water Fault'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', background: channelInfo.bg, color: channelInfo.color, padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {channelInfo.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: sla.bg, color: sla.color, padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ClockIcon size={12} color={sla.color} />
                      {sla.text}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-600)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPinIcon size={14} color="var(--text-600)" />
                    <span>{j.location_text || 'See map for location'} • Ref: {j.ref}</span>
                  </div>
                </div>
                <span className={`status-pill ${j.status}`}>{j.status.replace('_', ' ')}</span>
              </div>

              <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                &ldquo;{j.description}&rdquo;
              </p>

              {/* MINI MAP FOR TECHNICIAN NAVIGATION */}
              {j.lat && j.lng ? (
                <div style={{ marginBottom: '1rem' }}>
                  <MapView reports={[j]} categories={cats} />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${j.lat},${j.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                    Open in Google Maps for Navigation
                  </a>
                </div>
              ) : (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#FEF3C7', color: '#92400E', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  📍 Customer Location: <strong>{j.location_text || 'Maseru West'}</strong> (Coordinates not pinned on map)
                </div>
              )}

              {open === j.id ? (
                <div style={{ background: 'var(--bg-base)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Field Repair Notes &amp; Materials Used
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Replaced 50mm PVC junction valve, flushed sediment, restored 4.5 bar line pressure..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    {j.status === 'assigned' && (
                      <button className="btn-hero" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: '#D97706', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => updateStatus(j, 'in_progress')}>
                        <ZapIcon size={16} color="white" />
                        <span>Accept &amp; Start Work</span>
                      </button>
                    )}
                    <button className="btn-hero" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: '#16A34A', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => updateStatus(j, 'resolved')}>
                      <CheckCircleIcon size={16} color="white" />
                      <span>Complete &amp; Mark Resolved</span>
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }} onClick={() => { setOpen(null); setNote('') }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {j.status === 'assigned' && (
                    <button
                      className="btn-primary-pro"
                      style={{ flex: 1, justifyContent: 'center', background: '#D97706', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => updateStatus(j, 'in_progress')}
                    >
                      <ZapIcon size={16} color="white" />
                      <span>Start Work Order</span>
                    </button>
                  )}
                  <button
                    className="btn-primary-pro"
                    style={{ flex: 1, justifyContent: 'center', background: j.status === 'in_progress' ? '#16A34A' : 'var(--text-900)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => setOpen(j.id)}
                  >
                    {j.status === 'in_progress' ? (
                      <>
                        <CheckCircleIcon size={16} color="white" />
                        <span>Log Notes &amp; Complete</span>
                      </>
                    ) : (
                      <span>Manage Work Order</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completed Work Orders */}
      <h3>Completed Work Orders ({done.length})</h3>
      <div className="list-group">
        {done.map(j => (
          <div key={j.id} className="list-item" style={{ opacity: .85 }}>
            <div className="list-content">
              <strong>{j.work_order_ref ? `⚡ ${j.work_order_ref}` : j.ref}</strong> — {cats[j.category_id]?.name_en || 'Water Fault'}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-600)' }}>📍 {j.location_text} • Resolved on {new Date(j.updated_at || j.created_at).toLocaleDateString()}</div>
            </div>
            <span className={`status-pill ${j.status}`}>{j.status}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
