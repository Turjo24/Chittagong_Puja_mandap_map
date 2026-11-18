import { useEffect, useMemo, useRef, useState } from 'react'

/* ───────────────────────── DATA ─────────────────────────
   Ekhane tomar real heritage mandap gulo boshao.
   - dad: paragraph er array. Joto boro hok, scene nijei lomba hoye jabe (scroll beshi lagbe), kono jinis baire jabe na.
   - photo: url. Na dile 🪔 placeholder dekhabe.
*/
const STOPS = [
  {
    id: 'sample-1',
    name: { bn: 'উদাহরণ মণ্ডপ ১', en: 'Sample Mandap 1' },
    year: 1900,
    photo: '',
    caption: { bn: 'পুরনো ঠাকুরদালান', en: 'The old thakurdalan' },
    kid: {
      bn: 'বাবা, এই মণ্ডপটা এত পুরনো কেন?',
      en: 'Baba, why is this mandap so old?',
    },
    dad: {
      bn: [
        'আমাদের সময়ে এই পূজা এমনই ছিল রে। তখন বিদ্যুৎ ছিল না, প্রদীপ আর হ্যাজাকের আলোয় সব হতো।',
        'এখানে এখন যে কাঠামো দেখছিস, এটা শত বছরের বেশি পুরনো। তোর ঠাকুরদাও ছোটবেলায় এখানেই ঠাকুর দেখতে আসতেন।',
      ],
      en: [
        'This is how the puja used to be in our time. There was no electricity, everything ran on lamps and lanterns.',
        'The frame you see here is over a hundred years old. Your grandfather came here to see the Thakur when he was little.',
      ],
    },
  },
  {
    id: 'sample-2',
    name: { bn: 'উদাহরণ মণ্ডপ ২', en: 'Sample Mandap 2' },
    year: 1930,
    photo: '',
    caption: { bn: 'আরতির সন্ধ্যা', en: 'Evening aarti' },
    kid: {
      bn: 'এখানে এত ভিড় কেন বাবা?',
      en: 'Why is there such a crowd here, Baba?',
    },
    dad: {
      bn: ['সন্ধ্যার আরতি এখানকার সবচেয়ে বড় আকর্ষণ। ঢাকের তালে তালে সবাই একসাথে দাঁড়ায়।'],
      en: ['The evening aarti is the main event here. Everyone stands together to the beat of the dhak.'],
    },
  },
]

const COPY = {
  bn: {
    title: 'বাবার সাথে পূজা দেখা',
    sub: 'ছোটবেলায় বাবার হাত ধরে যেভাবে ঠাকুর দেখতে যেতাম, সেভাবেই ঘুরে দেখো।',
    hint: 'স্ক্রল করলেই হাঁটা শুরু',
    since: 'সাল',
    kid: 'ছেলে/মেয়ে',
    dad: 'বাবা',
    end: 'আজ এ পর্যন্তই। চল, এবার বাড়ি ফিরি।',
    empty: 'এখনো কোনো ঐতিহ্যবাহী মণ্ডপ যোগ করা হয়নি।',
  },
  en: {
    title: 'Pandal hopping with Baba',
    sub: 'Walk the lanes the way we did as kids, holding Baba’s hand.',
    hint: 'Scroll to start walking',
    since: 'Est.',
    kid: 'Child',
    dad: 'Baba',
    end: 'That’s enough for tonight. Come, let’s go home.',
    empty: 'No heritage mandaps added yet.',
  },
}

/* ───────────────────── timeline tuning ─────────────────────
   Protita stop = ekta "segment". Segment er vitore:
   0 → ENTER   : mandap dan dike theke ashe (baba-chele hete jay)
   ENTER → EXIT: dujon dariye, dialogue + golpo
   EXIT → 1    : mandap bam dike chole jay, abar hata
*/
const ENTER = 0.3
const EXIT = 0.8
const BASE_SEG = 1.6 // ek segment er minimum length (screen height er gunnok)
const CHARS_PER_VH = 600 // golpo joto boro, segment totoi lomba (beshi scroll)
const NAV_H = 0 // jodi tomar Nav fixed hoy ar scene er upor dhake, ekhane px diye dao

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const ease = (x) => {
  x = clamp(x)
  return x * x * (3 - 2 * x)
}

