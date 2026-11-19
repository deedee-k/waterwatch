import { useEffect, useState, useRef } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { startSyncLoop, onSyncChange, isOnline, flushOutbox } from './lib/sync'
import { db } from './lib/db'
import { LanguageProvider, useLanguage, LanguageModalPanel } from './lib/i18n'
import { ThemeProvider, useTheme } from './lib/theme'
import LanguageSelector from './components/LanguageSelector'
import ErrorBoundary from './components/ErrorBoundary'
import {
  HomeIcon,
  TapIcon,
  PlusCircleIcon,
  ClipboardListIcon,
  BellIcon,
  GlobeIcon,
  GaugeIcon,
  ZapIcon,
  UsersIcon,
  SunIcon,
  MoonIcon
} from './components/Icons'

import Login from './pages/login'
import Register from './pages/Register'
import CommunityDashboard from './pages/CommunityDashboard'
import CommunityMonitoring from './pages/CommunityMonitoring'
import ReportProblem from './pages/ReportProblem'
import MyReports from './pages/MyReports'
import Notifications from './pages/Notifications'
import WascoDashboard from './pages/WascoDashboard'
import TechnicianDashboard from './pages/TechnicianDashboard'
import StaffManagement from './pages/StaffManagement'

function OfflineBanner() {
  const [online, setOnline] = useState(isOnline())
  const [pending, setPending] = useState(0)
  const [toast, setToast] = useState('')
  const prevPendingRef = useRef(0)
  const toastTimer = useRef(null)

  useEffect(() => {
    const updateOnlineStatus = () => setOnline(isOnline())
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    const checkQueue = async () => {
      const count = await db.outbox.count()
      setPending(count)
      if (count === 0 && prevPendingRef.current > 0) {
        setToast('✅ All reports synced!')
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(''), 3000)
      }
      prevPendingRef.current = count
    }
    checkQueue()

    const unsub = onSyncChange(() => {
      checkQueue()
    })

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      unsub()
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  if (online && pending === 0 && !toast) return null
  return (
    <>
      {!online ? (
        <div className="offline-banner">Offline Mode: Reports will sync when reconnected</div>
      ) : (
        <div className="offline-banner">Syncing {pending} item(s)...</div>
      )}
      {toast && (
        <div className="toast-sync" style={{
          position: 'fixed', bottom: '1rem', right: '1rem', background: 'var(--green)', color: 'white',
          padding: '0.5rem 1rem', borderRadius: '0.4rem', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', zIndex: 2000,
        }}>{toast}</div>
      )}
    </>
  )
}

function NavLink({ to, icon: Icon, children, showDot }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link to={to} className={active ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {Icon && <Icon size={18} color="currentColor" />}
        <span>{children}</span>
      </div>
      {showDot && <span style={{ width: '8px', height: '8px', background: '#DC2626', borderRadius: '50%', display: 'inline-block' }} />}
    </Link>
  )
}

function MobileNavItem({ to, icon: Icon, label, showDot, isFab }) {
  const location = useLocation()
  const active = location.pathname === to

  if (isFab) {
    return (
      <Link to={to} className="mobile-nav-item" title={label}>
        <div className="mobile-nav-fab">
          <Icon size={24} color="white" />
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>{label}</span>
      </Link>
    )
  }

  return (
    <Link to={to} className={`mobile-nav-item ${active ? 'active' : ''}`}>
      <div style={{ position: 'relative' }}>
        <Icon size={20} color={active ? 'var(--primary)' : 'var(--text-600)'} />
        {showDot && <span style={{ position: 'absolute', top: -2, right: -2, width: '7px', height: '7px', background: '#DC2626', borderRadius: '50%' }} />}
      </div>
      <span>{label}</span>
    </Link>
  )
}

function MainApp() {
  const { lang, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [hasAlerts, setHasAlerts] = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)

  useEffect(() => {
    const cachedSession = localStorage.getItem('waterwatch_offline_session')
    
    if (!navigator.onLine && cachedSession) {
      try {
        const parsed = JSON.parse(cachedSession)
        setSession({ user: parsed.user })
        return
      } catch (e) {}
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        localStorage.setItem('waterwatch_offline_session', JSON.stringify({ user: data.session.user, timestamp: Date.now() }))
      }
    })
    
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) {
        localStorage.setItem('waterwatch_offline_session', JSON.stringify({ user: s.user, timestamp: Date.now() }))
      }
    })
    
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setProfile(null); return }

    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data))
      .catch(() => {
        db.meta.get('profile').then(cached => {
          if (cached) setProfile(cached)
        })
      })

    const stop = startSyncLoop(session.user.id, profile?.role)
    setTimeout(() => { flushOutbox() }, 1000)

    supabase.from('outage_alerts').select('id').eq('active', true).then(({ data }) => {
      if (data && data.length > 0) setHasAlerts(true)
      else setHasAlerts(false)
    }).catch(() => {})

    return stop
  }, [session, profile?.role])

  function handleLogout() {
    localStorage.removeItem('waterwatch_offline_session')
    supabase.auth.signOut()
  }

  if (session === undefined) {
    return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', fontFamily: 'Inter' }}>Loading WaterWatch…</div>
  }

  if (!session) {
    return (
      <div>
        <OfflineBanner />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    )
  }

  return (
    <>
      <OfflineBanner />
      <LanguageModalPanel isOpen={showLangModal} onClose={() => setShowLangModal(false)} />

      <header className="mobile-topbar">
        <div className="mobile-brand">
          <img src="/wasco-logo.png" alt="W" onError={(e) => e.target.style.display = 'none'} />
          <span>WaterWatch</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'var(--text-600)', cursor: 'pointer' }}>
            {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
          <LanguageSelector onOpen={() => setShowLangModal(true)} />
          <button className="btn-logout" onClick={handleLogout} title={t('nav_logout')} style={{ padding: '0.3rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
      </header>

      <div className="app-shell">
        <aside className="sidebar-pro">
          <div className="brand" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/wasco-logo.png" alt="W" onError={(e) => e.target.style.display = 'none'} />
              <span>WaterWatch</span>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button type="button" className="lang-toggle-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowLangModal(true)}>
              <GlobeIcon size={16} color="var(--primary)" />
              <span>{lang === 'st' ? '🇱🇸 Sesotho Side' : '🇬🇧 English Side'}</span>
            </button>
            
            {/* UPDATED THEME TOGGLE BUTTON */}
            <button 
              type="button" 
              onClick={toggleTheme}
              style={{ 
                width: '100%', 
                justifyContent: 'center',
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'var(--primary)', 
                color: 'white',
                border: 'none',
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }} 
            >
              {theme === 'dark' ? <SunIcon size={16} color="white" /> : <MoonIcon size={16} color="white" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          <nav className="nav-pro" style={{ marginTop: '1rem' }}>
            {profile?.role === 'community' && <>
              <NavLink to="/" icon={HomeIcon}>{t('nav_overview')}</NavLink>
              <NavLink to="/monitoring" icon={TapIcon}>{t('nav_monitoring')}</NavLink>
              <NavLink to="/report" icon={PlusCircleIcon}>{t('nav_report')}</NavLink>
              <NavLink to="/my-reports" icon={ClipboardListIcon}>{t('nav_my_reports')}</NavLink>
              <NavLink to="/notifications" icon={BellIcon} showDot={hasAlerts}>{t('nav_notifications')}</NavLink>
            </>}

            {profile?.role === 'wasco' && <>
              <NavLink to="/wasco" icon={GaugeIcon}>{t('nav_wasco')}</NavLink>
              <NavLink to="/wasco/staff" icon={UsersIcon}>Staff Management</NavLink>
            </>}

            {profile?.role === 'technician' && <>
              <NavLink to="/tech" icon={ZapIcon}>{t('nav_tech')}</NavLink>
            </>}
          </nav>

          <div className="user-profile">
            <div className="avatar">{profile?.full_name?.charAt(0) || 'U'}</div>
            <div className="user-info">
              <span className="name">{profile?.full_name || 'User'}</span>
              <span className="role">{profile?.role}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout} title={t('nav_logout')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </div>
        </aside>

        <main className="main-pro">
          <Routes>
            {profile?.role === 'community' && <>
              <Route path="/" element={<CommunityDashboard userId={session.user.id} onOpenLang={() => setShowLangModal(true)} />} />
              <Route path="/monitoring" element={<CommunityMonitoring />} />
              <Route path="/report" element={<ReportProblem userId={session.user.id} />} />
              <Route path="/my-reports" element={<MyReports userId={session.user.id} />} />
              <Route path="/notifications" element={<Notifications userId={session.user.id} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>}

            {profile?.role === 'wasco' && <>
              <Route path="/wasco" element={<WascoDashboard userId={session.user.id} />} />
              <Route path="/wasco/staff" element={<StaffManagement />} />
              <Route path="*" element={<Navigate to="/wasco" replace />} />
            </>}

            {profile?.role === 'technician' && <>
              <Route path="/tech" element={<TechnicianDashboard userId={session.user.id} />} />
              <Route path="*" element={<Navigate to="/tech" replace />} />
            </>}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {profile?.role === 'community' && (
        <nav className="mobile-bottom-nav">
          <MobileNavItem to="/" icon={HomeIcon} label={t('nav_overview')} />
          <MobileNavItem to="/monitoring" icon={TapIcon} label={t('nav_monitoring')} />
          <MobileNavItem to="/report" icon={PlusCircleIcon} label={t('nav_report')} isFab />
          <MobileNavItem to="/my-reports" icon={ClipboardListIcon} label={t('nav_my_reports')} />
          <MobileNavItem to="/notifications" icon={BellIcon} label={t('nav_notifications')} showDot={hasAlerts} />
        </nav>
      )}

      {profile?.role === 'wasco' && (
        <nav className="mobile-bottom-nav">
          <MobileNavItem to="/wasco" icon={GaugeIcon} label={t('nav_wasco')} />
        </nav>
      )}

      {profile?.role === 'technician' && (
        <nav className="mobile-bottom-nav">
          <MobileNavItem to="/tech" icon={ZapIcon} label={t('nav_tech')} />
        </nav>
      )}
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <MainApp />
        </ErrorBoundary>
      </ThemeProvider>
    </LanguageProvider>
  )
}