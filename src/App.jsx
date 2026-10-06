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
import { T } from './i18n'
import './styles.css'
const Admin = lazy(() => import('./Admin'))
const Sponsors = lazy(() => import('./Sponsors'))
const Schedule = lazy(() => import('./Schedule'))
const Vote = lazy(() => import('./Vote'))
const Routes = lazy(() => import('./Routes'))
const Reps = lazy(() => import('./Reps'))

const hav = (a, b) => {
  const r = (x) => (x * Math.PI) / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'bn')
  const [dark, setDark] = useState(localStorage.getItem('dark') === '1')
  const [mandaps, setMandaps] = useState([]), [covers, setCovers] = useState({})
  const [sel, setSel] = useState(null), [focus, setFocus] = useState(null)
  const [q, setQ] = useState(''), [area, setArea] = useState('')
  const [me, setMe] = useState(null)
  const [suggest, setSuggest] = useState(false), [picked, setPicked] = useState(null)
  const [route, setRoute] = useState(location.hash)
  const [loaded, setLoaded] = useState(false), [intro, setIntro] = useState(!sessionStorage.getItem('intro'))
  const t = T[lang]

  useEffect(() => { const f = () => setRoute(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  useEffect(() => {
    sb.from('mandaps').select('id,name,name_bn,area,address,lat,lng,theme,artist').eq('status', 'approved').then(({ data }) => { setMandaps(data || []); setLoaded(true) })
    sb.from('photos').select('mandap_id,url').eq('status', 'approved').order('likes', { ascending: false }).then(({ data }) => {
      const c = {}; (data || []).forEach((p) => { if (!c[p.mandap_id]) c[p.mandap_id] = p.url }); setCovers(c)
    })
  }, [])
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('dark', dark ? '1' : '0') }, [dark])
  useEffect(() => { localStorage.setItem('lang', lang) }, [lang])

  const sub = (el) => <><Live /><Nav lang={lang} setLang={setLang} dark={dark} setDark={setDark} route={route} tools /><Suspense fallback={<div className="page" />}>{el}</Suspense></>
  if (route.startsWith('#/admin')) return <><Live /><Suspense fallback={null}><Admin /></Suspense></>
  if (route.startsWith('#/sponsors')) return sub(<Sponsors lang={lang} />)
  if (route.startsWith('#/routes')) return sub(<Routes lang={lang} />)
  if (route.startsWith('#/schedule')) return sub(<Schedule lang={lang} />)
  if (route.startsWith('#/vote')) return sub(<Vote lang={lang} />)
  if (route.startsWith('#/reps')) return sub(<Reps lang={lang} />)

  const nm = (m) => (lang === 'bn' && m.name_bn ? m.name_bn : m.name)
  const areas = [...new Set(mandaps.map((m) => m.area).filter(Boolean))]
  let list = mandaps.filter((m) => (!area || m.area === area) && (!q || (m.name + (m.name_bn || '') + (m.address || '')).toLowerCase().includes(q.toLowerCase())))
  if (me) list = [...list].sort((a, b) => hav(me, a) - hav(me, b))

  const choose = (m) => { setSuggest(false); setSel(m); setFocus({ lat: m.lat, lng: m.lng }) }
  const nearMe = () => navigator.geolocation.getCurrentPosition((p) => {
    const pos = { lat: p.coords.latitude, lng: p.coords.longitude }; setMe(pos); setFocus(pos)
  }, () => alert('Location permission dao'))

  return (
    <>
      <Live />
      {intro && <Intro ready={loaded} t={t} onEnter={() => window.dispatchEvent(new Event('startmusic'))} onDone={() => { sessionStorage.setItem('intro', '1'); setIntro(false) }} />}
      <header className="top">
        <div className="brand">
          <div className="logo"><Flame /></div>
          <div><h1>{t.title}</h1><small>{t.tag}</small></div>
        </div>
        <div className="ctl">
          <input className="search" placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={area} onChange={(e) => setArea(e.target.value)}><option value="">{t.all}</option>{areas.map((a) => <option key={a}>{a}</option>)}</select>
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
              <div><h4>{nm(m)}</h4><small>{m.area}{me && ` · ${hav(me, m).toFixed(1)} ${t.away}`}</small></div>
            </div>
          ))}
        </div>
        <div className="map">
          <MapView items={list} onSelect={choose} focus={focus} me={me} dark={dark} picked={suggest ? picked : null} onPick={suggest ? setPicked : null} />
          <Player />
          {sel && <Panel m={sel} name={nm(sel)} t={t} onClose={() => setSel(null)} />}
          {suggest && <Suggest t={t} picked={picked} onClose={() => setSuggest(false)} />}
        </div>
      </div>
    </>
  )
}
