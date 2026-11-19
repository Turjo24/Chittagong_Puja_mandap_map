import { useEffect, useMemo, useState } from 'react'
import { sb } from './supabase'
import Flame from './Flame'
import Extras from './AdminExtras'
import More from './AdminMore'
import AllMandaps from './AdminMandaps'
import Emails from './AdminEmails'
import Parikroma from './AdminParikroma'
import Vote from './AdminVote'
import VoteCharts from './VoteCharts'
import Blog from './AdminBlog'
import Team from './AdminTeam'
import AdminHeritage, { DocCard, Lightbox, LOCATION_LABELS } from './AdminHeritage'
import { NAV } from './adminNav'
import { enableSound, ting, toast } from './alerts'
import { C, theme } from './adminUi'

/* ───────────────────────── ছোট ছোট UI ব্লক ───────────────────────── */

// সব request card: সাদা ব্যাকগ্রাউন্ড + গাঢ় বর্ডার + কালো লেখা
const REQ = 'bg-white text-neutral-900 border-2 border-slate-300 border-l-8 rounded-xl p-4 shadow-md flex flex-col gap-3'
const NAME = `${C.name} !text-neutral-900`
const MUTED = `${C.muted} !text-slate-600`

function SecHead({ icon, title, n, color }) {
  return (
    <div className={`flex items-center gap-2 mt-6 mb-3 px-4 py-2.5 rounded-xl border-2 font-bold ${color}`}>
      <span>{icon}</span>
      <span className="flex-1">{title}</span>
      <span className="min-w-7 text-center text-xs px-2 py-0.5 rounded-full bg-white text-neutral-900 border border-slate-300">{n}</span>
    </div>
  )
}

const Empty = () => (
  <p className="p-4 rounded-xl bg-white border-2 border-dashed border-slate-300 text-sm text-slate-600">✓ Kichu pending nai.</p>
)

function Kpi({ label, value, sub, accent }) {
  return (
    <div className={`bg-white text-neutral-900 border-2 border-slate-300 border-t-8 ${accent} rounded-xl p-4 shadow-sm`}>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="text-2xl font-extrabold">{value ?? '—'}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
  )
}

function Panel({ title, sub, children }) {
  return (
    <div className="bg-white text-neutral-900 border-2 border-slate-300 rounded-xl p-4 shadow-sm">
      <div className="font-bold">{title}</div>
      {sub && <div className="text-[11px] text-slate-500 mb-3">{sub}</div>}
      {!sub && <div className="mb-3" />}
      {children}
    </div>
  )
}

