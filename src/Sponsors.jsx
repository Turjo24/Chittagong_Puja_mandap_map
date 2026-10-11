import { useEffect, useState } from 'react'
import { sb } from './supabase'
import Flame from './Flame'
import { CONTACT } from './config'

const TIERS = [
  ['title', 'Title Sponsor', 'টাইটেল স্পনসর'],
  ['gold', 'Gold Sponsors', 'গোল্ড স্পনসর'],
  ['silver', 'Silver Sponsors', 'সিলভার স্পনসর'],
  ['supporter', 'Supporters', 'সহযোগী'],
]

// Social button style (light + dark)
const SOCIAL_BTN = `
  rounded-lg px-3 py-2 text-xs font-semibold
  border border-[#c49a48]/60
  bg-[#f7eddb] text-[#501126]
  hover:bg-[#501126] hover:text-white
  transition-colors
  dark:bg-transparent dark:text-[#f0d18a]
  dark:hover:bg-[#e4bf70] dark:hover:text-[#35101e]
`

export default function Sponsors({ lang }) {
  const bn = lang === 'bn'
  const [list, setList] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    sb.from('sponsors')
      .select('*')
      .order('sort')
      .order('created_at')
      .then(({ data }) => setList(data || []))
  }, [])

  // Shared link e ashle oi card e scroll kore highlight
  const sharedId = new URLSearchParams(window.location.hash.split('?')[1] || '').get('id')
  useEffect(() => {
    if (!list || !sharedId) return
    document.getElementById(`sponsor-${sharedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [list, sharedId])

  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    'Hello, I want to sponsor Chattogram Puja Map'
  )}`

  const getShareUrl = (s) => {
    const base = window.location.href.split('#')[0]
    return `${base}#/sponsors?id=${encodeURIComponent(s.id)}`
  }

  const getShareText = (s) =>
    `${s.name} — ${s.tagline || 'Proud Sponsor of Chattogram Puja Map'}\n${getShareUrl(s)}`

  const shareSponsor = async (s) => {
    const url = getShareUrl(s)

    if (navigator.share) {
      try {
        await navigator.share({ title: s.name, text: getShareText(s), url })
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share failed:', err)
      }
    } else {
      await copyLink(s)
    }
  }

  const shareSocial = (s, platform) => {
    const url = getShareUrl(s)
    const text = getShareText(s)
    const u = encodeURIComponent(url)
    const t = encodeURIComponent(text)

    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      messenger: `https://www.facebook.com/dialog/send?link=${u}&app_id=966242223397117&redirect_uri=${u}`,
      whatsapp: `https://wa.me/?text=${t}`,
      telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    }

    window.open(links[platform], '_blank', 'noopener,noreferrer')
  }

  const copyLink = async (s) => {
    const url = getShareUrl(s)

    try {
      await navigator.clipboard.writeText(url)
      setCopied(s.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      window.prompt(bn ? 'লিংকটি কপি করুন:' : 'Copy this link:', url)
    }
  }

  return (
    <div className="page">
      <div className="wrap">
        <a
          href="#/"
          className="inline-block mb-5 text-[#79551e] hover:text-[#501126] dark:text-amber-300 dark:hover:text-amber-200 transition"
        >
          ← {bn ? 'ফিরে যান' : 'Back to map'}
        </a>

        {/* Hero */}
        <div className="text-center py-8 sm:py-12">
          <div className="inline-flex items-center justify-center rounded-2xl bg-[#501126] border border-[#c49a48]/50 p-4 mb-4 text-[#e4bf70]">
            <Flame size={36} />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-[#501126] dark:text-amber-300">
            {bn ? 'আমাদের স্পনসর' : 'Our Sponsors'}
          </h2>

          <p className="mt-3 text-sm sm:text-base text-[#654b53] dark:text-[#d8c5cb] max-w-xl mx-auto">
            {bn
              ? 'যাঁদের সহযোগিতায় এই পূজা মানচিত্র সম্ভব হয়েছে'
              : 'The people and brands who make this puja guide possible'}
          </p>
        </div>

        {/* Sponsor tiers */}
        {TIERS.map(([k, en, b]) => {
          const items = (list || []).filter((s) => s.tier === k)

          if (!items.length) return null

          return (
            <section key={k} className="mb-10">
              <h3 className="text-xl font-bold text-[#501126] dark:text-amber-300 border-b border-[#c49a48]/40 pb-3 mb-5">
                {bn ? b : en}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((s) => (
                  <div
                    key={s.id}
                    id={`sponsor-${s.id}`}
                    className={`
                      ${String(s.id) === sharedId ? 'ring-2 ring-[#c49a48] ' : ''}
                      flex flex-col items-center text-center rounded-2xl p-5
                      border border-[#e5d5b2] bg-[#fffaf0] text-[#35101e]
                      shadow-md shadow-[#501126]/5
                      hover:border-[#b68a38] hover:shadow-xl hover:-translate-y-1
                      transition-all duration-200
                      dark:bg-[#2a0b16] dark:border-[#6e3448] dark:text-[#fff4df]
                      dark:shadow-black/20 dark:hover:border-[#d4af62]
                    `}
                  >
                    {/* Sponsor profile */}
                    <a
                      href={s.link || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center gap-3 w-full text-inherit no-underline"
                    >
                      <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-[#f1e4cf] dark:bg-white/5 border border-[#e5d5b2] dark:border-[#6e3448] p-3 overflow-hidden text-[#501126] dark:text-[#f0d18a]">
                        {s.logo_url ? (
                          <img
                            src={s.logo_url}
                            alt={s.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Flame size={42} />
                        )}
                      </div>

                      <h4 className="text-lg font-bold text-[#501126] dark:text-[#ffe6ae] break-words">
                        {s.name}
                      </h4>

                      {s.tagline && (
                        <p className="text-sm text-[#704b57] dark:text-[#e1c5ce]">{s.tagline}</p>
                      )}
                    </a>

                    {/* Share button */}
                    <button
                      type="button"
                      onClick={() => shareSponsor(s)}
                      className="
                        mt-5 w-full rounded-xl px-4 py-2.5 font-bold
                        bg-[#501126] text-[#fff4df] hover:bg-[#6b1935]
                        dark:bg-[#e4bf70] dark:text-[#35101e] dark:hover:bg-[#f1d79e]
                        active:scale-95 transition
                      "
                    >
                      ↗ {bn ? 'শেয়ার করুন' : 'Share Profile'}
                    </button>

                    {/* Social media buttons */}
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <button type="button" onClick={() => shareSocial(s, 'facebook')} className={SOCIAL_BTN}>
                        Facebook
                      </button>
                      <button type="button" onClick={() => shareSocial(s, 'messenger')} className={SOCIAL_BTN}>
                        Messenger
                      </button>
                      <button type="button" onClick={() => shareSocial(s, 'whatsapp')} className={SOCIAL_BTN}>
                        WhatsApp
                      </button>
                      <button type="button" onClick={() => shareSocial(s, 'telegram')} className={SOCIAL_BTN}>
                        Telegram
                      </button>
                      <button type="button" onClick={() => copyLink(s)} className={SOCIAL_BTN}>
                        {copied === s.id ? '✓ Copied!' : '🔗 Copy Link'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* Empty state */}
        {list && !list.length && (
          <p className="text-center text-[#795e65] dark:text-[#bda5ad] py-8">
            {bn
              ? 'শীঘ্রই স্পনসরদের নাম এখানে দেখা যাবে।'
              : 'Sponsors will appear here soon.'}
          </p>
        )}

        {/* Become a sponsor */}
        <div className="mt-12 mb-8 rounded-2xl border border-[#c49a48]/40 bg-[#501126] p-6 sm:p-10 text-center">
          <h3 className="text-2xl font-bold text-amber-300">
            {bn ? 'আপনিও স্পনসর হতে চান?' : 'Want to Become a Sponsor?'}
          </h3>

          <p className="mt-3 mb-6 text-[#e8d6dc] max-w-xl mx-auto">
            {bn
              ? 'হাজার হাজার পূজা-প্রেমী মানুষের কাছে আপনার ব্র্যান্ড পৌঁছে দিন।'
              : 'Reach thousands of puja lovers across Chattogram.'}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:${CONTACT.email}?subject=Sponsorship`}
              className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-[#501126] hover:bg-amber-300 transition"
            >
              ✉ Email
            </a>

            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-amber-400 px-5 py-3 font-bold text-amber-200 hover:bg-amber-400 hover:text-[#501126] transition"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
