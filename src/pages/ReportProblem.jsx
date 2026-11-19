import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { db, enqueue, uuid, makeRef } from '../lib/db'
import { flushOutbox, isOnline } from '../lib/sync'
import { supabase } from '../lib/supabase'
import { createAutoDispatchPackage } from '../lib/dispatch'
import LocationPicker from '../components/LocationPicker'
import ImageUploader from '../components/ImageUploader'
import { useLanguage } from '../lib/i18n'
import { ZapIcon, GlobeIcon, ArrowRightIcon } from '../components/Icons'

export default function ReportProblem({ userId }) {
  const { lang, setLang, t } = useLanguage()
  const nav = useNavigate()
  const location = useLocation()

  const [categories, setCategories] = useState([])
  const [waterPoints, setWaterPoints] = useState([])

  const [form, setForm] = useState({ category_id: '', water_point_id: '', location_text: '', description: '' })
  const [position, setPosition] = useState(null)

  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [issuedWorkOrder, setIssuedWorkOrder] = useState(null)
  const set = k => e => setForm({ ...form, [k]: e.target.value })

  useEffect(() => {
    db.categories.toArray().then(setCategories)
    db.waterPoints.toArray().then((wps) => {
      setWaterPoints(wps)

      if (location.state?.waterPointId) {
        const selectedWp = wps.find(w => w.id === location.state.waterPointId)
        setForm(prev => ({
          ...prev,
          water_point_id: location.state.waterPointId,
          location_text: selectedWp?.village || prev.location_text
        }))
      }
    })
  }, [location.state])

  async function submit(e) {
    e.preventDefault()
    if (!form.category_id || !form.description) return
    setSubmitting(true)

    const lat = position ? position.lat : null
    const lng = position ? position.lng : null

    const id = uuid()
    const ref = makeRef()
    const now = new Date().toISOString()

    let techs = []
    try {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'technician')
      techs = data || []
    } catch {
      techs = []
    }

    const activeReports = await db.reports.toArray()
    const catsMap = Object.fromEntries(categories.map(c => [c.id, c]))

    const dispatchPkg = createAutoDispatchPackage({
      category_id: form.category_id,
      description: form.description,
      location_text: form.location_text || 'Maseru West'
    }, techs, activeReports, catsMap)

    const payload = {
      id,
      ref,
      reporter_id: userId,
      category_id: form.category_id,
      water_point_id: form.water_point_id || null,
      location_text: form.location_text || 'Maseru West',
      description: form.description,
      status: dispatchPkg.status,
      priority: dispatchPkg.priority,
      technician_id: dispatchPkg.technician_id,
      work_order_ref: dispatchPkg.work_order_ref,
      work_order_issued_at: dispatchPkg.work_order_issued_at,
      sla_deadline: dispatchPkg.sla_deadline,
      source_channel: 'mobile_app',
      auto_assigned: true,
      dispatch_log: dispatchPkg.dispatch_log,
      created_at: now,
      updated_at: now,
      lat,
      lng
    }

    await db.reports.put(payload)
    await enqueue('report.insert', payload)

    if (photo) {
      await enqueue('photo.upload', { reportId: id, blob: photo, filename: `${Date.now()}.jpg` })
    }

    if (isOnline()) flushOutbox()
    setSubmitting(false)

    setIssuedWorkOrder({
      ...payload,
      technician_name: dispatchPkg.technician_name
    })
  }

  function handleSMS() {
    if (!form.description) {
      alert(lang === 'st' ? "Ka kopo, hlalosa bothata pele o romela SMS." : "Please describe the issue first.")
      return
    }
    const wascoNumber = "+26650000000"
    const cat = categories.find(c => c.id === form.category_id)
    const categoryName = lang === 'st' ? (cat?.name_st || cat?.name_en || 'Bothata') : (cat?.name_en || 'Unknown')

    const text = encodeURIComponent(
      lang === 'st' ? (
        `TLALEHO EA METSI EA WATERWATCH:\n` +
        `Sebaka: Maseru West\n` +
        `Mofuta: ${categoryName}\n` +
        `Aterese: ${form.location_text || 'Ha e boleloa'}\n` +
        `Lintlha: ${form.description}`
      ) : (
        `WATERWATCH REPORT:\n` +
        `Area: Maseru West\n` +
        `Category: ${categoryName}\n` +
        `Location: ${form.location_text || 'Not specified'}\n` +
        `Details: ${form.description}`
      )
    )

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.location.href = `sms:${wascoNumber}?body=${text}`
    } else {
      alert(lang === 'st' ? "Tšebeletso ea SMS e sebetsa feela lisebelisoa tsa mohala." : "SMS fallback is only available on mobile devices.")
    }
  }

  function handleWhatsApp() {
    if (!form.description) {
      alert(lang === 'st' ? "Ka kopo, hlalosa bothata pele o romela WhatsApp." : "Please describe the issue first so we can include it in the message.")
      return
    }
    
    const wascoPhone = "26650000000"
    const cat = categories.find(c => c.id === form.category_id)
    const categoryName = lang === 'st' ? (cat?.name_st || cat?.name_en || 'Bothata') : (cat?.name_en || 'Unknown')
    
    const text = encodeURIComponent(
      lang === 'st' ? (
        `*TLALEHO EA METSI EA WATERWATCH*\n` +
        `*Sebaka:* Maseru West\n` +
        `*Mofuta:* ${categoryName}\n` +
        `*Aterese:* ${form.location_text || 'Ha e boleloa'}\n` +
        `*Lintlha:* ${form.description}`
      ) : (
        `*WATERWATCH REPORT*\n` +
        `*Area:* Maseru West\n` +
        `*Category:* ${categoryName}\n` +
        `*Location:* ${form.location_text || 'Not specified'}\n` +
        `*Details:* ${form.description}`
      )
    )
    
    window.open(`https://wa.me/${wascoPhone}?text=${text}`, '_blank')
  }

  return (
    <div className="dash-main" style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* BILINGUAL LANGUAGE SWITCHER STRIP */}
      <div style={{
        background: 'var(--bg-surface)', // <-- FIXED: Was 'white'
        border: '1px solid var(--border)', 
        borderRadius: 'var(--radius-lg)',
        padding: '0.6rem 1.25rem', 
        marginBottom: '1.25rem', 
        display: 'flex',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '0.5rem', 
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GlobeIcon size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-900)' }}>
            {lang === 'st' ? 'Puo ea Foromo: Sesotho' : 'Form Language: English'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-base)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
          <button type="button" onClick={() => setLang('en')} style={{ background: lang === 'en' ? 'var(--bg-surface)' : 'transparent', border: lang === 'en' ? '1px solid var(--border)' : 'none', color: lang === 'en' ? 'var(--primary)' : 'var(--text-600)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-md)', fontWeight: lang === 'en' ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer', boxShadow: lang === 'en' ? 'var(--shadow-sm)' : 'none' }}>🇬🇧 English</button>
          <button type="button" onClick={() => setLang('st')} style={{ background: lang === 'st' ? 'var(--bg-surface)' : 'transparent', border: lang === 'st' ? '1px solid var(--border)' : 'none', color: lang === 'st' ? 'var(--green)' : 'var(--text-600)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-md)', fontWeight: lang === 'st' ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer', boxShadow: lang === 'st' ? 'var(--shadow-sm)' : 'none' }}>🇱🇸 Sesotho</button>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h1>{t('report_title')}</h1>
          <p>{t('report_subtitle')}</p>
        </div>
        <Link to="/" className="btn-secondary">{t('report_cancel')}</Link>
      </div>

      <div className="card" style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('report_category_label')}</label>
              <select value={form.category_id} onChange={set('category_id')} required>
                <option value="">{t('report_category_placeholder')}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {lang === 'st' && c.name_st ? `${c.name_st} (${c.name_en})` : `${c.name_en} ${c.name_st ? `(${c.name_st})` : ''}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('report_waterpoint_label')}</label>
              <select value={form.water_point_id} onChange={set('water_point_id')}>
                <option value="">{t('report_waterpoint_placeholder')}</option>
                {waterPoints.map(w => <option key={w.id} value={w.id}>{w.name} {w.village ? `(${w.village})` : ''}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group full">
            <label>{t('report_location_label')}</label>
            <input value={form.location_text} onChange={set('location_text')} placeholder={t('report_location_placeholder')} required />
          </div>

          <div className="form-group full">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('report_map_pin')}</span>
              {position && (
                <button type="button" onClick={() => setPosition(null)} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  {t('report_clear_pin')}
                </button>
              )}
            </label>
            <LocationPicker position={position} setPosition={setPosition} />
          </div>

          <div className="form-group full">
            <label>{t('report_desc_label')}</label>
            <textarea rows={4} value={form.description} onChange={set('description')} required placeholder={t('report_desc_placeholder')} />
          </div>

          <div className="form-group full">
            <label>{t('report_photo_label')}</label>
            <ImageUploader photo={photo} setPhoto={setPhoto} photoPreview={photoPreview} setPhotoPreview={setPhotoPreview} />
          </div>

          <div className="form-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={handleSMS} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', borderColor: 'var(--green)', background: 'rgba(22, 163, 74, 0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                <span>{t('report_sms_fallback')}</span>
              </button>

              <button type="button" onClick={handleWhatsApp} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#25D366', borderColor: '#25D366', background: 'rgba(37, 211, 102, 0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Use WhatsApp</span>
              </button>
            </div>

            <button type="submit" className="btn-hero" disabled={submitting} style={{ background: 'var(--primary)', color: 'white', minWidth: '220px', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ZapIcon size={18} color="white" />
              <span>{submitting ? t('report_generating') : (isOnline() ? t('report_submit_btn') : t('report_submit_offline'))}</span>
            </button>
          </div>
        </form>
      </div>

      {/* INSTANT WORK ORDER ISSUANCE MODAL */}
      {issuedWorkOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', textAlign: 'center', background: 'var(--bg-surface)' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(22, 163, 74, 0.1)', color: '#4ADE80', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem auto' }}>
              <ZapIcon size={32} color="#4ADE80" />
            </div>

            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: 'var(--text-900)' }}>
              {t('report_modal_title')}
            </h2>
            <p style={{ color: 'var(--text-600)', fontSize: '0.95rem', margin: '0 0 1.5rem 0' }}>
              {t('report_modal_desc')}
            </p>

            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-600)' }}>{t('report_wo_number')}</span>
                <strong style={{ color: '#A78BFA', fontSize: '1rem' }}>{issuedWorkOrder.work_order_ref}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-600)' }}>{t('report_tech_assigned')}</span>
                <strong style={{ color: 'var(--text-900)' }}>{issuedWorkOrder.technician_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-600)' }}>{t('report_priority_sla')}</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 700, color: '#F87171' }}>{issuedWorkOrder.priority}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-600)' }}>{t('report_speed')}</span>
                <span style={{ color: '#4ADE80', fontWeight: 700 }}>{t('report_speed_val')}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0, 174, 239, 0.1)', border: '1px solid rgba(0, 174, 239, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#7DD3FC', marginBottom: '1.5rem', textAlign: 'left' }}>
              💡 {t('report_dispatch_info')}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => nav('/my-reports')} className="btn-hero" style={{ flex: 1, justifyContent: 'center', background: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{t('report_btn_track')}</span>
                <ArrowRightIcon size={16} color="white" />
              </button>
              <button onClick={() => nav('/')} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                {t('report_btn_home')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}