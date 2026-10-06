import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { C } from './adminUi'

export default function Emails() {
  const [rows, setRows] = useState([]), [q, setQ] = useState('')
  useEffect(() => {
    (async () => {
      const [m, p, r, f] = await Promise.all([
        sb.from('mandaps').select('suggester_email, suggested_by'),
        sb.from('photos').select('uploader_email, uploader_name'),
        sb.from('routes').select('suggester_email, suggested_by'),
        sb.from('route_fares').select('suggester_email, suggested_by'),
      ])
      const map = {}
      const add = (email, name, key) => {
        const e = (email || '').trim().toLowerCase(); if (!e) return
        map[e] = map[e] || { email: e, name: '', mandaps: 0, photos: 0, routes: 0, fares: 0 }
        if (name && !map[e].name) map[e].name = name
        map[e][key]++
      }
      ;(m.data || []).forEach((x) => add(x.suggester_email, x.suggested_by, 'mandaps'))
      ;(p.data || []).forEach((x) => add(x.uploader_email, x.uploader_name, 'photos'))
      ;(r.data || []).forEach((x) => add(x.suggester_email, x.suggested_by, 'routes'))
      ;(f.data || []).forEach((x) => add(x.suggester_email, x.suggested_by, 'fares'))
      setRows(Object.values(map))
    })()
  }, [])

  const t = q.trim().toLowerCase()
  const shown = rows
    .filter((x) => !t || x.email.includes(t) || x.name.toLowerCase().includes(t))
    .sort((a, b) => a.email.localeCompare(b.email))

  return (
    <>
      <div className={C.sec}>User emails ({shown.length}/{rows.length}) · A → Z</div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <input className={`${C.input} flex-1 min-w-48`} placeholder="🔍 Search email / name" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={C.btn} onClick={() => navigator.clipboard.writeText(shown.map((x) => x.email).join(', '))}>📋 Copy all emails</button>
      </div>
      {!shown.length && <p className={C.muted}>Kichu nai.</p>}
      <div className={C.list}>
        {shown.map((x) => (
          <div className={C.card} key={x.email}>
            <div className="flex-1 min-w-40">
              <div className={C.name}>{x.email}{x.name && <span className="font-normal text-[var(--mu)]"> · {x.name}</span>}</div>
              <div className={C.muted}>mandap {x.mandaps} · photo {x.photos} · route {x.routes} · fare {x.fares}</div>
            </div>
            <a href={`mailto:${x.email}`}><button className={C.btn}>✉</button></a>
          </div>
        ))}
      </div>
    </>
  )
}