function HBars({ rows, bar = 'bg-indigo-500', fmt }) {
  if (!rows.length) return <p className="text-sm text-slate-500">Data nai.</p>
  const max = Math.max(1, ...rows.map((r) => r[1]))
  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-xs text-slate-700 mb-0.5">
            <span className="truncate pr-2">{fmt ? fmt(k) : k}</span>
            <b>{v}</b>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ColBars({ rows, bar = 'bg-orange-500' }) {
  if (!rows.length) return <p className="text-sm text-slate-500">Data nai.</p>
  const max = Math.max(1, ...rows.map((r) => r[1]))
  return (
    <div className="flex items-end gap-2 h-40 overflow-x-auto pt-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col items-center justify-end h-full min-w-[36px] flex-1">
          <span className="text-[11px] font-bold text-slate-800">{v}</span>
          <div className={`w-full max-w-[36px] rounded-t-md ${bar}`} style={{ height: `${Math.max(6, (v / max) * 72)}%` }} />
          <span className="text-[10px] text-slate-600 mt-1">{k}</span>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────── ডাটা হেল্পার ───────────────────────── */

// supabase এর 1000 row limit পার করে সব row আনে
async function pull(table, cols = '*') {
  let out = [], from = 0
  for (;;) {
    const { data, error } = await sb.from(table).select(cols).range(from, from + 999)
    if (error) return out
    out = out.concat(data || [])
    if (!data || data.length < 1000) break
    from += 1000
  }
  return out
}
const cnt = (tb, s) => {
  let q = sb.from(tb).select('*', { count: 'exact', head: true })
  if (s) q = q.eq('status', s)
  return q.then((r) => r.count || 0)
}
const tally = (arr, fn) => {
  const m = {}
  arr.forEach((x) => {
    const k = fn(x)
    if (k == null || k === '') return
    m[k] = (m[k] || 0) + 1
  })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

async function exportCSV(table) {
  try {
    const rows = await pull(table)
    if (!rows.length) return toast('Export', `${table} e kono data nai`)
    const cols = Object.keys(rows[0])
    const esc = (v) => {
      if (v == null) return ''
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = '\uFEFF' + [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    toast('Export fail', e.message)
  }
}

/* ───────────────────────── লগইন + রোল ───────────────────────── */

export default function Admin() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false)
  const [role, setRole] = useState(undefined) // undefined = loading, null = kono access nai
  const [cred, setCred] = useState({ email: '', password: '' }), [err, setErr] = useState('')
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setReady(true) })
    const { data } = sb.auth.onAuthStateChange((_, s) => setUser(s?.user || null))
    return () => data.subscription.unsubscribe()
  }, [])
  // login korle admin_roles theke role + perms ana
  useEffect(() => {
    if (!user) { setRole(undefined); return }
    sb.from('admin_roles').select('role,perms').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setRole(data || null))
  }, [user])
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
  if (role === undefined) return null
  if (role === null) return (
    <div style={theme} className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--bd)] rounded-2xl shadow-sm p-6 text-center">
        <h2 className={`${C.title} mb-2`}>Access nai</h2>
        <p className={C.muted}>Ei account ke admin access deya hoyni. Main admin er sathe kotha bolun.</p>
        <button className={`${C.btn} mt-4`} onClick={() => sb.auth.signOut()}>Logout</button>
      </div>
    </div>
  )
  return <Dash role={role} />
}

/* ───────────────────────── ড্যাশবোর্ড ───────────────────────── */

