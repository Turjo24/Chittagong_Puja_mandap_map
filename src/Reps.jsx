
import { useEffect, useState } from 'react'
import { sb } from './supabase'

const ini = (n = '') =>
  n
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default function Reps({ lang }) {
  const bn = lang === 'bn'
  const [list, setList] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    sb.from('reps')
      .select('*')
      .order('sort')
      .order('created_at')
      .then(({ data }) => setList(data || []))
  }, [])

  // Shared link e ashle oi card e scroll kore highlight
  const sharedId = new URLSearchParams(window.location.hash.split('?')[1] || '').get('id')
  useEffect(() => {
    if (!list || !sharedId) return
    document.getElementById(`rep-${sharedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [list, sharedId])

  // Share URL
  const getShareUrl = (r) => {
    const base = window.location.href.split('#')[0]
    return `${base}#/reps?id=${encodeURIComponent(r.id)}`
  }

  const getShareText = (r) =>
    `${r.name}${r.role ? ` — ${r.role}` : ''}\n${
      r.mandap_name ? `🪔 ${r.mandap_name}\n` : ''
    }${
      bn
        ? 'চট্টগ্রাম পূজা ম্যাপ প্রজেক্টের প্রতিনিধি'
        : 'Representative of Chattogram Puja Map'
    }\n${getShareUrl(r)}`

  // Native share
  const shareProfile = async (r) => {
    const url = getShareUrl(r)

    if (navigator.share) {
      try {
        await navigator.share({
          title: r.name,
          text: getShareText(r),
          url,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      await copyLink(r)
    }
  }

  // Social media share
  const shareSocial = (r, platform) => {
    const url = getShareUrl(r)
    const text = getShareText(r)
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

  // Copy profile link
  const copyLink = async (r) => {
    const url = getShareUrl(r)

    try {
      await navigator.clipboard.writeText(url)
      setCopied(r.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      window.prompt(
        bn ? 'লিংকটি কপি করুন:' : 'Copy this link:',
        url
      )
    }
  }

  return (
    <div className="page">
      <div className="wrap">

        {/* Page Heading */}
        <div className="text-center py-10 sm:py-14">

          <div className="
            inline-flex items-center justify-center
            w-16 h-16 rounded-2xl mb-5
            bg-[#501126] border border-[#c49a48]/50
            text-[#e4bf70] shadow-lg shadow-[#501126]/10
            dark:bg-[#501126] dark:text-[#e4bf70]
          ">
            <span className="text-3xl">🪔</span>
          </div>

          <h2 className="
            text-3xl sm:text-4xl md:text-5xl
            font-extrabold tracking-tight
            text-[#501126]
            dark:text-[#f0d18a]
          ">
            {bn ? 'আমাদের প্রতিনিধিবৃন্দ' : 'Our Representatives'}
          </h2>

          <p className="
            mt-4 max-w-2xl mx-auto
            text-sm sm:text-base leading-7
            text-[#654b53]
            dark:text-[#d8c5cb]
          ">
            {bn
              ? 'চট্টগ্রাম পূজা ম্যাপ প্রজেক্টের সঙ্গে যুক্ত প্রতিনিধিবৃন্দের পরিচিতি'
              : 'Meet the representatives associated with the Chattogram Puja Map project'}
          </p>

          <div className="
            mx-auto mt-5 h-1 w-20 rounded-full
            bg-[#c49a48]
            dark:bg-[#e4bf70]
          " />
        </div>

        {/* Loading */}
        {!list && (
          <div className="
            py-12 text-center
            text-[#704b57]
            dark:text-[#d8c5cb]
          ">
            {bn ? 'তথ্য লোড হচ্ছে...' : 'Loading representatives...'}
          </div>
        )}

        {/* Representative Cards */}
        {list && list.length > 0 && (
          <div className="
            grid grid-cols-1 sm:grid-cols-2
            lg:grid-cols-3 gap-5 lg:gap-6
          ">
            {list.map((r) => (
              <article
                key={r.id}
                id={`rep-${r.id}`}
                className={`${String(r.id) === sharedId ? 'ring-2 ring-[#c49a48] ' : ''}

                  group relative flex flex-col items-center
                  text-center rounded-2xl p-6
                  border border-[#e5d5b2]
                  bg-[#fffaf0] text-[#35101e]
                  shadow-md shadow-[#501126]/5
                  hover:border-[#b68a38]
                  hover:shadow-xl hover:shadow-[#501126]/10
                  hover:-translate-y-1
                  transition-all duration-300

                  dark:bg-[#2a0b16]
                  dark:border-[#6e3448]
                  dark:text-[#fff4df]
                  dark:shadow-black/20
                  dark:hover:border-[#d4af62]
                `}
              >

                {/* Decorative top line */}
                <div className="
                  absolute top-0 left-8 right-8
                  h-0.5 rounded-full
                  bg-[#c49a48]/50
                  group-hover:bg-[#b68a38]
                  dark:bg-[#c49a48]/40
                  dark:group-hover:bg-[#e4bf70]
                  transition-colors
                " />

                {/* Profile Photo */}
                <div className="
                  w-24 h-24 sm:w-28 sm:h-28
                  rounded-full overflow-hidden
                  flex items-center justify-center
                  border-[3px] border-[#c49a48]
                  bg-[#f1e4cf]
                  text-[#501126]
                  text-2xl sm:text-3xl font-extrabold
                  shadow-md shadow-[#501126]/10
                  dark:bg-[#501126]
                  dark:text-[#f0d18a]
                  dark:border-[#d4af62]
                ">
                  {r.photo_url ? (
                    <img
                      src={r.photo_url}
                      loading="lazy"
                      alt={r.name || 'Representative'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    ini(r.name || '')
                  )}
                </div>

                {/* Name */}
                <h3 className="
                  mt-5 text-xl sm:text-2xl
                  font-extrabold tracking-tight
                  break-words max-w-full
                  text-[#501126]
                  dark:text-[#ffe6ae]
                ">
                  {r.name}
                </h3>

                {/* Role */}
                {r.role && (
                  <p className="
                    mt-2 text-sm font-semibold
                    tracking-wide
                    text-[#704b57]
                    dark:text-[#e1c5ce]
                  ">
                    {r.role}
                  </p>
                )}

                {/* Mandap */}
                {r.mandap_name && (
                  <div className="
                    mt-3 inline-flex items-center gap-2
                    rounded-full px-3 py-2
                    border border-[#e5d5b2]
                    bg-[#f7eddb]
                    text-[#79551e] text-xs sm:text-sm
                    font-semibold
                    dark:bg-[#501126]/60
                    dark:border-[#6e3448]
                    dark:text-[#e3bd68]
                  ">
                    <span>🪔</span>
                    <span>{r.mandap_name}</span>
                  </div>
                )}

                {/* Contact */}
                {r.contact && (
                  <a
                    href={`tel:${r.contact}`}
                    className="
                      mt-4 inline-flex items-center gap-2
                      text-sm font-medium
                      text-[#79551e]
                      hover:text-[#501126]
                      transition-colors
                      dark:text-[#e3bd68]
                      dark:hover:text-[#fff0c9]
                    "
                  >
                    <span>☎</span>
                    <span>{r.contact}</span>
                  </a>
                )}

                {/* Divider */}
                <div className="
                  w-full h-px my-5
                  bg-[#e5d5b2]
                  dark:bg-[#6e3448]
                " />

                {/* Main Share Button */}
                <button
                  type="button"
                  onClick={() => shareProfile(r)}
                  className="
                    w-full rounded-xl px-4 py-3
                    bg-[#501126] text-[#fff4df]
                    border border-[#501126]
                    font-bold tracking-wide
                    shadow-sm
                    hover:bg-[#6b1935]
                    active:scale-[0.98]
                    transition-all duration-200

                    dark:bg-[#e4bf70]
                    dark:text-[#35101e]
                    dark:border-[#e4bf70]
                    dark:hover:bg-[#f1d79e]
                  "
                >
                  ↗ {bn ? 'প্রোফাইল শেয়ার করুন' : 'Share Profile'}
                </button>

                {/* Social Media Buttons */}
                <div className="mt-4 flex flex-wrap justify-center gap-2">

                  <button
                    type="button"
                    onClick={() => shareSocial(r, 'facebook')}
                    className="
                      rounded-lg px-3 py-2
                      text-xs font-semibold
                      border border-[#c49a48]/60
                      bg-[#f7eddb] text-[#501126]
                      hover:bg-[#501126] hover:text-white
                      transition-colors
                      dark:bg-transparent dark:text-[#f0d18a]
                      dark:hover:bg-[#e4bf70]
                      dark:hover:text-[#35101e]
                    "
                  >
                    Facebook
                  </button>

                  <button
                    type="button"
                    onClick={() => shareSocial(r, 'messenger')}
                    className="
                      rounded-lg px-3 py-2
                      text-xs font-semibold
                      border border-[#c49a48]/60
                      bg-[#f7eddb] text-[#501126]
                      hover:bg-[#501126] hover:text-white
                      transition-colors
                      dark:bg-transparent dark:text-[#f0d18a]
                      dark:hover:bg-[#e4bf70]
                      dark:hover:text-[#35101e]
                    "
                  >
                    Messenger
                  </button>

                  <button
                    type="button"
                    onClick={() => shareSocial(r, 'whatsapp')}
                    className="
                      rounded-lg px-3 py-2
                      text-xs font-semibold
                      border border-[#c49a48]/60
                      bg-[#f7eddb] text-[#501126]
                      hover:bg-[#501126] hover:text-white
                      transition-colors
                      dark:bg-transparent dark:text-[#f0d18a]
                      dark:hover:bg-[#e4bf70]
                      dark:hover:text-[#35101e]
                    "
                  >
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => shareSocial(r, 'telegram')}
                    className="
                      rounded-lg px-3 py-2
                      text-xs font-semibold
                      border border-[#c49a48]/60
                      bg-[#f7eddb] text-[#501126]
                      hover:bg-[#501126] hover:text-white
                      transition-colors
                      dark:bg-transparent dark:text-[#f0d18a]
                      dark:hover:bg-[#e4bf70]
                      dark:hover:text-[#35101e]
                    "
                  >
                    Telegram
                  </button>

                  <button
                    type="button"
                    onClick={() => copyLink(r)}
                    className="
                      rounded-lg px-3 py-2
                      text-xs font-semibold
                      border border-[#c49a48]/60
                      bg-[#f7eddb] text-[#501126]
                      hover:bg-[#501126] hover:text-white
                      transition-colors
                      dark:bg-transparent dark:text-[#f0d18a]
                      dark:hover:bg-[#e4bf70]
                      dark:hover:text-[#35101e]
                    "
                  >
                    {copied === r.id
                      ? '✓ Copied!'
                      : '🔗 Copy Link'}
                  </button>

                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty State */}
        {list && list.length === 0 && (
          <div className="
            rounded-2xl p-8 sm:p-12 text-center
            border border-[#e5d5b2]
            bg-[#fffaf0]
            dark:bg-[#2a0b16]
            dark:border-[#6e3448]
          ">
            <div className="text-4xl mb-4">🪔</div>

            <p className="
              text-base sm:text-lg font-semibold
              text-[#501126]
              dark:text-[#f0d18a]
            ">
              {bn
                ? 'প্রতিনিধিদের তথ্য শীঘ্রই যোগ করা হবে।'
                : 'Representative profiles will be added soon.'}
            </p>
          </div>
        )}

        {/* Footer Note */}
        <div className="
          mt-10 mb-8 text-center
          text-xs sm:text-sm
          text-[#795e65]
          dark:text-[#bda5ad]
        ">
          {bn
            ? 'চট্টগ্রাম পূজা ম্যাপ — পূজার তথ্য ও পরিচিতি একসঙ্গে'
            : 'Chattogram Puja Map — Puja information and community profiles in one place'}
        </div>

      </div>
    </div>
  )
}