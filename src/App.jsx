import { lazy, Suspense, useEffect, useState } from 'react'
import { sb } from './supabase'
import MapView from './MapView'
import Panel from './Panel'
import Suggest from './Suggest'
import Player from './Player'
import Intro from './Intro'
import Bell from './Bell'
import Nav from './Nav'
import Live from './Live'
import Flame from './Flame'
import About from './About'
import Tutorial from './Tutorial'
import { T } from './i18n'
import HeritagePage from './HeritagePage'
import Chatbot from './Chatbot'
import BlogTicker from './BlogTicker'
import { applySeo } from './Seo'
import './styles.css'

const Admin = lazy(() => import('./Admin'))
const Sponsors = lazy(() => import('./Sponsors'))
const Schedule = lazy(() => import('./Schedule'))
const Vote = lazy(() => import('./Vote'))
const Routes = lazy(() => import('./Routes'))
const Reps = lazy(() => import('./Reps'))
const Parikroma = lazy(() => import('./Parikroma'))
const Blog = lazy(() => import('./Blog'))
const SubmitBlog = lazy(() => import('./SubmitBlog'))
const MapPage = lazy(() => import('./MapPage'))

const hav = (a, b) => {
  const r = (x) => (x * Math.PI) / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

// main map page: '/' ba '/mandap/<slug>'
const onMain = () => {
  const p = window.location.pathname.toLowerCase()
  return p === '/' || p.startsWith('/mandap/')
}

function AppInner() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'bn')
  const [dark, setDark] = useState(localStorage.getItem('dark') === '1')
  const [mandaps, setMandaps] = useState([]), [covers, setCovers] = useState({})
  const [sel, setSel] = useState(null), [focus, setFocus] = useState(null)
  const [q, setQ] = useState(''), [area, setArea] = useState('')
  const [me, setMe] = useState(null)
  const [suggest, setSuggest] = useState(false), [picked, setPicked] = useState(null)
  
  // ১. ফিক্স: location.hash এর বদলে window.location.pathname
  const [route, setRoute] = useState(window.location.pathname) 
  
  // ২. ফিক্স: ইন্ট্রো পেজের লজিক থেকে হ্যাশ চেকিং বাদ দেওয়া হয়েছে
  const [loaded, setLoaded] = useState(false)
  const [intro, setIntro] = useState(!sessionStorage.getItem('intro') && window.location.pathname === '/' && !new URLSearchParams(window.location.search).has('m'))
  const t = T[lang]

  // স্কিপ ইন্ট্রো ফাংশন
  const skipIntro = () => {
    sessionStorage.setItem('intro', '1')
    setIntro(false)
  }

  // ৩. ফিক্স: hashchange ইভেন্টের বদলে popstate ইভেন্ট ব্যবহার করা হয়েছে
  useEffect(() => { 
    const f = () => setRoute(window.location.pathname); 
    window.addEventListener('popstate', f); 
    return () => window.removeEventListener('popstate', f) 
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data, error } = await sb
        .from('mandaps')
        .select('id,slug,name,name_bn,area,address,lat,lng,theme,artist,areaeng')
        .eq('status', 'approved')

      if (error) {
        console.error('Supabase error:', error)
      } else {
        setMandaps(data || [])
      }

      const urlParams = new URLSearchParams(window.location.search)
      const pm = window.location.pathname.match(/^\/mandap\/([^/]+)/i)
      let slugFromPath = null
      try { slugFromPath = pm ? decodeURIComponent(pm[1]) : null } catch { /* bad url */ }
      const mParam = urlParams.get('m') || slugFromPath // purono ?m= link o kaj korbe
      if (mParam && data) {
        const target = data.find(x => x.slug === mParam || x.id == mParam)
        if (target) {
          setSel(target)
          setFocus({ id: target.id, lat: target.lat, lng: target.lng, zoom: 17, ts: Date.now() })
        }
      }
      setLoaded(true) // error hole o intro atke thakbe na

      const { data: ph, error: phErr } = await sb
        .from('photos')
        .select('mandap_id,url')
        .eq('status', 'approved')
        .order('likes', { ascending: false })

      if (phErr) console.error('Photos error:', phErr)
      const c = {}
      ;(ph || []).forEach((p) => { if (!c[p.mandap_id]) c[p.mandap_id] = p.url })
      setCovers(c)
    }
    load()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', dark) // Tailwind dark: variant er jonno
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    localStorage.setItem('dark', dark ? '1' : '0')
  }, [dark])
  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.lang = lang === 'en' ? 'en' : 'bn'
    window.dispatchEvent(new CustomEvent('applang', { detail: lang })) // chatbot er bhasha sync
  }, [lang])
  // language change hole selected area reset (nahole ager language er value diye filter hoye list faka hoy)
  useEffect(() => { setArea('') }, [lang])

  // ---- Chatbot -> map control ----
  useEffect(() => {
    const onFocus = (e) => {
      const m = mandaps.find((x) => String(x.id) === String(e.detail?.id))
      if (!m) return
      if (!onMain()) { window.history.pushState({}, '', '/'); setRoute('/') }
      setSuggest(false); setSel(m)
      setFocus({ id: m.id, lat: m.lat, lng: m.lng, zoom: 17, ts: Date.now() })
    }
    const onMe = (e) => {
      if (!onMain()) { window.history.pushState({}, '', '/'); setRoute('/') }
      setMe(e.detail); setFocus({ ...e.detail, zoom: 15, ts: Date.now() })
    }
    window.addEventListener('chat:focus', onFocus)
    window.addEventListener('chat:me', onMe)
    return () => { window.removeEventListener('chat:focus', onFocus); window.removeEventListener('chat:me', onMe) }
  }, [mandaps])

  // ---- URL sync: mandap select hole URL = /mandap/<slug> (Google index + share er jonno) ----
  useEffect(() => {
    if (!loaded) return
    const p = window.location.pathname
    if (p !== '/' && !p.toLowerCase().startsWith('/mandap/')) return // onno page e hat dio na
    const want = sel ? `/mandap/${encodeURIComponent(sel.slug || sel.id)}` : '/'
    if (p !== want) { window.history.replaceState({}, '', want); setRoute(want) }
  }, [sel, loaded])

  // ---- SEO: route / selected mandap / language bodlale title+meta update ----
  useEffect(() => { applySeo({ route, sel, lang }) }, [route, sel, lang])

  const sub = (el) => <><Live /><Nav lang={lang} setLang={setLang} dark={dark} setDark={setDark} route={route} tools /><Suspense fallback={<div className="page" />}>{el}</Suspense></>
  const rt = route.toLowerCase() // case-insensitive, jate #/Sponsors ba #/Representatives o kaj kore
  if (rt.startsWith('/admin')) return <><Live /><Suspense fallback={null}><Admin /></Suspense></>
  if (rt.startsWith('/sponsors')) return sub(<Sponsors lang={lang} />)
  if (rt.startsWith('/routes')) return sub(<Routes lang={lang} />)
  if (rt.startsWith('/schedule')) return sub(<Schedule lang={lang} />)
  if (rt.startsWith('/vote')) return sub(<Vote lang={lang} />)
  if (rt.startsWith('/reps')) return sub(<Reps lang={lang} />)
  if (rt.startsWith('/player')) return sub(<Player lang={lang} />)
  if (rt.startsWith('/parikroma')) return sub(<Parikroma lang={lang} />)
  if (rt.startsWith('/about')) return sub(<About lang={lang} />)
  if (rt.startsWith('/tutorial')) return sub(<Tutorial lang={lang} />)
  if (rt.startsWith('/blog-submit')) return sub(<SubmitBlog lang={lang} />) // '#/blog' er age thakte hobe
  if (rt.startsWith('/blog')) return sub(<Blog lang={lang} />)
  if (rt.startsWith('/zones')) return sub(<MapPage lang={lang} />)
  if (rt.startsWith('/heritage')) return sub(<HeritagePage lang={lang} />)

  const nm = (m) => (lang === 'bn' && m.name_bn ? m.name_bn : m.name)

  // bn hole area, en hole areaeng; na thakle onnotar fallback
  const ar = (m) => (lang === 'bn' ? (m.areaeng || m.area) : (m.area|| m.areaeng))

  const areas = [...new Set(mandaps.map(ar).filter(Boolean))]

  const searchText = q.trim().toLowerCase()

  let list = mandaps.filter((m) => {
    const matchesArea = !area || ar(m) === area

    const searchableText = [m.name, m.name_bn, m.area, m.areaeng, m.address]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch = !searchText || searchableText.includes(searchText)

    return matchesArea && matchesSearch
  })

  if (me) list = [...list].sort((a, b) => hav(me, a) - hav(me, b))

  const choose = (m) => {
    setSuggest(false); setSel(m)
    setFocus({ id: m.id, lat: m.lat, lng: m.lng, zoom: 17, ts: Date.now() }) // zoom + ts: ekই mandap e abar click korleo trigger hobe
    // mobile e list er upor map thake, tai map er dike scroll
    document.querySelector('.map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const nearMe = () => navigator.geolocation.getCurrentPosition((p) => {
    const pos = { lat: p.coords.latitude, lng: p.coords.longitude }; setMe(pos); setFocus(pos)
  }, () => alert('Location permission dao'))

  return (
    <>
      <Live />
      {intro && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          {/* Skip Button */}
          <button 
            onClick={skipIntro}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              cursor: 'pointer',
              zIndex: 100000,
              fontSize: '14px',
              backdropFilter: 'blur(4px)'
            }}
          >
            Skip ⏭
          </button>
          
          <Intro 
            ready={loaded} 
            t={t} 
            onEnter={() => window.dispatchEvent(new Event('startmusic'))} 
            onDone={skipIntro} 
          />
        </div>
      )}
      <header className="top">
        <div className="brand">
          <div className="logo"><Flame /></div>
          <div><h1>{t.title}</h1><small>{t.tag}</small></div>
        </div>
        <div className="ctl">
          <input className="search" placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={area} onChange={(e) => setArea(e.target.value)}><option value="">{t.all}</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}</select>
          <button className="btn" onClick={nearMe}>◎ {t.near}</button>
          <button className="btn pri" onClick={() => { setSel(null); setSuggest(true) }}>＋ {t.suggest}</button>
          <Bell lang={lang} t={t} />
          <button className="btn" onClick={() => setDark(!dark)}>{dark ? '☀' : '☾'}</button>
          <button className="btn" onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}>{t.lang}</button>
        </div>
      </header>
      <Nav lang={lang} route={route} />
      <div className="main">
        <div className="list">
          {!list.length && <p className="muted">{t.nomatch}</p>}
          {list.map((m) => (
            <div className={'card' + (sel?.id === m.id ? ' on' : '')} key={m.id} onClick={() => choose(m)}>
              {covers[m.id] ? <img className="thumb" src={covers[m.id]} loading="lazy" /> : <div className="thumb"><Flame size={26} /></div>}
              <div><h4>{nm(m)}</h4><small>{ar(m)}{me && ` · ${hav(me, m).toFixed(1)} ${t.away}`}</small></div>
            </div>
          ))}
        </div>
        <div className="map">
          <MapView items={list} onSelect={choose} focus={focus} me={me} dark={dark} picked={suggest ? picked : null} onPick={suggest ? setPicked : null} />

          {sel && <Panel m={sel} name={nm(sel)} t={t} onClose={() => setSel(null)} />}
          {suggest && <Suggest t={t} picked={picked} onClose={() => setSuggest(false)} />}
        </div>
      </div>
    </>
  )
}

// Chatbot sob page e thake (AppInner er early return er baire)
export default function App() {
  return (
    <>
      <BlogTicker />
      <AppInner />
      <Chatbot />
    </>
  )
}
