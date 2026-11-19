
import { useEffect, useRef, useState } from 'react'

// ============================================================
// CONFIG
// ============================================================

// Vercel backend: same API for workers.dev, pages.dev and .com
const CHAT_API = 'https://ctgpujamandap.vercel.app/api/chat'

const STEP_MS = 9000

const go = (url) => {
  if (window.location.pathname + window.location.search !== url) {
    window.history.pushState({}, '', url)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const isMobile = () => window.innerWidth < 700

// ============================================================
// TRANSLATIONS
// ============================================================

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
    welcomeButton: 'আমার সাথে কথা বলুন →',
    online: 'অনলাইন · সাহায্যের জন্য প্রস্তুত'
  },

  en: {
    title: 'Puja Guide',
    sub: 'Mandaps, heritage, routes — ask anything',
    hello: 'Hello! I am Puja Guide 🪔 Tell me where you are (or tap 📍) and I will show the nearest mandaps. Ask about a mandap\'s heritage or website features too.',
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
    welcomeButton: 'Chat with me →',
    online: 'Online · Ready to help'
  }
}

// ============================================================
// FEATURE TOUR
// ============================================================

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

// ============================================================
// TAILWIND THEME CLASSES
// ============================================================

const panel =
  'bg-[var(--surface,#fffdf8)] text-[var(--ink,#2a1512)] border border-[var(--line,#e8dcc4)] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.55)]'

const goldButton =
  'border border-[var(--gold,#b8892e)] bg-[var(--surface,#fffdf8)] text-[var(--maroon,#7a1620)] dark:text-[#e4bf70] rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed'

const maroonButton =
  'rounded-xl bg-[var(--maroon,#7a1620)] text-white font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed'

// ============================================================
// CHATBOT COMPONENT
// ============================================================

