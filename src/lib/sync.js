import { db } from './db'
import { supabase } from './supabase'

let syncing = false
const listeners = new Set()

export function onSyncChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emit(state) {
  listeners.forEach(fn => fn(state))
}

export function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine
}

// Pull reference data + own reports into IndexedDB so pages open offline
export async function pullAll(userId, role) {
  emit({ phase: 'pull' })
  try {
    const [{ data: cats }, { data: wps }] = await Promise.all([
      supabase.from('fault_categories').select('*').eq('active', true),
      supabase.from('water_points').select('*')
    ])
    if (cats) await db.categories.bulkPut(cats)
    if (wps) await db.waterPoints.bulkPut(wps)

    // Pull scoped reports depending on role
    let query = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200)
    if (role === 'community') query = query.eq('reporter_id', userId)
    if (role === 'technician') query = query.eq('technician_id', userId)

    const { data: reps, error } = await query
    if (error) throw error
    if (reps) await db.reports.bulkPut(reps)
    emit({ phase: 'pull-done' })
  } catch (e) {
    console.warn('pull failed (offline?)', e.message)
  }
}

// Push one queued item to Supabase
async function pushItem(item) {
  const { kind, payload } = item

  const coreKeys = ['id', 'ref', 'reporter_id', 'category_id', 'water_point_id', 'location_text', 'description', 'status', 'priority', 'technician_id', 'photo_url', 'lat', 'lng', 'created_at', 'updated_at']

  if (kind === 'report.insert') {
    let res = await supabase.from('reports').upsert(payload, { onConflict: 'id' })
    if (res.error && res.error.message && res.error.message.includes('column')) {
      const safePayload = {}
      for (const k of coreKeys) {
        if (payload[k] !== undefined) safePayload[k] = payload[k]
      }
      const retry = await supabase.from('reports').upsert(safePayload, { onConflict: 'id' })
      if (retry.error) throw retry.error
    } else if (res.error) {
      throw res.error
    }

    await supabase.from('report_status_history').insert({
      report_id: payload.id,
      from_status: null,
      to_status: payload.status || 'submitted',
      changed_by: payload.reporter_id,
      note: payload.dispatch_log || (payload.work_order_ref ? `Work Order ${payload.work_order_ref} automatically issued` : 'Report submitted')
    }).catch(e => console.warn('History note warning:', e.message))

    // If report was auto-assigned, generate technician and customer notifications
    if (payload.technician_id) {
      await supabase.from('notifications').insert([
        {
          user_id: payload.technician_id,
          report_id: payload.id,
          type: 'work_order_assigned',
          message_en: `New Work Order ${payload.work_order_ref || payload.ref} assigned to you at ${payload.location_text}`,
          message_st: `Tsebetso e ncha ea tokiso ${payload.work_order_ref || payload.ref} e abetsoe uena Sebakeng sa ${payload.location_text}`
        },
        {
          user_id: payload.reporter_id,
          report_id: payload.id,
          type: 'work_order_issued',
          message_en: `Work order ${payload.work_order_ref || payload.ref} issued immediately. Technician is dispatched.`,
          message_st: `Taelo ea tokiso ${payload.work_order_ref || payload.ref} e lokollotsoe kapele. Setsebi se tseleng.`
        }
      ]).catch(e => console.warn('Notification warning:', e.message))
    }
    return
  }

  if (kind === 'report.update') {
    const { id, ...patch } = payload
    let res = await supabase.from('reports').update(patch).eq('id', id)
    if (res.error && res.error.message && res.error.message.includes('column')) {
      const safePatch = {}
      for (const k of coreKeys) {
        if (patch[k] !== undefined) safePatch[k] = patch[k]
      }
      const retry = await supabase.from('reports').update(safePatch).eq('id', id)
      if (retry.error) throw retry.error
    } else if (res.error) {
      throw res.error
    }
    return
  }

  if (kind === 'report.status_change') {
    const { report_id, from_status, to_status, changed_by, note } = payload
    const { error: e1 } = await supabase
      .from('reports').update({ status: to_status, updated_at: new Date().toISOString() })
      .eq('id', report_id)
    if (e1) throw e1
    
    const { error: e2 } = await supabase.from('report_status_history').insert({
      report_id, from_status, to_status, changed_by, note
    })
    if (e2) throw e2
    return
  }

  if (kind === 'repair.note') {
    const { error } = await supabase.from('repair_notes').insert(payload)
    if (error) throw error
    return
  }

  if (kind === 'photo.upload') {
    const { reportId, blob, filename } = payload
    const path = `reports/${reportId}/${filename}`
    const { error: upErr } = await supabase.storage
      .from('report-photos')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (upErr) throw upErr
    
    const { data: urlData } = supabase.storage
      .from('report-photos').getPublicUrl(path)
    const { error: updErr } = await supabase
      .from('reports').update({ photo_url: urlData.publicUrl })
      .eq('id', reportId)
    if (updErr) throw updErr
    return
  }

  throw new Error('Unknown outbox kind: ' + kind)
}

// Drain the outbox
export async function flushOutbox() {
  if (syncing || !isOnline()) return
  syncing = true
  emit({ phase: 'push-start' })

  const items = await db.outbox.orderBy('created_at').toArray()
  for (const item of items) {
    try {
      await pushItem(item)
      await db.outbox.delete(item.id)
      emit({ phase: 'pushed', item })
    } catch (e) {
      // THIS WILL PRINT THE EXACT ERROR TO YOUR BROWSER CONSOLE
      console.error("SYNC FAILED FOR ITEM:", item.kind, "ERROR:", e.message); 

      const tries = item.tries + 1
      await db.outbox.update(item.id, { tries, last_error: String(e.message || e) })
      emit({ phase: 'error', item, error: e.message })

      // Give up after 8 tries (backoff grows naturally by skipping)
      if (tries >= 8) {
        console.warn('Dropping item after 8 tries', item)
        await db.outbox.delete(item.id)
      }
      break // stop the loop; retry next tick
    }
  }

  syncing = false
  emit({ phase: 'push-done' })
}

// Kick off on reconnect + periodically
export function startSyncLoop(userId, role) {
  const tick = () => {
    if (isOnline()) {
      flushOutbox()
      if (userId) pullAll(userId, role)
    }
  }
  window.addEventListener('online', tick)
  window.addEventListener('offline', () => emit({ phase: 'offline' }))
  const t = setInterval(tick, 30000) // every 30s
  tick()
  return () => {
    clearInterval(t)
    window.removeEventListener('online', tick)
  }
}