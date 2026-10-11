
import { useEffect, useState } from 'react'
import { sb } from './supabase'
import { toast } from './alerts'

const MODES = {
  cng: ['🛺', 'CNG', 'সিএনজি'],
  bus: ['🚌', 'Bus', 'বাস'],
  rickshaw: ['🚲', 'Rickshaw', 'রিকশা'],
  ride: ['🏍️', 'Pathao/Uber', 'পাঠাও/উবার'],
  other: ['🚶', 'Other', 'অন্যান্য'],
}

// বাংলা সংখ্যা ইংরেজি সংখ্যায় রূপান্তর
const toEnglishDigits = (value) =>
  String(value).replace(/[০-৯]/g, (d) =>
    '০১২৩৪৫৬৭৮৯'.indexOf(d)
  )

// ভাড়া ইনপুট যাচাই ও numeric conversion
const parseFare = (value) => {
  const normalized = toEnglishDigits(value).trim()

  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) {
    return null
  }

  const amount = Number(normalized)

  return Number.isFinite(amount) && amount >= 0
    ? amount
    : null
}

const hist = (r) =>
  (r.route_fares || [])
    .filter((f) => f.status === 'approved')
    .sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    )

export default function Routes({ lang }) {
  const bn = lang === 'bn'

  const [routes, setRoutes] = useState([])
  const [ms, setMs] = useState([])
  const [open, setOpen] = useState(null)
  const [rep, setRep] = useState(null)
  const [q, setQ] = useState('')
  const [dest, setDest] = useState('')

  const [f, setF] = useState({
    fare: '',
    by: '',
    email: '',
  })

  const [s, setS] = useState({
    from: '',
    mandap: '',
    to: '',
    mode: 'cng',
    fare: '',
    note: '',
    by: '',
    email: '',
  })

  const load = () =>
    sb
      .from('routes')
      .select(
        'id,from_place,to_place,mandap_id,mode,note,route_fares(id,fare,created_at,status)'
      )
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast('Error', error.message)
          return
        }

        setRoutes(data || [])
      })

  useEffect(() => {
    load()

    sb
      .from('mandaps')
      .select('id,name,name_bn')
      .eq('status', 'approved')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          toast('Error', error.message)
          return
        }

        setMs(data || [])
      })
  }, [])

  const nm = (m) =>
    bn && m.name_bn ? m.name_bn : m.name

  const ok = () =>
    toast(
      'জমা হয়েছে! / Submitted!',
      'অ্যাডমিন যাচাই করে অনুমোদন করবেন / Admin will review it'
    )

  const list = routes.filter(
    (r) =>
      (!dest || r.mandap_id == dest) &&
      (!q ||
        (r.from_place || '')
          .toLowerCase()
          .includes(q.toLowerCase()))
  )

  const dfmt = (d) =>
    new Date(d).toLocaleDateString(
      bn ? 'bn-BD' : 'en-GB',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    )

  // নতুন ভাড়া রিপোর্ট
  async function reportFare(e, r) {
    e.preventDefault()

    const fare = parseFare(f.fare)

    if (fare === null) {
      toast(
        'Invalid Fare / ভুল ভাড়া',
        'সঠিক ভাড়া লিখুন / Enter a valid fare'
      )
      return
    }

    const { error } = await sb.from('route_fares').insert({
      route_id: r.id,
      fare,
      suggested_by: f.by.trim(),
      suggester_email: f.email.trim(),
    })

    if (error) {
      toast('Error', error.message)
      return
    }

    setF({
      fare: '',
      by: '',
      email: '',
    })

    setRep(null)
    ok()
    load()
  }

  // নতুন রুট জমা
  async function suggest(e) {
    e.preventDefault()

    const fare = parseFare(s.fare)

    if (fare === null) {
      toast(
        'Invalid Fare / ভুল ভাড়া',
        'সঠিক ভাড়া লিখুন / Enter a valid fare'
      )
      return
    }

    const m = ms.find((x) => x.id == s.mandap)

    const { error } = await sb.rpc('suggest_route', {
      p_from: s.from.trim(),
      p_to: s.to.trim() || m?.name || '',
      p_mandap: s.mandap ? +s.mandap : null,
      p_mode: s.mode,
      p_fare: fare,
      p_note: s.note.trim(),
      p_by: s.by.trim(),
      p_email: s.email.trim(),
    })

    if (error) {
      toast('Error', error.message)
      return
    }

    setS({
      from: '',
      mandap: '',
      to: '',
      mode: 'cng',
      fare: '',
      note: '',
      by: '',
      email: '',
    })

    ok()
  }

  const set = (k) => (e) =>
    setS((prev) => ({
      ...prev,
      [k]: e.target.value,
    }))

  // বাংলা ও ইংরেজি সংখ্যা গ্রহণকারী ভাড়া ইনপুট
  const fareInput = (value, onChange) => (
    <input
      required
      type="text"
      inputMode="decimal"
      placeholder="ভাড়া (টাকা) / Fare (BDT)"
      value={value}
      onChange={(e) =>
        onChange(
          toEnglishDigits(e.target.value).replace(
            /[^0-9.]/g,
            ''
          )
        )
      }
    />
  )

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div className="shero">
          <h2 className="title">
            মণ্ডপে যেতে কত খরচ? / Getting to the Mandaps
          </h2>

          <p className="muted">
            কোথা থেকে কোথায়, কীভাবে যাবেন ও আনুমানিক ভাড়া
            / Starting point, transport and estimated fare
          </p>
        </div>

        {/* Search and filter */}
        <div className="ctl" style={{ marginBottom: 8 }}>
          <input
            placeholder="কোথা থেকে / From (e.g. Oxygen)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            value={dest}
            onChange={(e) => setDest(e.target.value)}
          >
            <option value="">
              সব মণ্ডপ / All Mandaps
            </option>

            {ms.map((m) => (
              <option key={m.id} value={m.id}>
                {nm(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Route list */}
        {!list.length && (
          <p className="muted">
            এখনো কোনো রুট নেই। আপনিই যোগ করুন!
            / No routes yet. Add one below!
          </p>
        )}

        {list.map((r) => {
          const h = hist(r)
          const [ic, en, b] =
            MODES[r.mode] || MODES.other

          return (
            <div className="rc" key={r.id}>
              <div className="top2">
                <div>
                  <b className="rt">
                    {r.from_place} → {r.to_place}
                  </b>

                  <br />

                  <span className="muted">
                    {ic} {b} / {en}
                    {r.note && ` · ${r.note}`}
                  </span>
                </div>

                <div className="fare">
                  {h[0] ? `৳${h[0].fare}` : '—'}
                </div>
              </div>

              {/* Actions */}
              <div className="acts" style={{ marginTop: 8 }}>
                <button
                  className="btn"
                  onClick={() =>
                    setOpen(open === r.id ? null : r.id)
                  }
                >
                  ভাড়ার ইতিহাস / Fare History ({h.length})
                </button>

                <button
                  className="btn"
                  onClick={() =>
                    setRep(rep === r.id ? null : r.id)
                  }
                >
                  নতুন ভাড়া জানান / Report New Fare
                </button>
              </div>

              {/* Fare history */}
              {open === r.id && (
                <div className="hist">
                  {!h.length && (
                    <p className="muted">
                      কোনো ভাড়ার ইতিহাস নেই / No fare history
                    </p>
                  )}

                  {h.map((x, i) => {
                    const d = h[i + 1]
                      ? x.fare - h[i + 1].fare
                      : 0

                    return (
                      <div key={x.id}>
                        <span>{dfmt(x.created_at)}</span>

                        <b>
                          ৳{x.fare}{' '}

                          {d > 0 && (
                            <span className="up">
                              ▲{d}
                            </span>
                          )}

                          {d < 0 && (
                            <span className="down">
                              ▼{-d}
                            </span>
                          )}
                        </b>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Report fare form */}
              {rep === r.id && (
                <form
                  onSubmit={(e) => reportFare(e, r)}
                  style={{ marginTop: 10 }}
                >
                  {fareInput(f.fare, (value) =>
                    setF((prev) => ({
                      ...prev,
                      fare: value,
                    }))
                  )}

                  <input
                    required
                    placeholder="আপনার নাম / Your Name"
                    value={f.by}
                    onChange={(e) =>
                      setF((prev) => ({
                        ...prev,
                        by: e.target.value,
                      }))
                    }
                  />

                  <input
                    required
                    type="email"
                    placeholder="ইমেইল (গোপন) / Email (Private)"
                    value={f.email}
                    onChange={(e) =>
                      setF((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />

                  <button className="btn pri">
                    ভাড়া জমা দিন / Submit Fare
                  </button>
                </form>
              )}
            </div>
          )
        })}

        {/* Suggest route */}
        <div className="sec">
          নতুন রুট যোগ করুন / Suggest a Route
        </div>

        <form onSubmit={suggest} className="rc">
          <input
            required
            placeholder="কোথা থেকে / From"
            value={s.from}
            onChange={set('from')}
          />

          <select
            value={s.mandap}
            onChange={set('mandap')}
          >
            <option value="">
              গন্তব্য মণ্ডপ / To Mandap (Optional)
            </option>

            {ms.map((m) => (
              <option key={m.id} value={m.id}>
                {nm(m)}
              </option>
            ))}
          </select>

          {!s.mandap && (
            <input
              required
              placeholder="গন্তব্যের নাম / Destination"
              value={s.to}
              onChange={set('to')}
            />
          )}

          <select
            value={s.mode}
            onChange={set('mode')}
          >
            {Object.entries(MODES).map(([k, v]) => (
              <option key={k} value={k}>
                {v[0]} {v[2]} / {v[1]}
              </option>
            ))}
          </select>

          {fareInput(s.fare, (value) =>
            setS((prev) => ({
              ...prev,
              fare: value,
            }))
          )}

          <input
            placeholder="নোট (ঐচ্ছিক) / Note (Optional)"
            value={s.note}
            onChange={set('note')}
          />

          <input
            required
            placeholder="আপনার নাম / Your Name"
            value={s.by}
            onChange={set('by')}
          />

          <input
            required
            type="email"
            placeholder="ইমেইল (গোপন) / Email (Private)"
            value={s.email}
            onChange={set('email')}
          />

          <button className="btn pri">
            রুট জমা দিন / Submit Route
          </button>
        </form>
      </div>
    </div>
  )
}
