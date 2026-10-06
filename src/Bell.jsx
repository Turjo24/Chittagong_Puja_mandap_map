import { useEffect, useState } from 'react'
import { sb } from './supabase'

export default function Bell({ lang, t }) {
  const [list, setList] = useState([]), [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(() => { if (localStorage.getItem('seen') === null) localStorage.setItem('seen', Date.now()); return +localStorage.getItem('seen') })
  const load = () => sb.from('notices').select('*').order('created_at', { ascending: false }).limit(15).then(({ data }) => setList(data || []))
  useEffect(() => { load(); const i = setInterval(load, 60000); addEventListener('notice-new', load); return () => { clearInterval(i); removeEventListener('notice-new', load) } }, [])
  const isNew = (n) => new Date(n.created_at).getTime() > seen
  const unread = list.filter(isNew).length
  const toggle = () => { if (open) { const now = Date.now(); localStorage.setItem('seen', now); setSeen(now) } else load(); setOpen(!open) }
  const fmt = (d) => new Date(d).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="bell">
      <button className="btn" onClick={toggle}>🔔{unread > 0 && <em>{unread}</em>}</button>
      {open && (
        <div className="dd">
          <h4>{t.notices}</h4>
          {!list.length && <p className="muted">{t.nonotice}</p>}
          {list.map((n) => (
            <div key={n.id} className={'nt' + (isNew(n) ? ' new' : '')}>
              <b>{n.title}</b>{n.body && <p>{n.body}</p>}<small>{fmt(n.created_at)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
