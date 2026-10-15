import { useEffect, useMemo, useRef, useState } from 'react'
import { sb } from './supabase'
import { GEO, DIVISIONS, INNER } from './bdDivisions'

const L = {
  bn: {
    title: 'বাংলাদেশ জুড়ে পূজা মণ্ডপ',
    unit: (n) => `${n.toLocaleString('bn-BD')} টি মণ্ডপ`,
    live: 'ডাটাবেস থেকে লাইভ গণনা',
    all: 'সব মণ্ডপ',
    search: 'নাম / এলাকা / ঠিকানা খুঁজুন',
    showAll: 'সব দেখাও',
    dir: 'দিকনির্দেশ',
    none: 'কিছু পাওয়া যায়নি',
    unknown: 'এলাকা দেওয়া নেই',
    loading: 'লোড হচ্ছে...',
    total: 'মোট',
    credit: 'সীমানা: geoBoundaries (CC BY 4.0)'
  },
  en: {
    title: 'Explore Puja mandaps across Bangladesh',
    unit: (n) => `${n} ${n === 1 ? 'mandap' : 'mandaps'}`,
    live: 'Live counts from the database',
    all: 'All mandaps',
    search: 'Search name / area / address',
    showAll: 'Show all',
    dir: 'Directions',
    none: 'Nothing found',
    unknown: 'No area given',
    loading: 'Loading...',
    total: 'Total',
    credit: 'Boundaries: geoBoundaries (CC BY 4.0)'
  }
}

// Division er rong, ar callout card ta kon pashe (left/right) kotha theke boshbe
const META = {
  Rangpur:    { color: '#4fbf6a', side: 'L', y: 190 },
  Rajshahi:   { color: '#8b6fe0', side: 'L', y: 340 },
  Khulna:     { color: '#e0b43a', side: 'L', y: 520 },
  Barishal:   { color: '#35b3a6', side: 'L', y: 700 },
  Mymensingh: { color: '#34d399', side: 'R', y: 130 },
  Sylhet:     { color: '#f08a3c', side: 'R', y: 280 },
  Dhaka:      { color: '#4c8df0', side: 'R', y: 440 },
  Chattogram: { color: '#f2646d', side: 'R', y: 600 }
}
const NAMES = Object.keys(META)

// Canvas ar map er placement (viewBox unit)
const VW = 986, VH = 892, CW = 176, CH = 76, PAD = 22
const MS = 620 / GEO.h
const MX = (VW - GEO.w * MS) / 2, MY = 150

const ringsPath = (rings) =>
  rings.map((r) => {
    let d = 'M' + r[0] + ',' + r[1]
    for (let i = 2; i < r.length; i += 2) d += 'L' + r[i] + ',' + r[i + 1]
    return d + 'Z'
  }).join('')

const inRing = (x, y, r) => {
  let c = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

const toMap = (lng, lat) => [(lng - GEO.minLng) * GEO.sx, (GEO.maxLat - lat) * GEO.sy]
const toCanvas = ([x, y]) => [MX + x * MS, MY + y * MS]

// Ekta mandap kon division e, sheta ber kore. Border er baire porle shobcheye kache marker er division.
function divisionOf(lng, lat) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  const [x, y] = toMap(lng, lat)
  for (const n of NAMES) if (DIVISIONS[n].rings.some((r) => inRing(x, y, r))) return n
  let best = null, bd = Infinity
  for (const n of NAMES) {
    const [mx, my] = DIVISIONS[n].marker
    const d = Math.hypot(mx - x, my - y)
    if (d < bd) { bd = d; best = n }
  }
  return best
}

const cleanArea = (s) => (s || '').replace(/\s+/g, ' ').trim()

