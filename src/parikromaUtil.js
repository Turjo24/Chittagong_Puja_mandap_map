export const DAYS = [
  ['• পঞ্চমী', 'পঞ্চমী'],
  ['• ষষ্ঠী', 'ষষ্ঠী'],
  ['• সপ্তমী', 'সপ্তমী'],
  ['• অষ্টমী', 'অষ্টমী'],
  ['• নবমী', 'নবমী'],
  ['• দশমী', 'দশমী'],
]
export const dayLabel = (k) => {
  const key = String(k || '').trim().toLowerCase()
  const hit = DAYS.find((d) => d[0] === key)
  return hit ? hit[1] : key.charAt(0).toUpperCase() + key.slice(1)
}

const emoji = /[\p{Extended_Pictographic}\uFE0F\u200d]/gu
const strip = (s) => s.replace(/\*\*/g, '').replace(emoji, '').trim()
const routeHead = /^(রুট|route)\s*[–—-]?\s*[\d০-৯]+\s*[:：.]?\s*/i

// "A → B → C" (ba new line) theke array
export const splitStops = (t) =>
  (t || '').split(/→|->|\n/).map((s) => s.trim()).filter(Boolean)

/*
  Pura route guide text paste korle eta bhege dei:
    🚩 / "রুট–০১:" / "Route 1:"  -> notun route
    🔸 / "## "                    -> route er bhitore section
    "A → B → C"                   -> jaigar list
  ━━━ line, heading, footer ignore hoy.
*/
export function parseRoutes(text) {
  const out = []
  let cur = null, sec = null
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || /^[━─=_\-\s]{3,}$/.test(line)) continue
    const c = strip(line)
    if (!c) continue

    if (line.includes('🚩') || routeHead.test(c)) {
      cur = { title: c.replace(routeHead, '').replace(/^#+\s*/, ''), days: [], time_note: '', sort: 0, sections: [] }
      out.push(cur)
      sec = null
      continue
    }
    if (!cur) continue // route shuru hoyar age er heading skip

    if (line.includes('🔸') || /^##\s/.test(c)) {
      sec = { heading: c.replace(/^#+\s*/, ''), text: '' }
      cur.sections.push(sec)
      continue
    }
    const hasArrow = /→|->/.test(c)
    // arrow nai + lomba/| thakle eta footer/paragraph, skip
    if (!hasArrow && (c.length > 40 || c.includes('|'))) continue

    if (!sec) { sec = { heading: '', text: '' }; cur.sections.push(sec) }
    sec.text = sec.text ? `${sec.text} → ${c}` : c
  }
  return out
}

// DB row <-> edit form
export const toDraft = (r) => ({
  title: r.title || '',
  days: r.days || [],
  time_note: r.time_note || '',
  sort: r.sort ?? 0,
  sections: (r.sections || []).map((s) => ({ heading: s.heading || '', text: (s.stops || []).join(' → ') }))
})
export const fromDraft = (d) => ({
  title: d.title.trim(),
  days: d.days,
  time_note: d.time_note.trim() || null,
  sort: Number(d.sort) || 0,
  sections: d.sections
    .map((s) => ({ heading: s.heading.trim(), stops: splitStops(s.text) }))
    .filter((s) => s.stops.length)
})