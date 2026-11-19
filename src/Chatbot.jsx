
import { useEffect, useRef, useState } from 'react'

// ---------- texts ----------
const TXT = {
  bn: {
    title: 'পূজা সহায়ক',
    sub: 'মণ্ডপ, হেরিটেজ, রুট — যা জানতে চান',
    hello: 'নমস্কার! আমি পূজা সহায়ক 🪔 আপনি কোথায় আছেন বললে (বা 📍 চাপলে) কাছের মণ্ডপগুলো দেখিয়ে দেব। কোনো মণ্ডপের হেরিটেজ বা ওয়েবসাইটের ফিচারও জানতে পারেন।',
    ph: 'এখানে লিখুন…',
    send: 'পাঠান',
    loc: 'আমার লোকেশন',
    locAsk: 'আমার লোকেশন পাঠালাম। আমার কাছের পূজা মণ্ডপ কোনগুলো?',
    locDenied: 'লোকেশন পারমিশন পাওয়া যায়নি। এলাকার নাম লিখে জিজ্ঞেস করতে পারেন।',
    err: 'নেটওয়ার্কে সমস্যা হচ্ছে, আবার চেষ্টা করুন।',
    chips: [
      'আমার কাছের পূজা মণ্ডপ কোনগুলো?',
      'কোন মণ্ডপের হেরিটেজ আছে?',
      'ওয়েবসাইটের ফিচার ঘুরিয়ে দেখাও'
    ],
    km: 'কিমি',
    openMap: 'মানচিত্রে',
    openHer: 'হেরিটেজ খুলুন',
    goPage: 'পেজে যান',
    tour: 'ফিচার ট্যুর',
    step: 'ধাপ',
    next: 'পরের',
    prev: 'আগের',
    pause: 'থামান',
    play: 'চালান',
    stop: 'বন্ধ',
    done: 'ট্যুর শেষ! 🎉 কিছু জানতে চাইলে আমাকে জিজ্ঞেস করুন।',
    close: 'বন্ধ করুন',
    welcomeTitle: 'পূজা সহায়ক',
    welcomeGreeting: 'নমস্কার! 🙏',
    welcomeMessage: 'আমি Chattogram Puja Mandap Guide-এর ভার্চুয়াল অ্যাসিস্ট্যান্ট।',
    welcomeHelp: 'Sir, need any help? 😊',
    welcomeInfo: 'কাছের মণ্ডপ খোঁজা, হেরিটেজ, রুট ও ভাড়া এবং ওয়েবসাইটের ফিচার সম্পর্কে সাহায্য করতে পারি।',
    welcomeButton: 'আমার সাথে কথা বলুন →'
  },

  en: {
    title: 'Puja Guide',
    sub: 'Mandaps, heritage, routes — ask anything',
    hello: 'Hello! I am Puja Guide 🪔 Tell me where you are (or tap 📍) and I will show the nearest mandaps. Ask about a mandap\'s heritage or the website features too.',
    ph: 'Type here…',
    send: 'Send',
    loc: 'My location',
    locAsk: 'I shared my location. Which puja mandaps are nearest to me?',
    locDenied: 'Location permission was not granted. You can type your area name instead.',
    err: 'Network problem, please try again.',
    chips: [
      'Which puja mandaps are near me?',
      'Which mandaps have heritage info?',
      'Show me the website features'
    ],
    km: 'km',
    openMap: 'On map',
    openHer: 'Open heritage',
    goPage: 'Go to page',
    tour: 'Feature tour',
    step: 'Step',
    next: 'Next',
    prev: 'Back',
    pause: 'Pause',
    play: 'Play',
    stop: 'Stop',
    done: 'Tour finished! 🎉 Ask me anything else.',
    close: 'Close',
    welcomeTitle: 'Puja Guide Assistant',
    welcomeGreeting: 'Hello there! 🙏',
    welcomeMessage: 'I am the virtual assistant of Chattogram Puja Mandap Guide.',
    welcomeHelp: 'Sir, need any help? 😊',
    welcomeInfo: 'I can help you find nearby mandaps, explore heritage, check routes & fares, and discover website features.',
    welcomeButton: 'Chat with me →'
  }
}

