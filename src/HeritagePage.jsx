import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { sb } from './supabase'
import ShareButton from './ShareButton'
import SubmitHeritage from './SubmitHeritage'

// ১. হ্যাশ (#) এর বদলে ক্লিন URL-এর search query রিড করা হলো
const getParam = (key) => {
  const query = window.location.search || ''
  return new URLSearchParams(query).get(key)
}

/* ───────────────────────── হেল্পার ───────────────────────── */

const toBn = (n) => Number(n).toLocaleString('bn-BD', { useGrouping: false })

const LOCATION_LABELS = {
  open_field: 'উন্মুক্ত মাঠ / প্রাঙ্গণ',
  building_under: 'বিল্ডিংয়ের নিচে / নিচতলা',
  temporary_pandal: 'অস্থায়ী মণ্ডপ (রাস্তায়/গলি)',
  permanent_premises: 'স্থায়ী মন্দির প্রাঙ্গণ'
}

// বইয়ের এক পাতার মাপ (px)
const PAGE_W = 420
const PAGE_H = 580
const PAPER = '#fbf4e6'
const INK = '#3a2615'

// পাতার ভেতরের লেখার জায়গা (px-9, pt-9, pb-12 বাদ দিয়ে)
const INNER_W = PAGE_W - 72 // 348
const AVAIL = PAGE_H - 84 // 496
const SAFE = 6 // একটু ফাঁকা রাখা, যাতে নিচের কিনারায় না লাগে
const GAP = 12 // একটা আইটেম আর আরেকটার মাঝের দূরত্ব (space-y-3)
const MIN_ROOM = 60 // এর চেয়ে কম জায়গা থাকলে নতুন পাতা শুরু হবে
const MIN_SCALE = 0.72 // শেষ ভরসা: নিচে নামার সীমা
const FONT = "'Noto Serif Bengali','Hind Siliguri',serif"
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;800&display=swap'

/* ───────────────── ফন্ট লোড (মাপার আগে ফন্ট রেডি থাকতে হবে) ───────────────── */

let fontPromise = null
function loadBookFont() {
  if (fontPromise) return fontPromise
  fontPromise = new Promise((resolve) => {
    let finished = false
    const done = () => {
      if (finished) return
      finished = true
      const sample = 'আবক ঐতিহ্য'
      const loads = ['400', '600', '800'].map((w) => document.fonts.load(`${w} 16px 'Noto Serif Bengali'`, sample))
      Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]).then(resolve, resolve)
    }
    if (document.getElementById('hp-book-font')) return done()
    const l = document.createElement('link')
    l.id = 'hp-book-font'
    l.rel = 'stylesheet'
    l.href = FONT_URL
    l.onload = done
    l.onerror = done
    document.head.appendChild(l)
    setTimeout(done, 3000)
  })
  return fontPromise
}

/* ───────────── মাপার যন্ত্র: লুকানো DOM-এ আসল স্টাইলে লেখা বসিয়ে উচ্চতা মাপে ───────────── */

function createMeasurer() {
  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText = `position:fixed;left:-10000px;top:0;width:${INNER_W}px;visibility:hidden;pointer-events:none;font-family:${FONT};color:${INK};overflow-wrap:anywhere;`
  const mk = (html) => {
    const d = document.createElement('div')
    d.style.display = 'flow-root'
    d.innerHTML = html
    root.appendChild(d)
    return d
  }

  const titleBox = mk(
    '<div class="text-center"><div class="text-[12px] font-semibold mb-1">x</div><h2 class="text-[25px] font-extrabold leading-tight"></h2><div class="flex items-center justify-center gap-2 my-3"><span class="h-px w-14"></span><span class="text-xs">❖</span><span class="h-px w-14"></span></div></div>'
  )
  const kickerEl = titleBox.querySelector('div > div')
  const h2 = titleBox.querySelector('h2')
  const labelBox = mk('<div class="text-[13px] font-bold mb-1">x</div>')
  const labelEl = labelBox.firstChild
  const paraBox = mk('<p class="text-[14.5px] leading-[1.95] whitespace-pre-line text-justify"></p>')
  const para = paraBox.firstChild
  const anyBox = mk('')
  document.body.appendChild(root)

  const titleCache = new Map()
  const paraH = (s) => {
    para.textContent = s
    return para.offsetHeight
  }

  return {
    title(kicker, heading) {
      const k = `${kicker || ''}|${heading}`
      if (titleCache.has(k)) return titleCache.get(k)
      kickerEl.style.display = kicker ? '' : 'none'
      h2.textContent = heading
      const h = titleBox.offsetHeight
      titleCache.set(k, h)
      return h
    },
    label(text) {
      labelEl.textContent = text
      return labelBox.offsetHeight
    },
    measure(html) {
      anyBox.innerHTML = html
      return anyBox.offsetHeight
    },
    // text থেকে যতটুকু avail উচ্চতায় ধরে ততটুকু কেটে নেয় (শব্দ/বাক্যের মাঝখানে না কেটে)
    take(text, avail, force) {
      const whole = paraH(text)
      if (whole <= avail) return { chunk: text, remain: '', h: whole }
      const cuts = []
      for (let i = 0; i < text.length; i++) if (/\s/.test(text[i])) cuts.push(i)
      let lo = 0
      let hi = cuts.length - 1
      let best = -1
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        if (paraH(text.slice(0, cuts[mid])) <= avail) {
          best = mid
          lo = mid + 1
        } else hi = mid - 1
      }
      // অক্ষর ধরে বাইনারি সার্চ (space ছাড়া লম্বা শব্দের জন্য)
      const charSearch = (from, to) => {
        let a = from
        let b = to
        let ok = 0
        while (a <= b) {
          const mid = (a + b) >> 1
          if (paraH(text.slice(0, mid)) <= avail) {
            ok = mid
            a = mid + 1
          } else b = mid - 1
        }
        return ok
      }
      let cut = best >= 0 ? cuts[best] : 0
      let extended = false
      // পরের শব্দটা যদি অনেক লম্বা হয় (space ছাড়া), তাহলে ওটাকেও অক্ষরে অক্ষরে কেটে পাতা ভরাই
      const nextStop = best + 1 < cuts.length ? cuts[best + 1] : text.length
      if (nextStop - cut > 25) {
        const c = charSearch(cut + 1, nextStop - 1)
        if (c > cut) {
          cut = c
          extended = true
        }
      }
      if (cut <= 0) {
        if (!force) return { chunk: '', remain: text, h: 0 }
        cut = Math.min(40, text.length)
      }
      if (!extended && best >= 0) {
        const win = text.slice(0, cut)
        const lim = Math.floor(cut * 0.7)
        const s = Math.max(win.lastIndexOf('।'), win.lastIndexOf('\n'), win.lastIndexOf('. '))
        if (s >= lim) cut = s + 1
      }
      const chunk = text.slice(0, cut).trim() || text.slice(0, 1)
      return { chunk, remain: text.slice(chunk.length).trim(), h: paraH(chunk) }
    },
    destroy() {
      root.remove()
    }
  }
}

