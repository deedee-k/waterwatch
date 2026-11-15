import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isOnline } from '../lib/sync'
import { offlineSignIn } from '../lib/auth-utils'
import { useLanguage } from '../lib/i18n'


export default function Login() {
  const nav = useNavigate()

  // Community Login State
  const [method, setMethod] = useState('phone')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Staff Quick Access State
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffRole, setStaffRole] = useState('wasco')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffErr, setStaffErr] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    const email = method === 'phone' ? `${identifier.replace(/\D/g, '')}@waterwatch.local` : identifier
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setErr(error.message)
    nav('/')
  }

  async function handleStaffLogin(e) {
    e.preventDefault()
    setStaffErr(''); setStaffLoading(true)

    const email = staffRole === 'wasco' ? 'wasco@waterwatch.com' : 'tech@waterwatch.com'

    const { error } = await supabase.auth.signInWithPassword({ email, password: staffPassword })
    setStaffLoading(false)

    if (error) return setStaffErr("Incorrect password. Try 'wasco123' or 'tech123'")
    nav('/')
  }

  return (
    <div className="auth-wrapper" style={{ position: 'relative' }}>

      {/* GLASSMORPHISM STAFF ACCESS BUTTON */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 999 }}>
        <button
          onClick={() => setShowStaffModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '0.6rem 1.2rem',
            borderRadius: '50px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
        >
          🔒 Staff Access
        </button>
      </div>

      <div className="auth-left">
        <div style={{ zIndex: 10 }}>
          {/* Fallback if image is missing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <img src="/wasco-logo.png" alt="WASCO" style={{ width: '60px', height: 'auto' }} onError={(e) => e.target.style.display = 'none'} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>WASCO</h2>
          </div>
          <h1>Save Every Drop.</h1>
          <p>Join the WaterWatch network. Report faults, track repairs, and keep Lesotho's water flowing.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Community Login</h2>
          <p style={{ color: 'var(--text-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sign in to report water faults</p>

          {/* Login Method Toggle */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <button type="button" onClick={() => { setMethod('phone'); setIdentifier(''); }} style={{ background: 'none', border: 'none', padding: '0.5rem', fontWeight: 600, color: method === 'phone' ? 'var(--primary)' : 'var(--text-400)', borderBottom: method === 'phone' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>Phone Number</button>
            <button type="button" onClick={() => { setMethod('email'); setIdentifier(''); }} style={{ background: 'none', border: 'none', padding: '0.5rem', fontWeight: 600, color: method === 'email' ? 'var(--primary)' : 'var(--text-400)', borderBottom: method === 'email' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>Email</button>
          </div>

          <form onSubmit={submit}>
            <div className="form-group">
              <label>{method === 'phone' ? 'Phone Number' : 'Email Address'}</label>
              <input type={method === 'phone' ? 'tel' : 'email'} value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder={method === 'phone' ? '+266 5000 0000' : 'name@example.com'} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>

            {err && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{err}</div>}

            <button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: 'white' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ fontSize: '0.85rem', marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-600)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Register</Link>
          </p>
        </div>
      </div>

      {/* STAFF QUICK ACCESS MODAL */}
      {showStaffModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Staff Access</h3>
              <button className="close-btn" onClick={() => setShowStaffModal(false)}>&times;</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-600)', marginBottom: '1.5rem' }}>
              Select a role and enter the demo password to access the internal portals.
            </p>

            <form onSubmit={handleStaffLogin}>
              <div className="form-group">
                <label>Select Portal</label>
                <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                  <option value="wasco">WASCO Operations Center</option>
                  <option value="technician">Technician Field Tasks</option>
                </select>
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder={staffRole === 'wasco' ? 'Demo password: wasco123' : 'Demo password: tech123'}
                  required
                />
              </div>

              {staffErr && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{staffErr}</div>}

              <button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: 'var(--text-900)', color: 'white' }} disabled={staffLoading}>
                {staffLoading ? 'Authenticating…' : 'Access Portal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}