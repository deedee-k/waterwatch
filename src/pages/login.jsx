import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import { useTheme } from '../lib/theme'
import { SunIcon, MoonIcon } from '../components/Icons'

export default function Login() {
  const nav = useNavigate()
  const { theme, toggleTheme } = useTheme()
  
  // Community Login State
  const [method, setMethod] = useState('phone')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Staff Login State
  const [isStaffMode, setIsStaffMode] = useState(false)
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffErr, setStaffErr] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)

  async function submitCommunity(e) {
    e.preventDefault()
    setErr(''); setLoading(true)

    // 1. Check for Offline Session
    if (!navigator.onLine) {
      const cachedSession = localStorage.getItem('waterwatch_offline_session')
      if (cachedSession) return nav('/')
      setErr("Offline. Please connect to the internet to log in.")
      setLoading(false)
      return
    }

    // 2. Online Login via Supabase
    const email = method === 'phone' ? `${identifier.replace(/\D/g, '')}@waterwatch.local` : identifier
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    setLoading(false)
    
    if (error) return setErr(error.message)

    if (data?.session) {
      localStorage.setItem('waterwatch_offline_session', JSON.stringify({ user: data.user, timestamp: Date.now() }))
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      if (prof) await db.meta.put({ key: 'profile', ...prof })
    }
    nav('/')
  }

  async function submitStaff(e) {
    e.preventDefault()
    setStaffErr(''); setStaffLoading(true)
    
    if (!navigator.onLine) {
      setStaffErr("Staff portal requires an active internet connection for security reasons.")
      setStaffLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ 
      email: staffEmail, 
      password: staffPassword 
    })
    
    setStaffLoading(false)
    
    if (error) return setStaffErr(error.message)
    nav('/')
  }

  return (
    <div className="auth-wrapper" style={{ position: 'relative' }}>
      
      {/* FULLY VISIBLE THEME TOGGLE */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 999 }}>
        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'var(--bg-surface)', 
            color: 'var(--text-900)', 
            border: '1px solid var(--border)', 
            padding: '0.6rem',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.2s'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <SunIcon size={20} color="var(--primary)" /> : <MoonIcon size={20} color="var(--primary)" />}
        </button>
      </div>

      <div className="auth-left">
        <div style={{ zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <img src="/wasco-logo.png" alt="WASCO" style={{ width: '60px', height: 'auto' }} onError={(e) => e.target.style.display = 'none'} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>WATERWATCH</h2>
          </div>
          <h1>Save Every Drop.</h1>
          <p>Join the WaterWatch network. Report faults, track repairs, and keep Lesotho's water flowing.</p>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-form">
          
          {!isStaffMode ? (
            <>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Community Login</h2>
              <p style={{ color: 'var(--text-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sign in to report water faults</p>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <button type="button" onClick={() => { setMethod('phone'); setIdentifier(''); }} style={{ background: 'none', border: 'none', padding: '0.5rem', fontWeight: 600, color: method === 'phone' ? 'var(--primary)' : 'var(--text-400)', borderBottom: method === 'phone' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>Phone Number</button>
                <button type="button" onClick={() => { setMethod('email'); setIdentifier(''); }} style={{ background: 'none', border: 'none', padding: '0.5rem', fontWeight: 600, color: method === 'email' ? 'var(--primary)' : 'var(--text-400)', borderBottom: method === 'email' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>Email</button>
              </div>

              <form onSubmit={submitCommunity}>
                <div className="form-group">
                  <label>{method === 'phone' ? 'Phone Number' : 'Email Address'}</label>
                  <input type={method === 'phone' ? 'tel' : 'email'} value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder={method === 'phone' ? '+266 5000 0000' : 'name@example.com'} />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                
                {err && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem', background: '#FEF2F2', padding: '0.5rem', borderRadius: '4px' }}>{err}</div>}
                
                <button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: 'white' }} disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-600)' }}>
                <span>Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Register</Link></span>
                <button onClick={() => setIsStaffMode(true)} style={{ background: 'none', border: 'none', color: 'var(--text-400)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Staff Portal</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <button onClick={() => setIsStaffMode(false)} style={{ background: 'none', border: 'none', color: 'var(--text-400)', cursor: 'pointer', fontSize: '1.2rem' }}>&larr;</button>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Staff Portal</h2>
              </div>
              <p style={{ color: 'var(--text-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Authorized WASCO personnel only.</p>

              <form onSubmit={submitStaff}>
                <div className="form-group">
                  <label>Work Email</label>
                  <input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="e.g. admin@wasco.co.ls" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} placeholder="Enter your password" required />
                </div>

                {staffErr && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem', background: '#FEF2F2', padding: '0.5rem', borderRadius: '4px' }}>{staffErr}</div>}

                <button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: 'white' }} disabled={staffLoading}>
                  {staffLoading ? 'Authenticating…' : 'Access Secure Portal'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}