function Dash({ role }) {
  const isSuper = role.role === 'super'
  const allowed = NAV.filter(([k]) => (k === 'team' ? isSuper : isSuper || (role.perms || []).includes(k)))
  const canHeritage = isSuper || (role.perms || []).includes('heritage')

  // pending request gulo
  const [photos, setPhotos] = useState([]), [mandaps, setMandaps] = useState([])
  const [heritage, setHeritage] = useState([]), [hAlbums, setHAlbums] = useState({})
  // analytics er jonno sob data
  const [data, setData] = useState({ mandaps: [], photos: [], heritage: [], albums: 0, routesP: 0, faresP: 0 })

  async function load() {
    const [pPh, pM, pH, aM, aP, aH, albums, routesP, faresP] = await Promise.all([
      sb.from('photos').select('*, mandaps(name,status)').eq('status', 'pending').order('created_at'),
      sb.from('mandaps').select('*').eq('status', 'pending').order('created_at'),
      sb.from('heritage_docs').select('*, mandaps(name, name_bn)').eq('status', 'pending').order('created_at', { ascending: false }),
      pull('mandaps', 'id,area,theme,status,created_at'),
      pull('photos', 'id,status,year,created_at'),
      pull('heritage_docs', 'id,mandap_id,status,year,location_type,location_changed,statue_height_ft,thumbnail_post,heritage_description,pandal_architect,lighting_artist,statue_artist,statue_theme,custom_sections,created_at'),
      cnt('heritage_albums'),
      cnt('routes', 'pending'),
      cnt('route_fares', 'pending')
    ])
    setPhotos(pPh.data || [])
    setMandaps(pM.data || [])
    const hs = pH.data || []
    setHeritage(hs)
    if (hs.length) {
      const { data: al } = await sb.from('heritage_albums').select('*').in('heritage_id', hs.map((d) => d.id))
      const map = {}
      ;(al || []).forEach((a) => { (map[a.heritage_id] ||= []).push(a) })
      setHAlbums(map)
    } else setHAlbums({})
    setData({ mandaps: aM, photos: aP, heritage: aH, albums, routesP, faresP })
  }

  const [snd, setSnd] = useState(false)
  const [pageSel, setPage] = useState(null)
  // jei page er permission nai oita kokhono dekhabe na
  const page = allowed.some((n) => n[0] === pageSel) ? pageSel : allowed[0]?.[0]
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('req') // req | ana
  const [zoom, setZoom] = useState(null)
  const [hEdit, setHEdit] = useState(null) // dashboard theke heritage edit korte gele
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    load()
    const say = (t, b) => { ting(); toast(t, b); load() }
    let pc = 0, pt
    const ch = sb.channel('admin-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mandaps' }, (x) => x.new.status === 'pending' && say('নতুন মণ্ডপ suggestion', x.new.name))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'heritage_docs' }, (x) => x.new.status === 'pending' && say('Notun heritage submission', x.new.title || x.new.submitted_by || ''))
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
  const approveHeritage = async (id) => { await sb.from('heritage_docs').update({ status: 'approved' }).eq('id', id); load() }
  const rejectHeritage = async (id) => {
    if (!confirm('Ei heritage submission (album shoho) delete korben? Eta ar ferot ashbe na.')) return
    await sb.from('heritage_albums').delete().eq('heritage_id', id)
    await sb.from('heritage_docs').delete().eq('id', id); load()
  }
  const mail = (to, what) => `mailto:${to}?subject=${encodeURIComponent('Puja Map: apnar ' + what + ' approve hoyeche')}&body=${encodeURIComponent('Dhonnobad! Apnar ' + what + ' website e live hoyeche.')}`
  const own = photos.filter((p) => p.mandaps?.status === 'approved')

  const go = (k) => { setPage(k); setHEdit(null); setOpen(false) }
  const pageFor = (re) => allowed.find(([k, l]) => re.test(`${k} ${l}`))?.[0]
  const goEditHeritage = (id) => { setHEdit(id); setPage('heritage') }

  /* ── analytics হিসাব ── */
  const A = useMemo(() => {
    const { mandaps: M, photos: P, heritage: H } = data
    const ok = (x) => x.status === 'approved'
    const mA = M.filter(ok).length, pA = P.filter(ok).length, hA = H.filter(ok).length
    const hP = H.length - hA
    const approvedH = H.filter(ok)
    const covered = new Set(approvedH.map((h) => h.mandap_id)).size
    const heights = H.map((h) => Number(h.statue_height_ft)).filter((n) => Number.isFinite(n) && n > 0)
    const total = H.length || 1
    const pct = (fn) => Math.round((H.filter(fn).length / total) * 100)
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return monthKey(d)
    })
    const bucket = (arr) => {
      const m = {}
      arr.forEach((x) => { const k = (x.created_at || '').slice(0, 7); m[k] = (m[k] || 0) + 1 })
      return m
    }
    const mm = bucket(M), pm = bucket(P), hm = bucket(H)
    const monthly = months.map((k) => ({ k, m: mm[k] || 0, p: pm[k] || 0, h: hm[k] || 0 }))
    return {
      mA, pA, hA, hP,
      mP: M.length - mA, pP: P.length - pA,
      cov: mA ? Math.round((covered / mA) * 100) : 0,
      covered,
      byArea: tally(M.filter(ok), (x) => (x.area || '').trim()),
      byTheme: tally(M.filter(ok), (x) => (x.theme || '').trim()),
      byYear: tally(H, (x) => x.year).sort((a, b) => Number(a[0]) - Number(b[0])),
      byLoc: tally(H, (x) => x.location_type),
      locChanged: H.filter((h) => h.location_changed).length,
      avgH: heights.length ? (heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(1) : '—',
      maxH: heights.length ? Math.max(...heights) : '—',
      complete: [
        ['Thumbnail', pct((h) => h.thumbnail_post)],
        ['Heritage বর্ণনা', pct((h) => h.heritage_description)],
        ['Mandap architect', pct((h) => h.pandal_architect)],
        ['Lighting artist', pct((h) => h.lighting_artist)],
        ['Statue artist', pct((h) => h.statue_artist)],
        ['Statue theme', pct((h) => h.statue_theme)],
        ['Statue height', pct((h) => h.statue_height_ft)],
        ['Custom section', pct((h) => Array.isArray(h.custom_sections) && h.custom_sections.length)]
      ],
      monthly,
      monthlyMax: Math.max(1, ...monthly.map((x) => x.m + x.p + x.h))
    }
  }, [data])

  const totalPending = mandaps.length + own.length + (canHeritage ? heritage.length : 0) + data.routesP + data.faresP
  const kpis = [
    ['Mandaps', A.mA, `${A.mP} pending`, 'border-t-indigo-500'],
    ['Photos', A.pA, `${A.pP} pending`, 'border-t-sky-500'],
    ['Heritage docs', A.hA, `${A.hP} pending`, 'border-t-orange-500'],
    ['Album photos', data.albums, 'heritage gallery', 'border-t-emerald-500'],
    ['Heritage coverage', `${A.cov}%`, `${A.covered}/${A.mA} mandap`, 'border-t-fuchsia-500'],
    ['Total pending', totalPending, 'sob request', 'border-t-amber-500']
  ]
  const chips = [
    ['📍 Mandap', mandaps.length, 'bg-indigo-100 text-indigo-900 border-indigo-300', null],
    ['🖼 Photo', own.length, 'bg-sky-100 text-sky-900 border-sky-300', null],
    ...(canHeritage ? [['🏛 Heritage', heritage.length, 'bg-orange-100 text-orange-900 border-orange-300', null]] : []),
    ['🚌 Route', data.routesP, 'bg-emerald-100 text-emerald-900 border-emerald-300', pageFor(/route|rout/i)],
    ['💸 Bhara', data.faresP, 'bg-rose-100 text-rose-900 border-rose-300', pageFor(/fare|bhara|vara/i)]
  ]

  const menu = (
    <div className="flex flex-col gap-1">
      {allowed.map(([k, l]) => (
        <button key={k} onClick={() => go(k)}
          className={`text-left px-3 py-2.5 rounded-lg text-sm transition cursor-pointer ${page === k ? 'bg-[var(--a)] text-white font-medium' : 'text-[var(--tx)] hover:bg-[var(--soft)]'}`}>{l}</button>
      ))}
      <div className="border-t border-[var(--bd)] my-2" />
      <a href="#/" className="px-3 py-2.5 rounded-lg text-sm text-[var(--tx)] hover:bg-[var(--soft)]">← Back to site</a>
      <button onClick={() => sb.auth.signOut()} className="text-left px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer">Logout</button>
    </div>
  )

  const tabBtn = (k, l) => (
    <button key={k} onClick={() => setTab(k)}
      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 cursor-pointer ${tab === k ? 'bg-[var(--a)] text-white border-[var(--a)]' : 'bg-white text-neutral-800 border-slate-300 hover:bg-slate-50'}`}>{l}</button>
  )

  return (
    // h-[100dvh] + overflow-hidden: pura page scroll hoy na. Sidebar sthir, sudhu <main> scroll hoy.
    <div style={theme} className="h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--tx)]">
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

      <div className="h-full max-w-6xl mx-auto px-4 flex gap-5">
        {/* Desktop sidebar: fixed height, nijer scroll */}
        <aside className="hidden md:block w-56 shrink-0 self-start my-4 max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[var(--card)] border border-[var(--bd)] rounded-2xl shadow-sm p-3">
          <h3 className="px-2 pb-2 font-bold">🔥 Admin {!isSuper && <span className="text-xs font-normal text-[var(--mu)]">(sub)</span>}</h3>
          {menu}
        </aside>

        {/* Content: sudhu eta scroll hoy */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto pb-6 md:py-4">
          <div className="sticky top-0 z-30 py-3 bg-[var(--bg)]/95 backdrop-blur flex items-center gap-3 mb-3">
            <button onClick={() => setOpen(true)} aria-label="Open menu"
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--bd)] bg-[var(--card)] text-xl cursor-pointer">☰</button>
            <h2 className={`${C.title} flex-1 truncate`}>{allowed.find((n) => n[0] === page)?.[1] || 'No access'}</h2>
            <button className={snd ? C.btn : C.pri} onClick={() => { enableSound(); ting(); setSnd(true) }}>{snd ? '🔊 ON' : '🔈 Sound'}</button>
          </div>

          {!page && <p className={C.muted}>Apnar kono page er access nai. Main admin ke bolun.</p>}

          {page === 'dash' && <>
            {/* ── KPI ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {kpis.map(([l, v, s, a]) => <Kpi key={l} label={l} value={v} sub={s} accent={a} />)}
            </div>

            <div className="flex gap-2 mt-5">
              {tabBtn('req', `📥 Requests (${totalPending})`)}
              {tabBtn('ana', '📊 Analytics & Data')}
            </div>

            {/* ══════════ REQUESTS ══════════ */}
            {tab === 'req' && <>
              {/* Queue summary */}
              <div className="mt-4 p-3 rounded-xl bg-white border-2 border-slate-300 shadow-sm">
                <div className="text-xs font-bold text-slate-600 mb-2">Request queue</div>
                <div className="flex flex-wrap gap-2">
                  {chips.map(([l, n, cls, pg]) => (
                    <button key={l} disabled={!pg} onClick={() => pg && go(pg)}
                      className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${cls} ${pg ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}`}>
                      {l}: {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heritage requests */}
              {canHeritage && <>
                <SecHead icon="🏛" title="Heritage submissions" n={heritage.length} color="bg-orange-100 text-orange-900 border-orange-300" />
                {!heritage.length && <Empty />}
                <div className="flex flex-col gap-4">
                  {heritage.map((d) => (
                    <DocCard
                      key={d.id}
                      doc={d}
                      albums={hAlbums[d.id] || []}
                      kind="pending"
                      onApprove={approveHeritage}
                      onEdit={goEditHeritage}
                      onDelete={rejectHeritage}
                      onZoom={setZoom}
                    />
                  ))}
                </div>
              </>}

              {/* Mandap requests */}
              <SecHead icon="📍" title="New mandap requests" n={mandaps.length} color="bg-indigo-100 text-indigo-900 border-indigo-300" />
              {!mandaps.length && <Empty />}
              <div className="flex flex-col gap-4">
                {mandaps.map((m) => (
                  <div className={`${REQ} border-l-indigo-500`} key={m.id}>
                    <div>
                      <div className={NAME}>{m.name} <span className="font-normal !text-slate-500">· {m.area}</span></div>
                      <div className={MUTED}>{m.address} · {Number(m.lat).toFixed(5)}, {Number(m.lng).toFixed(5)}</div>
                      <div className={MUTED}>{m.theme} {m.artist && `· ${m.artist}`}</div>
                      <div className={MUTED}>by {m.suggested_by} · {m.suggester_email}</div>
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

              {/* Photo requests */}
              <SecHead icon="🖼" title="New photos" n={own.length} color="bg-sky-100 text-sky-900 border-sky-300" />
              {!own.length && <Empty />}
              <div className="flex flex-col gap-4">
                {own.map((p) => (
                  <div className={`${REQ} border-l-sky-500 sm:flex-row sm:items-center`} key={p.id}>
                    <a href={p.url} target="_blank" rel="noreferrer"><img className={C.img} src={p.url} /></a>
                    <div className="flex-1 min-w-40">
                      <div className={NAME}>{p.mandaps?.name}</div>
                      <div className={MUTED}>{p.uploader_name} · {p.uploader_email} · {p.year}</div>
                    </div>
                    <div className={C.acts}>
                      <button className={C.pri} onClick={() => approvePhoto(p.id)}>✓ Approve</button>
                      <a href={mail(p.uploader_email, 'photo')}><button className={C.btn}>✉ Notify</button></a>
                      <button className={C.danger} onClick={() => rejectPhoto(p)}>✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>

              {(data.routesP > 0 || data.faresP > 0) && (
                <p className="mt-6 p-3 rounded-xl bg-white border-2 border-dashed border-slate-300 text-sm text-slate-700">
                  🚌 {data.routesP} ta route suggestion ar 💸 {data.faresP} ta bhara report pending ache — oigulo nijer page theke approve korte hobe.
                </p>
              )}
            </>}

            {/* ══════════ ANALYTICS ══════════ */}
            {tab === 'ana' && <div className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Location change hoyeche" value={A.locChanged} sub="heritage docs e" accent="border-t-sky-500" />
                <Kpi label="Gor. protima uchchota" value={A.avgH === '—' ? '—' : `${A.avgH} ft`} sub="average" accent="border-t-rose-500" />
                <Kpi label="Shorbochcho protima" value={A.maxH === '—' ? '—' : `${A.maxH} ft`} sub="max" accent="border-t-violet-500" />
                <Kpi label="Route / bhara pending" value={`${data.routesP} / ${data.faresP}`} sub="route / fare" accent="border-t-emerald-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="📍 Area wise mandap" sub="approved mandap, top 8">
                  <HBars rows={A.byArea.slice(0, 8)} bar="bg-indigo-500" />
                </Panel>
                <Panel title="🎨 Theme wise mandap" sub="approved mandap, top 8">
                  <HBars rows={A.byTheme.slice(0, 8)} bar="bg-fuchsia-500" />
                </Panel>
                <Panel title="📅 Sal wise heritage docs" sub="prottek puja-bochhor e koyta nothi">
                  <ColBars rows={A.byYear} bar="bg-orange-500" />
                </Panel>
                <Panel title="🏛 Puja-sthaner dhoron" sub="heritage docs er location type">
                  <HBars rows={A.byLoc} bar="bg-sky-500" fmt={(k) => LOCATION_LABELS[k] || k} />
                </Panel>
                <Panel title="✅ Heritage data completeness" sub="koyta nothi te ei field ta bhora ache">
                  <div className="space-y-2">
                    {A.complete.map(([l, p]) => (
                      <div key={l}>
                        <div className="flex justify-between text-xs text-slate-700 mb-0.5"><span>{l}</span><b>{p}%</b></div>
                        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                          <div className={`h-full rounded-full ${p >= 80 ? 'bg-emerald-500' : p >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${p}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="📈 Last 6 months activity" sub="notun mandap / photo / heritage submission">
                  <div className="space-y-2">
                    {A.monthly.map((x) => (
                      <div key={x.k}>
                        <div className="flex justify-between text-xs text-slate-700 mb-0.5"><span>{x.k}</span><b>{x.m + x.p + x.h}</b></div>
                        <div className="h-3 rounded-full bg-slate-200 overflow-hidden flex">
                          <div className="bg-indigo-500" style={{ width: `${(x.m / A.monthlyMax) * 100}%` }} title={`Mandap ${x.m}`} />
                          <div className="bg-sky-500" style={{ width: `${(x.p / A.monthlyMax) * 100}%` }} title={`Photo ${x.p}`} />
                          <div className="bg-orange-500" style={{ width: `${(x.h / A.monthlyMax) * 100}%` }} title={`Heritage ${x.h}`} />
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-3 text-[11px] text-slate-600 pt-1">
                      <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-500 mr-1" />Mandap</span>
                      <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-500 mr-1" />Photo</span>
                      <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-500 mr-1" />Heritage</span>
                    </div>
                  </div>
                </Panel>
              </div>

              <Panel title="🔥 Vote results">
                <VoteCharts compact />
              </Panel>

              <Panel title="⬇ Raw data export (CSV)" sub="Excel / Sheets / Python e nijer moto analysis korar jonno pura table download koro">
                <div className="flex flex-wrap gap-2">
                  {['mandaps', 'photos', 'heritage_docs', 'heritage_albums', 'routes', 'route_fares'].map((t) => (
                    <button key={t} disabled={!!exporting}
                      onClick={async () => { setExporting(t); await exportCSV(t); setExporting('') }}
                      className="px-3 py-2 rounded-lg bg-white border-2 border-slate-300 hover:bg-slate-50 text-sm font-bold text-neutral-900 cursor-pointer disabled:opacity-50">
                      {exporting === t ? '…' : `⬇ ${t}`}
                    </button>
                  ))}
                </div>
              </Panel>
            </div>}
          </>}

          <Extras page={page} />
          <More page={page} />
          {page === 'mandaps' && <AllMandaps />}
          {page === 'emails' && <Emails />}
          {page === 'parikromas' && <Parikroma />}
          {page === 'vote' && <Vote />}
          {page === 'blog' && <Blog />}
          {page === 'team' && isSuper && <Team />}
          {page === 'heritage' && <AdminHeritage startEditId={hEdit} />}
        </main>
      </div>

      <Lightbox src={zoom} onClose={() => setZoom(null)} />
    </div>
  )
}