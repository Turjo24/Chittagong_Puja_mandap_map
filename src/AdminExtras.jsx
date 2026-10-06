import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { check, uploadAll } from './upload'
import { C } from './adminUi'

export default function Extras({ page }) {
  const [notices, setNotices] = useState([]), [sp, setSp] = useState([])
  const [n, setN] = useState({ title: '', body: '' })
  const [s, setS] = useState({ name: '', tier: 'gold', tagline: '', link: '' }), [logo, setLogo] = useState(null), [msg, setMsg] = useState('')
  const load = async () => {
    setNotices((await sb.from('notices').select('*').order('created_at', { ascending: false }).limit(20)).data || [])
    setSp((await sb.from('sponsors').select('*').order('created_at')).data || [])
  }
  useEffect(() => { load() }, [])
  const postN = async (e) => { e.preventDefault(); await sb.from('notices').insert(n); setN({ title: '', body: '' }); load() }
  const delN = async (id) => { await sb.from('notices').delete().eq('id', id); load() }
  async function addS(e) {
    e.preventDefault(); const f = e.currentTarget; setMsg('')
    try {
      let up = []
      if (logo) { const er = check([logo]); if (er) return setMsg(er); up = await uploadAll([logo], true) }
      const r = await sb.from('sponsors').insert({ ...s, logo_url: up[0]?.url, logo_path: up[0]?.path })
      if (r.error) throw r.error
      setS({ name: '', tier: 'gold', tagline: '', link: '' }); setLogo(null); f.reset(); load()
    } catch (x) { setMsg(x.message) }
  }
  const delS = async (x) => { if (x.logo_path) await sb.storage.from('photos').remove([x.logo_path]); await sb.from('sponsors').delete().eq('id', x.id); load() }

  return (
    <>
      {page === 'notices' && <>
        <div className={C.sec}>Post a notice</div>
        <form onSubmit={postN} className={C.form}>
          <input className={C.input} required placeholder="Title (jemon: Ashtami Anjali shokal 9 ta e)" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} />
          <input className={C.input} placeholder="Details (optional)" value={n.body} onChange={(e) => setN({ ...n, body: e.target.value })} />
          <div><button className={C.pri}>Post notice</button></div>
        </form>
        <div className={C.list}>
          {notices.map((x) => (
            <div className={C.card} key={x.id}>
              <div className="flex-1 min-w-40"><div className={C.name}>{x.title}</div><div className={C.muted}>{x.body}</div></div>
              <button className={C.danger} onClick={() => delN(x.id)}>✕ Delete</button>
            </div>
          ))}
        </div>
      </>}

      {page === 'sponsors' && <>
        <div className={C.sec}>Add sponsor</div>
        <form onSubmit={addS} className={C.form}>
          <input className={C.input} required placeholder="Sponsor name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
          <select className={C.input} value={s.tier} onChange={(e) => setS({ ...s, tier: e.target.value })}>
            <option value="title">Title Sponsor</option><option value="gold">Gold</option><option value="silver">Silver</option><option value="supporter">Supporter</option>
          </select>
          <input className={C.input} placeholder="Tagline (optional)" value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} />
          <input className={C.input} placeholder="Website link (optional)" value={s.link} onChange={(e) => setS({ ...s, link: e.target.value })} />
          <input className="text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogo(e.target.files[0])} />
          <div><button className={C.pri}>Add sponsor</button></div>
          {msg && <p className={C.msg}>{msg}</p>}
        </form>
        <div className={C.list}>
          {sp.map((x) => (
            <div className={C.card} key={x.id}>
              {x.logo_url && <img className={`${C.img} object-contain`} src={x.logo_url} />}
              <div className="flex-1 min-w-40"><div className={C.name}>{x.name} <span className="font-normal text-[var(--mu)]">· {x.tier}</span></div><div className={C.muted}>{x.tagline}</div></div>
              <button className={C.danger} onClick={() => delS(x)}>✕ Delete</button>
            </div>
          ))}
        </div>
      </>}
    </>
  )
}
