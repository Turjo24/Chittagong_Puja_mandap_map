import { useEffect, useState } from 'react'
import { sb } from './supabase'

export default function Bell({ lang, t }) {
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)

  const [seen, setSeen] = useState(() => {
    if (localStorage.getItem('seen') === null) {
      localStorage.setItem('seen', Date.now())
    }

    return +localStorage.getItem('seen')
  })

  const load = () =>
    sb
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => setList(data || []))

  useEffect(() => {
    load()

    const i = setInterval(load, 60000)
    addEventListener('notice-new', load)

    return () => {
      clearInterval(i)
      removeEventListener('notice-new', load)
    }
  }, [])

  const isNew = (n) => new Date(n.created_at).getTime() > seen
  const unread = list.filter(isNew).length

  const toggle = () => {
    if (open) {
      const now = Date.now()
      localStorage.setItem('seen', now)
      setSeen(now)
    } else {
      load()
    }

    setOpen(!open)
  }

  const close = () => setOpen(false)

  const fmt = (d) =>
    new Date(d).toLocaleString(
      lang === 'bn' ? 'bn-BD' : 'en-GB',
      {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }
    )

  return (
    <div className="bell">
      <button
        type="button"
        className="btn"
        onClick={toggle}
        aria-label={t.notices}
      >
        🔔{unread > 0 && <em>{unread}</em>}
      </button>

      {open && (
        <div className="dd">
          <div
            className="flex items-center justify-between gap-3"
            style={{ marginBottom: 12 }}
          >
            <h4 style={{ margin: 0 }}>{t.notices}</h4>

            <button
              type="button"
              onClick={close}
              aria-label="Close notifications"
              title="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-current transition hover:bg-white/15"
              style={{
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {!list.length && (
            <p className="muted">{t.nonotice}</p>
          )}

          {list.map((n) => (
            <div
              key={n.id}
              className={'nt' + (isNew(n) ? ' new' : '')}
            >
              <b>{n.title}</b>

              {n.body && <p>{n.body}</p>}

              <small>{fmt(n.created_at)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
