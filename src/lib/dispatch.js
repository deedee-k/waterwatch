// Intelligent Auto-Dispatch & Work Order Engine for WASCO
// Solves WASCO's 12-24hr work order issuance bottleneck by issuing orders in seconds,
// and unifies disparate intake channels (Mobile App, Call Centre, WhatsApp, Walk-in).

export const INTAKE_CHANNELS = {
  mobile_app: { label: 'Mobile App', iconType: 'smartphone', color: '#0284C7', bg: '#E0F2FE' },
  call_center: { label: 'Call Centre', iconType: 'phone', color: '#7C3AED', bg: '#EDE9FE' },
  whatsapp: { label: 'WhatsApp', iconType: 'message', color: '#16A34A', bg: '#DCFCE7' },
  walk_in: { label: 'Customer Centre', iconType: 'building', color: '#EA580C', bg: '#FFEDD5' }
}

export const SLA_HOURS = {
  urgent: 4,   // 4 hours (e.g., Burst main pipe, severe contamination)
  high: 8,     // 8 hours (e.g., Pipe leak, no water supply in zone)
  medium: 24,  // 24 hours (e.g., Low pressure, meter fault)
  low: 48      // 48 hours (e.g., Minor tap drip, billing inspection)
}

/**
 * Generate official WASCO Work Order Reference: WO-YYMMDD-XXXX
 */
export function generateWorkOrderRef() {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `WO-${y}${m}${day}-${rand}`
}

/**
 * Compute SLA target date based on priority
 */
export function calculateSlaDeadline(priority = 'medium') {
  const hours = SLA_HOURS[priority] || 24
  const target = new Date()
  target.setHours(target.getHours() + hours)
  return target.toISOString()
}

/**
 * Automatically determine priority from category name and description
 */
export function determinePriority(categoryName = '', description = '') {
  const text = `${categoryName} ${description}`.toLowerCase()
  if (text.includes('burst') || text.includes('flooding') || text.includes('sewer') || text.includes('contamination') || text.includes('urgent')) {
    return 'urgent'
  }
  if (text.includes('major leak') || text.includes('no water') || text.includes('outage') || text.includes('broken main')) {
    return 'high'
  }
  if (text.includes('meter') || text.includes('pressure') || text.includes('slow') || text.includes('leak')) {
    return 'medium'
  }
  return 'low'
}

/**
 * Auto-select best technician based on workload and geographical match
 */
export function selectBestTechnician(technicians = [], activeReports = [], preferredLocation = '') {
  if (!technicians || technicians.length === 0) return null

  // 1. Calculate active workload per technician (assigned or in_progress)
  const workloadMap = {}
  technicians.forEach(t => { workloadMap[t.id] = 0 })

  activeReports.forEach(r => {
    if (r.technician_id && ['assigned', 'in_progress'].includes(r.status)) {
      workloadMap[r.technician_id] = (workloadMap[r.technician_id] || 0) + 1
    }
  })

  // 2. Score technicians: lower active workload is better; matching village/zone gives bonus
  const scored = technicians.map(tech => {
    const activeJobs = workloadMap[tech.id] || 0
    let score = activeJobs * 10

    if (preferredLocation && tech.village && 
        (preferredLocation.toLowerCase().includes(tech.village.toLowerCase()) || 
         tech.village.toLowerCase().includes(preferredLocation.toLowerCase()))) {
      score -= 5 // Bonus for local zone presence
    }

    return { tech, score, activeJobs }
  })

  scored.sort((a, b) => a.score - b.score)
  return scored[0]?.tech || technicians[0]
}

/**
 * Formulate an automated dispatch package for a report
 */
export function createAutoDispatchPackage(report, technicians = [], activeReports = [], categoriesMap = {}) {
  const category = categoriesMap[report.category_id]
  const catName = category?.name_en || ''
  const priority = report.priority || determinePriority(catName, report.description)
  const chosenTech = selectBestTechnician(technicians, activeReports, report.location_text)
  const workOrderRef = report.work_order_ref || generateWorkOrderRef()
  const slaDeadline = report.sla_deadline || calculateSlaDeadline(priority)
  const now = new Date().toISOString()

  return {
    work_order_ref: workOrderRef,
    status: 'assigned',
    priority,
    technician_id: chosenTech?.id || null,
    technician_name: chosenTech?.full_name || 'WASCO Central Dispatch',
    work_order_issued_at: now,
    sla_deadline: slaDeadline,
    auto_assigned: true,
    dispatch_log: `Automated Work Order ${workOrderRef} issued in <5s (Legacy baseline: 12-24 hrs). Priority: ${priority.toUpperCase()} (SLA: ${SLA_HOURS[priority]}h). Assigned to ${chosenTech?.full_name || 'Standby Technician'}.`
  }
}

/**
 * Format remaining SLA time
 */
export function getSlaStatus(slaDeadline) {
  if (!slaDeadline) return { label: 'No SLA', isBreached: false, isWarning: false, text: '—' }
  const diffMs = new Date(slaDeadline).getTime() - Date.now()
  const isBreached = diffMs < 0
  const absHours = Math.abs(diffMs) / (1000 * 60 * 60)
  const hours = Math.floor(absHours)
  const minutes = Math.floor((absHours - hours) * 60)

  if (isBreached) {
    return {
      label: 'SLA Breached',
      isBreached: true,
      isWarning: true,
      color: '#DC2626',
      bg: '#FEF2F2',
      text: `-${hours}h ${minutes}m (Breached)`
    }
  }

  const isWarning = hours < 2
  return {
    label: isWarning ? 'SLA Urgent' : 'On Track',
    isBreached: false,
    isWarning,
    color: isWarning ? '#D97706' : '#16A34A',
    bg: isWarning ? '#FFFBEB' : '#F0FDF4',
    text: `${hours}h ${minutes}m left`
  }
}

