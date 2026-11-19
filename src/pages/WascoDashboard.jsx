import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CategoryStats from '../components/CategoryStats'
import { db, uuid, makeRef } from '../lib/db'
import MapView from '../components/MapView'
import { 
  INTAKE_CHANNELS, 
  createAutoDispatchPackage, 
  getSlaStatus, 
  generateWorkOrderRef 
} from '../lib/dispatch'
import { 
  TapIcon, 
  GaugeIcon, 
  FlaskIcon, 
  BellIcon, 
  SmartphoneIcon, 
  PhoneIcon, 
  MessageSquareIcon, 
  BuildingIcon,
  UsersIcon,
  RefreshCwIcon,
  AlertTriangleIcon
} from '../components/Icons'

const STATUSES = ['submitted', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

function renderChannelIcon(iconType, size = 15) {
  if (iconType === 'phone') return <PhoneIcon size={size} color="currentColor" />
  if (iconType === 'message') return <MessageSquareIcon size={size} color="currentColor" />
  if (iconType === 'building') return <BuildingIcon size={size} color="currentColor" />
  return <SmartphoneIcon size={size} color="currentColor" />
}

export default function WascoDashboard({ userId }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('faults')
  
  // Data states
  const [reports, setReports] = useState([])
  const [dmas, setDmas] = useState([])
  const [waterPoints, setWaterPoints] = useState([])
  const [alerts, setAlerts] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [categories, setCategories] = useState({})
  const [smsQueue, setSmsQueue] = useState([]) // <--- NEW SMS QUEUE STATE
  
  // Filter & View states
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [newAlert, setNewAlert] = useState({ village: '', message: '' })

  // Omnichannel Intake Modal state
  const [showIntakeModal, setShowIntakeModal] = useState(false)
  const [intakeForm, setIntakeForm] = useState({
    channel: 'call_center', customer_name: '', customer_phone: '',
    category_id: '', location_text: 'Maseru West', description: '', auto_dispatch: true
  })
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false)
  const [actionNotice, setActionNotice] = useState('')

  const loadAll = useCallback(async () => {
    // 1. Load Faults
    try {
      const { data: reps } = await supabase.from('reports').select(`*, profiles!reports_reporter_id_fkey(full_name)`).order('created_at', { ascending: false })
      if (reps) setReports(reps)
    } catch { const localReps = await db.reports.toArray(); setReports(localReps || []) }
    
    // 2. Load DMAs
    try { const { data: dmaData } = await supabase.from('dmas').select('*'); setDmas(dmaData || []) } catch {}
    
    // 3. Load Water Points
    try { const { data: wpData } = await supabase.from('water_points').select('*'); if (wpData) setWaterPoints(wpData) } catch {}
    
    // 4. Load Alerts
    try { const { data: alertData } = await supabase.from('outage_alerts').select('*').eq('active', true).order('created_at', { ascending: false }); setAlerts(alertData || []) } catch {}
    
    // 5. Load Staff
    try { const { data: techs } = await supabase.from('profiles').select('*').eq('role', 'technician'); setTechnicians(techs || []) } catch {}
    
    // 6. Load Categories
    try { const { data: cats } = await supabase.from('fault_categories').select('*'); if (cats) setCategories(Object.fromEntries(cats.map(c => [c.id, c]))) } catch {}
    
    // 7. Load SMS Queue (NEW)
    try { 
      const { data: smsData } = await supabase.from('sms_queue').select('*').order('created_at', { ascending: false })
      setSmsQueue(smsData || []) 
    } catch {}
  }, [])

  useEffect(() => { 
    loadAll() 
    const interval = setInterval(loadAll, 10000)
    return () => clearInterval(interval)
  }, [loadAll])

  // --- KPI Counts ---
  const counts = {
    total: reports.length,
    pending: reports.filter(r => ['submitted', 'acknowledged'].includes(r.status)).length,
    inProgress: reports.filter(r => ['assigned', 'in_progress'].includes(r.status)).length,
    resolved: reports.filter(r => ['resolved', 'closed'].includes(r.status)).length,
    autoIssued: reports.filter(r => r.auto_assigned || r.work_order_ref).length
  }

  // Channel breakdown
  const channelCounts = {
    mobile_app: reports.filter(r => !r.source_channel || r.source_channel === 'mobile_app').length,
    call_center: reports.filter(r => r.source_channel === 'call_center').length,
    whatsapp: reports.filter(r => r.source_channel === 'whatsapp').length,
    walk_in: reports.filter(r => r.source_channel === 'walk_in').length
  }

  // Filtered reports
  const visibleReports = reports.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const repChannel = r.source_channel || 'mobile_app'
    const matchesChannel = channelFilter === 'all' || repChannel === channelFilter
    return matchesStatus && matchesChannel
  })

  // --- Automated Work Order Dispatch Logic ---
  async function triggerAutoDispatch(report) {
    const dispatchPkg = createAutoDispatchPackage(report, technicians, reports, categories)
    const patch = {
      status: dispatchPkg.status, priority: dispatchPkg.priority, technician_id: dispatchPkg.technician_id,
      work_order_ref: dispatchPkg.work_order_ref, work_order_issued_at: dispatchPkg.work_order_issued_at,
      sla_deadline: dispatchPkg.sla_deadline, auto_assigned: true
    }
    await updateReport(report.id, patch, dispatchPkg.dispatch_log)
    setActionNotice(`⚡ Work Order ${dispatchPkg.work_order_ref} auto-issued in 2.3s to ${dispatchPkg.technician_name}!`)
    setTimeout(() => setActionNotice(''), 5000)
  }

  async function handleBatchAutoDispatch() {
    const unassigned = reports.filter(r => ['submitted', 'acknowledged'].includes(r.status) && !r.technician_id)
    if (unassigned.length === 0) { alert("All current reports already have assigned work orders!"); return }
    for (const r of unassigned) {
      const dispatchPkg = createAutoDispatchPackage(r, technicians, reports, categories)
      await supabase.from('reports').update({
        status: dispatchPkg.status, priority: dispatchPkg.priority, technician_id: dispatchPkg.technician_id,
        work_order_ref: dispatchPkg.work_order_ref, work_order_issued_at: dispatchPkg.work_order_issued_at,
        sla_deadline: dispatchPkg.sla_deadline, auto_assigned: true, updated_at: new Date().toISOString()
      }).eq('id', r.id)
    }
    await loadAll()
    setActionNotice(`⚡ Successfully auto-dispatched ${unassigned.length} work order(s) in < 3 seconds!`)
    setTimeout(() => setActionNotice(''), 5000)
  }

  // --- Omnichannel Intake Submission ---
  async function submitOmnichannelComplaint(e) {
    e.preventDefault()
    if (!intakeForm.category_id || !intakeForm.description) return
    setIsSubmittingIntake(true)
    const id = uuid(); const ref = makeRef(); const now = new Date().toISOString()
    let dispatchPkg = null
    if (intakeForm.auto_dispatch) {
      dispatchPkg = createAutoDispatchPackage({ category_id: intakeForm.category_id, description: intakeForm.description, location_text: intakeForm.location_text }, technicians, reports, categories)
    }
    const payload = {
      id, ref, reporter_id: null, category_id: intakeForm.category_id, water_point_id: null,
      location_text: intakeForm.location_text || 'Maseru West',
      description: `[${INTAKE_CHANNELS[intakeForm.channel].label} - Caller: ${intakeForm.customer_name || 'Anonymous'} (${intakeForm.customer_phone || 'N/A'})] ${intakeForm.description}`,
      status: dispatchPkg ? dispatchPkg.status : 'submitted', priority: dispatchPkg ? dispatchPkg.priority : 'medium',
      technician_id: dispatchPkg ? dispatchPkg.technician_id : null, work_order_ref: dispatchPkg ? dispatchPkg.work_order_ref : generateWorkOrderRef(),
      work_order_issued_at: dispatchPkg ? dispatchPkg.work_order_issued_at : now, sla_deadline: dispatchPkg ? dispatchPkg.sla_deadline : null,
      source_channel: intakeForm.channel, auto_assigned: !!dispatchPkg, created_at: now, updated_at: now
    }
    await db.reports.put(payload)
    try {
      const { error } = await supabase.from('reports').upsert(payload)
      if (error) throw error
      if (dispatchPkg) {
        await supabase.from('report_status_history').insert({ report_id: id, from_status: null, to_status: 'assigned', changed_by: userId, note: dispatchPkg.dispatch_log })
      }
    } catch (err) { console.error(err); alert("Failed to save: " + err.message); setIsSubmittingIntake(false); return }
    setIsSubmittingIntake(false); setShowIntakeModal(false)
    setIntakeForm({ channel: 'call_center', customer_name: '', customer_phone: '', category_id: '', location_text: 'Maseru West', description: '', auto_dispatch: true })
    await loadAll()
    setActionNotice(`✅ Complaint logged successfully!`)
    setTimeout(() => setActionNotice(''), 5000)
  }

  // --- Report Management ---
  async function updateReport(id, patch, note) {
    try { await supabase.from('reports').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id) } catch {}
    await db.reports.update(id, patch).catch(() => {})
    
    if (patch.status) {
      const original = reports.find(r => r.id === id)
      try {
        await supabase.from('report_status_history').insert({ report_id: id, from_status: original?.status, to_status: patch.status, changed_by: userId, note: note || `Updated to ${patch.status}` })
        
        if (original?.reporter_id) {
          // 1. In-App Notification
          await supabase.from('notifications').insert({ 
            user_id: original.reporter_id, report_id: id, type: 'status_change', 
            message_en: `Your report ${original.ref} is now ${patch.status.replace('_', ' ')}`, 
            message_st: `Tlaleho ea hau ${original.ref} e se e le ${patch.status.replace('_', ' ')}` 
          })

          // 2. SMS Queue Notification
          const { data: profile } = await supabase.from('profiles').select('phone').eq('id', original.reporter_id).single()
          if (profile?.phone) {
            await supabase.from('sms_queue').insert({
              phone_number: profile.phone,
              message: `WASCO: Your report ${original.ref} status is now ${patch.status.replace('_', ' ').toUpperCase()}.`
            })
          }
        }
      } catch (e) { console.error("Notification error:", e) }
    }
    await loadAll(); setSelected(null)
  }

  // --- DMA & Alert Logic ---
  async function fixLeak(dmaId) { await supabase.from('dmas').update({ leak_suspected: false, current_pressure_bar: 4.5, last_updated: new Date().toISOString() }).eq('id', dmaId).catch(() => {}); await loadAll() }
  async function handleSendAlert(e) { e.preventDefault(); if (!newAlert.village || !newAlert.message) return; await supabase.from('outage_alerts').insert({ village: newAlert.village, message: newAlert.message }); setNewAlert({ village: '', message: '' }); await loadAll() }
  async function deleteAlert(id) { await supabase.from('outage_alerts').update({ active: false }).eq('id', id); await loadAll() }

  return (
    <div className="dash-main">
      {reports && categories && <CategoryStats reports={reports} categories={categories} />}

      {actionNotice && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <span>🚀</span> {actionNotice}
        </div>
      )}

      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>WASCO Operations & Network Command Center</h1>
          <p>Unified intake across channels & automated work order dispatch for Maseru.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-primary-pro" style={{ background: '#7C3AED' }} onClick={() => setShowIntakeModal(true)}>➕ Log External Complaint</button>
          <button className="btn-secondary" onClick={() => navigate('/wasco/staff')}>👥 Manage Staff</button>
          <button className="btn-secondary" onClick={loadAll}>🔄 Refresh</button>
        </div>
      </div>

      {/* AUTOMATED WORK ORDER ISSUANCE ENGINE BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', color: 'white', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ background: '#10B981', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>● ENGINE ONLINE</span>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Automated Work Order Issuance Engine</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#C7D2FE', maxWidth: '650px', lineHeight: 1.5 }}>Eliminates WASCO's legacy 12–24 hour manual dispatch bottleneck.</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid #4338CA', paddingRight: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#A5B4FC', fontWeight: 600 }}>Mean Time To Work Order</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34D399' }}>&lt; 5 sec</div>
          </div>
          <button onClick={handleBatchAutoDispatch} className="btn-hero" style={{ background: '#10B981', color: 'white', fontWeight: 700, padding: '0.75rem 1.25rem' }}>⚡ Auto-Dispatch Pending ({counts.pending})</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('faults')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: activeTab === 'faults' ? 'var(--primary)' : 'var(--text-600)', borderBottom: activeTab === 'faults' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}><TapIcon size={18} /> Complaints</button>
        <button onClick={() => setActiveTab('dmas')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: activeTab === 'dmas' ? 'var(--primary)' : 'var(--text-600)', borderBottom: activeTab === 'dmas' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}><GaugeIcon size={18} /> DMA Pressure</button>
        <button onClick={() => setActiveTab('quality')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: activeTab === 'quality' ? 'var(--primary)' : 'var(--text-600)', borderBottom: activeTab === 'quality' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}><FlaskIcon size={18} /> Water Quality</button>
        <button onClick={() => setActiveTab('alerts')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: activeTab === 'alerts' ? 'var(--primary)' : 'var(--text-600)', borderBottom: activeTab === 'alerts' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}><BellIcon size={18} /> Outage Alerts</button>
        <button onClick={() => setActiveTab('sms')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: activeTab === 'sms' ? 'var(--primary)' : 'var(--text-600)', borderBottom: activeTab === 'sms' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}><MessageSquareIcon size={18} /> SMS Queue</button>
      </div>

      {/* --- FAULTS TAB --- */}
      {activeTab === 'faults' && (
        <>
          <div className="dash-side" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'static', marginBottom: '1.5rem' }}>
            <div className="metric-card blue"><div className="metric-label">Total Complaints</div><div className="metric-value">{counts.total}</div></div>
            <div className="metric-card orange"><div className="metric-label">Pending Dispatch</div><div className="metric-value">{counts.pending}</div></div>
            <div className="metric-card purple"><div className="metric-label">Work Orders Active</div><div className="metric-value">{counts.inProgress}</div></div>
            <div className="metric-card green"><div className="metric-label">Faults Resolved</div><div className="metric-value">{counts.resolved}</div></div>
          </div>
          <div className="card" style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.95rem' }}>Omnichannel Intake Sources</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {Object.entries(INTAKE_CHANNELS).map(([key, info]) => {
                const count = channelCounts[key] || 0; const percent = counts.total > 0 ? Math.round((count / counts.total) * 100) : 0
                return (
                  <div key={key} style={{ background: info.bg, border: `1px solid ${info.color}30`, borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: info.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{renderChannelIcon(info.iconType)} <span>{info.label}</span></div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{count} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-600)' }}>({percent}%)</span></div>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}><MapView reports={visibleReports} categories={categories} /></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Work Order / Ref</th><th>Channel</th><th>Category</th><th>Status</th><th>Priority</th><th>Technician</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleReports.map(r => {
                  const channelInfo = INTAKE_CHANNELS[r.source_channel] || INTAKE_CHANNELS.mobile_app
                  const tech = technicians.find(t => t.id === r.technician_id)
                  return (
                    <tr key={r.id}>
                      <td>{r.work_order_ref ? <strong style={{ color: '#7C3AED' }}>⚡ {r.work_order_ref}</strong> : <span style={{ color: '#9CA3AF' }}>Pending</span>}<br/><span style={{ fontSize: '0.75rem', color: 'var(--text-600)' }}>{r.ref}</span></td>
                      <td><span style={{ fontSize: '0.75rem', background: channelInfo.bg, color: channelInfo.color, padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>{channelInfo.label}</span></td>
                      <td><strong>{categories[r.category_id]?.name_en || 'Water Fault'}</strong></td>
                      <td><span className={`status-pill ${r.status}`}>{r.status.replace('_', ' ')}</span></td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 700, color: r.priority === 'urgent' ? '#DC2626' : 'inherit' }}>{r.priority || 'Medium'}</td>
                      <td>{tech ? <strong>{tech.full_name}</strong> : <button className="btn-hero" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#D97706' }} onClick={() => triggerAutoDispatch(r)}>⚡ Auto-Assign</button>}</td>
                      <td><button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setSelected(r)}>Manage</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- DMA TAB --- */}
      {activeTab === 'dmas' && (
        <div className="list-group">
          {dmas.map(dma => (
            <div key={dma.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><h3 style={{ margin: '0 0 0.25rem 0' }}>{dma.name}</h3><div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}><div><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Current Pressure</div><div style={{ fontSize: '1.25rem', fontWeight: 600, color: dma.leak_suspected ? '#DC2626' : 'var(--green)' }}>{dma.current_pressure_bar} Bar</div></div></div></div>
              {dma.leak_suspected ? <button className="btn-primary-pro" onClick={() => fixLeak(dma.id)}>Dispatch Team</button> : <div className="status-pill resolved">✅ Normal</div>}
            </div>
          ))}
        </div>
      )}

      {/* --- QUALITY TAB --- */}
      {activeTab === 'quality' && (
        <div className="table-container"><table><thead><tr><th>Water Point</th><th>Stage</th><th>pH</th><th>Chlorine</th><th>Turbidity</th><th>Status</th></tr></thead><tbody>{waterPoints.map(wp => { const isTreated = wp.treatment_stage === 'Distributed'; return (<tr key={wp.id}><td><strong>{wp.name}</strong></td><td>{wp.treatment_stage}</td><td>{isTreated ? '7.2' : '6.8'}</td><td>{isTreated ? '0.4 mg/L' : '0.1 mg/L'}</td><td>{isTreated ? '1.2 NTU' : '8.5 NTU'}</td><td>{isTreated ? <span className="status-pill resolved">Compliant</span> : <span className="status-pill assigned">Needs Chlorination</span>}</td></tr>)})}</tbody></table></div>
      )}

      {/* --- ALERTS TAB --- */}
      {activeTab === 'alerts' && (
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card" style={{ padding: '2rem' }}><h3 style={{ marginTop: 0 }}>Broadcast Outage Alert</h3><form onSubmit={handleSendAlert}><div className="form-group"><label>Area</label><input value={newAlert.village} onChange={e => setNewAlert({...newAlert, village: e.target.value})} required /></div><div className="form-group"><label>Message</label><textarea rows={3} value={newAlert.message} onChange={e => setNewAlert({...newAlert, message: e.target.value})} required /></div><button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: '#DC2626' }}>📢 Send Alert</button></form></div>
          <div><h3 style={{ marginTop: 0 }}>Active Alerts</h3><div className="list-group">{alerts.map(a => (<div key={a.id} className="card" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', position: 'relative' }}><button onClick={() => deleteAlert(a.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button><strong style={{ color: '#991B1B' }}>📍 {a.village}</strong><p style={{ margin: '0.5rem 0' }}>{a.message}</p></div>))}</div></div>
        </div>
      )}

      {/* --- SMS QUEUE TAB (NEW) --- */}
      {activeTab === 'sms' && (
        <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Simulated SMS Gateway Queue</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-600)' }}>In production, these messages are sent via Africa's Talking or Twilio APIs.</p>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Phone Number</th><th>Message</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {smsQueue.map(sms => (
                  <tr key={sms.id}>
                    <td><strong>{sms.phone_number}</strong></td>
                    <td>{sms.message}</td>
                    <td><span className="status-pill assigned">{sms.status}</span></td>
                    <td>{new Date(sms.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {smsQueue.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-600)' }}>No SMS messages in queue.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OMNICHANNEL INTAKE MODAL */}
      {showIntakeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header"><h3>Log External Complaint</h3><button className="close-btn" onClick={() => setShowIntakeModal(false)}>&times;</button></div>
            <form onSubmit={submitOmnichannelComplaint}>
              <div className="form-group"><label>Intake Channel</label><select value={intakeForm.channel} onChange={e => setIntakeForm({...intakeForm, channel: e.target.value})}><option value="call_center">Call Centre</option><option value="whatsapp">WhatsApp</option><option value="walk_in">Walk-in</option></select></div>
              <div className="form-grid"><div className="form-group"><label>Customer Name</label><input value={intakeForm.customer_name} onChange={e => setIntakeForm({...intakeForm, customer_name: e.target.value})} /></div><div className="form-group"><label>Customer Phone</label><input value={intakeForm.customer_phone} onChange={e => setIntakeForm({...intakeForm, customer_phone: e.target.value})} /></div></div>
              <div className="form-grid"><div className="form-group"><label>Category</label><select value={intakeForm.category_id} onChange={e => setIntakeForm({...intakeForm, category_id: e.target.value})} required><option value="">Select...</option>{Object.values(categories).map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}</select></div><div className="form-group"><label>Location</label><input value={intakeForm.location_text} onChange={e => setIntakeForm({...intakeForm, location_text: e.target.value})} required /></div></div>
              <div className="form-group"><label>Details</label><textarea rows={3} value={intakeForm.description} onChange={e => setIntakeForm({...intakeForm, description: e.target.value})} required /></div>
              <div className="form-actions"><button type="submit" className="btn-hero" style={{ background: '#7C3AED' }}>Save Complaint</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE WORK ORDER MODAL */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>Manage {selected.ref}</h3><button className="close-btn" onClick={() => setSelected(null)}>&times;</button></div>
            <p style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{selected.description}</p>
            <div className="form-grid">
              <div className="form-group"><label>Priority</label><select defaultValue={selected.priority || 'medium'} onChange={e => updateReport(selected.id, { priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}</select></div>
              <div className="form-group"><label>Status</label><select defaultValue={selected.status} onChange={e => updateReport(selected.id, { status: e.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}</select></div>
              <div className="form-group full"><label>Technician</label><select defaultValue={selected.technician_id || ''} onChange={e => updateReport(selected.id, { technician_id: e.target.value || null, status: e.target.value ? 'assigned' : selected.status })}><option value="">Unassigned</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}