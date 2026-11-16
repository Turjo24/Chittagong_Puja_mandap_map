import { toast } from './alerts'

// Share link GULO SOB SOMOY server-rendered path hobe (/m, /b, /h) — jate Facebook/WhatsApp/Messenger
// crawler og:image + title pay. "/?m=.." ba "#/..." link e per-page thumbnail kokhono ashe na.
export default function ShareButton({ m, kind = 'm', title }) {
  if (!m) return null

  const origin = window.location.origin
  let url
  if (kind === 'heritage') url = `${origin}/h/${m.id}`
  else if (kind === 'b') url = `${origin}/b/${encodeURIComponent(m.slug || m.id)}`
  else url = `${origin}/m/${encodeURIComponent(m.slug || m.id || m.mandap_id)}`

  const placeName = title || m.mandaps?.name_bn || m.mandaps?.name || m.name_bn || m.name || 'Mandap'
  const text = `${placeName} — Chattogram Puja Mandap Guide`

  // Message e SHUDHU ekta link rakho (page er link). Image er link dile WhatsApp oi image link tai preview kore.
  const shareMessage = `${text}\n${url}`

  const fb = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,width=600,height=500'
    )
  }

  const wa = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Copied!', 'লিংক কপি হয়েছে!')
    } catch {
      prompt('Link copy koro:', url)
    }
  }

  const native = () => {
    if (navigator.share) navigator.share({ title: text, url }).catch(() => {})
  }

  return (
    <div className="acts" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" className="btn pri" onClick={fb}>f Facebook e share</button>
      <button type="button" className="btn" onClick={wa}>WhatsApp</button>
      <button type="button" className="btn" onClick={copy}>🔗 Copy link</button>
      {typeof navigator !== 'undefined' && navigator.share && (
        <button type="button" className="btn" onClick={native}>📤 Share</button>
      )}
    </div>
  )
}