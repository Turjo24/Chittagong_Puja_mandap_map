/*
  Tutorial page. Notun tutorial dite nicher TUTORIALS e ekta line add koro:
    { title: 'Title', url: 'https://youtu.be/VIDEO_ID' }
  (youtu.be, youtube.com/watch?v=, shorts, embed, shob link cholbe)
*/
const TUTORIALS = [
  { title: 'Mandap Add Using Pc ', url: 'https://youtu.be/QLNrr8tLP_E' },
  { title: 'Mandap Add Using Mobile', url: 'https://youtube.com/shorts/aT8VoRrJVfk?si=cvRAfjnUvp4s7WWt' }
]

// link theke video id ber kore
function ytId(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/)
    return m ? m[2] : null
  } catch {
    return null
  }
}

const CSS = `
.tu { --pk: #e8590c; box-sizing: border-box; display: block; width: 100%; max-width: 44rem; min-width: 0;
  flex: 1 1 100%; align-self: stretch; justify-self: stretch; grid-column: 1 / -1;
  margin-left: auto; margin-right: auto; padding: 24px 16px 48px; }
.tu *, .tu *::before, .tu *::after { box-sizing: border-box; }
.tu h2 { font-size: 1.75rem; font-weight: 700; line-height: 1.2; margin: 0 0 4px; }
.tu .tu-sub { font-size: .9rem; opacity: .7; margin: 0 0 18px; }
.tu-list { display: flex; flex-direction: column; gap: 16px; }
.tu-card {
  display: block; color: inherit; text-decoration: none; border-radius: 20px; overflow: hidden;
  border: 1px solid rgba(128,128,128,.25);
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  box-shadow: inset 4px 0 0 var(--pk);
  background: rgba(128,128,128,.06);
  background: color-mix(in srgb, currentColor 4%, transparent);
}
.tu-card:focus-visible { outline: 2px solid var(--pk); outline-offset: 2px; }
.tu-thumb { position: relative; aspect-ratio: 16 / 9; background: rgba(232,89,12,.12); margin-left: 4px; }
.tu-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tu-play {
  position: absolute; inset: 0; margin: auto; width: 56px; height: 56px; border-radius: 50%;
  display: grid; place-items: center; background: var(--pk); color: #fff; font-size: 1.2rem; padding-left: 4px;
}
.tu-title { margin: 0; padding: 14px 18px 16px; font-size: 1.02rem; font-weight: 600; line-height: 1.45; }
.tu-empty { opacity: .65; padding: 24px 0; text-align: center; }
`

export default function Tutorial() {
  return (
    <div className="tu">
      <style>{CSS}</style>
      <h2>Tutorial</h2>
      <p className="tu-sub">ভিডিও লিংকে প্রেস করলে ভিডিও ওপেন হবে</p>

      {!TUTORIALS.length && <p className="tu-empty">Tutorial shighroi ashche.</p>}

      <div className="tu-list">
        {TUTORIALS.map((t, i) => {
          const id = ytId(t.url)
          return (
            <a key={i} className="tu-card" href={t.url} target="_blank" rel="noopener noreferrer">
              {id && (
                <div className="tu-thumb">
                  <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
                  <span className="tu-play" aria-hidden="true">▶</span>
                </div>
              )}
              <p className="tu-title">{t.title}</p>
            </a>
          )
        })}
      </div>
    </div>
  )
}
