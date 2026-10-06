import { useEffect, useState } from 'react'
import { sb } from './supabase'
import Flame from './Flame'
import Extras from './AdminExtras'
import More from './AdminMore'
import AllMandaps from './AdminMandaps'
import Emails from './AdminEmails'
import { enableSound, ting, toast } from './alerts'
import { C, theme } from './adminUi'

export default function Admin() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false)
  const [cred, setCred] = useState({ email: '', password: '' }), [err, setErr] = useState('')
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setReady(true) })
    const { data } = sb.auth.onAuthStateChange((_, s) => setUser(s?.user || null))
    return () => data.subscription.unsubscribe()
  }, [])
  async function login(e) { e.preventDefault(); const { error } = await sb.auth.signInWithPassword(cred); setErr(error?.message || '') }
  if (!ready) return null
  if (!user) return (
    <div style={theme} className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--bd)] rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-3"><Flame size={30} /></div>
        <h2 className={`${C.title} text-center mb-4`}>Admin Login</h2>
        <form onSubmit={login} className="flex flex-col gap-3">
          <input className={C.input} type="email" required placeholder="Email" onChange={(e) => setCred({ ...cred, email: e.target.value })} />
          <input className={C.input} type="password" required placeholder="Password" onChange={(e) => setCred({ ...cred, password: e.target.value })} />
          <button className={C.pri}>Login</button>
          {err && <p className={C.msg}>{err}</p>}
        </form>
        <p className="text-center mt-4 text-sm"><a className="text-[var(--a)] hover:underline" href="#/">← Back to site</a></p>
      </div>
    </div>
  )
  return <Dash />
}

