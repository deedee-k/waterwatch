import React, { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    // Navigation
    nav_overview: 'Overview',
    nav_monitoring: 'Water Monitoring',
    nav_my_reports: 'My Reports',
    nav_notifications: 'Notifications',
    nav_report: 'Submit Report',
    nav_wasco: 'Operations Center',
    nav_tech: 'Field Tasks',
    nav_logout: 'Sign Out',

    // Language Panel
    lang_panel_title: 'Language Selection / Khetho ea Puo',
    lang_panel_subtitle: 'Switch between English and Sesotho for all community services',
    lang_en_title: 'English Side',
    lang_en_desc: 'Default interface for official WASCO communication and international reporting.',
    lang_st_title: 'Sesotho Side (Sesotho sa Lesotho)',
    lang_st_desc: 'Sebelisa Sesotho ho tlaleha mathata le ho sheba maemo a phepelo ea metsi Maseru.',
    lang_active: 'Active / E Kgethilwe',
    lang_switch_to: 'Switch to / Fetolela ho',

    // Supply Status
    supply_status_title: 'Maseru West Water Network Status',
    supply_status_ok: 'Supply Active & Flowing',
    supply_status_desc: 'Network pressure is stable at 4.2 Bar. Reservoirs are supplying normally.',
    supply_status_notice: 'No major pipeline maintenance scheduled today in your area.',

    // Community Dashboard
    dash_title: 'Community Water Dashboard',
    dash_subtitle: 'Monitor water supply, report leakages, and track rapid technician dispatches.',
    hero_title: 'See a water fault in your area?',
    hero_desc: 'Report burst pipes, dry taps, or meter leaks. WASCO dispatches technicians in < 5 seconds.',
    btn_report_now: 'Report Fault Now',
    faults_near_you: 'Faults & Repairs Near You',
    view_map: 'Map View',
    view_list: 'List View',
    recent_activity: 'Recent Work Orders',
    view_all: 'View All',
    no_reports_yet: 'No reports submitted in your area yet.',

    // Water Reporting Page (ReportProblem)
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
    report_generating: 'Generating Work Order...',
    report_modal_title: 'Work Order Automatically Issued!',
    report_modal_desc: 'Your fault was processed and dispatched to field teams immediately.',
    report_wo_number: 'Work Order #:',
    report_tech_assigned: 'Assigned Technician:',
    report_priority_sla: 'Priority & SLA:',
    report_speed: 'Issuance Speed:',
    report_speed_val: '< 5 seconds (Legacy: 12-24 hrs)',
    report_dispatch_info: 'WASCO Automated Dispatch: You eliminated the traditional 12-24 hour manual dispatch bottleneck. Track live updates in your dashboard.',
    report_btn_track: 'Track My Report',
    report_btn_home: 'Dashboard',
    report_gps_btn: 'Use My Current Location',
    report_gps_getting: 'Getting GPS...',
    report_gps_captured: 'Location Captured',

    // Metrics
    metric_total: 'Total Reports',
    metric_pending: 'Pending Dispatch',
    metric_in_progress: 'In Progress',
    metric_resolved: 'Resolved',

    // Work Orders & Statuses
    wo_issued: 'Work Order Issued',
    tech_dispatched: 'Technician Dispatched',
    status_submitted: 'Submitted',
    status_assigned: 'Work Order Issued',
    status_in_progress: 'In Repair',
    status_resolved: 'Resolved',

    // Outages & Alerts
    alert_outage_title: 'Water Outage Notice',
    alert_rationing_title: 'Water Supply Advisory',
    no_active_alerts: 'No active water outages in your area.',

    // Community Tip
    tip_title: 'Community Water Conservation',
    tip_text: 'A running toilet or leaking valve can waste over 700 liters of potable water daily. Reporting leaks quickly keeps the taps running for everyone.',

    // Channels
    channel_app: 'Mobile App',
    channel_call: 'Call Centre',
    channel_whatsapp: 'WhatsApp',
    channel_walkin: 'Customer Centre'
  },
  st: {
    // Navigation
    nav_overview: 'Kakaretso',
    nav_monitoring: 'Tlhahlobo ea Metsi',
    nav_my_reports: 'Litlaleho tsa Ka',
    nav_notifications: 'Litsebiso',
    nav_report: 'Tlaleha Bothata',
    nav_wasco: 'Setsi sa Tsamaiso',
    nav_tech: 'Mesebetsi ea Tšimo',
    nav_logout: 'Tsoa Tsamaisong',

    // Language Panel
    lang_panel_title: 'Khetho ea Puo / Language Selection',
    lang_panel_subtitle: 'Khetha pakeng tsa Sesotho le Senyesemane bakeng sa litšebeletso tsohle',
    lang_en_title: 'English Side (Senyesemane)',
    lang_en_desc: 'Tsamaiso ea semmuso ea WASCO ka puo ea Senyesemane.',
    lang_st_title: 'Sesotho Side (Sesotho sa Lesotho)',
    lang_st_desc: 'Puo ea Basotho bakeng sa ho tlaleha mathata le ho beha leihlo lipompo le lipeipi.',
    lang_active: 'E Kgethilwe',
    lang_switch_to: 'Khetha Ena',

    // Supply Status
    supply_status_title: 'Boemo ba Phepelo ea Metsi Maseru West',
    supply_status_ok: 'Metsi a Teng ebile a Balla',
    supply_status_desc: 'Khatello ea metsi e tloaelehile ho 4.2 Bar. Litanka le matamo li sebetsa hantle.',
    supply_status_notice: 'Ha ho na khaolo ea metsi e reriloeng sebakeng sa heno kajeno.',

    // Community Dashboard
    dash_title: 'Setsi sa Metsi sa Sechaba',
    dash_subtitle: 'Sheba phepelo ea metsi, tlaleha lipeipi tse phatlohileng, le ho beha leihlo litokiso.',
    hero_title: 'Na u bona bothata ba metsi sebakeng sa heno?',
    hero_desc: 'Tlaleha peipi e dutlang, pompo e robehileng kapa komello. WASCO e romela setsebi hang-hang.',
    btn_report_now: 'Tlaleha Bothata Hona Joale',
    faults_near_you: 'Mathata le Litokiso Haufi le Uena',
    view_map: 'Sheba Mmepeng',
    view_list: 'Sheba Lethathamo',
    recent_activity: 'Ditaelo tsa Tokiso tsa Haufi',
    view_all: 'Bontša Tsohle',
    no_reports_yet: 'Ha ho litlaleho tse entsoeng sebakeng sa heno hajoale.',

    // Water Reporting Page (ReportProblem)
    report_title: 'Tlaleha Bothata ba Metsi',
    report_subtitle: 'Taelo ea tokiso e lokolloa hang-hang ho romela litsebi tsa Maseru tšimong.',
    report_cancel: 'Hlakola',
    report_category_label: 'Mofuta oa Bothata *',
    report_category_placeholder: 'Khetha mofuta oa bothata...',
    report_waterpoint_label: 'Sebaka sa Pompo se Tsebahalang',
    report_waterpoint_placeholder: 'Khetha pompo e tsebahalang...',
    report_location_label: 'Hlalosa sebaka ka mongolo *',
    report_location_placeholder: 'Mohlala: Haufi le Sekolo sa Hillsview, Maseru West',
    report_map_pin: 'Tšoaea Mmepeng (Ha u batla)',
    report_clear_pin: 'Tlosa Letšoao',
    report_desc_label: 'Hlalosa bothata ka botlalo *',
    report_desc_placeholder: 'Hlalosa hantle se etsahetseng (mohlala: peipi e kholo e phatlohile metsi a phalla seterateng)...',
    report_photo_label: 'Setšoantšo (Ha se qobelloe)',
    report_sms_fallback: 'Ha ho Data? Sebelisa SMS',
    report_submit_btn: 'Romela & Fana ka Taelo Hang-hang',
    report_submit_offline: 'Boloka Ntle le Marang-rang',
    report_generating: 'E Ntse e Lokolla Taelo ea Tokiso...',
    report_modal_title: 'Taelo ea Tokiso e Fanoe Hang-hang!',
    report_modal_desc: "Bothata ba hau bo amohetsoe 'me bo fetiselitsoe ho litsebi tsa tšimo ntle le tieho.",
    report_wo_number: 'Nomoro ea Taelo (WO #):',
    report_tech_assigned: 'Setsebi se Abetsoeng:',
    report_priority_sla: 'Boemo & Nako ea Tokiso (SLA):',
    report_speed: 'Lebelo la Kabo:',
    report_speed_val: 'Ka tlase ho metsotsoana e 5 (Pele: Lihora tse 12-24)',
    report_dispatch_info: 'WASCO E Potlakisa Litokiso: U qobetse tieho e tloaelehileng ea lihora tse 12-24. Sala morao tsoelopele ea tokiso.',
    report_btn_track: 'Sala Tlaleho Morao',
    report_btn_home: 'Setsi sa Qalo',
    report_gps_btn: 'Sebelisa Sebaka sa Ka sa Hajoale',
    report_gps_getting: 'E Batla GPS...',
    report_gps_captured: 'Sebaka se Tšoeroe',

    // Metrics
    metric_total: 'Kakaretso ea Litlaleho',
    metric_pending: 'Tse Emetseng',
    metric_in_progress: 'Tse Ntseng li Lokisoa',
    metric_resolved: 'Tse Lokisitsoeng',

    // Work Orders & Statuses
    wo_issued: 'Taelo ea Tokiso e Fanoe',
    tech_dispatched: 'Setsebi se Tseleng',
    status_submitted: 'E Kentswe',
    status_assigned: 'Taelo e Lokollotsoe',
    status_in_progress: 'E Ntse e Lokisoa',
    status_resolved: 'E Lokisitsoe',

    // Outages & Alerts
    alert_outage_title: 'Temoso ea Khaolo ea Metsi',
    alert_rationing_title: 'Tsebiso ea Phepelo ea Metsi',
    no_active_alerts: 'Ha ho likhaolo tsa metsi sebakeng sa heno hajoale.',

    // Community Tip
    tip_title: 'Paballo ea Metsi Sechabeng',
    tip_text: 'Peipi e dutlang kapa ntloana e phallang e ka senya lilithara tse fetang 700 ka letsatsi. Ha re tlaleha ka potlako, re boloka metsi a sechaba.',

    // Channels
    channel_app: 'App ea Mohala',
    channel_call: 'Setsi sa Mehala',
    channel_whatsapp: 'WhatsApp',
    channel_walkin: 'Ofising ea WASCO'
  }
}

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('ww_lang') || 'en'
  })

  function setLang(newLang) {
    setLangState(newLang)
    localStorage.setItem('ww_lang', newLang)
  }

  function t(key, fallback = '') {
    return translations[lang]?.[key] || translations.en?.[key] || fallback || key
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

/**
 * Dedicated Language Panel Component
 * Displays the English side and Sesotho side side-by-side with toggle controls
 */
export function LanguageModalPanel({ isOpen, onClose }) {
  const { lang, setLang, t } = useLanguage()
  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t('lang_panel_title')}</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-600)' }}>
              {t('lang_panel_subtitle')}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* SIDE-BY-SIDE PANELS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
          
          {/* ENGLISH SIDE */}
          <div 
            onClick={() => setLang('en')}
            style={{ 
              border: lang === 'en' ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: lang === 'en' ? '#F0F9FF' : 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              boxShadow: lang === 'en' ? 'var(--shadow-md)' : 'none'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🇬🇧</span>
                {lang === 'en' ? (
                  <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Active
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-400)', fontSize: '0.8rem' }}>Click to select</span>
                )}
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-900)' }}>
                {translations.en.lang_en_title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-600)', lineHeight: 1.5 }}>
                {translations.en.lang_en_desc}
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                {lang === 'en' ? '✓ Currently Selected' : 'Switch to English'}
              </span>
            </div>
          </div>

          {/* SESOTHO SIDE */}
          <div 
            onClick={() => setLang('st')}
            style={{ 
              border: lang === 'st' ? '2px solid var(--green)' : '1px solid var(--border)',
              background: lang === 'st' ? '#F0FDF4' : 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              boxShadow: lang === 'st' ? 'var(--shadow-md)' : 'none'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🇱🇸</span>
                {lang === 'st' ? (
                  <span style={{ background: 'var(--green)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    E Kgethilwe
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-400)', fontSize: '0.8rem' }}>Tobetsa mona</span>
                )}
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-900)' }}>
                {translations.st.lang_st_title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-600)', lineHeight: 1.5 }}>
                {translations.st.lang_st_desc}
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600 }}>
                {lang === 'st' ? '✓ E Kgethilwe Hajoale' : 'Fetolela ho Sesotho'}
              </span>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn-primary-pro" 
            onClick={onClose}
            style={{ minWidth: '120px', justifyContent: 'center' }}
          >
            {lang === 'st' ? 'Koala / E Lokile' : 'Done / Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
