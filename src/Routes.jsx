import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { toast } from './alerts'


const MODES = { cng: ['🛺', 'CNG', 'সিএনজি'], bus: ['🚌', 'Bus', 'বাস'], rickshaw: ['🚲', 'Rickshaw', 'রিকশা'], ride: ['🏍', 'Pathao/Uber', 'পাঠাও/উবার'], other: ['🚶', 'Other', 'অন্যান্য'] }
const hist = (r) => (r.route_fares || []).filter((f) => f.status === 'approved').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

export default function Routes({ lang }) {
  const bn = lang === 'bn'
  const [routes, setRoutes] = useState([]), [ms, setMs] = useState([]), [open, setOpen] = useState(null), [rep, setRep] = useState(null)
  const [q, setQ] = useState(''), [dest, setDest] = useState('')
  const [f, setF] = useState({ fare: '', by: '', email: '' })
  const [s, setS] = useState({ from: '', mandap: '', to: '', mode: 'cng', fare: '', note: '', by: '', email: '' })
  const load = () => sb.from('routes').select('id,from_place,to_place,mandap_id,mode,note,route_fares(id,fare,created_at,status)').eq('status', 'approved').order('created_at', { ascending: false }).then(({ data }) => setRoutes(data || []))
  useEffect(() => { load(); sb.from('mandaps').select('id,name,name_bn').eq('status', 'approved').order('name').then(({ data }) => setMs(data || [])) }, [])
  const nm = (m) => (bn && m.name_bn ? m.name_bn : m.name)
  const ok = () => toast(bn ? 'জমা হয়েছে!' : 'Submitted!', bn ? 'অ্যাডমিন দেখে অনুমোদন করবেন' : 'Admin will review it')
  const list = routes.filter((r) => (!dest || r.mandap_id == dest) && (!q || r.from_place.toLowerCase().includes(q.toLowerCase())))
  const dfmt = (d) => new Date(d).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  async function reportFare(e, r) {
    e.preventDefault()
    const { error } = await sb.from('route_fares').insert({ route_id: r.id, fare: +f.fare, suggested_by: f.by.trim(), suggester_email: f.email.trim() })
    if (error) return toast('Error', error.message)
    setF({ fare: '', by: '', email: '' }); setRep(null); ok()
  }
  async function suggest(e) {
    e.preventDefault()
    const m = ms.find((x) => x.id == s.mandap)
    const { error } = await sb.rpc('suggest_route', { p_from: s.from.trim(), p_to: s.to.trim() || m?.name || '', p_mandap: s.mandap ? +s.mandap : null, p_mode: s.mode, p_fare: +s.fare, p_note: s.note.trim(), p_by: s.by.trim(), p_email: s.email.trim() })
    if (error) return toast('Error', error.message)
    setS({ from: '', mandap: '', to: '', mode: 'cng', fare: '', note: '', by: '', email: '' }); ok()
  }
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value })

  return (
    <div className="page"><div className="wrap">
      <div className="shero">
        <h2 className="title">{bn ? 'মণ্ডপে যেতে কত খরচ?' : 'Getting to the mandaps'}</h2>
        <p className="muted">{bn ? 'কোথা থেকে কোথায়, কিসে করে, আনুমানিক ভাড়া' : 'From where, by what, and the typical fare'}</p>
      </div>
      <div className="ctl" style={{ marginBottom: 8 }}>
        <input placeholder={bn ? 'কোথা থেকে (যেমন: অক্সিজেন)' : 'From (e.g. Oxygen)'} value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={dest} onChange={(e) => setDest(e.target.value)}><option value="">{bn ? 'সব মণ্ডপ' : 'All mandaps'}</option>{ms.map((m) => <option key={m.id} value={m.id}>{nm(m)}</option>)}</select>
      </div>
      {!list.length && <p className="muted">{bn ? 'এখনো কোনো রুট নেই। নিচে থেকে আপনি যোগ করুন!' : 'No routes yet. Add one below!'}</p>}
      {list.map((r) => {
        const h = hist(r), [ic, en, b] = MODES[r.mode] || MODES.other
        return (
          <div className="rc" key={r.id}>
            <div className="top2">
              <div><b className="rt">{r.from_place} → {r.to_place}</b><br /><span className="muted">{ic} {bn ? b : en}{r.note && ` · ${r.note}`}</span></div>
              <div className="fare">{h[0] ? `৳${h[0].fare}` : '—'}</div>
            </div>
            <div className="acts" style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => setOpen(open === r.id ? null : r.id)}>{bn ? 'ভাড়ার ইতিহাস' : 'Fare history'} ({h.length})</button>
              <button className="btn" onClick={() => setRep(rep === r.id ? null : r.id)}>{bn ? 'নতুন ভাড়া জানান' : 'Report new fare'}</button>
            </div>
            {open === r.id && (
              <div className="hist">
                {h.map((x, i) => { const d = h[i + 1] ? x.fare - h[i + 1].fare : 0
                  return <div key={x.id}><span>{dfmt(x.created_at)}</span><b>৳{x.fare} {d > 0 && <span className="up">▲{d}</span>}{d < 0 && <span className="down">▼{-d}</span>}</b></div> })}
              </div>
            )}
            {rep === r.id && (
              <form onSubmit={(e) => reportFare(e, r)} style={{ marginTop: 10 }}>
                <input required type="number" min="0" placeholder={bn ? 'ভাড়া (টাকা)' : 'Fare (BDT)'} value={f.fare} onChange={(e) => setF({ ...f, fare: e.target.value })} />
                <input required placeholder={bn ? 'আপনার নাম' : 'Your name'} value={f.by} onChange={(e) => setF({ ...f, by: e.target.value })} />
                <input required type="email" placeholder={bn ? 'ইমেইল (গোপন)' : 'Email (private)'} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
                <button className="btn pri">{bn ? 'জমা দিন' : 'Submit'}</button>
              </form>
            )}
          </div>
        )
      })}

      <div className="sec">{bn ? 'নতুন রুট যোগ করুন' : 'Suggest a route'}</div>
      <form onSubmit={suggest} className="rc">
        <input required placeholder={bn ? 'কোথা থেকে' : 'From'} value={s.from} onChange={set('from')} />
        <select value={s.mandap} onChange={set('mandap')}><option value="">{bn ? 'কোন মণ্ডপে (ঐচ্ছিক)' : 'To mandap (optional)'}</option>{ms.map((m) => <option key={m.id} value={m.id}>{nm(m)}</option>)}</select>
        {!s.mandap && <input required placeholder={bn ? 'কোথায় (গন্তব্য)' : 'To (destination)'} value={s.to} onChange={set('to')} />}
        <select value={s.mode} onChange={set('mode')}>{Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v[0]} {bn ? v[2] : v[1]}</option>)}</select>
        <input required type="number" min="0" placeholder={bn ? 'ভাড়া (টাকা)' : 'Fare (BDT)'} value={s.fare} onChange={set('fare')} />
        <input placeholder={bn ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'} value={s.note} onChange={set('note')} />
        <input required placeholder={bn ? 'আপনার নাম' : 'Your name'} value={s.by} onChange={set('by')} />
        <input required type="email" placeholder={bn ? 'ইমেইল (গোপন)' : 'Email (private)'} value={s.email} onChange={set('email')} />
        <button className="btn pri">{bn ? 'জমা দিন' : 'Submit'}</button>
      </form>
    </div></div>
  )
}