function Dash() {
  const [photos, setPhotos] = useState([]), [mandaps, setMandaps] = useState([]), [st, setSt] = useState({})
  const count = (tb, s) => sb.from(tb).select('*', { count: 'exact', head: true }).eq('status', s).then((r) => r.count || 0)
  async function load() {
    setPhotos((await sb.from('photos').select('*, mandaps(name,status)').eq('status', 'pending').order('created_at')).data || [])
    setMandaps((await sb.from('mandaps').select('*').eq('status', 'pending').order('created_at')).data || [])
    const [pp, ap, pm, am] = await Promise.all([count('photos', 'pending'), count('photos', 'approved'), count('mandaps', 'pending'), count('mandaps', 'approved')])
    setSt({ pp, ap, pm, am })
  }
  const [snd, setSnd] = useState(false)
  const [page, setPage] = useState('dash')
  const [open, setOpen] = useState(false)
  const nav = [
    ['dash', '📊 Dashboard'],
    ['mandaps', '🛕 Mandaps'],
    ['emails', '✉ User emails'],
    ['routes', '🚌 Routes & fares'],
    ['schedule', '📅 Schedule'],
    ['notices', '🔔 Notices'],
    ['sponsors', '⭐ Sponsors'],
    ['reps', '👤 Representatives'],
  ]
  useEffect(() => {
    load()
    const say = (t, b) => { ting(); toast(t, b); load() }
    let pc = 0, pt
    const ch = sb.channel('admin-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mandaps' }, (x) => x.new.status === 'pending' && say('নতুন মণ্ডপ suggestion', x.new.name))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'routes' }, (x) => x.new.status === 'pending' && say('Notun route suggestion', `${x.new.from_place} → ${x.new.to_place}`))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'route_fares' }, (x) => x.new.status === 'pending' && say('Notun bhara report', `${x.new.fare} tk`))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, (x) => {
        if (x.new.status !== 'pending') return
        pc++; clearTimeout(pt); pt = setTimeout(() => { say('Notun photo', `${pc} ta photo pending`); pc = 0 }, 1500)
      }).subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])

  const approvePhoto = async (id) => { await sb.from('photos').update({ status: 'approved' }).eq('id', id); load() }
  const rejectPhoto = async (p) => { if (p.path) await sb.storage.from('photos').remove([p.path]); await sb.from('photos').delete().eq('id', p.id); load() }
  const approveMandap = async (m) => {
    await sb.from('mandaps').update({ status: 'approved' }).eq('id', m.id)
    await sb.from('photos').update({ status: 'approved' }).eq('mandap_id', m.id).eq('status', 'pending'); load()
  }
  const rejectMandap = async (m) => {
    const paths = photos.filter((p) => p.mandap_id === m.id).map((p) => p.path).filter(Boolean)
    if (paths.length) await sb.storage.from('photos').remove(paths)
    await sb.from('mandaps').delete().eq('id', m.id); load()
  }
  const mail = (to, what) => `mailto:${to}?subject=${encodeURIComponent('Puja Map: apnar ' + what + ' approve hoyeche')}&body=${encodeURIComponent('Dhonnobad! Apnar ' + what + ' website e live hoyeche.')}`
  const own = photos.filter((p) => p.mandaps?.status === 'approved')
  const stats = [['Pending photos', st.pp], ['Approved photos', st.ap], ['Pending mandaps', st.pm], ['Approved mandaps', st.am]]

  const go = (k) => { setPage(k); setOpen(false) }
  const menu = (
    <div className="flex flex-col gap-1">
      {nav.map(([k, l]) => (
        <button key={k} onClick={() => go(k)}
          className={`text-left px-3 py-2.5 rounded-lg text-sm transition cursor-pointer ${page === k ? 'bg-[var(--a)] text-white font-medium' : 'text-[var(--tx)] hover:bg-[var(--soft)]'}`}>{l}</button>
      ))}
      <div className="border-t border-[var(--bd)] my-2" />
      <a href="#/" className="px-3 py-2.5 rounded-lg text-sm text-[var(--tx)] hover:bg-[var(--soft)]">← Back to site</a>
      <button onClick={() => sb.auth.signOut()} className="text-left px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer">Logout</button>
    </div>
  )

  return (
    <div style={theme} className="min-h-screen bg-[var(--bg)] text-[var(--tx)]">
      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85%] bg-[var(--card)] p-4 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">🔥 Admin</h3>
              <button onClick={() => setOpen(false)} className="text-2xl leading-none px-2 cursor-pointer" aria-label="Close menu">✕</button>
            </div>
            {menu}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-6 md:py-4 flex gap-5 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0 sticky top-4 bg-[var(--card)] border border-[var(--bd)] rounded-2xl shadow-sm p-3">
          <h3 className="px-2 pb-2 font-bold">🔥 Admin</h3>
          {menu}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-[var(--bg)]/95 backdrop-blur md:static md:mx-0 md:px-0 md:bg-transparent flex items-center gap-3 mb-3">
            <button onClick={() => setOpen(true)} aria-label="Open menu"
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--bd)] bg-[var(--card)] text-xl cursor-pointer">☰</button>
            <h2 className={`${C.title} flex-1 truncate`}>{nav.find((n) => n[0] === page)[1]}</h2>
            <button className={snd ? C.btn : C.pri} onClick={() => { enableSound(); ting(); setSnd(true) }}>{snd ? '🔊 ON' : '🔈 Sound'}</button>
          </div>

          {page === 'dash' && <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map(([l, v]) => (
                <div key={l} className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-4 shadow-sm">
                  <div className="text-xs text-[var(--mu)]">{l}</div>
                  <div className="text-2xl font-bold">{v ?? '—'}</div>
                </div>
              ))}
            </div>

            <div className={C.sec}>New mandap requests</div>
            {!mandaps.length && <p className={C.muted}>Kichu nai.</p>}
            <div className={C.list}>
              {mandaps.map((m) => (
                <div className={C.cardCol} key={m.id}>
                  <div>
                    <div className={C.name}>{m.name} <span className="font-normal text-[var(--mu)]">· {m.area}</span></div>
                    <div className={C.muted}>{m.address} · {m.lat.toFixed(5)}, {m.lng.toFixed(5)}</div>
                    <div className={C.muted}>{m.theme} {m.artist && `· ${m.artist}`}</div>
                    <div className={C.muted}>by {m.suggested_by} · {m.suggester_email}</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {photos.filter((p) => p.mandap_id === m.id).map((p) => <a key={p.id} href={p.url} target="_blank" rel="noreferrer"><img className={C.thumb} src={p.url} /></a>)}
                  </div>
                  <div className={C.acts}>
                    <button className={C.pri} onClick={() => approveMandap(m)}>✓ Approve (photo shoho)</button>
                    <a href={mail(m.suggester_email, 'mandap')}><button className={C.btn}>✉ Notify</button></a>
                    <button className={C.danger} onClick={() => rejectMandap(m)}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={C.sec}>New photos</div>
            {!own.length && <p className={C.muted}>Kichu nai.</p>}
            <div className={C.list}>
              {own.map((p) => (
                <div className={C.card} key={p.id}>
                  <a href={p.url} target="_blank" rel="noreferrer"><img className={C.img} src={p.url} /></a>
                  <div className="flex-1 min-w-40">
                    <div className={C.name}>{p.mandaps?.name}</div>
                    <div className={C.muted}>{p.uploader_name} · {p.uploader_email} · {p.year}</div>
                  </div>
                  <div className={C.acts}>
                    <button className={C.pri} onClick={() => approvePhoto(p.id)}>✓ Approve</button>
                    <a href={mail(p.uploader_email, 'photo')}><button className={C.btn}>✉ Notify</button></a>
                    <button className={C.danger} onClick={() => rejectPhoto(p)}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </>}

          <Extras page={page} />
          <More page={page} />
          {page === 'mandaps' && <AllMandaps />}
          {page === 'emails' && <Emails />}
        </main>
      </div>
    </div>
  )
}
