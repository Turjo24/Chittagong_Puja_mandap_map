// SEO helper: route / selected mandap onujayi title, meta, canonical, JSON-LD set kore
const SITE = 'Chattogram Puja Mandap Guide'

// TODO: nijer asol link boshao. 'YOUR_' thakle ota skip hobe.
const SOCIAL = [
  'https://www.facebook.com/YOUR_PAGE',
  'https://www.youtube.com/@YOUR_CHANNEL',
]

// route -> [title, description]  (duita bhashatei keyword rakha, Googlebot default 'bn' dekhe)
const PAGES = {
  '/': [
    'Chittagong Puja Mandap Guide & Map | চট্টগ্রাম পূজা মণ্ডপ',
    'Chittagong (Chattogram) Durga Puja mandap guide: interactive map, exact locations, nearest pujas, parikroma routes & heritage. চট্টগ্রামের পূজা মণ্ডপ ম্যাপ ও গাইড।',
  ],
  '/heritage': [
    'Chattogram Puja Heritage & History | চট্টগ্রামের পূজার ঐতিহ্য',
    'Year-by-year history of Chattogram Durga Puja mandaps: pandal architects, statue artists, themes and location changes. চট্টগ্রামের পূজা মণ্ডপের ইতিহাস।',
  ],
  '/routes': [
    'Puja Route & Fare Planner Chattogram | পূজা রুট ও ভাড়া',
    'Plan your puja mandap visit in Chattogram: routes and fares between places. চট্টগ্রামে পূজা দেখার রুট ও ভাড়ার তথ্য।',
  ],
  '/schedule': [
    'Durga Puja Schedule & Tithi | দুর্গাপূজার সময়সূচি ও তিথি',
    'Durga Puja tithi and schedule: Saptami, Ashtami, Navami, Dashami. দুর্গাপূজার তিথি ও সময়সূচি।',
  ],
  '/parikroma': [
    'Chattogram Puja Parikroma Routes | পূজা পরিক্রমা',
    'Ordered puja parikroma routes in Chattogram with tithi and time. চট্টগ্রামের পূজা পরিক্রমা রুট।',
  ],
  '/vote': [
    'Vote for the Best Puja in Chattogram | সেরা পূজা ভোট',
    'Vote for your favourite Durga Puja mandaps in Chattogram. চট্টগ্রামের সেরা পূজা মণ্ডপে ভোট দিন।',
  ],
  '/reps': [
    'Puja Representatives (Protinidhi) Chattogram | পূজা প্রতিনিধি',
    'Meet the Durga Puja representatives of Chattogram. চট্টগ্রামের পূজা প্রতিনিধিদের তালিকা।',
  ],
  '/player': [
    'Durga Puja Songs | দুর্গাপূজার গান',
    'Listen to Durga Puja songs on Chattogram Puja Mandap Guide. দুর্গাপূজার গান শুনুন।',
  ],
  '/blog': [
    'Chattogram Puja Blog & Stories | পূজার ব্লগ',
    'Stories, memories and posts about Durga Puja in Chattogram. চট্টগ্রামের পূজা নিয়ে ব্লগ ও স্মৃতি।',
  ],
  '/zones': [
    'Chattogram Puja Zones Map | পূজা জোন ম্যাপ',
    'Zone-wise map of Durga Puja mandaps in Chattogram. চট্টগ্রামের জোনভিত্তিক পূজা মণ্ডপ ম্যাপ।',
  ],
  '/sponsors': [
    'Sponsors | Chattogram Puja Mandap Guide | স্পনসর',
    'Sponsors supporting the Chattogram Puja Mandap Guide. আমাদের স্পনসরবৃন্দ।',
  ],
  '/about': [
    'About Chattogram Puja Mandap Guide | আমাদের সম্পর্কে',
    'About the Chattogram Puja Mandap Guide project, its purpose and developer. এই প্রজেক্ট ও ডেভেলপার সম্পর্কে।',
  ],
  '/tutorial': [
    'How to Use the Puja Map | টিউটোরিয়াল',
    'Video tutorials: how to use the Chattogram Puja Mandap Guide. সাইট ব্যবহারের টিউটোরিয়াল।',
  ],
}

const NOINDEX = ['/admin', '/blog-submit']

const clip = (s, n) => {
  s = String(s || '').replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function setMeta(attr, key, val) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', val)
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setLd(obj) {
  let el = document.getElementById('seo-ld')
  if (!obj) { if (el) el.remove(); return }
  if (!el) {
    el = document.createElement('script')
    el.id = 'seo-ld'
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(obj)
}

export function applySeo({ route = '/', sel = null } = {}) {
  if (typeof document === 'undefined') return
  const origin = window.location.origin
  const path = (route || '/').toLowerCase().replace(/\/+$/, '') || '/'
  const noindex = NOINDEX.some((p) => path.startsWith(p))
  const onMain = path === '/' || path.startsWith('/mandap')

  let title, desc, canon, ld = null

  if (onMain && sel) {
    // ---- single mandap ----
    const nm = sel.name || sel.name_bn || 'Puja Mandap'
    const bn = sel.name_bn && sel.name_bn !== sel.name ? ` (${sel.name_bn})` : ''
    const area = sel.area || sel.areaeng || ''
    canon = `/mandap/${encodeURIComponent(sel.slug || sel.id)}`
    title = clip(`${nm}${area ? ' – ' + area : ''} | Chattogram Puja Mandap`, 70)
    desc = clip(
      `${nm}${bn} Durga Puja mandap${area ? ' in ' + area : ''}, Chattogram. ` +
        `${sel.address ? 'Address: ' + sel.address + '. ' : ''}` +
        `Location, photos & heritage. চট্টগ্রাম পূজা মণ্ডপ গাইড।`,
      200
    )
    ld = {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: nm,
      description: desc,
      url: origin + canon,
      address: {
        '@type': 'PostalAddress',
        streetAddress: sel.address || undefined,
        addressLocality: 'Chattogram',
        addressCountry: 'BD',
      },
    }
    if (sel.lat != null && sel.lng != null) {
      ld.geo = { '@type': 'GeoCoordinates', latitude: +sel.lat, longitude: +sel.lng }
    }
  } else {
    // ---- normal page ----
    const key =
      Object.keys(PAGES)
        .filter((k) => k !== '/' && path.startsWith(k))
        .sort((a, b) => b.length - a.length)[0] || '/'
    ;[title, desc] = PAGES[key]
    canon = path
    if (path === '/') {
      ld = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', name: SITE, url: origin + '/', inLanguage: ['bn', 'en'] },
          {
            '@type': 'Organization',
            name: SITE,
            url: origin + '/',
            sameAs: SOCIAL.filter((u) => !u.includes('YOUR_')),
          },
        ],
      }
    }
  }

  const url = origin + canon
  document.title = title
  setMeta('name', 'description', desc)
  setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large')
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:site_name', SITE)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', desc)
  setLink('canonical', url)
  setLd(noindex ? null : ld)
}