// ---------- Feature tour ----------
const STEPS = [
  {
    path: '/',
    t: ['মানচিত্র', 'Map'],
    d: [
      'পিনে ক্লিক করলে মণ্ডপের ছবি দেখা যায়। উপরে সার্চ, এলাকা ফিল্টার আর “কাছাকাছি” বাটন আছে — নিজের লোকেশন থেকে কাছের মণ্ডপ আগে দেখায়। নতুন মণ্ডপ ও ছবিও জমা দেওয়া যায়।',
      'Tap a pin to see photos of a mandap. Search, area filter and a Near me button sort mandaps by distance. You can also suggest new mandaps and upload photos.'
    ]
  },
  {
    path: '/heritage',
    t: ['হেরিটেজ', 'Heritage'],
    d: [
      'প্রতিটি মণ্ডপের বছরভিত্তিক ইতিহাস — স্থপতি, প্রতিমাশিল্পী, থিম, জায়গা বদলের কথা। বইয়ের মতো পাতা উল্টে পড়া, QR ও PDF-ও আছে। আপনিও হেরিটেজ জমা দিতে পারেন।',
      'Year-by-year history of each mandap: architect, artist, theme and location changes. Read it like a book, with QR and PDF. You can submit one too.'
    ]
  },
  {
    path: '/routes',
    t: ['যাতায়াত ও খরচ', 'Routes & Fare'],
    d: [
      'কোথা থেকে কোথায় যেতে কত ভাড়া — রুট ও ভাড়ার ইতিহাস। আপনিও রুট/ভাড়া সাজেস্ট করতে পারেন।',
      'Fares between places with fare history. You can suggest routes and fares.'
    ]
  },
  {
    path: '/schedule',
    t: ['তিথি', 'Schedule'],
    d: [
      'সপ্তমী, অষ্টমী, নবমী, দশমী — কোন দিন কী, তার সূচি।',
      'Saptami, Ashtami, Navami, Dashami — the puja day schedule.'
    ]
  },
  {
    path: '/parikroma',
    t: ['পরিক্রমা', 'Parikrama'],
    d: [
      'তিথি ও সময় অনুযায়ী মণ্ডপ পরিক্রমার ক্রমানুসারে রুট।',
      'Ordered puja parikroma routes by tithi and time.'
    ]
  },
  {
    path: '/vote',
    t: ['ভোট', 'Vote'],
    d: [
      'চট্টগ্রামের সেরা ৫ পূজায় ভোট দিন, ফলাফল চার্টে দেখুন।',
      'Vote for the best 5 pujas and see live charts.'
    ]
  },
  {
    path: '/reps',
    t: ['প্রতিনিধি', 'Representatives'],
    d: [
      'পূজা কমিটির প্রতিনিধিদের ছবি ও পরিচিতি।',
      'Pictures and details of puja committee representatives.'
    ]
  },
  {
    path: '/player',
    t: ['পূজার গান', 'Pujo Songs'],
    d: [
      'দুর্গাপূজার গান এখানেই শুনুন।',
      'Listen to Durga Puja songs right here.'
    ]
  },
  {
    path: '/blog',
    t: ['ব্লগ', 'Blog'],
    d: [
      'পূজা নিয়ে লেখা, অভিজ্ঞতা ও গল্প — আপনিও লিখে পাঠাতে পারেন।',
      'Stories and experiences about the puja — you can submit yours.'
    ]
  },
  {
    path: '/zones',
    t: ['জোন', 'Zones'],
    d: [
      'বাংলাদেশ জুড়ে বিভাগ/জেলা অনুযায়ী মণ্ডপের সংখ্যা ও খোঁজা।',
      'Mandap counts across Bangladesh by division and district.'
    ]
  },
  {
    path: '/sponsors',
    t: ['স্পনসর', 'Sponsors'],
    d: [
      'যাঁরা এই উদ্যোগের পাশে আছেন, আর স্পনসর হওয়ার যোগাযোগ।',
      'Who supports this project, and how to become a sponsor.'
    ]
  },
  {
    path: '/about',
    t: ['সম্পর্কে', 'About'],
    d: [
      'প্রজেক্টের উদ্দেশ্য, ডেভেলপার ও ভবিষ্যৎ পরিকল্পনা।',
      'The purpose, the developer and future plans.'
    ]
  },
  {
    path: '/tutorial',
    t: ['টিউটোরিয়াল', 'Tutorial'],
    d: [
      'ওয়েবসাইট ব্যবহারের ভিডিও গাইড।',
      'Video guides on using the website.'
    ]
  }
]

