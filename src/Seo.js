// Route onujayi title / description / canonical / OpenGraph / JSON-LD set kore.
// Googlebot JS render kore, tai SPA te eta kaj kore. (Facebook er jonno tomar /api/share ager moto thakbe.)
const SITE = { bn: 'চট্টগ্রাম পূজা মণ্ডপ ম্যাপ', en: 'Chattogram Puja Mandap Map' }

const PAGES = {
  '/': [['মণ্ডপ ম্যাপ ও কাছের পূজা', 'Puja Mandap Map & Nearby Pujas'], ['চট্টগ্রামের দুর্গাপূজা মণ্ডপগুলো মানচিত্রে দেখুন, ছবি দেখুন, কাছের মণ্ডপ খুঁজুন।', 'Find Durga Puja mandaps in Chattogram on a map, see photos and discover the nearest pujas.']],
  '/heritage': [['পূজার হেরিটেজ ও ইতিহাস', 'Puja Heritage & History'], ['চট্টগ্রামের মণ্ডপগুলোর বছরভিত্তিক ইতিহাস, স্থপতি, প্রতিমাশিল্পী ও থিম।', 'Year-by-year history, architects, artists and themes of Chattogram puja mandaps.']],
  '/routes': [['যাতায়াত ও ভাড়া', 'Routes & Fare'], ['মণ্ডপ ঘুরে দেখার রুট ও আনুমানিক ভাড়া।', 'Routes and approximate fares for visiting puja mandaps.']],
  '/schedule': [['পূজার তিথি সূচি', 'Puja Schedule (Tithi)'], ['সপ্তমী, অষ্টমী, নবমী, দশমীর সূচি।', 'Saptami, Ashtami, Navami and Dashami schedule.']],
  '/parikroma': [['পূজা পরিক্রমা রুট', 'Puja Parikrama Routes'], ['তিথি অনুযায়ী চট্টগ্রামের মণ্ডপ পরিক্রমার রুট।', 'Tithi-wise mandap parikrama routes in Chattogram.']],
  '/vote': [['সেরা পূজায় ভোট', 'Vote for the Best Puja'], ['চট্টগ্রামের সেরা ৫ পূজায় ভোট দিন।', 'Vote for the best 5 pujas in Chattogram.']],
  '/reps': [['প্রতিনিধি', 'Representatives'], ['পূজা কমিটির প্রতিনিধিরা।', 'Puja committee representatives.']],
  '/sponsors': [['স্পনসর', 'Sponsors'], ['আমাদের স্পনসর ও সহযোগী।', 'Our sponsors and partners.']],
  '/player': [['দুর্গাপূজার গান', 'Durga Puja Songs'], ['পূজার গান শুনুন।', 'Listen to Durga Puja songs.']],
  '/blog': [['পূজা ব্লগ', 'Puja Blog'], ['পূজা নিয়ে লেখা ও অভিজ্ঞতা।', 'Stories and experiences about the puja.']],
  '/zones': [['বাংলাদেশের পূজা মণ্ডপ', 'Puja Mandaps in Bangladesh'], ['বিভাগ ও জেলা অনুযায়ী মণ্ডপ।', 'Mandaps by division and district.']],
  '/about': [['আমাদের সম্পর্কে', 'About'], ['প্রজেক্টের উদ্দেশ্য ও ডেভেলপার।', 'Project purpose and developer.']],
  '/tutorial': [['টিউটোরিয়াল', 'Tutorial'], ['ওয়েবসাইট ব্যবহারের গাইড।', 'How to use the website.']],
}

function meta(attr, key, val) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', val)
}
function canonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el) }
  el.href = href
}

export function applySeo({ route, sel, lang }) {
  const li = lang === 'en' ? 1 : 0
  const path = '/' + (route.toLowerCase().split('/')[1] || '')
  const key = Object.keys(PAGES).find((p) => p !== '/' && path.startsWith(p)) || '/'
  const [t, d] = PAGES[key]
  const origin = window.location.origin
  let title = `${t[li]} | ${SITE[lang === 'en' ? 'en' : 'bn']}`
  let desc = d[li]
  let url = origin + (key === '/' ? '/' : key)
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE[lang === 'en' ? 'en' : 'bn'], url: origin + '/', inLanguage: ['bn', 'en'] }]

  if (key === '/' && sel) {
    const nm = sel.name_bn || sel.name
    title = `${nm} — ${sel.area || sel.areaeng || ''} | ${SITE[lang === 'en' ? 'en' : 'bn']}`
    desc = `${nm}${sel.area ? ', ' + sel.area : ''}${sel.address ? ' — ' + sel.address : ''}. ${d[li]}`
    url = `${origin}/?m=${encodeURIComponent(sel.slug || sel.id)}`
    ld.push({ '@context': 'https://schema.org', '@type': 'Place', name: nm, address: sel.address || sel.area || undefined, url,
      geo: sel.lat != null ? { '@type': 'GeoCoordinates', latitude: sel.lat, longitude: sel.lng } : undefined })
  }

  document.title = title
  meta('name', 'description', desc.slice(0, 300))
  meta('name', 'robots', route.toLowerCase().startsWith('/admin') ? 'noindex,nofollow' : 'index,follow,max-image-preview:large')
  meta('property', 'og:title', title); meta('property', 'og:description', desc.slice(0, 300))
  meta('property', 'og:url', url); meta('property', 'og:type', 'website')
  meta('name', 'twitter:card', 'summary_large_image')
  canonical(url)

  let s = document.getElementById('ld-json')
  if (!s) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ld-json'; document.head.appendChild(s) }
  s.textContent = JSON.stringify(ld)
}
