import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Flame from './Flame'

const L = [
  ['#/', 'Map', 'মানচিত্র'],
  ['#/routes', 'Routes & Fare', 'যাতায়াত ও খরচ'],
  ['#/schedule', 'Schedule', 'তিথি'],
  ['#/vote', 'Vote', 'ভোট'],
  ['#/reps', 'Representatives', 'প্রতিনিধি'],
  ['#/sponsors', 'Sponsors', 'স্পনসর'],
  ['#/player', 'Pujo Song', 'পূজার গান'],
  ['#/parikroma', 'Parikrama', 'পরিক্রমা'],
  ['#/about', 'About', 'সম্পর্কে'],
  ['#/tutorial', 'Tutorial', 'টিউটোরিয়াল'],
  ['#/blog', 'Blog', 'ব্লগ'],
  ['#/zones', 'Zones', 'জোন']
]

// Mobile e hamburger button er pashe likha, ar tooltip er likha (ekhane chaile bodlate paro)
const MENU_LABEL = { bn: 'মেনু', en: 'Menu' }
const HINT_TEXT = {
  bn: 'এই মেনুতে ক্লিক করুন — আমাদের সব ফিচার এখানেই আছে',
  en: 'Tap this menu — all our features are right here'
}
const SEEN_KEY = 'nav-menu-seen'
const HINT_COLOR = '#e8590c' // tooltip er rong (dark/light dutoi te dekha jay)

// Shudhu mobile er extra CSS. Navbar er rong / theme tomar purano CSS (.nav, .links, .on, .btn) theke-i ashe.
// Dropdown er background nav theke inherit kore. Shudhu tooltip er rong fixed.
const CSS = `
.nav .nav-menu, .nav-hint { display: none; }

@media (max-width: 900px) {
  .nav { flex-wrap: nowrap; align-items: center; gap: 8px; }

  .nav .nav-menu {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    flex: 0 0 auto; min-height: 40px; padding: 0 14px;
    font-weight: 700; font-size: 15px; line-height: 1; white-space: nowrap;
    border-radius: 999px; cursor: pointer;
  }
  .nav .nav-menu .nm-icon { font-size: 18px; line-height: 1; }

  /* Tooltip dekhacche tokhon button halka pulse kore */
  .nav .nav-menu.nm-pulse { animation: nmPulse 1.8s ease-out infinite; }
  @keyframes nmPulse {
    0%   { box-shadow: 0 0 0 0 currentColor; }
    70%  { box-shadow: 0 0 0 10px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  .nav .tools { margin-left: auto; flex: 0 0 auto; }
  .nav .tools .btn { white-space: nowrap; }

  .nav .links { display: none !important; }
  .nav .links.nav-open {
    display: flex !important; flex-direction: column; flex-wrap: nowrap; gap: 2px;
    position: fixed; left: 0; right: 0; width: auto; margin: 0;
    box-sizing: border-box; padding: 8px 10px 12px; overflow-x: hidden; overflow-y: auto;
    background: inherit; z-index: 1000;
    border-bottom: 1px solid rgba(128,128,128,.35);
    box-shadow: 0 12px 24px rgba(0,0,0,.22);
  }
  .nav .links.nav-open a {
    display: block; padding: 13px 14px; font-size: 16px; white-space: normal;
  }

  /* "Ei menu te click korun" tooltip, menu button er thik niche */
  .nav-hint {
    display: flex; align-items: flex-start; gap: 10px;
    position: fixed; z-index: 1100; box-sizing: border-box;
    width: min(300px, calc(100vw - 24px)); padding: 12px 12px 12px 14px;
    border-radius: 14px; color: #fff; background: ${HINT_COLOR};
    font-size: 14px; font-weight: 600; line-height: 1.4; cursor: pointer;
    box-shadow: 0 10px 28px rgba(0,0,0,.35);
    animation: nhBounce 1.6s ease-in-out infinite;
  }
  .nav-hint::before {
    content: ''; position: absolute; top: -8px; left: var(--nh-arrow, 28px);
    width: 16px; height: 16px; background: ${HINT_COLOR};
    transform: translateX(-50%) rotate(45deg); border-radius: 3px;
  }
  .nav-hint .nh-text { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
  .nav-hint .nh-x {
    flex: 0 0 auto; border: 0; background: rgba(255,255,255,.22); color: #fff;
    width: 24px; height: 24px; border-radius: 50%; font-size: 13px; line-height: 1; cursor: pointer;
  }
  @keyframes nhBounce {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(5px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .nav .nav-menu.nm-pulse, .nav-hint { animation: none; }
  }
}
`