const STEP_MS = 9000

const go = (url) => {
  if (window.location.pathname + window.location.search !== url) {
    window.history.pushState({}, '', url)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const isMobile = () => window.innerWidth < 700

// ---------- Styles ----------
const CSS = `
.cb-fab {
  position:fixed; right:16px; bottom:16px; z-index:9000;
  width:58px; height:58px; border-radius:50%;
  border:2px solid var(--gold,#b8892e);
  background:var(--maroon,#7a1620); color:#fff;
  font-size:26px; cursor:pointer;
  box-shadow:0 10px 26px -8px rgba(0,0,0,.55);
  display:flex; align-items:center; justify-content:center;
}
.cb-fab:hover { transform:scale(1.05); }

.cb-dot {
  position:absolute; top:4px; right:4px;
  width:12px; height:12px; border-radius:50%;
  background:#ffb300; border:2px solid #fff;
}

/* Welcome popup */
.cb-welcome {
  position:fixed;
  right:22px;
  bottom:88px;
  z-index:8999;
  width:300px;
  max-width:calc(100vw - 32px);
  padding:17px;
  border-radius:17px;
  background:var(--surface,#fffdf8);
  color:var(--ink,#2a1512);
  border:1px solid var(--gold,#b8892e);
  box-shadow:0 15px 40px rgba(0,0,0,.25);
  animation:cb-pop .4s ease-out;
  line-height:1.5;
}

.cb-welcome-head {
  display:flex;
  align-items:center;
  gap:9px;
  margin-bottom:12px;
}

.cb-welcome-icon {
  width:38px;
  height:38px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--maroon,#7a1620);
  color:white;
  font-size:21px;
}

.cb-welcome-head strong {
  color:var(--maroon,#7a1620);
  font-size:14px;
}

[data-theme=dark] .cb-welcome-head strong {
  color:#e4bf70;
}

.cb-welcome-status {
  font-size:11px;
  color:#16a34a;
}

.cb-welcome p {
  margin:8px 0;
  font-size:13.5px;
}

.cb-welcome-info {
  font-size:12px;
  opacity:.8;
  line-height:1.6;
}

.cb-welcome-btn {
  width:100%;
  margin-top:13px;
  padding:10px;
  border:0;
  border-radius:11px;
  background:var(--maroon,#7a1620);
  color:#fff;
  font-weight:700;
  cursor:pointer;
}

.cb-welcome-btn:hover {
  opacity:.9;
}

.cb-welcome-x {
  position:absolute;
  top:8px;
  right:10px;
  background:transparent;
  border:0;
  color:inherit;
  font-size:21px;
  cursor:pointer;
}

@keyframes cb-pop {
  from { opacity:0; transform:translateY(14px) scale(.97); }
  to { opacity:1; transform:translateY(0) scale(1); }
}

.cb-win {
  position:fixed; right:16px; bottom:86px; z-index:9001;
  width:370px; max-width:calc(100vw - 24px);
  height:540px; max-height:calc(100dvh - 110px);
  display:flex; flex-direction:column;
  background:var(--surface,#fffdf8);
  color:var(--ink,#2a1512);
  border:1px solid var(--line,#e8dcc4);
  border-radius:18px;
  box-shadow:0 24px 60px -18px rgba(0,0,0,.55);
  overflow:hidden;
}

.cb-head {
  padding:12px 14px;
  background:var(--maroon,#7a1620);
  color:#fff;
  display:flex;
  align-items:center;
  gap:10px;
}

.cb-head h4 { margin:0; font-size:16px; line-height:1.2; }
.cb-head small { opacity:.85; font-size:12px; }

.cb-x {
  margin-left:auto; background:transparent; border:0;
  color:#fff; font-size:22px; cursor:pointer; line-height:1;
}

.cb-body {
  flex:1; overflow-y:auto; padding:12px;
  display:flex; flex-direction:column; gap:10px;
}

.cb-m {
  max-width:88%; padding:9px 12px;
  border-radius:14px; font-size:14.5px;
  line-height:1.5; white-space:pre-wrap;
  word-break:break-word;
}

.cb-m.bot {
  align-self:flex-start;
  background:rgba(184,137,46,.14);
  border:1px solid var(--line,#e8dcc4);
}

.cb-m.user {
  align-self:flex-end;
  background:var(--maroon,#7a1620);
  color:#fff;
}

.cb-acts {
  display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;
}

.cb-act {
  border:1px solid var(--gold,#b8892e);
  background:var(--surface,#fffdf8);
  color:var(--maroon,#7a1620);
  border-radius:999px; padding:5px 10px;
  font-size:12.5px; cursor:pointer; font-weight:600;
}

[data-theme=dark] .cb-act { color:#e4bf70; }

.cb-chips {
  display:flex; flex-wrap:wrap;
  gap:6px; padding:0 12px 8px;
}

.cb-in {
  display:flex; gap:6px; padding:10px;
  border-top:1px solid var(--line,#e8dcc4);
}

.cb-in input {
  flex:1; min-width:0; padding:10px 12px;
  border-radius:12px;
  border:1px solid var(--line,#e8dcc4);
  background:var(--bg,#faf5ec);
  color:inherit; font:inherit; font-size:14.5px;
}

.cb-in button {
  border:0; border-radius:12px;
  padding:0 14px; cursor:pointer; font-weight:700;
}

.cb-send { background:var(--maroon,#7a1620); color:#fff; }
.cb-loc { background:rgba(184,137,46,.2); font-size:18px; }
.cb-typing { align-self:flex-start; opacity:.7; font-size:13px; }

.cb-tour {
  position:fixed; left:50%; transform:translateX(-50%);
  bottom:14px; z-index:9002;
  width:min(560px,calc(100vw - 20px));
  background:var(--surface,#fffdf8);
  color:var(--ink,#2a1512);
  border:2px solid var(--gold,#b8892e);
  border-radius:16px; padding:12px 14px;
  box-shadow:0 20px 50px -14px rgba(0,0,0,.6);
}

.cb-tour b { color:var(--maroon,#7a1620); }
[data-theme=dark] .cb-tour b { color:#e4bf70; }

.cb-bar {
  height:4px; border-radius:4px;
  background:rgba(184,137,46,.25);
  margin:8px 0; overflow:hidden;
}

.cb-bar i {
  display:block; height:100%;
  background:var(--gold,#b8892e);
}

.cb-bar i.run {
  animation:cbfill ${STEP_MS}ms linear forwards;
}

@keyframes cbfill {
  from { width:0; }
  to { width:100%; }
}

.cb-trow {
  display:flex; gap:6px;
  flex-wrap:wrap; margin-top:6px;
}

@media (max-width:700px) {
  .cb-win {
    right:8px; left:8px; width:auto;
    bottom:78px; height:62dvh;
  }

  .cb-fab { right:12px; bottom:12px; }
  .cb-tour { bottom:10px; }

  .cb-welcome {
    right:14px;
    bottom:82px;
    width:290px;
  }
}
`

export default function Chatbot() {
  const [lang, setLang] = useState(
    localStorage.getItem('lang') === 'en' ? 'en' : 'bn'
  )

  const t = TXT[lang]

  const [open, setOpen] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [loc, setLoc] = useState(null)
  const [tour, setTour] = useState(null)

  const bodyRef = useRef(null)

  // ---------- Language ----------
  useEffect(() => {
    const h = (e) => setLang(e.detail === 'en' ? 'en' : 'bn')

    window.addEventListener('applang', h)

    return () => window.removeEventListener('applang', h)
  }, [])

  // ---------- Welcome popup ----------
  useEffect(() => {
    if (open || msgs.length > 0) return

    const timer = setTimeout(() => {
      setWelcome(true)
    }, 2500)

    return () => clearTimeout(timer)
  }, [open, msgs.length])

  // ---------- Initial message ----------
  useEffect(() => {
    if (open && !msgs.length) {
      setWelcome(false)
      setMsgs([{ role: 'bot', text: t.hello }])
    }
  }, [open])

  // ---------- Auto scroll ----------
  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: 1e6,
      behavior: 'smooth'
    })
  }, [msgs, busy, open])

  // ---------- Tour ----------
  const startTour = () => {
    setTour({ i: 0, paused: false })

    if (isMobile()) setOpen(false)
  }

  useEffect(() => {
    if (!tour || tour.done) return

    const s = STEPS[tour.i]

    go(s.path)
    window.scrollTo({ top: 0 })

    if (tour.paused) return

    const id = setTimeout(() => {
      setTour((c) =>
        c && !c.done
          ? c.i + 1 >= STEPS.length
            ? { done: true }
            : { i: c.i + 1, paused: false }
          : c
      )
    }, STEP_MS)

    return () => clearTimeout(id)
  }, [tour?.i, tour?.paused, tour?.done])

  useEffect(() => {
    if (tour?.done) {
      go('/')
      setMsgs((m) => [...m, { role: 'bot', text: t.done }])
      setTour(null)
      setOpen(true)
    }
  }, [tour?.done])

  // ---------- Actions ----------
  const run = (a) => {
    if (a.type === 'show_mandap') {
      window.dispatchEvent(
        new CustomEvent('chat:focus', {
          detail: { id: a.id }
        })
      )
    } else if (a.type === 'open_heritage') {
      go(`/heritage?docId=${a.id}`)
    } else if (a.type === 'go_page') {
      go(a.path)
    } else if (a.type === 'tour') {
      return startTour()
    }

    if (isMobile()) setOpen(false)
  }

  // ---------- Send message ----------
  const send = async (raw, locOverride) => {
    const message = (raw ?? text).trim()

    if (!message || busy) return

    setText('')

    const history = msgs.slice(-6).map((m) => ({
      role: m.role === 'user' ? 'user' : 'bot',
      text: m.text
    }))

    setMsgs((m) => [
      ...m,
      { role: 'user', text: message }
    ])

    setBusy(true)

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          history,
          lang,
          loc: locOverride || loc
        })
      })

      if (!r.ok) {
        throw new Error(`API Error: ${r.status}`)
      }

      const j = await r.json()

      const actions = j.actions || []

      setMsgs((m) => [
        ...m,
        {
          role: 'bot',
          text: j.reply || t.err,
          actions
        }
      ])

      const first = actions.find(
        (a) => a.type !== 'ask_location'
      )

      if (first) {
        setTimeout(() => run(first), 350)
      }

    } catch (error) {
      console.error('Chatbot error:', error)

      setMsgs((m) => [
        ...m,
        { role: 'bot', text: t.err }
      ])
    }

    setBusy(false)
  }

  // ---------- Location ----------
  const askLocation = () => {
    if (!navigator.geolocation) {
      return setMsgs((m) => [
        ...m,
        { role: 'bot', text: t.locDenied }
      ])
    }

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = {
          lat: p.coords.latitude,
          lng: p.coords.longitude
        }

        setLoc(pos)

        window.dispatchEvent(
          new CustomEvent('chat:me', {
            detail: pos
          })
        )

        send(t.locAsk, pos)
      },
      () => {
        setMsgs((m) => [
          ...m,
          { role: 'bot', text: t.locDenied }
        ])
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    )
  }

  // ---------- Action labels ----------
  const label = (a) =>
    a.type === 'show_mandap'
      ? `📍 ${a.name}${a.km != null ? ` · ${a.km} ${t.km}` : ''}`
      : a.type === 'open_heritage'
        ? `📖 ${t.openHer}: ${a.name}`
        : a.type === 'go_page'
          ? `➜ ${t.goPage}: ${
              STEPS.find((s) => s.path === a.path)?.t[
                lang === 'bn' ? 0 : 1
              ] || a.path
            }`
          : a.type === 'tour'
            ? `🧭 ${t.tour}`
            : ''

  const cur = tour && !tour.done
    ? STEPS[tour.i]
    : null

  const li = lang === 'bn' ? 0 : 1

  return (
    <>
      <style>{CSS}</style>

      {/* ---------- Feature Tour ---------- */}
      {cur && (
        <div className="cb-tour" role="status">
          <div>
            <b>
              {t.tour} · {t.step} {tour.i + 1}/{STEPS.length}: {cur.t[li]}
            </b>
          </div>

          <div style={{
            fontSize: 14,
            marginTop: 4,
            lineHeight: 1.5
          }}>
            {cur.d[li]}
          </div>

          <div className="cb-bar">
            <i
              key={tour.i + String(tour.paused)}
              className={tour.paused ? '' : 'run'}
              style={tour.paused ? { width: '0%' } : undefined}
            />
          </div>

          <div className="cb-trow">
            <button
              className="cb-act"
              disabled={tour.i === 0}
              onClick={() =>
                setTour({
                  i: tour.i - 1,
                  paused: tour.paused
                })
              }
            >
              ‹ {t.prev}
            </button>

            <button
              className="cb-act"
              onClick={() =>
                setTour({
                  ...tour,
                  paused: !tour.paused
                })
              }
            >
              {tour.paused ? `▶ ${t.play}` : `❚❚ ${t.pause}`}
            </button>

            <button
              className="cb-act"
              onClick={() =>
                setTour(
                  tour.i + 1 >= STEPS.length
                    ? { done: true }
                    : {
                        i: tour.i + 1,
                        paused: tour.paused
                      }
                )
              }
            >
              {t.next} ›
            </button>

            <button
              className="cb-act"
              onClick={() => setTour(null)}
            >
              ✕ {t.stop}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Welcome Popup ---------- */}
      {!open && welcome && (
        <div className="cb-welcome">
          <button
            className="cb-welcome-x"
            onClick={() => setWelcome(false)}
            aria-label={t.close}
          >
            ×
          </button>

          <div className="cb-welcome-head">
            <div className="cb-welcome-icon">🪔</div>

            <div>
              <strong>{t.welcomeTitle}</strong>
              <div className="cb-welcome-status">
                ● Online · Ready to help
              </div>
            </div>
          </div>

          <p><b>{t.welcomeGreeting}</b></p>

          <p>{t.welcomeMessage}</p>

          <p><b>{t.welcomeHelp}</b></p>

          <div className="cb-welcome-info">
            {t.welcomeInfo}
          </div>

          <button
            className="cb-welcome-btn"
            onClick={() => {
              setWelcome(false)
              setOpen(true)
            }}
          >
            {t.welcomeButton}
          </button>
        </div>
      )}

      {/* ---------- Floating Button ---------- */}
      {!open && (
        <button
          className="cb-fab"
          aria-label={t.title}
          onClick={() => {
            setWelcome(false)
            setOpen(true)
          }}
        >
          🪔
          {!msgs.length && <span className="cb-dot" />}
        </button>
      )}

      {/* ---------- Chat Window ---------- */}
      {open && (
        <div
          className="cb-win"
          role="dialog"
          aria-label={t.title}
        >
          <div className="cb-head">
            <span style={{ fontSize: 24 }}>🪔</span>

            <div>
              <h4>{t.title}</h4>
              <small>{t.sub}</small>
            </div>

            <button
              className="cb-x"
              onClick={() => setOpen(false)}
              aria-label={t.close}
            >
              ×
            </button>
          </div>

          <div className="cb-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div
                key={i}
                className={'cb-m ' + m.role}
              >
                {m.text}

                {m.actions?.some((a) => label(a)) && (
                  <div className="cb-acts">
                    {m.actions
                      .filter((a) => a.type !== 'ask_location')
                      .map((a, k) => (
                        <button
                          key={k}
                          className="cb-act"
                          onClick={() => run(a)}
                        >
                          {label(a)}
                        </button>
                      ))}

                    {m.actions.some(
                      (a) => a.type === 'ask_location'
                    ) && (
                      <button
                        className="cb-act"
                        onClick={askLocation}
                      >
                        📍 {t.loc}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="cb-typing">…</div>
            )}
          </div>

          {msgs.length <= 1 && (
            <div className="cb-chips">
              {t.chips.map((c) => (
                <button
                  key={c}
                  className="cb-act"
                  onClick={() =>
                    c === t.chips[0] && !loc
                      ? askLocation()
                      : send(c)
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="cb-in">
            <button
              className="cb-loc"
              title={t.loc}
              onClick={askLocation}
            >
              📍
            </button>

            <input
              value={text}
              placeholder={t.ph}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && send()
              }
            />

            <button
              className="cb-send"
              onClick={() => send()}
              disabled={busy}
            >
              {t.send}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
