const MONTHS = [
  'януари', 'февруари', 'март', 'април', 'май', 'юни',
  'юли', 'август', 'септември', 'октомври', 'ноември', 'декември',
]

export function parse(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function iso(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function formatBg(s) {
  const d = parse(s)
  if (!d) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} г.`
}

export function yearOf(s) {
  const d = parse(s)
  return d ? d.getFullYear() : ''
}

export function addDays(s, n) {
  const d = parse(s)
  if (!d) return ''
  d.setDate(d.getDate() + n)
  return iso(d)
}

export function addMonths(s, n) {
  const d = parse(s)
  if (!d) return ''
  d.setMonth(d.getMonth() + n)
  return iso(d)
}

export function yearsSince(s) {
  const d = parse(s)
  if (!d) return 1
  const now = new Date()
  let y = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) y--
  return Math.max(1, y)
}

/** Suggested date for a помен. The 40th day counts the day of death as day 1. */
export function suggestedDate(type, death, years = 1) {
  if (!death) return ''
  if (type === 'd40') return addDays(death, 39)
  if (type === 'm6') return addMonths(death, 6)
  if (type === 'y1') return addMonths(death, 12)
  if (type === 'yearly') return addMonths(death, 12 * years)
  return ''
}

const esc = (t) => t.replace(/[\\,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n')

/** Builds an .ics file with all-day events and a reminder 3 days before each. */
export function toICS(events) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//nekrolog-mvp//BG', 'CALSCALE:GREGORIAN']
  events.forEach((e, i) => {
    const d = e.date.replace(/-/g, '')
    const next = addDays(e.date, 1).replace(/-/g, '')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${d}-${i}-${Math.random().toString(36).slice(2)}@nekrolog`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${next}`,
      `SUMMARY:${esc(e.title)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P3D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(e.title)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