const STAR_POS = [
  [6, 8], [14, 22], [23, 6], [31, 16], [40, 9], [49, 24], [57, 7],
  [66, 18], [74, 5], [82, 21], [90, 10], [96, 26], [37, 28], [70, 30],
]

const css = `
@keyframes hp-swing{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}
@keyframes hp-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes hp-flicker{0%,100%{opacity:.85}30%{opacity:1}55%{opacity:.7}80%{opacity:.95}}
@keyframes hp-twinkle{0%,100%{opacity:.15}50%{opacity:.9}}
@keyframes hp-smoke{0%{transform:translateY(0) scale(.6);opacity:0}20%{opacity:.45}100%{transform:translateY(-80px) scale(1.9);opacity:0}}
@keyframes hp-hint{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
.hp-leg{transform-box:fill-box;transform-origin:50% 0;animation:hp-swing .7s ease-in-out infinite alternate;animation-play-state:var(--ps,paused)}
.hp-leg.b{animation-delay:-.7s}
.hp-bob{animation:hp-bob .7s ease-in-out infinite;animation-play-state:var(--ps,paused)}
.hp-flk{animation:hp-flicker 1.6s ease-in-out infinite}
.hp-tw{animation:hp-twinkle 3s ease-in-out infinite}
.hp-smoke{animation:hp-smoke 4s ease-out infinite}
.hp-hint{animation:hp-hint 1.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.hp-leg,.hp-bob,.hp-flk,.hp-tw,.hp-smoke,.hp-hint{animation:none}}
`

/* ───────────────────── illustrations ───────────────────── */