export default function Chatbot() {
  const [lang, setLang] = useState(() =>
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

  const li = lang === 'bn' ? 0 : 1

  // ---------- Language listener ----------

  useEffect(() => {
    const h = (e) => {
      const next = e.detail === 'en' ? 'en' : 'bn'
      setLang(next)
    }

    window.addEventListener('applang', h)

    return () => window.removeEventListener('applang', h)
  }, [])

  // ---------- Welcome popup ----------

  useEffect(() => {
    if (open || msgs.length > 0) {
      setWelcome(false)
      return
    }

    const timer = setTimeout(() => {
      setWelcome(true)
    }, 2500)

    return () => clearTimeout(timer)
  }, [open, msgs.length])

  // ---------- Initial greeting ----------

  useEffect(() => {
    if (open && !msgs.length) {
      setWelcome(false)
      setMsgs([{ role: 'bot', text: t.hello }])
    }
  }, [open, msgs.length, t.hello])

  // ---------- Auto scroll ----------

  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [msgs, busy, open])

  // ---------- Feature tour ----------

  const startTour = () => {
    setTour({ i: 0, paused: false })

    if (isMobile()) setOpen(false)
  }

  useEffect(() => {
    if (!tour || tour.done) return

    const s = STEPS[tour.i]

    go(s.path)
    window.scrollTo({ top: 0, behavior: 'smooth' })

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

  // ---------- Tour completed ----------

  useEffect(() => {
    if (!tour?.done) return

    go('/')

    setMsgs((m) => [
      ...m,
      { role: 'bot', text: t.done }
    ])

    setTour(null)
    setOpen(true)
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
      startTour()
      return
    } else if (a.type === 'ask_location') {
      askLocation()
      return
    }

    if (isMobile()) setOpen(false)
  }

  // ---------- Send message ----------

  const send = async (raw, locOverride) => {
    const message = (raw ?? text).trim()

    if (!message || busy) return

    setText('')

    const history = msgs.slice(-6).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.text
    }))

    setMsgs((m) => [
      ...m,
      { role: 'user', text: message }
    ])

    setBusy(true)

    try {
      const r = await fetch(CHAT_API, {
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

      const actions = Array.isArray(j.actions)
        ? j.actions
        : []

      setMsgs((m) => [
        ...m,
        {
          role: 'bot',
          text: j.reply || t.err,
          actions
        }
      ])

      // Automatically execute first navigation action
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
    } finally {
      setBusy(false)
    }
  }

  // ---------- Location ----------

  const askLocation = () => {
    if (!navigator.geolocation) {
      setMsgs((m) => [
        ...m,
        { role: 'bot', text: t.locDenied }
      ])
      return
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

  const label = (a) => {
    if (a.type === 'show_mandap') {
      return `📍 ${a.name}${a.km != null ? ` · ${a.km} ${t.km}` : ''}`
    }

    if (a.type === 'open_heritage') {
      return `📖 ${t.openHer}: ${a.name}`
    }

    if (a.type === 'go_page') {
      const page = STEPS.find((s) => s.path === a.path)

      return `➜ ${t.goPage}: ${
        page?.t[li] || a.path
      }`
    }

    if (a.type === 'tour') {
      return `🧭 ${t.tour}`
    }

    return ''
  }

  const cur = tour && !tour.done
    ? STEPS[tour.i]
    : null

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* ================================================== */}
      {/* FEATURE TOUR */}
      {/* ================================================== */}

      {cur && (
        <div
          className={`fixed bottom-3 left-1/2 z-[9002] w-[min(560px,calc(100vw-20px))] -translate-x-1/2 rounded-2xl border-2 border-[var(--gold,#b8892e)] p-3.5 ${panel}`}
          role="status"
        >
          <div className="font-bold text-[var(--maroon,#7a1620)] dark:text-[#e4bf70]">
            {t.tour} · {t.step} {tour.i + 1}/{STEPS.length}: {cur.t[li]}
          </div>

          <p className="mt-2 text-sm leading-relaxed">
            {cur.d[li]}
          </p>

          <div className="my-3 h-1 overflow-hidden rounded-full bg-amber-700/15">
            <div
              key={tour.i + String(tour.paused)}
              className={`h-full rounded-full bg-[var(--gold,#b8892e)] ${
                tour.paused ? '' : 'animate-[cbfill_9s_linear_forwards]'
              }`}
              style={{
                width: tour.paused ? '0%' : '100%'
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={goldButton}
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
              className={goldButton}
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
              className={goldButton}
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
              className={goldButton}
              onClick={() => setTour(null)}
            >
              ✕ {t.stop}
            </button>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* WELCOME POPUP */}
      {/* ================================================== */}

      {!open && welcome && (
        <div
          className={`fixed bottom-[88px] right-3.5 z-[8999] w-[290px] max-w-[calc(100vw-32px)] animate-[cbpop_.4s_ease-out] rounded-2xl border border-[var(--gold,#b8892e)] p-4 shadow-xl sm:right-[22px] sm:w-[300px] ${panel}`}
        >
          <button
            className="absolute right-2 top-1.5 rounded-full p-1 text-2xl leading-none hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setWelcome(false)}
            aria-label={t.close}
          >
            ×
          </button>

          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--maroon,#7a1620)] text-xl text-white">
              🪔
            </div>

            <div>
              <strong className="text-sm text-[var(--maroon,#7a1620)] dark:text-[#e4bf70]">
                {t.welcomeTitle}
              </strong>

              <div className="text-[11px] text-green-600">
                ● {t.online}
              </div>
            </div>
          </div>

          <p className="my-2 text-sm font-bold">
            {t.welcomeGreeting}
          </p>

          <p className="my-2 text-[13px] leading-relaxed">
            {t.welcomeMessage}
          </p>

          <p className="my-2 text-[13px] font-semibold">
            {t.welcomeHelp}
          </p>

          <p className="text-xs leading-relaxed opacity-80">
            {t.welcomeInfo}
          </p>

          <button
            className={`mt-3 w-full px-3 py-2.5 text-sm ${maroonButton}`}
            onClick={() => {
              setWelcome(false)
              setOpen(true)
            }}
          >
            {t.welcomeButton}
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* FLOATING BUTTON */}
      {/* ================================================== */}

      {!open && (
        <button
          className="fixed bottom-3 right-3 z-[9000] flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-[var(--gold,#b8892e)] bg-[var(--maroon,#7a1620)] text-[26px] text-white shadow-[0_10px_26px_-8px_rgba(0,0,0,0.55)] transition hover:scale-105 sm:bottom-4 sm:right-4"
          aria-label={t.title}
          onClick={() => {
            setWelcome(false)
            setOpen(true)
          }}
        >
          🪔

          {!msgs.length && (
            <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />
          )}
        </button>
      )}

      {/* ================================================== */}
      {/* CHAT WINDOW */}
      {/* ================================================== */}

      {open && (
        <div
          className={`fixed bottom-[78px] left-2 right-2 z-[9001] flex h-[62dvh] flex-col overflow-hidden rounded-[18px] sm:bottom-[86px] sm:left-auto sm:right-4 sm:h-[540px] sm:max-h-[calc(100dvh-110px)] sm:w-[370px] ${panel}`}
          role="dialog"
          aria-label={t.title}
        >
          {/* HEADER */}

          <div className="flex shrink-0 items-center gap-2.5 bg-[var(--maroon,#7a1620)] px-3.5 py-3 text-white">
            <span className="text-2xl">🪔</span>

            <div className="min-w-0">
              <h4 className="text-base font-bold leading-tight">
                {t.title}
              </h4>

              <small className="text-xs opacity-85">
                {t.sub}
              </small>
            </div>

            <button
              className="ml-auto rounded-full px-2 text-2xl leading-none text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label={t.close}
            >
              ×
            </button>
          </div>

          {/* MESSAGES */}

          <div
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3"
            ref={bodyRef}
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] whitespace-pre-wrap break-words rounded-[14px] px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'self-end bg-[var(--maroon,#7a1620)] text-white'
                    : 'self-start border border-[var(--line,#e8dcc4)] bg-[rgba(184,137,46,0.14)] text-[var(--ink,#2a1512)] dark:text-white'
                }`}
              >
                {m.text}

                {m.actions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.actions
                      .filter((a) => a.type !== 'ask_location' && label(a))
                      .map((a, k) => (
                        <button
                          key={k}
                          className={goldButton}
                          onClick={() => run(a)}
                        >
                          {label(a)}
                        </button>
                      ))}

                    {m.actions.some(
                      (a) => a.type === 'ask_location'
                    ) && (
                      <button
                        className={goldButton}
                        onClick={askLocation}
                      >
                        📍 {t.loc}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* LOADING */}

            {busy && (
              <div className="flex items-center gap-1.5 self-start rounded-xl bg-amber-700/10 px-3 py-2">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold,#b8892e)]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold,#b8892e)] [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold,#b8892e)] [animation-delay:300ms]" />
              </div>
            )}
          </div>

          {/* QUICK SUGGESTIONS */}

          {msgs.length <= 1 && (
            <div className="flex shrink-0 flex-wrap gap-1.5 px-3 pb-2">
              {t.chips.map((c, i) => (
                <button
                  key={c}
                  className={goldButton}
                  disabled={busy}
                  onClick={() =>
                    i === 0 && !loc
                      ? askLocation()
                      : send(c)
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* INPUT */}

          <div className="flex shrink-0 gap-1.5 border-t border-[var(--line,#e8dcc4)] p-2.5">
            <button
              className="rounded-xl bg-[rgba(184,137,46,0.2)] px-3 text-lg transition hover:bg-amber-700/25"
              title={t.loc}
              onClick={askLocation}
              disabled={busy}
            >
              📍
            </button>

            <input
              value={text}
              placeholder={t.ph}
              maxLength={500}
              disabled={busy}
              className="min-w-0 flex-1 rounded-xl border border-[var(--line,#e8dcc4)] bg-[var(--bg,#faf5ec)] px-3 py-2.5 text-sm text-[var(--ink,#2a1512)] outline-none placeholder:text-gray-500 focus:border-[var(--gold,#b8892e)] dark:text-white"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />

            <button
              className={`px-3 text-sm ${maroonButton}`}
              onClick={() => send()}
              disabled={busy || !text.trim()}
            >
              {t.send}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