/* ───────────── ফ্লো ইঞ্জিন: লেখা বড় হলে নিজে থেকে পরের পাতায় নিয়ে যায় ─────────────
   blocks = [{ label, labelClass, text, photo: { src, h, tilt } }]
   head   = প্রথম পাতার উপরের অংশ (ব্যাজ/ছবি), headH = তার উচ্চতা
*/
function flowPages(m, { kicker, heading, contHeading, head, headH = 0, blocks }) {
  const pages = []
  const mk = () => {
    const first = pages.length === 0
    const p = { first, heading: first ? heading : contHeading || heading, items: [], used: 0 }
    p.used = m.title(kicker, p.heading) + (first && head ? headH + GAP : 0)
    pages.push(p)
    return p
  }
  let cur = mk()
  const room = () => AVAIL - SAFE - cur.used - (cur.items.length ? GAP : 0)
  const add = (item, h) => {
    cur.used += (cur.items.length ? GAP : 0) + h
    cur.items.push(item)
  }

  for (const b of blocks) {
    let rest = (b.text || '').trim()
    let label = b.label
    while (rest) {
      const lh = label ? m.label(label) : 0
      const avail = room() - lh
      if (avail < MIN_ROOM && cur.items.length) {
        cur = mk()
        continue
      }
      const r = m.take(rest, avail, cur.items.length === 0)
      if (!r.chunk) {
        cur = mk()
        continue
      }
      add({ label, labelClass: b.labelClass, text: r.chunk }, lh + r.h)
      label = null
      rest = r.remain
      if (rest) cur = mk()
    }
    if (b.photo) {
      const need = 6 + b.photo.h + 18
      const last = cur.items[cur.items.length - 1]
      if (last && !last.photo && room() >= need) {
        last.photo = b.photo
        cur.used += need
      } else {
        if (cur.items.length && room() < need) cur = mk()
        add({ photo: b.photo }, need)
      }
    }
  }
  return pages
}

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

/* ───────────────────── বইয়ের পাতার ছোট অংশ ───────────────────── */

// PDF বানানোর সময়ই শুধু crossOrigin লাগে (canvas-এ ছবি আঁকার জন্য)
function Img({ pdf, ...props }) {
  return <img alt="" crossOrigin={pdf ? 'anonymous' : undefined} {...props} />
}

const Divider = () => (
  <div className="flex items-center justify-center gap-2 my-3 text-[#b45309]">
    <span className="h-px w-14 bg-current opacity-40" />
    <span className="text-xs">❖</span>
    <span className="h-px w-14 bg-current opacity-40" />
  </div>
)

const PageTitle = ({ kicker, children }) => (
  <div className="text-center">
    {kicker && <div className="text-[12px] text-[#b45309] font-semibold mb-1">{kicker}</div>}
    <h2 className="text-[25px] font-extrabold leading-tight text-[#7c2d12]">{children}</h2>
    <Divider />
  </div>
)

const Row = ({ k, v }) =>
  v ? (
    <div className="flex items-baseline gap-3 py-2 border-b border-dotted border-[#b45309]/40">
      <span className="text-[13px] text-[#8a6d4b] w-28 shrink-0">{k}</span>
      <span className="text-[15px] font-semibold flex-1 min-w-0 leading-snug">{v}</span>
    </div>
  ) : null