function Walkers() {
  return (
    <svg viewBox="0 0 160 130" className="h-full w-full overflow-visible" aria-hidden="true">
      <g className="hp-bob">
        {/* baba */}
        <g>
          <line className="hp-leg" x1="46" y1="78" x2="46" y2="118" stroke="#f5f5f4" strokeWidth="7" strokeLinecap="round" />
          <line className="hp-leg b" x1="55" y1="78" x2="55" y2="118" stroke="#e7e5e4" strokeWidth="7" strokeLinecap="round" />
          <rect x="38" y="33" width="26" height="48" rx="9" fill="#f59e0b" />
          <circle cx="51" cy="22" r="10" fill="#f1c9a0" />
          <path d="M41 19 Q51 6 61 19 Q51 14 41 19Z" fill="#292524" />
          <line x1="62" y1="46" x2="101" y2="72" stroke="#f1c9a0" strokeWidth="5" strokeLinecap="round" />
        </g>
        {/* child */}
        <g>
          <line className="hp-leg" x1="108" y1="90" x2="108" y2="118" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" />
          <line className="hp-leg b" x1="116" y1="90" x2="116" y2="118" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
          <rect x="103" y="60" width="18" height="33" rx="6" fill="#f43f5e" />
          <circle cx="112" cy="50" r="8.5" fill="#f1c9a0" />
          <path d="M103.5 48 Q112 36 120.5 48 Q112 44 103.5 48Z" fill="#292524" />
          <circle cx="119" cy="42" r="3" fill="#fde047" />
          <line x1="104" y1="68" x2="101" y2="72" stroke="#f1c9a0" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

function Mandap({ hue }) {
  const flags = Array.from({ length: 9 }, (_, i) => 30 + i * 30)
  const colors = ['#f43f5e', '#fbbf24', '#38bdf8', '#34d399']
  return (
    <svg viewBox="0 0 300 250" className="w-full overflow-visible" style={{ filter: `hue-rotate(${hue}deg)` }} aria-hidden="true">
      <defs>
        <radialGradient id="hp-glow" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
      </defs>
      {/* base */}
      <rect x="12" y="213" width="276" height="22" rx="3" fill="#44302a" />
      <rect x="30" y="205" width="240" height="10" fill="#5b4036" />
      {/* inner glow */}
      <rect className="hp-flk" x="58" y="96" width="184" height="112" fill="url(#hp-glow)" />
      {/* idol */}
      <circle cx="150" cy="140" r="46" fill="#fde68a" opacity=".3" />
      <polygon points="128,208 172,208 164,150 136,150" fill="#be123c" />
      <circle cx="150" cy="138" r="13" fill="#fcd9b6" />
      <polygon points="138,128 150,108 162,128" fill="#facc15" />
      <path d="M136 158 L112 138 M164 158 L188 138 M138 166 L108 160 M162 166 L192 160" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
      {/* pillars */}
      {[44, 242].map((x) => (
        <g key={x}>
          <rect x={x} y="92" width="14" height="121" fill="#7f1d1d" />
          <rect x={x} y="120" width="14" height="4" fill="#facc15" />
          <rect x={x} y="160" width="14" height="4" fill="#facc15" />
        </g>
      ))}
      {/* roof */}
      <path d="M14 98 L150 38 L286 98 Q150 84 14 98Z" fill="#991b1b" stroke="#facc15" strokeWidth="2" />
      <path d="M62 62 L150 20 L238 62 Q150 52 62 62Z" fill="#b91c1c" stroke="#facc15" strokeWidth="2" />
      <rect x="146" y="6" width="8" height="14" fill="#facc15" />
      <circle cx="150" cy="5" r="5" fill="#facc15" />
      {/* bunting */}
      {flags.map((x, i) => (
        <polygon key={x} points={`${x},98 ${x + 15},98 ${x + 7.5},114`} fill={colors[i % 4]} />
      ))}
      {/* lamps */}
      {[78, 150, 222].map((x, i) => (
        <circle key={x} className="hp-flk" style={{ animationDelay: `${i * 0.4}s` }} cx={x} cy="200" r="4.5" fill="#fde047" />
      ))}
    </svg>
  )
}

/* ───────────────────────── page ───────────────────────── */

export default function HeritagePage({ lang = 'bn' }) {
  const c = COPY[lang] || COPY.bn
  const N = STOPS.length
  const wrap = useRef(null)
  const panel = useRef(null)
  const timer = useRef(null)
  const [pos, setPos] = useState(0) // scroll position, screen-height er unit e
  const [moving, setMoving] = useState(false) // user ekhon scroll korche?
  const [size, setSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 400,
    h: typeof window !== 'undefined' ? window.innerHeight - NAV_H : 800,
  })

  // protita stop er length, golpo boro hole beshi
  const segs = useMemo(
    () =>
      STOPS.map((s) => {
        const len = (s.kid[lang] || s.kid.bn).length + (s.dad[lang] || s.dad.bn).join('').length
        return BASE_SEG + len / CHARS_PER_VH
      }),
    [lang]
  )
  const starts = useMemo(() => {
    let a = 1
    return segs.map((g) => {
      const st = a
      a += g
      return st
    })
  }, [segs])
  const end = 1 + segs.reduce((a, b) => a + b, 0) // sob stop sesh howar position
  const maxPos = end + 1

  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setPos(clamp(-(r.top - NAV_H) / size.h, 0, maxPos))
      setMoving(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setMoving(false), 140)
    }
    const onResize = () => {
      setSize({ w: window.innerWidth, h: window.innerHeight - NAV_H })
      onScroll()
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      clearTimeout(timer.current)
    }
  }, [size.h, maxPos])

  /* ── ekhon kon stop, segment er kon obostha e ── */
  let idx = -1
  let t = 0
  for (let i = 0; i < N; i++) {
    if (pos >= starts[i] && pos < starts[i] + segs[i]) {
      idx = i
      t = (pos - starts[i]) / segs[i]
    }
  }
  const hold = idx >= 0 && t >= ENTER && t < EXIT
  const walk = moving && !hold

  // mandap er x position
  let mx = size.w
  if (idx >= 0) {
    if (t < ENTER) mx = (1 - ease(t / ENTER)) * size.w
    else if (t < EXIT) mx = 0
    else mx = -ease((t - EXIT) / (1 - EXIT)) * size.w * 1.2
  }

  // rasta/background kototuku hete esheche (hold er shomoy thame thake)
  let travel = Math.min(pos, 1)
  starts.forEach((s, i) => {
    const tt = clamp((pos - s) / segs[i])
    travel += (Math.min(tt, ENTER) + Math.max(0, tt - EXIT)) * segs[i]
  })
  if (pos > end) travel += pos - end
  const off = travel * size.h * 0.7

  // golpo scroll er sathe sathe nijei upore uthe, user ke alada scroll korte hoy na
  useEffect(() => {
    const el = panel.current
    if (!el) return
    if (hold) {
      const hp = clamp((t - ENTER - 0.08) / (EXIT - ENTER - 0.16))
      el.scrollTop = hp * Math.max(0, el.scrollHeight - el.clientHeight)
    } else el.scrollTop = 0
  }, [pos, hold, idx])

  const stop = idx >= 0 ? STOPS[idx] : null
  const kidOn = hold && t > ENTER + 0.02
  const dadOn = hold && t > ENTER + 0.09
  const introOp = 1 - ease((pos - 0.35) / 0.5)
  const endOp = ease((pos - (end + 0.35)) / 0.4)

  if (!N) {
    return (
      <div className="page flex min-h-[60vh] items-center justify-center text-stone-500 dark:text-stone-400">{c.empty}</div>
    )
  }

  return (
    <div className="page">
      <style>{css}</style>
      <div ref={wrap} className="relative" style={{ height: (end + 2) * size.h }}>
        <div
          className="sticky overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-rose-950 text-white"
          style={{ top: NAV_H, height: size.h, '--ps': walk ? 'running' : 'paused' }}
        >
          {/* ───────── SCENE (upor 58%) ───────── */}
          <div className="absolute inset-x-0 top-0 h-[58%]">
            {/* tara */}
            {STAR_POS.map(([x, y], i) => (
              <span
                key={i}
                className="hp-tw absolute h-[3px] w-[3px] rounded-full bg-amber-100"
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.6}s` }}
              />
            ))}
            <div className="absolute right-[8%] top-[10%] h-9 w-9 rounded-full bg-amber-100 shadow-[0_0_30px_8px_rgba(253,230,138,0.35)]" />

            {/* durer baari-ghor ar mondir (dheere sore) */}
            <svg className="absolute inset-x-0 bottom-8 h-24 w-full" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <pattern id="hp-sky" width="260" height="90" patternUnits="userSpaceOnUse" patternTransform={`translate(${-off * 0.25} 0)`}>
                  <rect x="10" y="50" width="40" height="40" fill="#1e1b4b" />
                  <polygon points="6,50 30,34 54,50" fill="#1e1b4b" />
                  <polygon points="100,90 100,42 115,14 130,42 130,90" fill="#1e1b4b" />
                  <rect x="160" y="60" width="50" height="30" fill="#1e1b4b" />
                  <rect x="220" y="44" width="30" height="46" fill="#1e1b4b" />
                  <rect x="20" y="62" width="5" height="7" fill="#fbbf24" opacity=".8" />
                  <rect x="170" y="70" width="5" height="7" fill="#fbbf24" opacity=".8" />
                  <rect x="230" y="58" width="5" height="7" fill="#fbbf24" opacity=".8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hp-sky)" />
            </svg>

            {/* lantern er maala */}
            <svg className="absolute inset-x-0 top-0 h-16 w-full" aria-hidden="true">
              <defs>
                <pattern id="hp-lant" width="120" height="64" patternUnits="userSpaceOnUse" patternTransform={`translate(${-off * 0.5} 0)`}>
                  <path d="M0 4 Q60 30 120 4" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
                  <line x1="30" y1="17" x2="30" y2="24" stroke="#fbbf24" />
                  <ellipse cx="30" cy="31" rx="6" ry="8" fill="#f43f5e" />
                  <line x1="90" y1="17" x2="90" y2="24" stroke="#fbbf24" />
                  <ellipse cx="90" cy="31" rx="6" ry="8" fill="#fbbf24" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hp-lant)" />
            </svg>

            {/* rasta */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-zinc-950">
              <div
                className="absolute inset-x-0 top-3 h-[3px] opacity-70"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg,#fbbf24 0 28px,transparent 28px 72px)',
                  backgroundPosition: `${-off}px 0`,
                }}
              />
            </div>

            {/* mandap */}
            {idx >= 0 && (
              <div
                className="absolute bottom-6 left-[44%] w-[54vw] max-w-[360px] sm:left-[48%]"
                style={{ transform: `translateX(${mx}px)` }}
              >
                <Mandap hue={(idx * 25) % 360} />
                {/* dhunuchir dhoa */}
                {[0, 1.3, 2.6].map((d, k) => (
                  <span
                    key={k}
                    className="hp-smoke absolute bottom-6 h-6 w-6 rounded-full bg-stone-200/40 blur-[3px]"
                    style={{ left: `${30 + k * 18}%`, animationDelay: `${d}s` }}
                  />
                ))}
              </div>
            )}

            {/* baba + chele/meye */}
            <div className="absolute bottom-6 left-[4%] h-[120px] w-[150px] sm:left-[12%]">
              <Walkers />
            </div>

            {/* polaroid: fixed size, tai photo jototai boro hok sheta baire jabe na */}
            {stop && (
              <figure
                className={
                  'absolute left-3 top-3 w-28 -rotate-3 rounded-sm bg-white p-1.5 pb-2 shadow-xl transition-all duration-500 sm:left-8 sm:w-44 ' +
                  (hold ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')
                }
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-stone-200">
                  {stop.photo ? (
                    <img src={stop.photo} alt={stop.name[lang] || stop.name.bn} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">🪔</div>
                  )}
                </div>
                {stop.caption && (
                  <figcaption className="mt-1 truncate text-center text-[11px] text-stone-600 sm:text-xs">
                    {stop.caption[lang] || stop.caption.bn}
                  </figcaption>
                )}
              </figure>
            )}

            {/* intro title */}
            <div
              className="pointer-events-none absolute inset-x-0 top-[14%] px-6 text-center"
              style={{ opacity: introOp }}
            >
              <h2 className="text-3xl font-bold text-amber-300 drop-shadow sm:text-4xl">{c.title}</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-200 sm:text-base">{c.sub}</p>
            </div>

            {/* shesh e */}
            <div
              className="pointer-events-none absolute inset-x-0 top-[22%] px-6 text-center text-lg text-amber-200"
              style={{ opacity: endOp }}
            >
              {c.end}
            </div>
          </div>

          {/* ───────── DIALOGUE PANEL (niche 42%) ───────── */}
          <div className="absolute inset-x-0 bottom-0 h-[42%] border-t border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="mx-auto flex h-full max-w-xl flex-col px-4 pb-3 pt-3">
              {/* stop dots */}
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {stop && hold ? (
                    <div className="truncate font-semibold text-amber-300">
                      {stop.name[lang] || stop.name.bn}
                      {stop.year ? <span className="ml-2 text-sm font-normal text-stone-300">{c.since} {stop.year}</span> : null}
                    </div>
                  ) : (
                    <div className="text-sm text-stone-300">&nbsp;</div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {STOPS.map((s, i) => (
                    <span
                      key={s.id}
                      className={
                        'h-2 w-2 rounded-full transition-colors ' +
                        (i === idx ? 'bg-amber-400' : pos >= starts[i] + segs[i] ? 'bg-amber-700' : 'bg-white/25')
                      }
                    />
                  ))}
                </div>
              </div>

              {/* scroll hint (shuru te) */}
              {pos < 0.9 && idx < 0 && (
                <div className="hp-hint m-auto text-center text-sm text-stone-300">↓ {c.hint}</div>
              )}

              {/* kotha-barta */}
              <div ref={panel} className="min-h-0 flex-1 space-y-3 overflow-hidden">
                {stop && (
                  <>
                    <div className={'flex transition-all duration-500 ' + (kidOn ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')}>
                      <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-amber-200 px-4 py-2.5 text-amber-950">
                        <div className="mb-0.5 text-xs font-medium text-amber-800">{c.kid}</div>
                        {stop.kid[lang] || stop.kid.bn}
                      </div>
                    </div>
                    <div className={'flex justify-end transition-all duration-500 ' + (dadOn ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')}>
                      <div className="max-w-[94%] space-y-2.5 rounded-2xl rounded-tr-sm bg-stone-100 px-4 py-2.5 leading-relaxed text-stone-800">
                        <div className="text-xs font-medium text-stone-500">{c.dad}</div>
                        {(stop.dad[lang] || stop.dad.bn).map((para, k) => (
                          <p key={k}>{para}</p>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}