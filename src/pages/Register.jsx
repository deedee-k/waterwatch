import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const nav = useNavigate()
  const [method, setMethod] = useState('phone')
  const [form, setForm] = useState({ identifier: '', password: '', full_name: '', village: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    
    const rawPhone = form.identifier.replace(/\D/g, '')
    const email = method === 'phone' ? `${rawPhone}@waterwatch.local` : form.identifier
    const phone = method === 'phone' ? form.identifier : null

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: form.password,
      options: { 
        data: { 
          full_name: form.full_name,
          role: 'community' // HARDCODED: Public registration is ALWAYS community
        } 
      }
    })
    setLoading(false)
    if (error) return setErr(error.message)

    if (data.user) {
      await supabase.from('profiles').update({ 
        phone: phone, 
        village: form.village 
      }).eq('id', data.user.id)
    }
    nav('/')
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div style={{ zIndex: 10 }}>
          <img src="/wasco-logo.png" alt="WASCO" style={{ width: '160px', marginBottom: '2rem' }} onError={(e) => e.target.style.display = 'none'} />
          <h1>Join the Community.</h1>
          <p>Create an account to report water faults in your area and help WASCO respond faster.</p>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-form" style={{ maxWidth: '500px' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Create Community Account</h2>
          <p style={{ color: 'var(--text-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Join your community in improving water services.</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <button type="button" onClick={() => { setMethod('phone'); setForm({...form, identifier: ''}); }} style={{ background: 'none', border: 'none', padding: '0.5rem', fontWeight: 600, color: method === 'phone' ? 'var(--primary)' : 'var(--text-400)', borderBottom: method === 'phone' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>Phone Number</button>
            <button type="button" onClick={() => { setMethod('email'); setForm({...form, identifier: ''}); }} style={{ background: 'none', border: 'none', padding: '0.5rem', fontWeight: 600, color: method === 'email' ? 'var(--primary)' : 'var(--text-400)', borderBottom: method === 'email' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>Email</button>
          </div>

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.full_name} onChange={set('full_name')} required placeholder="John Molapo" />
            </div>
            <div className="form-group">
              <label>{method === 'phone' ? 'Phone Number' : 'Email Address'}</label>
              <input type={method === 'phone' ? 'tel' : 'email'} value={form.identifier} onChange={set('identifier')} required placeholder={method === 'phone' ? '+266 5000 0000' : 'name@example.com'} />
            </div>
            <div className="form-group">
              <label>Village / Area</label>
              <input value={form.village} onChange={set('village')} placeholder="e.g. Maseru West" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} minLength={6} required placeholder="••••••••" />
            </div>
            {err && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{err}</div>}
            <button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: 'white' }} disabled={loading}>
              {loading ? 'Creating…' : 'Create Community Account'}
            </button>
          </form>
          <p style={{ fontSize: '0.85rem', marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-600)' }}>
            Already registered? <Link to="/" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-400)' }}>
            WASCO employee? <Link to="/" style={{ color: 'var(--text-600)', fontWeight: '600', textDecoration: 'underline' }}>Staff Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}