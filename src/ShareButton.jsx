import { toast } from './alerts'

export default function ShareButton({ m, kind = 'm', title }) {
  if (!m) return null

  const origin = window.location.origin
  
  // ১. ক্লিন URL (ইউজারদের দেখার জন্য আসল লিংক)
  let cleanUrl = `${origin}/?m=${m.id || m.mandap_id}`
  if (kind === 'heritage') cleanUrl = `${origin}/heritage?docId=${m.id}`
  else if (kind === 'b') cleanUrl = `${origin}/blog?id=${m.id}`

  // ২. ডায়নামিক কার্ডের জন্য API URL (যা ফেসবুক/হোয়াটসঅ্যাপে প্রিভিউ বানাবে)
  const placeName = title || m.mandaps?.name_bn || m.mandaps?.name || m.name_bn || m.name || 'Mandap'
  const imageUrl = m.thumbnail_post || m.pandal_architect_photo || m.entry_point_photo || m.exit_point_photo || m.url || `${origin}/pntro.png`
  
  const type = kind === 'heritage' ? 'heritage' : kind === 'b' ? 'blog' : 'm'
  const docId = m.id || m.mandap_id
  
  // এই API লিংকটাই মূলত নিউজ কার্ডের মতো প্রিভিউ দেখাবে
  const apiUrl = `${origin}/api/share?type=${type}&id=${docId}&title=${encodeURIComponent(placeName)}&img=${encodeURIComponent(imageUrl)}`
  
  const text = `${placeName} — Chattogram Puja Mandap Guide`

  // ৩. শেয়ার ফাংশনসমূহ
  const fb = () => {
    // ফেসবুকে API লিংক পাঠাবো, ফেসবুক নিজে থেকে ছবি ও টাইটেল নিয়ে কার্ড বানাবে
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(apiUrl)}`,
      '_blank',
      'noopener,width=600,height=500'
    )
  }

  const wa = () => {
    // হোয়াটসঅ্যাপে শুধু টাইটেল আর API লিংক পাঠাবো। 
    // হোয়াটসঅ্যাপ নিজে লিংক রিড করে ছবির কার্ড বানিয়ে নেবে! আলাদা করে ছবির লিংক লেখার দরকার নেই।
    const waShareText = `${text}\n\n${apiUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`, '_blank', 'noopener')
  }

const copy = async () => {
    try {
      // এখানে cleanUrl এর বদলে apiUrl করে দিন
      const copyText = `${text}\n\n🔗 বিস্তারিত তথ্য ও ইতিহাস: ${apiUrl}`
      await navigator.clipboard.writeText(copyText)
      toast('Copied!', 'লিংক কপি হয়েছে!')
    } catch {
      // এখানেও apiUrl করে দিন
      prompt('Link copy koro:', apiUrl)
    }
  }

  const native = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: text,
        // এখানেও cleanUrl এর বদলে apiUrl করে দিন
        url: apiUrl
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