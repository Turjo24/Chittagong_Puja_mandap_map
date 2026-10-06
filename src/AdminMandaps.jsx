import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { C } from './adminUi'

export default function AllMandaps() {
  const [list, setList] = useState([]), [q, setQ] = useState(''), [msg, setMsg] = useState('')
  const load = async () => setList((await sb.from('mandaps').select('*').order('name')).data || [])
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

  const t = q.trim().toLowerCase()
  const shown = list
    .filter((m) => !t || [m.name, m.area, m.address].some((v) => (v || '').toLowerCase().includes(t)))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

  return (
    <>
      <div className={C.sec}>All mandaps ({shown.length}/{list.length}) · A → Z</div>
      <input className={`${C.input} mb-3`} placeholder="🔍 Search name / area / address" value={q} onChange={(e) => setQ(e.target.value)} />
      {msg && <p className={`${C.msg} mb-2`}>{msg}</p>}
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
