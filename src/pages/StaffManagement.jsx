import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { UsersIcon } from '../components/Icons'

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([])
  const [staffEmail, setStaffEmail] = useState('')
  const [staffName, setStaffName] = useState('')
  const [staffRole, setStaffRole] = useState('technician')
  const [staffPassword, setStaffPassword] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadStaff() {
    const { data } = await supabase.from('profiles').select('*').in('role', ['technician', 'wasco'])
    if (data) setStaffList(data)
  }

  useEffect(() => { loadStaff() }, [])

  async function handleInvite(e) {
    e.preventDefault()
    if (staffPassword.length < 6) {
      setInviteMsg('Error: Password must be at least 6 characters.')
      return
    }

    setInviteMsg('Creating account...'); setLoading(true)
    
    // Use standard signUp instead of admin API to avoid RLS trigger crashes
    const { data, error } = await supabase.auth.signUp({
      email: staffEmail,
      password: staffPassword,
      options: {
        data: {
          full_name: staffName,
          role: staffRole
        }
      }
    })

    if (error) {
      setInviteMsg(`Error: ${error.message}`)
      setLoading(false)
      return
    }

    // Successfully created! Now manually update their profile
    if (data.user) {
      await supabase.from('profiles')
        .update({ role: staffRole, full_name: staffName })
        .eq('id', data.user.id)
    }

    setLoading(false)
    setInviteMsg(`✅ ${staffRole} created successfully! They can log in with the password you set.`)
    setStaffEmail(''); setStaffName(''); setStaffPassword(''); await loadStaff()
  }

  return (
    <div className="dash-main">
      <div className="page-header">
        <div>
          <h1>Staff Management</h1>
          <p>Create secure accounts for WASCO administrators and field technicians.</p>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* INVITE FORM */}
        <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginTop: 0 }}>Create Staff Account</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-600)', marginBottom: '1.5rem' }}>
            Create an account and set a temporary password for the new staff member.
          </p>
          
          <form onSubmit={handleInvite}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="e.g. Thabo Mokoena" required />
            </div>
            <div className="form-group">
              <label>Work Email</label>
              <input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} placeholder="e.g. thabo@wasco.co.ls" required />
            </div>
            <div className="form-group">
              <label>Set Password</label>
              <input type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} placeholder="Min 6 characters" required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={staffRole} onChange={e => setStaffRole(e.target.value)}>
                <option value="technician">Field Technician</option>
                <option value="wasco">WASCO Administrator</option>
              </select>
            </div>
            
            {inviteMsg && (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', background: inviteMsg.includes('Error') ? '#FEF2F2' : '#F0FDF4', color: inviteMsg.includes('Error') ? '#991B1B' : '#166534' }}>
                {inviteMsg}
              </div>
            )}
            
            <button type="submit" className="btn-hero" style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: 'white' }} disabled={loading}>
              {loading ? 'Creating...' : '➕ Create Account'}
            </button>
          </form>
        </div>

        {/* CURRENT STAFF LIST */}
        <div>
          <h3 style={{ marginTop: 0 }}>Active Staff</h3>
          <div className="list-group">
            {staffList.map(t => (
              <div key={t.id} className="list-item" style={{ alignItems: 'center' }}>
                <div className="list-icon" style={{ background: '#E0E7FF', color: '#3730A3', fontWeight: 700 }}>
                  {t.full_name?.charAt(0) || 'S'}
                </div>
                <div className="list-content">
                  <div className="list-title">
                    <span>{t.full_name || 'Staff Member'}</span>
                    <span className="status-pill resolved">Active</span>
                  </div>
                  <div className="list-meta">
                    <span>Role: {t.role}</span>
                  </div>
                </div>
              </div>
            ))}
            {staffList.length === 0 && <p style={{ color: 'var(--text-600)' }}>No staff found.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}