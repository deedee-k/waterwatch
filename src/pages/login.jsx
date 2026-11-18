import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const nav = useNavigate()
  
  // Community Login State
  const [method, setMethod] = useState('phone')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Staff Login State
  const [isStaffMode, setIsStaffMode] = useState(false)
  const [staffRole, setStaffRole] = useState('wasco')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffErr, setStaffErr] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)

  async function submitCommunity(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    const email = method === 'phone' ? `${identifier.replace(/\D/g, '')}@waterwatch.local` : identifier
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setErr(error.message)
    nav('/')
  }

  async function submitStaff(e) {
    e.preventDefault()
    setStaffErr(''); setStaffLoading(true)
    
    // These match the accounts you created in Supabase
    const email = staffRole === 'wasco' ? 'wasco@waterwatch.com' : 'tech@waterwatch.com'
    
    const { error } = await supabase.auth.signInWithPassword({ email, password: staffPassword })
    setStaffLoading(false)
    
    if (error) return setStaffErr("Incorrect password. Contact Tec")
    nav('/')
  }

  return (
    <div className="auth-wrapper">
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
            /* --- COMMUNITY LOGIN VIEW --- */
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
                
                {err && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{err}</div>}
                
                <button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: 'white' }} disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-600)' }}>
                <span>Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Register</Link></span>
                
                {/* HIDDEN STAFF PORTAL LINK */}
                <button 
                  onClick={() => setIsStaffMode(true)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-400)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Staff Portal
                </button>
              </div>
            </>
          ) : (
            /* --- STAFF LOGIN VIEW --- */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <button onClick={() => setIsStaffMode(false)} style={{ background: 'none', border: 'none', color: 'var(--text-400)', cursor: 'pointer', fontSize: '1.2rem' }}>&larr;</button>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Staff Portal</h2>
              </div>
              <p style={{ color: 'var(--text-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Authorized WASCO personnel only.</p>

              <form onSubmit={submitStaff}>
                <div className="form-group">
                  <label>Select Department</label>
                  <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                    <option value="wasco">WASCO Operations Center</option>
                    <option value="technician">Technician Field Tasks</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Staff Password</label>
                  <input 
                    type="password" 
                    value={staffPassword} 
                    onChange={(e) => setStaffPassword(e.target.value)} 
                    placeholder={staffRole === 'wasco' ? 'Enter password' : 'Enter password'}
                    required 
                  />
                </div>

                {staffErr && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{staffErr}</div>}

                <button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: 'var(--text-900)', color: 'white' }} disabled={staffLoading}>
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