import { useEffect, useState } from 'react'
import { sb } from './supabase'
const ini = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Reps({ lang }) {
  const bn = lang === 'bn'
  const [list, setList] = useState(null)
  useEffect(() => { sb.from('reps').select('*').order('sort').order('created_at').then(({ data }) => setList(data || [])) }, [])
  return (
    <div className="page"><div className="wrap">
      <div className="shero">
        <h2 className="title">{bn ? 'পূজা কমিটির প্রতিনিধি' : 'Committee Representatives'}</h2>
        <p className="muted">{bn ? 'যাঁরা আপনাদের পূজা আয়োজনে নেতৃত্ব দিচ্ছেন' : 'The people leading the puja celebrations'}</p>
      </div>
      <div className="rgrid">
        {(list || []).map((r) => (
          <div className="rep" key={r.id}>
            {r.photo_url ? <img className="avatar" src={r.photo_url} loading="lazy" alt={r.name} /> : <div className="avatar">{ini(r.name)}</div>}
            <h4>{r.name}</h4>
            {r.role && <small>{r.role}</small>}
            {r.mandap_name && <small>🪔 {r.mandap_name}</small>}
            {r.contact && <a href={`tel:${r.contact}`}><small>☎ {r.contact}</small></a>}
          </div>
        ))}
      </div>
      {list && !list.length && <p className="muted" style={{ textAlign: 'center' }}>{bn ? 'শীঘ্রই যোগ করা হবে।' : 'Coming soon.'}</p>}
    </div></div>
  )
}