export default function MapPage({ lang = 'bn' }) {
  const t = L[lang] || L.bn
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [sel, setSel] = useState(null)
  const [hov, setHov] = useState(null)
  const [q, setQ] = useState('')
  const [narrow, setNarrow] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    sb.from('mandaps').select('id,name,name_bn,area,address,lat,lng').eq('status', 'approved').then(({ data, error }) => {
      if (error) return setErr(error.message)
      setRows(data || [])
    })
  }, [])

  useEffect(() => {
    if (!box.current || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 720))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])

  const items = useMemo(
    () => (rows || []).map((m) => ({ ...m, div: divisionOf(Number(m.lng), Number(m.lat)) })),
    [rows]
  )
  const counts = useMemo(() => {
    const c = Object.fromEntries(NAMES.map((n) => [n, 0]))
    items.forEach((m) => { if (m.div) c[m.div]++ })
    return c
  }, [items])
  const dots = useMemo(
    () => items.filter((m) => Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng))).map((m) => toCanvas(toMap(Number(m.lng), Number(m.lat)))),
    [items]
  )

  const dname = (n) => (lang === 'bn' ? DIVISIONS[n].bn : n)
  const nm = (m) => (lang === 'bn' && m.name_bn ? m.name_bn : m.name)
  const pick = (n) => {
    setSel((s) => (s === n ? null : n))
    document.getElementById('mandap-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const s = q.trim().toLowerCase()
  const shown = useMemo(
    () =>
      items
        .filter((m) => sel === null || m.div === sel)
        .filter((m) => !s || [m.name, m.name_bn, m.area, m.address].some((v) => (v || '').toLowerCase().includes(s)))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'bn', { sensitivity: 'base' })),
    [items, sel, s]
  )

  if (err) return <div className="page"><p className="msg">{err}</p></div>
  if (!rows) return <div className="page"><p className="muted">{t.loading}</p></div>

  const markerOf = (n) => toCanvas(DIVISIONS[n].marker)
  const cardPos = (n) => {
    const m = META[n]
    const x = m.side === 'L' ? PAD : VW - PAD - CW
    return { x, y: m.y, ax: m.side === 'L' ? x + CW : x, ay: m.y + CH / 2 }
  }

  const card = (n, style) => {
    const m = META[n], on = sel === n, lit = on || hov === n
    return (
      <div
        key={n}
        onClick={() => pick(n)}
        onMouseEnter={() => setHov(n)}
        onMouseLeave={() => setHov(null)}
        style={{
          cursor: 'pointer', boxSizing: 'border-box', borderRadius: 14, padding: '10px 14px',
          background: lit ? 'rgba(20,30,52,.95)' : 'rgba(13,20,36,.82)',
          border: `1px solid ${m.color}${lit ? '' : '99'}`,
          boxShadow: lit ? `0 0 18px ${m.color}66` : 'none',
          backdropFilter: 'blur(4px)', transition: 'all .15s', ...style
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '1.05em' }}>{dname(n)}</div>
        <div style={{ opacity: 0.75, fontSize: '.9em', marginTop: 2 }}>{t.unit(counts[n])}</div>
      </div>
    )
  }

  const renderMap = (crop) => (
    <svg
      viewBox={crop ? `${MX - 30} ${MY - 20} ${GEO.w * MS + 60} ${GEO.h * MS + 40}` : `0 0 ${VW} ${VH}`}
      style={crop ? { width: '100%', display: 'block' } : { position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g transform={`translate(${MX},${MY}) scale(${MS})`}>
        {NAMES.map((n) => {
          const on = sel === n, lit = on || hov === n
          return (
            <path
              key={n}
              d={ringsPath(DIVISIONS[n].rings)}
              fill={META[n].color}
              fillOpacity={lit ? 0.85 : sel && !on ? 0.28 : 0.6}
              stroke="rgba(214,240,255,.9)"
              strokeWidth={0.55}
              strokeLinejoin="round"
              filter="url(#glow)"
              style={{ cursor: 'pointer', transition: 'fill-opacity .15s' }}
              onClick={() => pick(n)}
              onMouseEnter={() => setHov(n)}
              onMouseLeave={() => setHov(null)}
            />
          )
        })}
        {INNER && <path d={INNER} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={0.25} style={{ pointerEvents: 'none' }} />}
      </g>

      {/* proti mandap er jayga */}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill="#fff" fillOpacity={0.9} style={{ pointerEvents: 'none' }} />
      ))}

      {NAMES.map((n) => {
        const [mx, my] = markerOf(n), c = META[n].color
        const cp = cardPos(n)
        return (
          <g key={n} style={{ pointerEvents: 'none' }}>
            {!crop && <line x1={cp.ax} y1={cp.ay} x2={mx} y2={my} stroke={c} strokeOpacity={0.55} strokeWidth={1.2} />}
            <circle cx={mx} cy={my} r={20} fill={c} fillOpacity={0.22} />
            <circle cx={mx} cy={my} r={11} fill={c} fillOpacity={0.35} stroke="#fff" strokeWidth={3} />
            {crop && (
              <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="700" fill="#fff">{counts[n]}</text>
            )}
          </g>
        )
      })}
    </svg>
  )

  return (
    <div className="page">
      <div
        ref={box}
        style={{
          containerType: 'inline-size', position: 'relative', borderRadius: 24, overflow: 'hidden', color: '#fff',
          border: '1px solid rgba(255,255,255,.12)',
          background: 'radial-gradient(ellipse at 50% 40%, #15233d 0%, #0b1220 70%)',
          ...(narrow ? { padding: 14 } : { aspectRatio: `${VW}/${VH}` })
        }}
      >
        {!narrow && renderMap(false)}

        {/* title */}
        <div style={narrow ? { marginBottom: 8 } : { position: 'absolute', left: `${(PAD / VW) * 100}%`, top: '3.2%', width: '30%' }}>
          <div style={{ fontSize: narrow ? 24 : 'clamp(18px, 3.4cqw, 40px)', fontWeight: 800, lineHeight: 1.12 }}>{t.title}</div>
          <div style={{ fontSize: narrow ? 13 : 'clamp(11px, 1.35cqw, 15px)', opacity: 0.7, marginTop: 8 }}>{t.total}: {t.unit(rows.length)}</div>
        </div>

        {/* desktop: callout card */}
        {!narrow && NAMES.map((n) => {
          const p = cardPos(n)
          return card(n, {
            position: 'absolute', left: `${(p.x / VW) * 100}%`, top: `${(p.y / VH) * 100}%`,
            width: `${(CW / VW) * 100}%`, height: `${(CH / VH) * 100}%`,
            fontSize: 'clamp(10px, 1.7cqw, 17px)', display: 'flex', flexDirection: 'column', justifyContent: 'center'
          })
        })}

        {/* mobile: map niche card grid */}
        {narrow && (
          <>
            {renderMap(true)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {NAMES.map((n) => card(n, { fontSize: 14 }))}
            </div>
          </>
        )}

        <div style={{ position: narrow ? 'static' : 'absolute', left: PAD, bottom: 18, marginTop: narrow ? 12 : 0, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', fontSize: narrow ? 12 : 'clamp(10px, 1.3cqw, 13px)', opacity: 0.85 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: '#34d399' }} />{t.live}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>{t.credit}</p>

      {/* ---- full list ---- */}
      <div className="sec" id="mandap-list" style={{ marginTop: 18 }}>
        {t.all} ({shown.length}/{rows.length}){sel !== null && <> · {dname(sel)}</>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input style={{ flex: 1, minWidth: 220 }} placeholder={'🔍 ' + t.search} value={q} onChange={(e) => setQ(e.target.value)} />
        {sel !== null && <button className="btn" onClick={() => setSel(null)}>✕ {t.showAll}</button>}
      </div>
      {!shown.length && <p className="muted">{t.none}</p>}
      {shown.map((m) => (
        <div className="card" key={m.id} style={{ cursor: 'default' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0 }}>{nm(m)}</h4>
            <small>
              {m.div && <span style={{ color: META[m.div].color, fontWeight: 600 }}>{dname(m.div)}</span>}
              {cleanArea(m.area) ? ` · ${cleanArea(m.area)}` : ''}{m.address ? ` · ${m.address}` : ''}
            </small>
          </div>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`} target="_blank" rel="noreferrer">
            <button className="btn">🧭 {t.dir}</button>
          </a>
        </div>
      ))}
    </div>
  )
}