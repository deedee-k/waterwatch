import Dexie from 'dexie'

export const db = new Dexie('waterwatch')

db.version(2).stores({
  // mirrors of server tables (read cache)
  categories: 'id, name_en',
  waterPoints: 'id, name',
  reports: 'id, ref, status, reporter_id, technician_id, created_at',
  // outgoing sync queue
  outbox: '++id, kind, payload, created_at, tries, last_error',
  // offline authentication data
  auth: 'session',
  authUsers: 'email, password, role',
  // optional cached profiles for technicians
  profiles: 'id, email, role'
})

export function uuid() {
  return crypto.randomUUID()
}

export function makeRef() {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `WW-${y}${m}${day}-${rnd}`
}

// Queue anything you want to push to Supabase later
export async function enqueue(kind, payload) {
  return db.outbox.add({
    kind,
    payload,
    created_at: Date.now(),
    tries: 0,
    last_error: null
  })
}