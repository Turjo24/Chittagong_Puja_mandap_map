
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

export default function Sponsors({ lang }) {
  const bn = lang === 'bn'
  const [list, setList] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    let active = true

    sb.from('sponsors')
      .select('*')
      .order('sort')
      .order('created_at')
      .then(({ data, error }) => {
        if (!active) return

        if (error) {
          console.error('Failed to load sponsors:', error)
          setList([])
          return
        }

        setList(data || [])
      })

    return () => {
      active = false
    }
  }, [])

  const sharedId = new URLSearchParams(
    window.location.hash.split('?')[1] || ''
  ).get('id')

  useEffect(() => {
    if (!list || !sharedId) return

    document
      .getElementById(`sponsor-${sharedId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [list, sharedId])

  const getShareUrl = (s) => {
    const base = window.location.href.split('#')[0]
    return `${base}#/sponsors?id=${encodeURIComponent(s.id)}`
  }

  const copyLink = async (s) => {
    const url = getShareUrl(s)

    try {
      await navigator.clipboard.writeText(url)
      setCopied(s.id)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      window.prompt(
        bn ? 'লিংকটি কপি করুন:' : 'Copy this URL:',
        url
      )
    }
  }

  return (
    <div className="page">
      <div className="wrap">
        <a
          href="#/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#79551e] transition hover:text-[#501126] dark:text-amber-300 dark:hover:text-amber-200"
        >
          <span aria-hidden="true">←</span>
          {bn ? 'ফিরে যান' : 'Back to map'}
        </a>

        {/* Premium hero */}
        <header className="relative overflow-hidden py-8 text-center sm:py-10">
          <div className="pointer-events-none absolute inset-x-0 top-8 -z-10 mx-auto h-40 max-w-md rounded-full bg-[#c49a48]/10 blur-3xl" />

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#c49a48]/60 bg-[#501126] text-[#e4bf70] shadow-lg shadow-[#501126]/20">
            <Flame size={30} />
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#a47b35] sm:text-xs">
            CHATTOGRAM PUJA MAP
          </p>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#501126] sm:text-3xl dark:text-amber-300">
            {bn ? 'আমাদের স্পনসর' : 'Our Sponsors'}
          </h2>

          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-[#c49a48] via-[#f0d18a] to-[#c49a48]" />

          <p className="mx-auto mt-3 max-w-xl px-3 text-sm leading-6 text-[#654b53] sm:text-base dark:text-[#d8c5cb]">
            {bn
              ? 'যাঁদের সহযোগিতায় এই পূজা মানচিত্র সম্ভব হয়েছে'
              : 'Celebrating the brands and people behind our Puja guide'}
          </p>
        </header>

        {/* Sponsor tiers */}
        {TIERS.map(([tier, en, bengali]) => {
          const items = (list || []).filter(
            (s) => s.tier === tier
          )

          if (!items.length) return null

          const isTitle = tier === 'title'

          return (
            <section key={tier} className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-7 w-1 rounded-full bg-[#c49a48]" />

                <h3 className="text-lg font-extrabold tracking-tight text-[#501126] sm:text-xl dark:text-amber-300">
                  {bn ? bengali : en}
                </h3>

                <span className="h-px flex-1 bg-gradient-to-r from-[#c49a48]/50 to-transparent" />
              </div>

              <div
                className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${
                  isTitle
                    ? 'lg:grid-cols-2'
                    : 'lg:grid-cols-3'
                }`}
              >
                {items.map((s) => (
                  <article
                    key={s.id}
                    id={`sponsor-${s.id}`}
                    className={`
                      group relative flex h-full flex-col items-center
                      overflow-hidden rounded-3xl border p-6 text-center
                      transition-all duration-300
                      hover:-translate-y-1 hover:shadow-xl
                      ${
                        String(s.id) === sharedId
                          ? 'border-[#c49a48] ring-2 ring-[#c49a48]/50'
                          : 'border-[#e5d5b2] hover:border-[#c49a48]'
                      }
                      bg-gradient-to-b from-white via-[#fffaf0] to-[#f8efdf]
                      shadow-md shadow-[#501126]/5
                      dark:border-[#6e3448]
                      dark:from-[#35101e] dark:via-[#2a0b16] dark:to-[#210711]
                      dark:shadow-black/20 dark:hover:border-[#d4af62]
                    `}
                  >
                    <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#c49a48] to-transparent" />

                    {isTitle && (
                      <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c49a48]/50 bg-[#f1e4cf] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#79551e] dark:bg-[#501126] dark:text-amber-200">
                        <span>✦</span>
                        {bn ? 'প্রধান স্পনসর' : 'TITLE SPONSOR'}
                        <span>✦</span>
                      </span>
                    )}

                    {/* Large circular sponsor logo */}
                    <a
                      href={s.link || undefined}
                      target={s.link ? '_blank' : undefined}
                      rel={s.link ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (!s.link) e.preventDefault()
                      }}
                      aria-label={s.name}
                      className="mb-5 block rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#c49a48]/40"
                    >
                      <div
                        className={`
                          relative flex items-center justify-center
                          rounded-full border-2 border-[#c49a48]/70
                          bg-white p-2
                          shadow-[0_8px_30px_rgba(80,17,38,0.12)]
                          transition duration-300
                          group-hover:scale-105 group-hover:border-[#c49a48]
                          ${
                            isTitle
                              ? 'h-40 w-40 sm:h-44 sm:w-44'
                              : 'h-36 w-36 sm:h-40 sm:w-40'
                          }
                        `}
                      >
                        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#f8f1e5] dark:bg-[#fffaf0]">
                          {s.logo_url ? (
                            <img
                              src={s.logo_url}
                              alt={`${s.name} logo`}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-[#501126]">
                              <Flame size={42} />
                              <span className="max-w-[110px] px-2 text-center text-xs font-bold">
                                {s.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </a>

                    {/* Sponsor name and tagline */}
                    <div className="flex w-full flex-1 flex-col items-center">
                      <h4
                        className={`
                          max-w-full break-words font-black leading-snug
                          tracking-tight text-[#501126]
                          dark:text-[#ffe6ae]
                          ${
                            isTitle
                              ? 'text-xl sm:text-2xl'
                              : 'text-lg sm:text-xl'
                          }
                        `}
                      >
                        {s.name}
                      </h4>

                      {s.tagline && (
                        <p className="mt-2 max-w-sm break-words text-sm leading-6 text-[#704b57] dark:text-[#e1c5ce]">
                          {s.tagline}
                        </p>
                      )}

                      <div className="mb-5 mt-4 h-px w-10 bg-[#c49a48]/70" />
                    </div>

                    {/* Single Copy URL button */}
                    <button
                      type="button"
                      onClick={() => copyLink(s)}
                      className="
                        mt-auto inline-flex min-h-11 w-full items-center
                        justify-center gap-2 rounded-xl
                        border border-[#c49a48]/60
                        bg-[#501126] px-4 py-3
                        text-sm font-bold text-white
                        shadow-sm shadow-[#501126]/15
                        transition duration-200
                        hover:border-[#c49a48] hover:bg-[#6b1935]
                        active:scale-[0.98]
                        focus-visible:outline-none
                        focus-visible:ring-2 focus-visible:ring-[#c49a48]
                        focus-visible:ring-offset-2
                        dark:bg-[#e4bf70] dark:text-[#35101e]
                        dark:hover:bg-[#f1d79e]
                      "
                    >
                      {copied === s.id ? (
                        <>
                          <span aria-hidden="true">✓</span>
                          {bn ? 'লিংক কপি হয়েছে' : 'URL Copied'}
                        </>
                      ) : (
                        <>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <rect
                              x="8"
                              y="8"
                              width="12"
                              height="12"
                              rx="2"
                            />
                            <path
                              d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
                            />
                          </svg>
                          {bn ? 'কপি URL' : 'Copy URL'}
                        </>
                      )}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )
        })}

        {/* Loading and empty states */}
        {!list ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c49a48]/30 border-t-[#501126]" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#795e65] dark:text-[#bda5ad]">
            {bn
              ? 'শীঘ্রই স্পনসরদের নাম এখানে দেখা যাবে।'
              : 'Sponsors will appear here soon.'}
          </p>
        ) : null}

        {/* Become a sponsor */}
        <section className="relative mb-8 mt-14 overflow-hidden rounded-3xl border border-[#c49a48]/50 bg-gradient-to-br from-[#501126] via-[#3b0c1d] to-[#240711] px-6 py-10 text-center shadow-xl shadow-[#501126]/10 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#c49a48]/10 blur-3xl" />

          <div className="relative">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#c49a48]/50 bg-white/5 text-2xl text-amber-300">
              ✦
            </div>

            <h3 className="text-xl font-black tracking-tight text-amber-300 sm:text-2xl">
              {bn ? 'আপনিও স্পনসর হতে চান?' : 'Become a Sponsor'}
            </h3>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#e8d6dc] sm:text-base">
              {bn
                ? 'হাজার হাজার পূজা-প্রেমী মানুষের কাছে আপনার ব্র্যান্ড পৌঁছে দিন।'
                : 'Showcase your brand to Puja lovers across Chattogram.'}
            </p>

            <a
              href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
                'Sponsorship - Chattogram Puja Map'
              )}`}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-300 px-7 py-3 font-extrabold text-[#501126] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-amber-200 active:scale-[0.98]"
            >
              <span aria-hidden="true">✉</span>
              {bn ? 'যোগাযোগ করুন' : 'Contact for Sponsorship'}
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
