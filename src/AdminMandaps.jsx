import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { C } from './adminUi'
import { parseMapsUrl } from './parseMapsUrl'

// Bulk add e jei value gulo default hisebe jabe (existing mandap er moto).
// Table e theme/artist nullable hole ekhane null kore dite paro.
const DEFAULTS = { theme: 'Traditional', artist: 'Not Provided' }

const norm = (s) => (s || '').trim().toLowerCase()
const validNum = (v, min, max) => {
  if (v === '' || v == null) return false
  const n = Number(v)
  return Number.isFinite(n) && n >= min && n <= max
}
// ~30 meter er moddhe thakle same jaygar mandap dhora hoy
const near = (aLat, aLng, bLat, bLng) =>
  Math.abs(aLat - bLat) < 0.0003 && Math.abs(aLng - bLng) < 0.0003

export default function AllMandaps() {
  const [list, setList] = useState([]), [q, setQ] = useState(''), [msg, setMsg] = useState('')
  const [text, setText] = useState('')
  const [rows, setRows] = useState(null)
  const [adding, setAdding] = useState(false)

  async function load() {
    const { data, error } = await sb.from('mandaps').select('*').order('name')
    if (error) return setMsg(error.message)
    setList(data || [])
  }
  useEffect(() => { load() }, [])

  async function del(m) {
    if (!confirm(`"${m.name}" delete korben? Photo gulo o muche jabe.`)) return
    setMsg('')
    const { data: ph } = await sb.from('photos').select('path').eq('mandap_id', m.id)
    const paths = (ph || []).map((p) => p.path).filter(Boolean)
    if (paths.length) await sb.storage.from('photos').remove(paths)
    const { error } = await sb.from('mandaps').delete().eq('id', m.id)
    if (error) return setMsg(error.message)
    load()
  }

  // Same naam+area, ba ~30m er moddhe onno mandap ache kina
  const findDup = (name, area, lat, lng) =>
    list.find(
      (m) =>
        (norm(m.name) === norm(name) && norm(m.area) === norm(area)) ||
        (m.lat != null && m.lng != null && near(lat, lng, Number(m.lat), Number(m.lng)))
    )

  // ---- Bulk add ----
  // Prottek line e ekta link. Naam dite chaile: "Naam | link"
  function preview() {
    setMsg('')
    const out = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line, i) => {
        const parts = line.split('|').map((s) => s.trim())
        const url = parts[parts.length - 1]
        const given = parts.length > 1 ? parts[0] : ''
        const p = parseMapsUrl(url)
        return {
          id: i,
          url,
          name: given || p.name || '',
          area: '',
          lat: p.lat ?? '',
          lng: p.lng ?? '',
          short: p.short
        }
      })
    if (!out.length) return setMsg('Kono link paoa jayni.')
    setRows(out)
  }

  const setRow = (id, k, v) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)))
  const dropRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id))

  // Row te kono somossa thakle string, na thakle null
  function problem(r, idx) {
    if (!/^https?:\/\//i.test(r.url)) return 'Eta Google Maps link na'
    if (!r.name.trim()) return 'Naam lagbe'
    if (!validNum(r.lat, -90, 90) || !validNum(r.lng, -180, 180)) {
      return r.short ? 'Short link — lat/lng nije din' : 'lat/lng paoa jayni — nije din'
    }
    const lat = Number(r.lat), lng = Number(r.lng)
    const dup = findDup(r.name, r.area, lat, lng)
    if (dup) return `Already ache: ${dup.name}`
    const earlier = rows.slice(0, idx).find(
      (o) =>
        validNum(o.lat, -90, 90) && validNum(o.lng, -180, 180) &&
        ((norm(o.name) === norm(r.name) && norm(o.area) === norm(r.area)) ||
          near(lat, lng, Number(o.lat), Number(o.lng)))
    )
    if (earlier) return 'Batch er moddhei duplicate'
    return null
  }

  const checked = (rows || []).map((r, i) => ({ r, err: problem(r, i) }))
  const okRows = checked.filter((x) => !x.err).map((x) => x.r)

  async function addAll() {
    if (!okRows.length) return
    if (!confirm(`${okRows.length} ta mandap map-e add korben?`)) return
    setAdding(true)
    setMsg('')
    const { error } = await sb.from('mandaps').insert(
      okRows.map((r) => ({
        name: r.name.trim(),
        area: r.area.trim() || null,
        lat: Number(r.lat),
        lng: Number(r.lng),
        status: 'approved',
        ...DEFAULTS
      }))
    )
    setAdding(false)
    if (error) return setMsg(error.message)
    const done = new Set(okRows.map((r) => r.id))
    const left = rows.filter((r) => !done.has(r.id))
    setRows(left.length ? left : null)
    if (!left.length) setText('')
    setMsg(`${okRows.length} ta mandap add hoyeche.${left.length ? ` ${left.length} ta baki ache (niche dekho).` : ''}`)
    load()
  }

  const t = q.trim().toLowerCase()
  const shown = list
    .filter((m) => !t || [m.name, m.area, m.address].some((v) => (v || '').toLowerCase().includes(t)))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

  return (
    <>
      {msg && <p className={`${C.msg} mb-2`}>{msg}</p>}

      <div className={C.sec}>Bulk add (Google Maps link)</div>
      <p className={C.muted}>
        Prottek line e ekta link paste koro. Naam dite chaile <b>Naam | link</b> format e likho.
        Short link (maps.app.goo.gl) theke lat/lng ber hoy na, oigulo preview te nije dite hobe.
      </p>
      <textarea
        className={`${C.input} mb-2`}
        rows={5}
        placeholder={'https://www.google.com/maps/place/...\nSatish Babu Lane Puja Mandap | https://maps.app.goo.gl/...'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className={C.btn || 'btn pri'} onClick={preview}>Preview</button>

      {rows && (
        <div className="mt-3">
          <div className={C.list}>
            {checked.map(({ r, err }) => (
              <div className={C.card} key={r.id}>
                <div className="flex-1 min-w-40">
                  <div className="flex gap-2 flex-wrap mb-2">
                    <input className={C.input} placeholder="Naam" value={r.name} onChange={(e) => setRow(r.id, 'name', e.target.value)} />
                    <input className={C.input} placeholder="Area (optional)" value={r.area} onChange={(e) => setRow(r.id, 'area', e.target.value)} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <input className={C.input} placeholder="Latitude" value={r.lat} onChange={(e) => setRow(r.id, 'lat', e.target.value)} />
                    <input className={C.input} placeholder="Longitude" value={r.lng} onChange={(e) => setRow(r.id, 'lng', e.target.value)} />
                  </div>
                  <div className={C.muted}>{err ? `⚠ ${err}` : '✓ Ready'}</div>
                </div>
                <button className={C.danger} onClick={() => dropRow(r.id)}>✕</button>
              </div>
            ))}
          </div>
          <button className={`${C.btn || 'btn pri'} mt-3`} disabled={adding || !okRows.length} onClick={addAll}>
            {adding ? 'Adding...' : `Add ${okRows.length} / ${rows.length} mandap`}
          </button>
        </div>
      )}

      <div className={`${C.sec} mt-6`}>All mandaps ({shown.length}/{list.length}) · A → Z</div>
      <input className={`${C.input} mb-3`} placeholder="🔍 Search name / area / address" value={q} onChange={(e) => setQ(e.target.value)} />
      {!shown.length && <p className={C.muted}>Kichu nai.</p>}
      <div className={C.list}>
        {shown.map((m) => (
          <div className={C.card} key={m.id}>
            <div className="flex-1 min-w-40">
              <div className={C.name}>{m.name} <span className="font-normal text-[var(--mu)]">· {m.area}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${m.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span></div>
              <div className={C.muted}>{m.address} {m.theme && `· ${m.theme}`} {m.artist && `· ${m.artist}`}</div>
            </div>
            <button className={C.danger} onClick={() => del(m)}>✕ Delete</button>
          </div>
        ))}
      </div>
    </>
  )
}