// পোলারয়েড স্টাইলের ছবি
const Photo = ({ src, pdf, h = 100, tilt = 0, className = '' }) => (
  <div className={`bg-white p-1.5 pb-3 shadow-md ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
    <Img pdf={pdf} src={src} className="w-full object-cover" style={{ height: h }} />
  </div>
)

// ফ্লো ইঞ্জিনের একটা আইটেম (লেবেল + লেখা + ছবি)
function FlowItem({ it, pdf }) {
  return (
    <div>
      {it.label && <div className={`text-[13px] font-bold mb-1 ${it.labelClass || ''}`}>{it.label}</div>}
      {it.text && <p className="text-[14.5px] leading-[1.95] whitespace-pre-line text-justify">{it.text}</p>}
      {it.photo && (
        <div className="pt-1.5">
          <Photo pdf={pdf} src={it.photo.src} h={it.photo.h} tilt={it.photo.tilt} />
        </div>
      )}
    </div>
  )
}

/* ───────────────────── পাতা তৈরির মূল ফাংশন ───────────────────── */

function buildPages(doc, albums, { qrUrl, shareUrl, pdf, m }) {
  const mName = doc.mandaps?.name_bn || doc.mandaps?.name || ''
  const area = doc.mandaps?.area || ''
  const title = doc.title || `${mName} এর হেরিটেজ নথি`
  const thumb = doc.thumbnail_post || doc.pandal_architect_photo || doc.entry_point_photo || doc.exit_point_photo
  const pages = []

  // ফ্লো পাতাগুলো বইয়ে যোগ করার হেল্পার
  const pushFlow = (key, cfg) => {
    flowPages(m, cfg).forEach((fp, i) =>
      pages.push({
        key: `${key}-${i}`,
        body: (
          <>
            <PageTitle kicker={cfg.kicker}>{fp.heading}</PageTitle>
            {fp.first && cfg.head ? <div className="mb-3">{cfg.head}</div> : null}
            <div className="space-y-3">
              {fp.items.map((it, k) => (
                <FlowItem key={k} it={it} pdf={pdf} />
              ))}
            </div>
          </>
        )
      })
    )
  }

  // ── প্রচ্ছদ ──
  pages.push({
    key: 'cover',
    bare: true,
    body: (
      <div className="absolute inset-0 text-white" style={{ background: 'linear-gradient(160deg,#7c2d12,#431407 70%)' }}>
        {thumb ? (
          <Img pdf={pdf} src={thumb} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[130px] opacity-20">🏛</div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(67,20,7,.6) 0%, rgba(67,20,7,.05) 35%, rgba(67,20,7,.93) 100%)' }}
        />
        <div className="absolute inset-4 border border-amber-300/50 rounded-md pointer-events-none" />
        <div className="absolute top-8 inset-x-0 text-center text-sm text-amber-200 font-semibold">চট্টগ্রাম পূজা হেরিটেজ আর্কাইভ</div>
        <div className="absolute bottom-0 inset-x-0 px-9 pb-11 text-center">
          <div className="text-6xl font-extrabold text-amber-300 drop-shadow">{toBn(doc.year)}</div>
          <h1 className="mt-2 text-[26px] font-extrabold leading-snug drop-shadow line-clamp-4">{title}</h1>
          <div className="mt-3 text-sm text-amber-100">
            {mName}
            {area ? ` · ${area}` : ''}
          </div>
          <div className="mt-4 text-[11px] text-amber-200/80">Developed by Sharadindu Dutta Turjo</div>
        </div>
      </div>
    )
  })

  // ── এক নজরে ──
  pages.push({
    key: 'facts',
    body: (
      <>
        <PageTitle kicker="এক নজরে">নথির পরিচয়</PageTitle>
        <Row k="পূজার বছর" v={`${toBn(doc.year)} সাল`} />
        <Row k="মণ্ডপ" v={mName} />
        <Row k="এলাকা" v={area} />
        <Row k="স্থানের প্রকৃতি" v={LOCATION_LABELS[doc.location_type]} />
        <Row k="প্রতিমার উচ্চতা" v={doc.statue_height_ft ? `${toBn(doc.statue_height_ft)} ফুট` : ''} />
        <Row k="প্রতিমার থিম" v={doc.statue_theme} />
        <Row k="সংগ্রাহক" v={doc.submitted_by || 'Admin'} />
        <Row k="প্রকাশ" v={new Date(doc.created_at).toLocaleDateString('bn-BD')} />
        <p className="mt-6 text-center text-[13px] italic text-[#8a6d4b] leading-7">
          প্রতিটি মণ্ডপ একেকটি জীবন্ত ইতিহাস —<br />সেই ইতিহাস এই পাতাগুলোয় ধরে রাখা হলো।
        </p>
      </>
    )
  })

  // ── স্থান ও স্থানান্তর (লম্বা হলে পরের পাতায় চলবে) ──
  const locBadgeText = `📍 ${LOCATION_LABELS[doc.location_type] || 'স্থান'}`
  const locBlocks = []
  if (doc.location_changed) {
    locBlocks.push({
      label: '⚠ স্থান পরিবর্তনের কাহিনি',
      labelClass: 'text-[#b45309]',
      text: doc.location_change_history || 'বিস্তারিত বিবরণ দেওয়া হয়নি।'
    })
  } else {
    locBlocks.push({ text: '✅ মণ্ডপটি শুরু থেকেই একই নির্ধারিত স্থানে উদযাপিত হচ্ছে।' })
  }
  if (doc.post_puja_site_status) {
    locBlocks.push({ label: 'পূজা-পরবর্তী স্থানের অবস্থা', labelClass: 'text-[#7c2d12]', text: doc.post_puja_site_status })
  }
  pushFlow('loc', {
    kicker: 'নগরায়ণের ছাপ',
    heading: 'স্থান ও স্থানান্তর',
    contHeading: 'স্থান ও স্থানান্তর (চলমান)',
    head: (
      <div className="inline-block px-3 py-1 rounded-full bg-[#b45309]/10 text-[#7c2d12] text-[13px] font-semibold">{locBadgeText}</div>
    ),
    headH: m.measure(`<div class="inline-block px-3 py-1 rounded-full text-[13px] font-semibold">${locBadgeText}</div>`),
    blocks: locBlocks
  })

  // ── শিল্পী ও কারিগর ──
  const people = [
    { role: 'মণ্ডপ আর্কিটেক্ট', name: doc.pandal_architect, photo: doc.pandal_architect_photo, emoji: '🏛', color: '#b45309' },
    { role: 'লাইটিং কারিগর', name: doc.lighting_artist, photo: doc.lighting_artist_photo, emoji: '💡', color: '#ca8a04' },
    { role: 'প্রতিমা ভাস্কর', name: doc.statue_artist, photo: doc.statue_artist_photo, emoji: '🎨', color: '#be123c' }
  ]
  pages.push({
    key: 'artists',
    body: (
      <>
        <PageTitle kicker="যাঁদের হাতে গড়া">নেপথ্যের কারিগর</PageTitle>
        <div className="space-y-5 mt-2">
          {people.map((p) => (
            <div key={p.role} className="flex items-center gap-4">
              {p.photo ? (
                <Img pdf={pdf} src={p.photo} className="w-20 h-20 rounded-full object-cover shrink-0" style={{ border: `3px solid ${p.color}` }} />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shrink-0"
                  style={{ border: `3px solid ${p.color}`, background: `${p.color}22` }}
                >
                  {p.emoji}
                </div>
              )}
              <div>
                <div className="text-[12px] text-[#8a6d4b]">{p.role}</div>
                <div className="text-[18px] font-extrabold leading-snug">{p.name || 'তথ্য নেই'}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  })

  // ── প্রতিমা ও থিম ──
  pages.push({
    key: 'statue',
    body: (
      <>
        <PageTitle kicker="ভাস্কর্য">প্রতিমা ও থিম</PageTitle>
        {doc.statue_height_ft ? (
          <div className="text-center mt-2">
            <div className="text-[64px] leading-none font-extrabold text-[#b45309]">{toBn(doc.statue_height_ft)}</div>
            <div className="text-sm text-[#8a6d4b] mt-1">ফুট উচ্চতার প্রতিমা</div>
          </div>
        ) : null}
        {doc.statue_theme ? (
          <div className="mt-6 px-4 text-center">
            <div className="text-4xl text-[#b45309]/50 leading-none">“</div>
            <p className="text-[18px] font-semibold leading-[1.8]">{doc.statue_theme}</p>
            <div className="text-4xl text-[#b45309]/50 leading-none">”</div>
            <div className="text-[12px] text-[#8a6d4b] mt-1">— প্রতিমার মূল ভাবনা</div>
          </div>
        ) : null}
        {!doc.statue_height_ft && !doc.statue_theme && (
          <p className="mt-10 text-center text-[#8a6d4b]">এই বছরের প্রতিমার তথ্য সংগ্রহ করা হয়নি।</p>
        )}
        {doc.statue_artist && <p className="mt-6 text-center text-[13px] text-[#8a6d4b]">ভাস্কর: {doc.statue_artist}</p>}
      </>
    )
  })

  // ── সার্কুলেশন (প্রবেশ/প্রস্থান, এখন আর লেখা কাটা পড়ে না) ──
  pushFlow('circ', {
    kicker: 'দর্শনার্থীর পথ',
    heading: 'প্রবেশ ও প্রস্থান',
    contHeading: 'প্রবেশ ও প্রস্থান (চলমান)',
    blocks: [
      {
        label: '🟢 প্রবেশ পথ',
        labelClass: 'text-emerald-700',
        text: doc.entry_point || 'বিবরণ নেই',
        photo: doc.entry_point_photo ? { src: doc.entry_point_photo, h: 88, tilt: -1.2 } : null
      },
      {
        label: '🔴 প্রস্থান পথ',
        labelClass: 'text-rose-700',
        text: doc.exit_point || 'বিবরণ নেই',
        photo: doc.exit_point_photo ? { src: doc.exit_point_photo, h: 88, tilt: 1.2 } : null
      }
    ]
  })

  // ── হেরিটেজ বর্ণনা (লম্বা লেখা, জায়গা ফুরোলেই পরের পাতা) ──
  if ((doc.heritage_description || '').trim()) {
    pushFlow('desc', {
      kicker: 'স্মৃতি ও ঐতিহ্য',
      heading: 'হেরিটেজ বর্ণনা',
      contHeading: 'হেরিটেজ বর্ণনা (চলমান)',
      blocks: [{ text: doc.heritage_description }]
    })
  }

  // ── অ্যাডমিনের কাস্টম সেকশন ──
  if (Array.isArray(doc.custom_sections)) {
    doc.custom_sections.forEach((sec, idx) => {
      const secTitle = sec.title || 'বিশেষ তথ্য'
      pushFlow(`custom-${idx}`, {
        kicker: 'বিশেষ অধ্যায়',
        heading: secTitle,
        contHeading: `${secTitle} (চলমান)`,
        head: sec.image_url ? <Photo pdf={pdf} src={sec.image_url} h={150} tilt={-1} /> : null,
        headH: sec.image_url ? 150 + 18 : 0,
        blocks: [{ text: sec.content || '' }]
      })
    })
  }

  // ── ফটো অ্যালবাম (প্রতি পাতায় ৬টি) ──
  for (let i = 0; i < albums.length; i += 6) {
    const group = albums.slice(i, i + 6)
    pages.push({
      key: `album-${i}`,
      body: (
        <>
          <PageTitle kicker="স্মৃতির ক্যামেরা">{i === 0 ? 'ফটো অ্যালবাম' : 'ফটো অ্যালবাম (চলমান)'}</PageTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {group.map((img, j) => (
              <Photo key={img.id} pdf={pdf} src={img.image_url} h={100} tilt={j % 2 ? 1.3 : -1.3} />
            ))}
          </div>
        </>
      )
    })
  }

  // ── পাতা জোড় করার জন্য "স্মৃতির পাতা" (শেষ মলাট বাদে মোট সংখ্যা বিজোড় হলে) ──
  if ((pages.length + 1) % 2 !== 0) {
    pages.push({
      key: 'notes',
      body: (
        <>
          <PageTitle kicker="স্মৃতির পাতা">আপনার স্মৃতি</PageTitle>
          <div
            className="h-[340px]"
            style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(180,83,9,.28) 32px)' }}
          />
          <p className="text-center text-[12px] text-[#8a6d4b] mt-3">এই মণ্ডপের সাথে জড়িত আপনার নিজের স্মৃতি এখানে লিখে রাখুন।</p>
        </>
      )
    })
  }

  // ── শেষ মলাট + QR ──
  pages.push({
    key: 'back',
    bare: true,
    body: (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-8"
        style={{ background: 'linear-gradient(200deg,#7c2d12,#431407 75%)' }}
      >
        <div className="absolute inset-4 border border-amber-300/50 rounded-md pointer-events-none" />
        <div className="text-4xl">🏛</div>
        <h3 className="mt-3 text-2xl font-extrabold text-amber-200">স্ক্যান করে পড়ুন</h3>
        <p className="mt-1 text-sm text-amber-100/90 leading-6">
          এই নথিটি ফোনে খুলতে বা বন্ধুদের পাঠাতে<br />QR কোড স্ক্যান করুন
        </p>
        <div className="mt-5 p-3 bg-white rounded-2xl shadow-xl">
          {qrUrl ? (
            <img src={qrUrl} alt="QR" width={160} height={160} />
          ) : (
            <div style={{ width: 160, height: 160 }} className="bg-gray-200 rounded animate-pulse" />
          )}
        </div>
        <p className="mt-4 text-[11px] text-amber-100/70 break-all px-4">{shareUrl}</p>
        <div className="mt-4 text-sm text-amber-200">সংগ্রাহক: {doc.submitted_by || 'Admin'}</div>
        <div className="mt-1 text-xs text-amber-100/70">চট্টগ্রাম পূজা মণ্ডপ মানচিত্র</div>
        <div className="mt-4 pt-3 px-6 border-t border-amber-300/30 text-[12px] text-amber-200 font-semibold">
          Developed by Sharadindu Dutta Turjo
        </div>
      </div>
    )
  })

  return pages
}

/* ─────────── একটি পাতার খোল (কাগজ, ফ্রেম, পাতা নম্বর, স্পাইনের ছায়া) ───────────
   শেষ ভরসা: ফ্লো ইঞ্জিনের বাইরের পাতায় (facts, artists, statue) কিছু বেশি লম্বা হলে
   পাতার ভেতরের জিনিস নিজে থেকে ছোট (scale) হয়ে পাতার মধ্যেই ঢুকে যায়। */

function PageShell({ page, num, side }) {
  const inner = useRef(null)
  const [sc, setSc] = useState(1)

  useLayoutEffect(() => {
    if (page.bare) return
    const el = inner.current
    if (!el) return
    const calc = () => {
      const prev = el.style.width
      el.style.width = '100%'
      const nat = el.offsetHeight
      el.style.width = prev
      const k = nat > AVAIL ? Math.max(MIN_SCALE, AVAIL / nat) : 1
      setSc((old) => (Math.abs(old - k) < 0.005 ? old : k))
    }
    calc()
    const t = setTimeout(calc, 400) // ছবি/ফন্ট লোড হওয়ার পর আবার মেপে নেয়
    return () => clearTimeout(t)
  }, [page])

  const radius = side === 'right' ? '4px 10px 10px 4px' : side === 'left' ? '10px 4px 4px 10px' : '8px'
  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        borderRadius: radius,
        color: INK,
        fontFamily: FONT,
        background: page.bare ? '#431407' : `linear-gradient(135deg, #fffaf0, ${PAPER} 60%, #f3e7cf)`,
        boxShadow: '0 10px 30px rgba(67,20,7,.25)'
      }}
    >
      {page.bare ? (
        page.body
      ) : (
        <>
          <div className="absolute inset-3 border border-[#b45309]/20 rounded pointer-events-none" />
          <div className="absolute inset-0 px-9 pt-9 pb-12 overflow-hidden">
            <div
              ref={inner}
              style={{
                display: 'flow-root',
                overflowWrap: 'anywhere',
                width: `${100 / sc}%`,
                transform: sc < 1 ? `scale(${sc})` : undefined,
                transformOrigin: 'top left'
              }}
            >
              {page.body}
            </div>
          </div>
          <div className="absolute bottom-3.5 inset-x-0 text-center text-xs text-[#8a6d4b]">— {toBn(num)} —</div>
        </>
      )}
      {side === 'right' && <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/25 to-transparent" />}
      {side === 'left' && <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/25 to-transparent" />}
    </div>
  )
}

/* ───────────────────── বই ভিউয়ার (পাতা ওল্টানো + QR + PDF) ───────────────────── */

const tbBtn =
  'px-4 py-2 rounded-xl text-sm font-semibold border bg-white dark:bg-gray-800 border-orange-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

function HeritageBook({ doc, albums, onBack }) {
  const w = useWindowWidth()
  const spreadMode = w >= 1000 // ডেস্কটপে দুই পাতা, ছোট স্ক্রিনে এক পাতা
  const shareUrl = `${window.location.origin}/heritage?docId=${doc.id}`

  const [qrUrl, setQrUrl] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [spread, setSpread] = useState(0)
  const [page, setPage] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [m, setM] = useState(null) // মাপার যন্ত্র (ফন্ট লোড হলে তৈরি হয়)
  const pdfRef = useRef(null)
  const touchX = useRef(null)

  useEffect(() => {
    let dead = false
    let meas = null
    ;(async () => {
      await loadBookFont()
      if (dead) return
      meas = createMeasurer()
      setM(meas)
    })()
    return () => {
      dead = true
      meas?.destroy()
    }
  }, [])

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 320, margin: 1, color: { dark: '#7c2d12', light: '#ffffff' } })
      .then(setQrUrl)
      .catch(() => {})
  }, [shareUrl])

  const pages = useMemo(() => (m ? buildPages(doc, albums, { qrUrl, shareUrl, pdf: false, m }) : []), [m, doc, albums, qrUrl, shareUrl])
  const pdfPages = useMemo(
    () => (exporting && m ? buildPages(doc, albums, { qrUrl, shareUrl, pdf: true, m }) : []),
    [exporting, m, doc, albums, qrUrl, shareUrl]
  )

  const total = pages.length
  const L = total / 2 // মোট পাতা সবসময় জোড়, তাই লিফ = total/2

  // পাতা ওল্টানো
  const next = () => {
    if (spreadMode) setSpread((s) => Math.min(L, s + 1))
    else setPage((p) => Math.min(total - 1, p + 1))
  }
  const prev = () => {
    if (spreadMode) setSpread((s) => Math.max(0, s - 1))
    else setPage((p) => Math.max(0, p - 1))
  }

  // কিবোর্ডের ← → দিয়ে পাতা ওল্টানো
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [spreadMode, L, total])

  // PDF ডাউনলোড
  useEffect(() => {
    if (!exporting) return
    ;(async () => {
      try {
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])
        if (document.fonts?.ready) await document.fonts.ready
        const root = pdfRef.current
        const imgs = Array.from(root.querySelectorAll('img'))
        await Promise.all(
          imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r })))
        )
        await new Promise((r) => setTimeout(r, 500))
        const nodes = Array.from(root.querySelectorAll('[data-pdf-page]'))
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PAGE_W, PAGE_H], hotfixes: ['px_scaling'] })
        for (let i = 0; i < nodes.length; i++) {
          const canvas = await html2canvas(nodes[i], { scale: 2, useCORS: true, backgroundColor: PAPER })
          if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait')
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_W, PAGE_H)
          setProgress(i + 1)
        }
        pdf.save(`heritage-${doc.year}-${doc.id}.pdf`)
      } catch (e) {
        console.error(e)
        alert('PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।')
      }
      setExporting(false)
    })()
  }, [exporting])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  // মাপার যন্ত্র তৈরি না হওয়া পর্যন্ত (ফন্ট লোড হচ্ছে)
  if (!m) {
    return <p className="text-orange-700 dark:text-gray-500 animate-pulse text-center py-24">📖 পাতা সাজানো হচ্ছে...</p>
  }

  const atStart = spreadMode ? spread === 0 : page === 0
  const atEnd = spreadMode ? spread === L : page === total - 1
  const idx = spreadMode ? spread : page
  const indicator = spreadMode
    ? spread === 0
      ? 'প্রচ্ছদ'
      : spread === L
        ? 'শেষ মলাট'
        : `পাতা ${toBn(2 * spread - 1)}–${toBn(2 * spread)} / ${toBn(total - 2)}`
    : page === 0
      ? 'প্রচ্ছদ'
      : page === total - 1
        ? 'শেষ মলাট'
        : `পাতা ${toBn(page)} / ${toBn(total - 2)}`

  const singleScale = Math.min(1, (w - 64) / PAGE_W)
  const shift = spread === 0 ? -PAGE_W / 2 : spread === L ? PAGE_W / 2 : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* টুলবার */}
      <div className="flex justify-between items-center flex-wrap gap-3 border-b border-orange-200 dark:border-gray-700/50 pb-4">
        <button onClick={onBack} className={tbBtn}>
          ← সব হেরিটেজ আর্টিকেলে ফিরুন
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowQR(true)} className={tbBtn}>
            ▦ QR কোড
          </button>
          <button
            onClick={() => {
              setProgress(0)
              setExporting(true)
            }}
            disabled={exporting}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {exporting ? `PDF তৈরি হচ্ছে… ${toBn(progress)}/${toBn(total)}` : '⬇ PDF ডাউনলোড'}
          </button>
          <ShareButton
            m={doc}
            kind="heritage"
            title={doc.title || `${doc.mandaps?.name_bn || doc.mandaps?.name} — ${doc.year}`}
          />
        </div>
      </div>

      {/* পড়ার টেবিল */}
      <div className="rounded-3xl p-4 sm:p-6 overflow-hidden bg-gradient-to-b from-amber-100 to-orange-200/70 dark:from-gray-900 dark:to-black border border-orange-200 dark:border-gray-800 shadow-inner">
        {spreadMode ? (
          <>
            <div className="mx-auto" style={{ width: PAGE_W * 2, height: PAGE_H }}>
              <div
                className="relative"
                style={{
                  width: PAGE_W * 2,
                  height: PAGE_H,
                  perspective: 2400,
                  transform: `translateX(${shift}px)`,
                  transition: 'transform .8s ease'
                }}
              >
                {Array.from({ length: L }, (_, i) => {
                  const flipped = i < spread
                  return (
                    <div
                      key={i}
                      onClick={() => setSpread(flipped ? i : i + 1)}
                      className="absolute top-0 cursor-pointer"
                      style={{
                        left: PAGE_W,
                        width: PAGE_W,
                        height: PAGE_H,
                        transformOrigin: 'left center',
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                        transition: 'transform .9s cubic-bezier(.45,.05,.25,1), z-index 0s .45s',
                        zIndex: flipped ? i : L - i
                      }}
                    >
                      <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        <PageShell page={pages[2 * i]} num={2 * i} side="right" />
                      </div>
                      <div
                        className="absolute inset-0"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <PageShell page={pages[2 * i + 1]} num={2 * i + 1} side="left" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mx-auto mt-3 h-5 rounded-[50%] bg-black/25 blur-xl" style={{ width: 700 }} />
          </>
        ) : (
          <>
            {/* মোবাইল: ডেস্কটপের মতোই আসল 3D পাতা ওল্টানো (বাঁ কিনারা ধরে পাতা উল্টে যায়) */}
            <div
              className="mx-auto"
              style={{ width: PAGE_W * singleScale, height: PAGE_H * singleScale, clipPath: 'inset(-60px 0px -60px 0px)' }}
              onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchX.current == null) return
                const dx = e.changedTouches[0].clientX - touchX.current
                touchX.current = null
                if (dx < -50) next()
                else if (dx > 50) prev()
              }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                if (e.clientX - r.left > r.width * 0.4) next()
                else prev()
              }}
            >
              <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${singleScale})`, transformOrigin: 'top left' }}>
                <div className="relative" style={{ width: PAGE_W, height: PAGE_H, perspective: 1800 }}>
                  {pages.map((p, i) => {
                    const flipped = i < page
                    return (
                      <div
                        key={p.key}
                        className="absolute inset-0"
                        style={{
                          transformOrigin: 'left center',
                          transformStyle: 'preserve-3d',
                          transform: flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                          transition: 'transform .85s cubic-bezier(.45,.05,.25,1), z-index 0s .4s',
                          zIndex: flipped ? i : total - i,
                          pointerEvents: 'none'
                        }}
                      >
                        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                          <PageShell page={p} num={i} side="right" />
                        </div>
                        {/* পাতার উল্টো পিঠ (ফাঁকা কাগজ) */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            borderRadius: '10px 4px 4px 10px',
                            background: `linear-gradient(225deg, ${PAPER}, #eadcc0)`,
                            boxShadow: '0 10px 30px rgba(67,20,7,.25)'
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="mx-auto mt-3 h-4 rounded-[50%] bg-black/25 blur-xl" style={{ width: PAGE_W * singleScale * 0.85 }} />
          </>
        )}

        {/* কন্ট্রোল */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            disabled={atStart}
            aria-label="আগের পাতা"
            className="w-11 h-11 rounded-full bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 text-gray-800 dark:text-white font-bold shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <div className="min-w-[150px] text-center text-sm font-semibold text-orange-800 dark:text-orange-300">{indicator}</div>
          <button
            onClick={next}
            disabled={atEnd}
            aria-label="পরের পাতা"
            className="w-11 h-11 rounded-full bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 text-gray-800 dark:text-white font-bold shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-orange-900/60 dark:text-gray-500">
          {spreadMode ? 'পাতায় ক্লিক করুন বা কিবোর্ডের ← → চাপুন' : 'পাতার ডান/বাম পাশে ট্যাপ করুন বা সোয়াইপ করুন'}
          {idx === 0 ? ' · প্রচ্ছদে ক্লিক করে বইটি খুলুন 📖' : ''}
        </p>
      </div>

      {/* PDF-এর জন্য অফস্ক্রিনে সব পাতা রেন্ডার (ব্যবহারকারী দেখতে পায় না) */}
      {exporting && (
        <div ref={pdfRef} aria-hidden style={{ position: 'fixed', left: -10000, top: 0, width: PAGE_W, pointerEvents: 'none' }}>
          {pdfPages.map((p, i) => (
            <div key={p.key} data-pdf-page style={{ width: PAGE_W, height: PAGE_H }}>
              <PageShell page={p} num={i} side="none" />
            </div>
          ))}
        </div>
      )}

      {/* QR মডাল */}
      {showQR && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-3xl bg-white dark:bg-gray-900 p-6 text-center shadow-2xl border border-orange-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">QR কোড</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">স্ক্যান করলেই এই হেরিটেজ নথিটি খুলবে</p>
            <div className="mt-4 inline-block p-3 bg-white rounded-2xl border border-orange-200">
              {qrUrl ? <img src={qrUrl} alt="QR" width={220} height={220} /> : <div style={{ width: 220, height: 220 }} className="bg-gray-100 animate-pulse rounded" />}
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <a href={qrUrl} download={`heritage-qr-${doc.id}.png`} className={`${tbBtn} no-underline`}>
                ⬇ ডাউনলোড
              </a>
              <button onClick={copyLink} className={tbBtn}>
                {copied ? 'কপি হয়েছে ✓' : '🔗 লিংক কপি'}
              </button>
            </div>
            <button onClick={() => setShowQR(false)} className="mt-4 text-xs text-gray-500 dark:text-gray-400 underline cursor-pointer">
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── মূল হেরিটেজ পেজ ───────────────────────── */

export default function HeritagePage({ mandapId: propMandapId }) {
  const [docId, setDocId] = useState(getParam('docId'))
  const [selectedMandap, setSelectedMandap] = useState(propMandapId || getParam('id') || '')

  const [mandapList, setMandapList] = useState([])
  const [allDocs, setAllDocs] = useState([])
  const [singleDoc, setSingleDoc] = useState(null)
  const [albums, setAlbums] = useState([])

  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    sb.from('mandaps')
      .select('id, name, name_bn, area')
      .eq('status', 'approved')
      .order('name', { ascending: true })
      .then(({ data }) => setMandapList(data || []))
  }, [])

  // ব্রাউজারের Back/Forward বাটনে URL বদলালে docId সিঙ্ক রাখা
  useEffect(() => {
    const h = () => setDocId(getParam('docId'))
    window.addEventListener('popstate', h)
    return () => window.removeEventListener('popstate', h)
  }, [])

  // Load all approved docs for blog list
  async function loadApprovedDocs() {
    setLoading(true)
    let q = sb.from('heritage_docs').select('*, mandaps(name, name_bn, area)').eq('status', 'approved').order('created_at', { ascending: false })
    if (selectedMandap) q = q.eq('mandap_id', selectedMandap)

    const { data } = await q
    setAllDocs(data || [])
    setLoading(false)
  }

  // Load single doc details
  async function loadSingleDoc(id) {
    setLoading(true)
    const { data: docData } = await sb.from('heritage_docs').select('*, mandaps(name, name_bn, area)').eq('id', id).maybeSingle()
    if (docData) {
      setSingleDoc(docData)
      const { data: albumData } = await sb.from('heritage_albums').select('*').eq('heritage_id', id)
      setAlbums(albumData || [])
    } else {
      setSingleDoc(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    const currentDocId = getParam('docId') || docId
    if (currentDocId) {
      loadSingleDoc(currentDocId)
    } else {
      setSingleDoc(null)
      loadApprovedDocs()
    }
  }, [docId, selectedMandap])

  const currentMandapObj = mandapList.find((m) => m.id == selectedMandap)

  // ডকুমেন্ট লোড হওয়ার সময়
  if (docId && loading && !singleDoc) {
    return <p className="text-orange-700 dark:text-gray-500 animate-pulse text-center py-24">📖 বইটি খোলা হচ্ছে...</p>
  }

  // Single Heritage Book View
  if (singleDoc) {
    return (
      <HeritageBook
        key={singleDoc.id}
        doc={singleDoc}
        albums={albums}
        onBack={() => {
          setDocId(null)
          // pushState দিয়ে ক্লিন URL সেট করা হলো
          const newUrl = selectedMandap ? `/heritage?id=${selectedMandap}` : '/heritage'
          window.history.pushState({}, '', newUrl)
        }}
      />
    )
  }

  // Blog Card Grid View
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-orange-200 dark:border-gray-700/50 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 bg-clip-text text-transparent">
            🏛 হেরিটেজ ও আর্কিটেকচার আর্কাইভ
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">মণ্ডপের ইতিহাস, নগরায়ণ ও স্থপতি বিবরণী ব্লগসমূহ</p>
        </div>

        <button
          onClick={() => {
            if (!selectedMandap) return alert('অনুগ্রহ করে প্রথমে একটি মণ্ডপ সিলেক্ট করুন!')
            setShowForm(true)
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg cursor-pointer"
        >
          ➕ হেরিটেজ তথ্য যোগ করুন
        </button>
      </div>

      {/* Filter Selector */}
      <div className="bg-orange-50 dark:bg-white/5 p-4 rounded-xl border border-orange-200 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-4">
        <label className="font-semibold text-gray-700 dark:text-gray-300 min-w-max">মণ্ডপ ফিল্টার করুন:</label>
        <select
          value={selectedMandap}
          onChange={(e) => {
            setSelectedMandap(e.target.value)
            // pushState দিয়ে ক্লিন URL সেট করা হলো
            const newUrl = e.target.value ? `/heritage?id=${e.target.value}` : '/heritage'
            window.history.pushState({}, '', newUrl)
          }}
          className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-orange-200 dark:border-gray-700 focus:outline-none focus:border-orange-500"
        >
          <option value="">-- চট্টগ্রাম শহরের সকল মণ্ডপ --</option>
          {mandapList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name_bn || m.name} ({m.area})
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-orange-700 dark:text-gray-500 animate-pulse text-center py-10">ব্লগ লোড হচ্ছে...</p>}

      {!loading && !allDocs.length && (
        <div className="text-center py-12 px-6 rounded-2xl bg-orange-50 dark:bg-white/5 border border-orange-200 dark:border-gray-800 space-y-4">
          <p className="text-gray-700 dark:text-gray-400 text-lg">
            {selectedMandap
              ? `${currentMandapObj?.name_bn || currentMandapObj?.name} এর জন্য কোনো আর্কাইভ পাওয়া যায়নি।`
              : 'কোনো হেরিটেজ পোস্ট পাওয়া যায়নি।'}
          </p>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg cursor-pointer">
            প্রথম ব্লগ সাবমিট করুন
          </button>
        </div>
      )}

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allDocs.map((item) => {
          // ✅ এখন থাম্বনেইল হিসেবে thumbnail_post (পুরনো পোস্টে না থাকলে আগের ছবিগুলো ফলব্যাক)
          const coverImg = item.thumbnail_post || item.pandal_architect_photo || item.entry_point_photo || item.exit_point_photo
          return (
            <div
              key={item.id}
              onClick={() => {
                setDocId(item.id)
                // pushState দিয়ে ক্লিন URL সেট করা হলো
                window.history.pushState({}, '', `/heritage?docId=${item.id}`)
              }}
              className="group bg-white dark:bg-gray-900/60 border border-orange-200/80 dark:border-gray-800 hover:border-orange-500/60 rounded-2xl overflow-hidden shadow-lg shadow-orange-900/5 dark:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="overflow-hidden">
                  {coverImg ? (
                    <img src={coverImg} alt="" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center text-4xl">🏛</div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <span className="inline-block px-2.5 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-md">
                    📅 {item.year} · {item.mandaps?.name_bn || item.mandaps?.name}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                    {item.title || `${item.mandaps?.name_bn || item.mandaps?.name} এর হেরিটেজ নথি`}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.heritage_description || item.location_change_history || item.entry_point || 'আর্কিটেকচার ও ইতিহাস বিস্তারিত দেখতে ক্লিক করুন...'}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-orange-100 dark:border-gray-800/60 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>লেখক: {item.submitted_by || 'Admin'}</span>
                <span className="text-orange-600 dark:text-orange-500 font-bold group-hover:translate-x-1 transition-transform">📖 বইটি খুলুন →</span>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8">
            <button
              onClick={() => setShowForm(false)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold border border-gray-600 hover:bg-rose-600 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <SubmitHeritage
              mandapId={selectedMandap}
              onClose={() => {
                setShowForm(false)
                loadApprovedDocs()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}