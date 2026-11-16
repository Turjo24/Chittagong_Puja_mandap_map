import { toast } from './alerts'

export default function ShareButton({ m, kind = 'm', title }) {
  if (!m) return null

  // ১. ডায়নামিক URL তৈরি (হেরিটেজ, ব্লগ ও সাধারণ মণ্ডপের জন্য)
  let url = `${window.location.origin}/?m=${m.id || m.mandap_id}`

  if (kind === 'heritage') {
    url = `${window.location.origin}/#/heritage?docId=${m.id}`
  } else if (kind === 'b') {
    url = `${window.location.origin}/#/blog?id=${m.id}`
  }

  // ২. মণ্ডপের নাম ও ছবির URL বের করা
  const placeName = title || m.mandaps?.name_bn || m.mandaps?.name || m.name_bn || m.name || 'Mandap'
  const imageUrl = m.pandal_architect_photo || m.entry_point_photo || m.exit_point_photo || m.url || ''
  
  const text = `${placeName} — Chattogram Puja Mandap Guide`

  // ৩. সোশ্যাল শেয়ারের জন্য কাস্টম টেক্সট (ছবি সহ)
  const shareMessage = imageUrl 
    ? `${text}\n\n📷 ছবি দেখুন: ${imageUrl}\n\n🔗 বিস্তারিত তথ্য ও ইতিহাস: ${url}`
    : `${text}\n\n🔗 বিস্তারিত তথ্য ও ইতিহাস: ${url}`

  const fb = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,width=600,height=500'
    )
  }

  const wa = () => {
    const waShareText = encodeURIComponent(shareMessage)
    window.open(`https://api.whatsapp.com/send?text=${waShareText}`, '_blank', 'noopener')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      toast('Copied!', 'ছবি ও লিংক কপি হয়েছে!')
    } catch {
      prompt('Link copy koro:', shareMessage)
    }
  }

  const native = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: text,
        text: shareMessage,
        url: url
      }).catch(() => {})
    }
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