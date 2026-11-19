import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { go } from './spa'

// Site er ekdom upore news-bar: notun BLOG ba notun HERITAGE ashle dekhay.
// Click korle oi blog (paper style) / heritage book khule.
const MAX_AGE_DAYS = 30 // eto din er purono hole dekhabe na
const SEEN_KEY = 'tickerSeen'

const KIND = {
  blog: { icon: '📝', chip: { bn: 'ব্লগ', en: 'Blog' }, hide: '/blog', path: (id) => `/blog/${id}` },
  heritage: { icon: '📖', chip: { bn: 'হেরিটেজ', en: 'Heritage' }, hide: '/heritage', path: (id) => `/heritage?docId=${id}` },
}

const T = {
  bn: { tag: '🗞 নতুন', read: 'পড়ো →', close: 'বন্ধ করো', doc: (m) => `${m} এর হেরিটেজ নথি` },
  en: { tag: '🗞 NEW', read: 'Read →', close: 'Close', doc: (m) => `${m} heritage document` },
}

const readSeen = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
    const old = localStorage.getItem('blogTickerSeen') // ager version er key
    if (old && !s.blog) s.blog = old
    return s
  } catch { return {} }
}
const writeSeen = (patch) => {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify({ ...readSeen(), ...patch })) } catch { /* ignore */ }
}
const fresh = (d) => (Date.now() - new Date(d).getTime()) / 86400000 <= MAX_AGE_DAYS

export default function BlogTicker() {
  const [items, setItems] = useState([])
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('lang') || 'bn' } catch { return 'bn' } })
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    let alive = true
    Promise.all([
      sb.from('blog_posts').select('id,title,created_at').order('created_at', { ascending: false }).limit(1),
      sb.from('heritage_docs').select('id,title,year,created_at,mandaps(name,name_bn)')
        .eq('status', 'approved').order('created_at', { ascending: false }).limit(1),
    ])
      .then(([b, h]) => {
        if (!alive) return
        const seen = readSeen()
        const out = []
        const bp = !b.error && b.data?.[0]
        if (bp && fresh(bp.created_at) && seen.blog !== String(bp.id)) {
          out.push({ kind: 'blog', id: bp.id, title: bp.title, at: bp.created_at })
        }
        const hd = !h.error && h.data?.[0]
        if (hd && fresh(hd.created_at) && seen.heritage !== String(hd.id)) {
          out.push({ kind: 'heritage', id: hd.id, title: hd.title, mName: hd.mandaps?.name_bn || hd.mandaps?.name || '', at: hd.created_at })
        }
        out.sort((x, y) => new Date(y.at) - new Date(x.at)) // notun age
        setItems(out)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const onLang = (e) => setLang(e.detail === 'en' ? 'en' : 'bn')
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('applang', onLang)
    window.addEventListener('popstate', onPop)
    return () => { window.removeEventListener('applang', onLang); window.removeEventListener('popstate', onPop) }
  }, [])

  const p = path.toLowerCase()
  if (p.startsWith('/admin')) return null
  // blog section e thakle blog item, heritage section e thakle heritage item lukai
  const shown = items.filter((it) => !p.startsWith(KIND[it.kind].hide))
  if (!shown.length) return null

  const t = T[lang] || T.bn
  const label = (it) => it.title || t.doc(it.mName)

  const open = (it) => {
    writeSeen({ [it.kind]: String(it.id) })
    setItems((prev) => prev.filter((x) => !(x.kind === it.kind && x.id === it.id)))
    go(KIND[it.kind].path(it.id))
  }
  const close = () => {
    const patch = {}
    shown.forEach((it) => { patch[it.kind] = String(it.id) })
    writeSeen(patch)
    setItems((prev) => prev.filter((x) => !shown.includes(x)))
  }

  const chars = shown.reduce((n, it) => n + label(it).length, 0)
  const secs = Math.max(12, Math.round(chars * 0.4 + 8 * shown.length))

  return (
    <div role="region" aria-label={t.tag} className="flex items-stretch border-b-2 border-orange-500 bg-stone-900 text-sm text-amber-50">
      <style>{`
        @keyframes tkrun { from { transform: translateX(0) } to { transform: translateX(-100%) } }
        .tk-run { display:inline-block; white-space:nowrap; padding-left:100%; animation: tkrun ${secs}s linear infinite }
        .tk-btn:hover .tk-run { animation-play-state: paused }
        @media (prefers-reduced-motion: reduce) { .tk-run { animation:none; padding-left:0 } }
      `}</style>

      <span className="flex shrink-0 items-center bg-orange-600 px-3 py-2 font-bold tracking-wide">{t.tag}</span>

      <div className="tk-btn min-w-0 flex-1 overflow-hidden py-2">
        <div className="tk-run">
          {shown.map((it, i) => (
            <span key={it.kind + it.id}>
              {i > 0 && <span className="mx-6 text-orange-400" aria-hidden="true">◆</span>}
              <button type="button" onClick={() => open(it)} className="hover:underline">
                <span className="mr-2 rounded bg-orange-600/90 px-1.5 py-0.5 text-xs font-bold">
                  {KIND[it.kind].icon} {KIND[it.kind].chip[lang] || KIND[it.kind].chip.bn}
                </span>
                {label(it)} <span className="font-semibold text-orange-300">· {t.read}</span>
              </button>
            </span>
          ))}
        </div>
      </div>

      <button type="button" onClick={close} aria-label={t.close} className="shrink-0 px-3 hover:bg-stone-800">✕</button>
    </div>
  )
}