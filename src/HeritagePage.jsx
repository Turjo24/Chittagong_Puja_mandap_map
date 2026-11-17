import { useEffect, useMemo, useRef, useState } from 'react'
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

// লম্বা লেখাকে পাতা অনুযায়ী ভাগ করে (শব্দ/বাক্যের মাঝখানে না কেটে)
function chunkText(text, first, next) {
  let rest = (text || '').trim()
  if (!rest) return []
  const out = []
  let limit = first
  while (rest.length > limit) {
    const slice = rest.slice(0, limit)
    let cut = slice.lastIndexOf('\n')
    if (cut < limit * 0.5) {
      const d = slice.lastIndexOf('।')
      if (d >= limit * 0.5) cut = d + 1
    }
    if (cut < limit * 0.5) cut = slice.lastIndexOf(' ')
    if (cut < limit * 0.5) cut = limit
    out.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
    limit = next
  }
  if (rest) out.push(rest)
  return out
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
      <span className="text-[15px] font-semibold flex-1 leading-snug">{v}</span>
    </div>
  ) : null

// পোলারয়েড স্টাইলের ছবি
const Photo = ({ src, pdf, h = 100, tilt = 0, className = '' }) => (
  <div className={`bg-white p-1.5 pb-3 shadow-md ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
    <Img pdf={pdf} src={src} className="w-full object-cover" style={{ height: h }} />
  </div>
)

const textPage = (key, kicker, heading, text) => ({
  key,
  body: (
    <>
      <PageTitle kicker={kicker}>{heading}</PageTitle>
      <p className="text-[14.5px] leading-[1.95] whitespace-pre-line text-justify">{text}</p>
    </>
  )
})

/* ───────────────────── পাতা তৈরির মূল ফাংশন ───────────────────── */

function buildPages(doc, albums, { qrUrl, shareUrl, pdf }) {
  const mName = doc.mandaps?.name_bn || doc.mandaps?.name || ''
  const area = doc.mandaps?.area || ''
  const title = doc.title || `${mName} এর হেরিটেজ নথি`
  const thumb = doc.thumbnail_post || doc.pandal_architect_photo || doc.entry_point_photo || doc.exit_point_photo
  const pages = []

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
          <h1 className="mt-2 text-[26px] font-extrabold leading-snug drop-shadow">{title}</h1>
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

  // ── স্থান ও স্থানান্তর ──
  const histChunks = doc.location_changed ? chunkText(doc.location_change_history, 330, 620) : []
  pages.push({
    key: 'loc',
    body: (
      <>
        <PageTitle kicker="নগরায়ণের ছাপ">স্থান ও স্থানান্তর</PageTitle>
        <div className="inline-block px-3 py-1 rounded-full bg-[#b45309]/10 text-[#7c2d12] text-[13px] font-semibold">
          📍 {LOCATION_LABELS[doc.location_type] || 'স্থান'}
        </div>
        {doc.location_changed ? (
          <>
            <div className="mt-4 text-[13px] font-bold text-[#b45309]">⚠ স্থান পরিবর্তনের কাহিনি</div>
            <p className="mt-2 text-[14.5px] leading-[1.95] whitespace-pre-line text-justify">
              {histChunks[0] || 'বিস্তারিত বিবরণ দেওয়া হয়নি।'}
            </p>
          </>
        ) : (
          <p className="mt-5 text-[14.5px] leading-[1.95]">✅ মণ্ডপটি শুরু থেকেই একই নির্ধারিত স্থানে উদযাপিত হচ্ছে।</p>
        )}
        {doc.post_puja_site_status && (
          <div className="mt-4 p-3 rounded-lg bg-[#b45309]/10 text-[13px] leading-7 line-clamp-3">
            <b>পূজা-পরবর্তী স্থানের অবস্থা:</b> {doc.post_puja_site_status}
          </div>
        )}
      </>
    )
  })
  histChunks.slice(1).forEach((c, i) => pages.push(textPage(`loc-${i}`, 'নগরায়ণের ছাপ', 'স্থান পরিবর্তন (চলমান)', c)))

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

  // ── সার্কুলেশন ──
  pages.push({
    key: 'circ',
    body: (
      <>
        <PageTitle kicker="দর্শনার্থীর পথ">প্রবেশ ও প্রস্থান</PageTitle>
        <div className="space-y-3">
          <div>
            <div className="text-[13px] font-bold text-emerald-700">🟢 প্রবেশ পথ</div>
            <p className="text-[13px] leading-6 line-clamp-4 mt-0.5">{doc.entry_point || 'বিবরণ নেই'}</p>
            {doc.entry_point_photo && <Photo pdf={pdf} src={doc.entry_point_photo} h={88} tilt={-1.2} className="mt-1.5" />}
          </div>
          <div>
            <div className="text-[13px] font-bold text-rose-700">🔴 প্রস্থান পথ</div>
            <p className="text-[13px] leading-6 line-clamp-4 mt-0.5">{doc.exit_point || 'বিবরণ নেই'}</p>
            {doc.exit_point_photo && <Photo pdf={pdf} src={doc.exit_point_photo} h={88} tilt={1.2} className="mt-1.5" />}
          </div>
        </div>
      </>
    )
  })

  // ── হেরিটেজ বর্ণনা (লম্বা লেখা, একাধিক পাতা) ──
  chunkText(doc.heritage_description, 480, 620).forEach((c, i) =>
    pages.push(textPage(`desc-${i}`, 'স্মৃতি ও ঐতিহ্য', i === 0 ? 'হেরিটেজ বর্ণনা' : 'হেরিটেজ বর্ণনা (চলমান)', c))
  )

  // ── অ্যাডমিনের কাস্টম সেকশন ──
  if (Array.isArray(doc.custom_sections)) {
    doc.custom_sections.forEach((sec, idx) => {
      const [firstChunk = '', ...restChunks] = chunkText(sec.content, sec.image_url ? 260 : 420, 620)
      pages.push({
        key: `custom-${idx}`,
        body: (
          <>
            <PageTitle kicker="বিশেষ অধ্যায়">{sec.title || 'বিশেষ তথ্য'}</PageTitle>
            {sec.image_url && <Photo pdf={pdf} src={sec.image_url} h={150} tilt={-1} className="mb-3" />}
            <p className="text-[14.5px] leading-[1.95] whitespace-pre-line text-justify">{firstChunk}</p>
          </>
        )
      })
      restChunks.forEach((c, i) => pages.push(textPage(`custom-${idx}-${i}`, 'বিশেষ অধ্যায়', `${sec.title || 'বিশেষ তথ্য'} (চলমান)`, c)))
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

/* ─────────── একটি পাতার খোল (কাগজ, ফ্রেম, পাতা নম্বর, স্পাইনের ছায়া) ─────────── */

function PageShell({ page, num, side }) {
  const radius = side === 'right' ? '4px 10px 10px 4px' : side === 'left' ? '10px 4px 4px 10px' : '8px'
  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        borderRadius: radius,
        color: INK,
        fontFamily: "'Noto Serif Bengali', 'Hind Siliguri', serif",
        background: page.bare ? '#431407' : `linear-gradient(135deg, #fffaf0, ${PAPER} 60%, #f3e7cf)`,
        boxShadow: '0 10px 30px rgba(67,20,7,.25)'
      }}
    >
      {page.bare ? (
        page.body
      ) : (
        <>
          <div className="absolute inset-3 border border-[#b45309]/20 rounded pointer-events-none" />
          <div className="absolute inset-0 px-9 pt-9 pb-12 overflow-hidden">{page.body}</div>
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
  const pdfRef = useRef(null)
  const touchX = useRef(null)

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 320, margin: 1, color: { dark: '#7c2d12', light: '#ffffff' } })
      .then(setQrUrl)
      .catch(() => {})
  }, [shareUrl])

  const pages = useMemo(() => buildPages(doc, albums, { qrUrl, shareUrl, pdf: false }), [doc, albums, qrUrl, shareUrl])
  const pdfPages = useMemo(
    () => (exporting ? buildPages(doc, albums, { qrUrl, shareUrl, pdf: true }) : []),
    [exporting, doc, albums, qrUrl, shareUrl]
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
        await new Promise((r) => setTimeout(r, 300))
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;800&display=swap');
      `}</style>

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