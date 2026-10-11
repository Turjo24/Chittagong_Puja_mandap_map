import { useEffect, useMemo, useState } from 'react'
import { sb } from './supabase'
import { DAYS, dayLabel } from './parikromaUtil'

const CACHE_KEY = 'puja_parikromas_cache_v1'
const CACHE_TIME = 5 * 60 * 1000

function readCache() {
  try {
    const cached = JSON.parse(
      localStorage.getItem(CACHE_KEY) || 'null'
    )

    if (
      cached &&
      Array.isArray(cached.data) &&
      Date.now() - cached.time < CACHE_TIME
    ) {
      return cached.data
    }
  } catch {}

  return null
}

function saveCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        time: Date.now(),
      })
    )
  } catch {}
}

export default function Parikroma() {
  const [list, setList] = useState(() => readCache() || [])
  const [day, setDay] = useState('all')
  const [loading, setLoading] = useState(() => !readCache())
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true

    async function loadRoutes() {
      try {
        const { data, error } = await sb
          .from('parikromas')
          .select(
            'id, title, days, time_note, sections, sort, created_at'
          )
          .order('sort', { ascending: true })
          .order('created_at', { ascending: true })

        if (error) throw error
        if (!active) return

        const routes = data || []

        setList(routes)
        saveCache(routes)
        setError(false)
      } catch (err) {
        console.error('Parikroma load error:', err)

        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRoutes()

    return () => {
      active = false
    }
  }, [retry])

  const shown = useMemo(() => {
    return list
      .map((r, i) => ({
        r,
        no: i + 1,
      }))
      .filter(({ r }) =>
        day === 'all' ||
        !(r.days || []).length ||
        r.days.some(
          d => String(d).toLowerCase() === day
        )
      )
  }, [list, day])

  return (
    <section className="mx-auto box-border block w-full min-w-0 max-w-3xl px-4 pb-12 pt-6 sm:px-6">

      {/* Header */}
      <header className="mb-5">
        <h2 className="mb-1 text-2xl font-bold leading-tight sm:text-3xl">
          Puja Porikroma
        </h2>

        <p className="text-sm opacity-70 sm:text-base">
          Kon din kon route e mandap ghurbe, din select kore dekho.
        </p>
      </header>

      {/* Day Selector */}
      <div
        className="mb-5 flex gap-2 overflow-x-auto pb-2"
        role="group"
        aria-label="Din select koro"
      >
        {[['all', 'Sob'], ...DAYS].map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={day === key}
            onClick={() => setDay(key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${
              day === key
                ? 'border-orange-600 bg-orange-600 font-semibold text-white'
                : 'border-current/20 bg-transparent hover:bg-orange-500/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && list.length === 0 && (
        <div className="flex items-center justify-center gap-3 py-10 text-sm opacity-70">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current/20 border-t-orange-600" />
          Route load hocche...
        </div>
      )}

      {/* Error and Retry */}
      {error && list.length === 0 && (
        <div className="rounded-2xl border border-red-500/20 p-5 text-center">
          <p className="mb-3 text-sm text-red-500">
            Route load kora jayni. Internet connection check koro.
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true)
              setError(false)
              setRetry(v => v + 1)
            }}
            className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Abar try koro
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && shown.length === 0 && (
        <p className="py-10 text-center text-sm opacity-65">
          Ei dine kono porikroma nai. Onno din select koro.
        </p>
      )}

      {/* Route List */}
      <div className="flex min-w-0 flex-col gap-4">
        {shown.map(({ r, no }) => (
          <article
            key={r.id}
            className="min-w-0 overflow-hidden rounded-2xl border border-current/10 bg-current/[0.04] p-4 shadow-sm sm:p-5"
            style={{
              boxShadow: 'inset 4px 0 0 #e8590c',
            }}
          >

            {/* Route Title and Serial */}
            <div className="flex min-w-0 items-start gap-3">

              {/* Fixed circular route number */}
              <span className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-orange-600 p-0 text-sm font-bold leading-none text-white">
                {no}
              </span>

              <h3 className="min-w-0 break-words pt-1 text-base font-semibold leading-relaxed sm:text-lg">
                {r.title}
              </h3>
            </div>

            {/* Days and Time */}
            <div className="my-3 flex flex-wrap gap-2">
              {(r.days || []).length > 0 ? (
                r.days.map(k => (
                  <span
                    key={k}
                    className="rounded-full bg-orange-500/10 px-3 py-1 text-xs"
                  >
                    {dayLabel(k)}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs">
                  Protidin
                </span>
              )}

              {r.time_note && (
                <span className="rounded-full bg-current/[0.07] px-3 py-1 text-xs opacity-80">
                  🕘 {r.time_note}
                </span>
              )}
            </div>

            {/* Route Sections */}
            <div className="flex min-w-0 flex-col gap-4">
              {(r.sections || []).map((section, i) => {
                const stops = section.stops || []

                return (
                  <div key={i} className="min-w-0">

                    {/* Section Heading */}
                    {section.heading && (
                      <h4 className="mb-3 flex flex-wrap items-baseline gap-2 text-sm font-semibold">
                        {section.heading}

                        <span className="text-xs font-normal opacity-60">
                          {stops.length} ta jaiga
                        </span>
                      </h4>
                    )}

                    {/* Mandap Stops */}
                    <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-3 p-0">
                      {stops.map((stop, j) => (
                        <li
                          key={j}
                          className="inline-flex min-w-0 max-w-full items-center gap-2"
                        >

                          {/* Stop Name and Fixed Circular Number */}
                          <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-orange-600/25 bg-orange-500/10 py-1.5 pl-1.5 pr-3 text-sm leading-relaxed">

                            {/* Fixed circular stop number */}
                            <span className="flex h-6 w-6 min-h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 p-0 text-xs font-bold leading-none text-white">
                              {j + 1}
                            </span>

                            <span className="min-w-0 break-words">
                              {stop}
                            </span>
                          </span>

                          {/* Arrow */}
                          {j < stops.length - 1 && (
                            <span className="shrink-0 text-sm text-orange-600/70">
                              →
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      {/* Background Refresh Indicator */}
      {loading && list.length > 0 && (
        <p className="pt-3 text-center text-xs opacity-50">
          Latest route update check hocche...
        </p>
      )}

    </section>
  )
}
