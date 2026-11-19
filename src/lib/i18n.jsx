import { createContext, useContext, useState, useEffect } from 'react'
import { GlobeIcon, CheckCircleIcon } from '../components/Icons'

const LanguageContext = createContext()

const translations = {
  en: {
    // Navigation
    nav_overview: 'Overview',
    nav_monitoring: 'Water Monitoring',
    nav_report: 'Submit Report',
    nav_my_reports: 'My Reports',
    nav_notifications: 'Notifications',
    nav_wasco: 'Operations Center',
    nav_tech: 'Field Tasks',
    nav_logout: 'Sign Out',
    
    // Dashboard
    alert_outage_title: 'Water Outage Notice',
    supply_status_title: 'Maseru West Network Status',
    supply_status_desc: 'Network pressure is stable at 4.2 Bar. Reservoirs are supplying normally.',
    supply_status_ok: 'Supply Active & Flowing',
    hero_title: 'See a water fault in your area?',
    hero_desc: 'Report burst pipes, dry taps, or meter leaks. WASCO dispatches technicians in < 5 seconds.',
    btn_report_now: 'Report a Problem',
    faults_near_you: 'Faults & Repairs Near You',
    recent_activity: 'Recent Work Orders',
    view_all: 'View All',
    no_reports_yet: 'No reports submitted yet.',
    tip_title: 'Water Conservation Tip',
    tip_text: 'Report leaks immediately. A single dripping tap can waste over 20 litres of clean water per day.',
    
    // Metrics
    metric_total: 'Total Reports',
    metric_pending: 'Pending Dispatch',
    metric_in_progress: 'In Progress',
    metric_resolved: 'Resolved',

    // Report Form
    report_title: 'Submit a Water Fault',
    report_subtitle: 'Instant automated work order generation & field dispatch across Maseru.',
    report_cancel: 'Cancel',
    report_category_label: 'Fault Category *',
    report_category_placeholder: 'Select a category...',
    report_waterpoint_label: 'Known Water Point',
    report_waterpoint_placeholder: 'Select known location...',
    report_location_label: 'Describe location manually *',
    report_location_placeholder: 'e.g. Near Hillsview Primary School, Maseru West',
    report_map_pin: 'Pinpoint on Map (Optional)',
    report_clear_pin: 'Clear Pin',
    report_desc_label: 'Describe the issue *',
    report_desc_placeholder: 'Tell us what happened (e.g. major burst pipe leaking into the street)...',
    report_photo_label: 'Photo (Optional)',
    report_sms_fallback: 'No Data? Use SMS',
    report_submit_btn: 'Submit & Auto-Dispatch',
    report_submit_offline: 'Save Offline',
    report_generating: 'Generating...',
    
    // Work Order Modal
    report_modal_title: 'Work Order Auto-Issued!',
    report_modal_desc: 'Your report has been instantly dispatched to a WASCO field technician.',
    report_wo_number: 'Work Order Number',
    report_tech_assigned: 'Assigned Technician',
    report_priority_sla: 'Priority / SLA',
    report_speed: 'Dispatch Speed',
    report_speed_val: '< 5 seconds (Automated)',
    report_dispatch_info: 'You will receive an SMS notification when the technician arrives on site.',
    report_btn_track: 'Track Repair Progress',
    report_btn_home: 'Back to Dashboard',
  },
  st: {
    // Navigation
    nav_overview: 'Kakaretso',
    nav_monitoring: 'Tlhokomelo ea Metsi',
    nav_report: 'Kenya Tlaleho',
    nav_my_reports: 'Litlaleho Tsa Ka',
    nav_notifications: 'Litsebiso',
    nav_wasco: 'Setsi sa Ts\'ebetso',
    nav_tech: 'Mesebetsi ea Tšimo',
    nav_logout: 'Tsoa',
    
    // Dashboard
    alert_outage_title: 'Tsebiso ea Khaello ea Metsi',
    supply_status_title: 'Boemo ba Marang-rang a Maseru West',
    supply_status_desc: 'Khatello ea marang-rang e tsitsitse ho 4.2 Bar. Matamo a fana ka metsi ka tloaelo.',
    supply_status_ok: 'Metsi a Tsamaea Hantle',
    hero_title: 'Na u bona bothata ba metsi sebakeng sa heno?',
    hero_desc: 'Tlaleha lipeipi tse phatlohileng, lipompo tse omileng, kapa ho dutla ha metara. WASCO e romela litsebi ka < metsotsoano e 5.',
    btn_report_now: 'Tlaleha Bothata',
    faults_near_you: 'Mathata le Litokiso Haufi le Uena',
    recent_activity: 'Litaelo tsa Mesebetsi tsa Haufinyane',
    view_all: 'Bona Tsohle',
    no_reports_yet: 'Ha ho litlaleho tse kentsoeng.',
    tip_title: 'Keletso ea ho Boloka Metsi',
    tip_text: 'Tlaleha ho dutla hang-hang. Pompo e le \'ngoe e rothang e ka senya metsi a hloekileng a fetang 20 litres ka letsatsi.',

    // Metrics
    metric_total: 'Litlaleho Tsohle',
    metric_pending: 'E Emetse ho Romeloa',
    metric_in_progress: 'E Ntse e Sebetsa',
    metric_resolved: 'E Lokisitsoe',

    // Report Form
    report_title: 'Kenya Tlaleho ea Bothata ba Metsi',
    report_subtitle: 'Tlhahiso ea taelo ea mosebetsi hang-hang le ho romela litsebi Maseru ka bophara.',
    report_cancel: 'Hlakola',
    report_category_label: 'Mofuta oa Bothata *',
    report_category_placeholder: 'Khetha mofuta...',
    report_waterpoint_label: 'Sebaka sa Metsi se Tsejoang',
    report_waterpoint_placeholder: 'Khetha sebaka se tsejoang...',
    report_location_label: 'Hlalosa sebaka ka letsoho *',
    report_location_placeholder: 'mohlala Haufi le Sekolo sa Hillsview, Maseru West',
    report_map_pin: 'Supe sebaka \'mapeng (Ha e hlokehe)',
    report_clear_pin: 'Tlosa Pin',
    report_desc_label: 'Hlalosa bothata *',
    report_desc_placeholder: 'Re bolelle se etsahetseng (mohlala peipi e phatlohile e dutla seterateng)...',
    report_photo_label: 'Setšoantšo (Ha se hlokehe)',
    report_sms_fallback: 'Ha u na Data? Sebelisa SMS',
    report_submit_btn: 'Romela & Auto-Dispatch',
    report_submit_offline: 'Boloka Offline',
    report_generating: 'E ntse e hlahisa...',

    // Work Order Modal
    report_modal_title: 'Taelo ea Mosebetsi e Lokollotsoe!',
    report_modal_desc: 'Tlaleho ea hau e rometsoe hang-hang ho setsebi sa tšimo sa WASCO.',
    report_wo_number: 'Nomoro ea Taelo ea Mosebetsi',
    report_tech_assigned: 'Setsebi se Abelitsoeng',
    report_priority_sla: 'Bohlokoa / SLA',
    report_speed: 'Lebelo la ho Romela',
    report_speed_val: '< metsotsoano e 5 (Automated)',
    report_dispatch_info: 'U tla fumana tsebiso ea SMS ha setsebi se fihla setšeng.',
    report_btn_track: 'Latela Tsoelo-pele ea Tokiso',
    report_btn_home: 'Khutlela Dashboard',
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('ww-lang') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('ww-lang', lang)
  }, [lang])

  const t = (key) => {
    return translations[lang]?.[key] || translations['en'][key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

// --- LANGUAGE MODAL PANEL ---
export function LanguageModalPanel({ isOpen, onClose }) {
  const { lang, setLang } = useLanguage()
  
  if (!isOpen) return null

  const options = [
    {
      code: 'en',
      label: 'English',
      nativeLabel: 'English (UK)',
      flag: '🇬🇧',
      description: 'Default interface for official WASCO communication and international reporting.'
    },
    {
      code: 'st',
      label: 'Sesotho',
      nativeLabel: 'Sesotho sa Lesotho',
      flag: '🇱🇸',
      description: 'Puo ea Basotho bakeng sa ho tlaleha mathata le ho beha leihlo lipompo le lipeipi.'
    }
  ]

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '600px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-900)' }}>Language Selection / Khetho ea Puo</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-600)' }}>
              Switch between English and Sesotho for all community services
            </p>
          </div>
          <button className="close-btn" onClick={onClose} style={{ color: 'var(--text-400)' }}>&times;</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {options.map(option => {
            const isActive = lang === option.code
            return (
              <div
                key={option.code}
                onClick={() => {
                  setLang(option.code)
                  onClose()
                }}
                style={{
                  background: 'var(--bg-surface)', // Fixed for dark mode
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 0 0 4px rgba(0, 174, 239, 0.15)' : 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{option.flag}</span>
                  {isActive && (
                    <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                      Active
                    </span>
                  )}
                </div>

                <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-900)' }}>{option.label}</h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-600)' }}>{option.nativeLabel}</p>
                <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-600)', lineHeight: 1.4 }}>{option.description}</p>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isActive ? (
                    <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircleIcon size={16} color="var(--primary)" /> Currently Selected
                    </span>
                  ) : (
                    <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>
                      Switch to {option.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} className="btn-secondary" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-900)' }}>
            Close / Kwala
          </button>
        </div>
      </div>
    </div>
  )
}