const readSeen = () => {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}
const writeSeen = () => {
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
}

export default function Nav({
  lang,
  setLang,
  dark,
  setDark,
  tools,
  route
}) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(readSeen)
  const [pos, setPos] = useState({ top: 56, left: 12, arrow: 28 })
  const navRef = useRef(null)
  const btnRef = useRef(null)
  const cur = route || '#/'

  const on = (h) =>
    h === '#/'
      ? cur === '' || cur === '#' || cur === '#/'
      : cur.startsWith(h)

  const label = (e, b) => (lang === 'bn' ? b : e)

  // Dropdown ar tooltip ta nav / button er sathe milie boshbe
  const place = () => {
    if (!navRef.current) return
    const top = Math.round(navRef.current.getBoundingClientRect().bottom)
    const b = btnRef.current && btnRef.current.getBoundingClientRect()
    const left = 12
    const arrow = b && b.width ? Math.round(b.left + b.width / 2 - left) : 28
    setPos({ top, left, arrow })
  }

  const dismissHint = () => {
    if (!seen) { setSeen(true); writeSeen() }
  }

  const toggle = () => {
    if (!open) place()
    setOpen((o) => !o)
    dismissHint()
  }

  // Page change hole menu bondho
  useEffect(() => { setOpen(false) }, [cur])

  // Language / layout bodlale position abar hisab
  useEffect(() => { place() }, [lang, tools, seen])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false)
      place()
    }
    place()
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', place, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', place)
    }
  }, [])

  const showHint = !seen && !open

  return (
    <nav className="nav" ref={navRef}>
      <style>{CSS}</style>

      {/* Logo */}
      {tools && (
        <a href="#/" className="logo sm">
          <Flame size={16} />
        </a>
      )}

      {/* Mobile hamburger (shudhu mobile e) */}
      <button
        ref={btnRef}
        className={'btn nav-menu' + (showHint ? ' nm-pulse' : '')}
        onClick={toggle}
        aria-expanded={open}
        aria-label={HINT_TEXT[lang] || HINT_TEXT.bn}
      >
        <span className="nm-icon" aria-hidden="true">{open ? '✕' : '☰'}</span>
        <span>{MENU_LABEL[lang] || MENU_LABEL.bn}</span>
      </button>

      {/* Navigation Links (desktop: age jemon, mobile: dropdown) */}
      <div
        className={'links' + (open ? ' nav-open' : '')}
        style={open ? { top: pos.top, maxHeight: `calc(100dvh - ${pos.top}px)` } : undefined}
      >
        {L.map(([h, e, b]) => (
          <a
            key={h}
            href={h}
            className={on(h) ? 'on' : ''}
            onClick={() => setOpen(false)}
          >
            {h === '#/player' && '🎵 '}
            {label(e, b)}
          </a>
        ))}
      </div>

      {/* Right Side Tools */}
      {tools && (
        <div className="tools">

          {/* Dark / Light */}
          <button
            className="btn"
            onClick={() => setDark(!dark)}
          >
            {dark ? '☀' : '☾'}
          </button>

          {/* Language */}
          <button
            className="btn"
            onClick={() =>
              setLang(lang === 'bn' ? 'en' : 'bn')
            }
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>

        </div>
      )}

      {/* Prothom visit e: "ei menu te click korun, shob feature ekhane" tooltip */}
      {showHint &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="nav-hint"
            role="status"
            style={{ top: pos.top + 10, left: pos.left, '--nh-arrow': pos.arrow + 'px' }}
            onClick={toggle}
          >
            <span aria-hidden="true">👆</span>
            <span className="nh-text">{HINT_TEXT[lang] || HINT_TEXT.bn}</span>
            <button
              className="nh-x"
              aria-label="Close"
              onClick={(e) => { e.stopPropagation(); dismissHint() }}
            >
              ✕
            </button>
          </div>,
          document.body
        )}
    </nav>
  )
}