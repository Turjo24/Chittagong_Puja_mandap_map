import { toast } from './alerts'

export default function ShareButton({ m, kind = 'm', title }) {
  if (!m) return null

  // slug বাদ দিয়ে সরাসরি id ব্যবহার করা হয়েছে
  const url = kind === 'b'
    ? `${window.location.origin}/#/blog?id=${m.id}`
    : `${window.location.origin}/?m=${m.id}`

  const placeName = title || m.name_bn || m.name || 'Mandap'
  const text = `${placeName} — Chattogram Puja Mandap Guide`

  const fb = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,width=600,height=500'
    )
  }

  const wa = () => {
    const waShareText = encodeURIComponent(`${text}\n\n${url}`)
    window.open(`https://api.whatsapp.com/send?text=${waShareText}`, '_blank', 'noopener')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Copied!', url)
    } catch {
      prompt('Link copy koro:', url)
    }
  }

  const native = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: text, url }).catch(() => {})
    }
  }

  return (
    <div className="acts" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button className="btn pri" onClick={fb}>f Facebook e share</button>
      <button className="btn" onClick={wa}>WhatsApp</button>
      <button className="btn" onClick={copy}>🔗 Copy link</button>
      {typeof navigator !== 'undefined' && navigator.share && (
        <button className="btn" onClick={native}>📤 Share</button>
      )}
    </div>
  )
}