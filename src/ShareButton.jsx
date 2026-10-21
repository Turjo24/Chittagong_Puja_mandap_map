import { toast } from './alerts'

// Mandap card/popup er bhitore boshao: <ShareButton m={selectedMandap} />
export default function ShareButton({ m }) {
  if (!m) return null
  const url = `${window.location.origin}/m/${m.id}`   // # nai
  const text = `${m.name} — Puja Map Chattogram`

  const fb = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,width=600,height=500')

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast('Copied!', url) }
    catch { prompt('Link copy koro:', url) }
  }
  const native = () => navigator.share?.({ title: text, url }).catch(() => {})

  return (
    <div className="acts" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button className="btn pri" onClick={fb}>f Facebook e share</button>
      <button className="btn" onClick={copy}>🔗 Copy link</button>
      {navigator.share && <button className="btn" onClick={native}>📤 Share</button>}
    </div>
  )
}
