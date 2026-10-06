import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { check, uploadAll } from './upload'
import { C } from './adminUi'

const E = { from_place: '', to_place: '', mandap_id: '', mode: 'cng', fare: '', note: '' }
export default function More({ page }) {
  const [csv, setCsv] = useState(''), [bm, setBm] = useState(''), [msg, setMsg] = useState('')
  const [pr, setPr] = useState([]), [pf, setPf] = useState([]), [routes, setRoutes] = useState([]), [ms, setMs] = useState([])
  const [sch, setSch] = useState([]), [reps, setReps] = useState([])
  const [r, setR] = useState(E), [nf, setNf] = useState({})
  const [s, setS] = useState({ title: '', title_bn: '', day: '', note: '' })
  const [p, setP] = useState({ name: '', role: '', mandap_name: '', contact: '' }), [pic, setPic] = useState(null)

  async function load() {
    setPr((await sb.from('routes').select('*').eq('status', 'pending').order('created_at')).data || [])
    setPf((await sb.from('route_fares').select('*, routes(from_place,to_place,status)').eq('status', 'pending').order('created_at')).data || [])
    setRoutes((await sb.from('routes').select('*, route_fares(id,fare,status,created_at)').eq('status', 'approved').order('created_at', { ascending: false })).data || [])
    setMs((await sb.from('mandaps').select('id,name').eq('status', 'approved').order('name')).data || [])
    setSch((await sb.from('schedule').select('*').order('day')).data || [])
    setReps((await sb.from('reps').select('*').order('sort').order('created_at')).data || [])
  }
  useEffect(() => {
    load()
    const ch = sb.channel('more-live').on('postgres_changes', { event: '*', schema: 'public', table: 'route_fares' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, load).subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])

  async function bulk(e) {
    e.preventDefault(); setBm('')
    const rows = csv.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split(/\t|,/).map((x) => x.trim()))
      .map(([name, area, lat, lng, theme, artist]) => ({ name, area, lat: parseFloat(lat), lng: parseFloat(lng), theme, artist, status: 'approved' }))
      .filter((x) => x.name && !isNaN(x.lat) && !isNaN(x.lng))
    if (!rows.length) return setBm('Kono valid line nai. Format: name, area, lat, lng, theme, artist')
    const { error } = await sb.from('mandaps').insert(rows)
    setBm(error ? error.message : `${rows.length} ta mandap add hoyeche ✓`); if (!error) setCsv('')
  }
  const okRoute = async (x) => { await sb.from('routes').update({ status: 'approved' }).eq('id', x.id); await sb.from('route_fares').update({ status: 'approved' }).eq('route_id', x.id).eq('status', 'pending'); load() }
  const noRoute = async (x) => { await sb.from('routes').delete().eq('id', x.id); load() }
  const okFare = async (f) => { await sb.from('route_fares').update({ status: 'approved' }).eq('id', f.id); load() }
  const noFare = async (f) => { await sb.from('route_fares').delete().eq('id', f.id); load() }
  async function addRoute(e) {
    e.preventDefault(); setMsg('')
    const m = ms.find((x) => x.id == r.mandap_id)
    const ins = await sb.from('routes').insert({ from_place: r.from_place, to_place: r.to_place || m?.name, mandap_id: r.mandap_id || null, mode: r.mode, note: r.note, status: 'approved' }).select('id').single()
    if (ins.error) return setMsg(ins.error.message)
    await sb.from('route_fares').insert({ route_id: ins.data.id, fare: +r.fare, status: 'approved', suggested_by: 'admin' })
    setR(E); load()
  }
  const addFare = async (x) => { const v = nf[x.id]; if (v === undefined || v === '') return; await sb.from('route_fares').insert({ route_id: x.id, fare: +v, status: 'approved', suggested_by: 'admin' }); setNf({ ...nf, [x.id]: '' }); load() }
  const delRoute = async (x) => { await sb.from('routes').delete().eq('id', x.id); load() }
  const addSch = async (e) => { e.preventDefault(); await sb.from('schedule').insert(s); setS({ title: '', title_bn: '', day: '', note: '' }); load() }
  const delSch = async (x) => { await sb.from('schedule').delete().eq('id', x.id); load() }
  async function addRep(e) {
    e.preventDefault(); const f = e.currentTarget; setMsg('')
    try {
      let up = []
      if (pic) { const er = check([pic]); if (er) return setMsg(er); up = await uploadAll([pic]) }
      const x = await sb.from('reps').insert({ ...p, photo_url: up[0]?.url, photo_path: up[0]?.path })
      if (x.error) throw x.error
      setP({ name: '', role: '', mandap_name: '', contact: '' }); setPic(null); f.reset(); load()
    } catch (x) { setMsg(x.message) }
  }
  const delRep = async (x) => { if (x.photo_path) await sb.storage.from('photos').remove([x.photo_path]); await sb.from('reps').delete().eq('id', x.id); load() }
  const cur = (x) => (x.route_fares || []).filter((f) => f.status === 'approved').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.fare

  return (
    <>
      {page === 'mandaps' && <>
        <div className={C.sec}>Create: Bulk add mandaps</div>
        <form onSubmit={bulk} className={C.form}>
          <p className={C.muted}>Protita line e ekta mandap: <b>name, area, lat, lng, theme, artist</b> (Excel/Google Sheet theke copy-paste o cholbe)</p>
          <textarea className={C.textarea} placeholder={'Agrabad Sarbojanin, Agrabad, 22.3250, 91.8100, Traditional, Artist Name'} value={csv} onChange={(e) => setCsv(e.target.value)} />
          <div><button className={C.pri}>Add all</button></div>
          {bm && <p className="text-sm text-green-700">{bm}</p>}
        </form>
      </>}

      {page === 'routes' && <>
        <div className={C.sec}>Route / fare requests</div>
        {!pr.length && !pf.filter((f) => f.routes?.status === 'approved').length && <p className={C.muted}>Kichu nai.</p>}
        <div className={C.list}>
          {pr.map((x) => (
            <div className={C.card} key={x.id}>
              <div className="flex-1 min-w-40"><div className={C.name}>{x.from_place} → {x.to_place} <span className="font-normal text-[var(--mu)]">· {x.mode}</span></div><div className={C.muted}>{x.note} · by {x.suggested_by} · {x.suggester_email}</div></div>
              <div className={C.acts}><button className={C.pri} onClick={() => okRoute(x)}>✓ Approve</button><button className={C.danger} onClick={() => noRoute(x)}>✕ Reject</button></div>
            </div>
          ))}
          {pf.filter((f) => f.routes?.status === 'approved').map((f) => (
            <div className={C.card} key={f.id}>
              <div className="flex-1 min-w-40">Notun bhara: <b>৳{f.fare}</b> · {f.routes?.from_place} → {f.routes?.to_place}<div className={C.muted}>by {f.suggested_by} · {f.suggester_email}</div></div>
              <div className={C.acts}><button className={C.pri} onClick={() => okFare(f)}>✓ Approve</button><button className={C.danger} onClick={() => noFare(f)}>✕ Reject</button></div>
            </div>
          ))}
        </div>

        <div className={C.sec}>Add route (admin)</div>
        <form onSubmit={addRoute} className={C.form}>
          <input className={C.input} required placeholder="From" value={r.from_place} onChange={(e) => setR({ ...r, from_place: e.target.value })} />
          <select className={C.input} value={r.mandap_id} onChange={(e) => setR({ ...r, mandap_id: e.target.value })}><option value="">To mandap (optional)</option>{ms.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          {!r.mandap_id && <input className={C.input} required placeholder="To (destination)" value={r.to_place} onChange={(e) => setR({ ...r, to_place: e.target.value })} />}
          <select className={C.input} value={r.mode} onChange={(e) => setR({ ...r, mode: e.target.value })}><option value="cng">CNG</option><option value="bus">Bus</option><option value="rickshaw">Rickshaw</option><option value="ride">Pathao/Uber</option><option value="other">Other</option></select>
          <input className={C.input} required type="number" min="0" placeholder="Fare (BDT)" value={r.fare} onChange={(e) => setR({ ...r, fare: e.target.value })} />
          <input className={C.input} placeholder="Note" value={r.note} onChange={(e) => setR({ ...r, note: e.target.value })} />
          <div><button className={C.pri}>Add route</button></div>
          {msg && <p className={C.msg}>{msg}</p>}
        </form>
        <div className={C.list}>
          {routes.map((x) => (
            <div className={C.card} key={x.id}>
              <div className="flex-1 min-w-40"><span className={C.name}>{x.from_place} → {x.to_place}</span> <span className={C.muted}>· {x.mode} · now ৳{cur(x) ?? '—'}</span></div>
              <input className={`${C.input} !w-28`} type="number" placeholder="new fare" value={nf[x.id] ?? ''} onChange={(e) => setNf({ ...nf, [x.id]: e.target.value })} />
              <div className={C.acts}><button className={C.pri} onClick={() => addFare(x)}>Update fare</button><button className={C.danger} onClick={() => delRoute(x)}>✕</button></div>
            </div>
          ))}
        </div>
      </>}

      {page === 'schedule' && <>
        <div className={C.sec}>Add schedule (tithi)</div>
        <form onSubmit={addSch} className={C.form}>
          <input className={C.input} required placeholder="Title (Maha Saptami)" value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} />
          <input className={C.input} placeholder="Bangla title" value={s.title_bn} onChange={(e) => setS({ ...s, title_bn: e.target.value })} />
          <input className={C.input} required type="date" value={s.day} onChange={(e) => setS({ ...s, day: e.target.value })} />
          <input className={C.input} placeholder="Note" value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })} />
          <div><button className={C.pri}>Add</button></div>
        </form>
        <div className={C.list}>
          {sch.map((x) => <div className={C.card} key={x.id}><div className="flex-1 min-w-40"><div className={C.name}>{x.title} <span className="font-normal text-[var(--mu)]">· {x.day}</span></div><div className={C.muted}>{x.note}</div></div><button className={C.danger} onClick={() => delSch(x)}>✕</button></div>)}
        </div>
      </>}

      {page === 'reps' && <>
        <div className={C.sec}>Add representative</div>
        <form onSubmit={addRep} className={C.form}>
          <input className={C.input} required placeholder="Name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          <input className={C.input} placeholder="Role (Sovapoti...)" value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })} />
          <input className={C.input} placeholder="Mandap name" value={p.mandap_name} onChange={(e) => setP({ ...p, mandap_name: e.target.value })} />
          <input className={C.input} placeholder="Contact (optional, public hobe)" value={p.contact} onChange={(e) => setP({ ...p, contact: e.target.value })} />
          <input className="text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setPic(e.target.files[0])} />
          <div><button className={C.pri}>Add</button></div>
          {msg && <p className={C.msg}>{msg}</p>}
        </form>
        <div className={C.list}>
          {reps.map((x) => <div className={C.card} key={x.id}>{x.photo_url && <img className="w-16 h-16 rounded-full object-cover" src={x.photo_url} />}<div className="flex-1 min-w-40"><div className={C.name}>{x.name} <span className="font-normal text-[var(--mu)]">· {x.role}</span></div><div className={C.muted}>{x.mandap_name}</div></div><button className={C.danger} onClick={() => delRep(x)}>✕</button></div>)}
        </div>
      </>}
    </>
  )
}
