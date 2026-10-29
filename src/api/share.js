// Vercel serverless function: /m/:key (mandap heritage page) ar /b/:key (blog post)
// key = slug (jemon "satish-babu-lane") ba purono numeric ID (138 -> slug e 301 redirect hobe)
//
// Eta ekta PUBLIC page: crawler (Facebook, Prothom Alo er link preview, WhatsApp...) ar manush,
// dujon-i ekhi HTML dekhe. Kono redirect / intro page nai, tai thumbnail ar content dujon-i thik thake.

const ORIGIN = (process.env.SITE_ORIGIN || 'https://ctgpujamandap.vercel.app').replace(/\/$/, '')
const SITE = 'Chattogram Puja Mandap Guide'
const DEFAULT_IMAGE = `${ORIGIN}/pintro.png` // public/pintro.png thakte hobe (1200x630 bhalo)

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// shudhu absolute http(s) image; http hole https
const imgUrl = (u) => {
  if (typeof u !== 'string') return null
  const s = u.trim()
  if (!/^https?:\/\//i.test(s)) return null
  return s.replace(/^http:\/\//i, 'https://')
}

const paras = (s) => String(s || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
const lines = (s) => String(s || '').split(/\n+/).map((p) => p.trim()).filter(Boolean)
const html = (s) => esc(s).replace(/\n/g, '<br>')
const cut = (s, n) => {
  const x = String(s || '').replace(/\s+/g, ' ').trim()
  return x.length > n ? x.slice(0, n - 1).trimEnd() + '…' : x
}

async function sbGet(table, params) {
  const base = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!base || !key) throw new Error('Missing Supabase env vars')
  const r = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${table}?${new URLSearchParams(params)}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!r.ok) throw new Error(`${table} query failed: ${r.status}`)
  return r.json()
}

const isNum = (k) => /^\d+$/.test(k)

// ---------- common page shell ----------
function shell({ title, desc, url, image, type = 'website', extraMeta = '', jsonld, body }) {
  return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">

<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${SITE}">
<meta property="og:locale" content="bn_BD">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(title)}">
${extraMeta}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@500;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#fff8f1;--card:#fff;--tx:#2a1d16;--mu:#7a6a5f;--ac:#e8590c;--ln:rgba(120,80,40,.18)}
@media(prefers-color-scheme:dark){:root{--bg:#17110d;--card:#221913;--tx:#f4e9df;--mu:#b5a495;--ac:#ff8a4c;--ln:rgba(255,200,150,.16)}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font-family:'Hind Siliguri',system-ui,sans-serif;line-height:1.8;font-size:17px}
a{color:var(--ac)}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 16px;max-width:900px;margin:0 auto}
.top a{text-decoration:none;font-weight:600}
.wrap{max-width:900px;margin:0 auto;padding:0 16px 48px}
.hero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px;display:block;background:var(--ln)}
h1,h2{font-family:'Noto Serif Bengali','Hind Siliguri',serif;line-height:1.4}
h1{font-size:clamp(26px,5vw,38px);margin:18px 0 6px}
h2{font-size:22px;margin:34px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--ln)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.chip{background:var(--card);border:1px solid var(--ln);border-radius:999px;padding:2px 12px;font-size:14px}
.mu{color:var(--mu)}
.story p{margin:0 0 1.1em}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:600px){.grid2{grid-template-columns:1fr}}
.box{background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:12px 16px}
.box b{display:block;font-size:13px;color:var(--mu);font-weight:600;letter-spacing:.02em}
.albums{margin:0;padding-left:20px}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
.gal a{display:block;border-radius:12px;overflow:hidden;aspect-ratio:4/3;background:var(--ln)}
.gal img{width:100%;height:100%;object-fit:cover;display:block}
.acts{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}
.btn{display:inline-block;border:1px solid var(--ln);background:var(--card);color:var(--tx);border-radius:10px;padding:8px 16px;font:inherit;font-size:15px;text-decoration:none;cursor:pointer}
.btn.pri{background:var(--ac);border-color:var(--ac);color:#fff}
footer{text-align:center;color:var(--mu);font-size:14px;padding:24px 16px}
</style>
</head>
<body>
<div class="top"><a href="${ORIGIN}/">🪔 ${SITE}</a><a href="${ORIGIN}/#/blog">ব্লগ</a></div>
<div class="wrap">
${body}
</div>
<footer>${SITE} · <a href="${ORIGIN}/">${ORIGIN.replace(/^https?:\/\//, '')}</a></footer>
</body>
</html>`
}

function shareButtons(url, text) {
  const u = encodeURIComponent(url)
  return `<div class="acts">
  <a class="btn pri" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${u}">f Facebook-এ শেয়ার</a>
  <a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}">WhatsApp</a>
  <button class="btn" type="button" onclick="navigator.clipboard.writeText(${esc(JSON.stringify(url))}).then(function(){this.textContent='✓ কপি হয়েছে'}.bind(this),function(){prompt('Link:',${esc(JSON.stringify(url))})})">🔗 লিংক কপি</button>
</div>`
}

// ---------- mandap heritage page ----------
async function mandapPage(key) {
  const q = {
    select: 'id,slug,name,name_bn,area,areaeng,address,lat,lng,theme,artist,artist_bio,artist_albums,entry_point,exit_point,established_year,heritage_story,og_image',
    status: 'eq.approved',
    limit: '1',
  }
  q[isNum(key) ? 'id' : 'slug'] = `eq.${key}`
  const m = (await sbGet('mandaps', q))[0]
  if (!m) return null
  if (isNum(key) && m.slug) return { redirect: `/m/${m.slug}` }

  const photos = await sbGet('photos', {
    mandap_id: `eq.${m.id}`,
    status: 'eq.approved',
    select: 'url,uploader_name,year',
    order: 'likes.desc,created_at.asc',
    limit: '12',
  }).catch(() => [])

  const name = m.name_bn || m.name || 'পূজা মণ্ডপ'
  const pics = photos.map((p) => imgUrl(p.url)).filter(Boolean)
  const image = imgUrl(m.og_image) || pics[0] || DEFAULT_IMAGE
  const url = `${ORIGIN}/m/${encodeURIComponent(m.slug || m.id)}`
  const hasArtist = m.artist && m.artist !== 'Not Provided'
  const story = paras(m.heritage_story)

  const desc = cut(
    story[0] ||
      [m.area && `এলাকা: ${m.area}`, m.theme && `থিম: ${m.theme}`, hasArtist && `শিল্পী: ${m.artist}`, 'মণ্ডপের ইতিহাস, ছবি ও অবস্থান দেখুন।']
        .filter(Boolean).join(' · '),
    200
  )
  const title = `${name}${m.area ? ' · ' + m.area : ''} | ${SITE}`

  const albums = lines(m.artist_albums)
  const body = `
${pics[0] ? `<img class="hero" src="${esc(pics[0])}" alt="${esc(name)}">` : ''}
<h1>${esc(name)}</h1>
${m.name_bn && m.name && m.name_bn !== m.name ? `<div class="mu">${esc(m.name)}</div>` : ''}
<div class="chips">
  ${m.area ? `<span class="chip">📍 ${esc(m.area)}</span>` : ''}
  ${m.theme ? `<span class="chip">থিম: ${esc(m.theme)}</span>` : ''}
  ${m.established_year ? `<span class="chip">প্রতিষ্ঠা: ${esc(m.established_year)}</span>` : ''}
  ${hasArtist ? `<span class="chip">শিল্পী: ${esc(m.artist)}</span>` : ''}
</div>
${m.address ? `<p class="mu">${esc(m.address)}</p>` : ''}

<div class="acts">
  <a class="btn pri" href="${ORIGIN}/?m=${encodeURIComponent(m.slug || m.id)}#/">🗺 মানচিত্রে দেখুন</a>
  ${m.lat != null && m.lng != null ? `<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}">🧭 দিকনির্দেশ</a>` : ''}
</div>

${story.length ? `<h2>ঐতিহ্যের গল্প</h2><div class="story">${story.map((p) => `<p>${html(p)}</p>`).join('')}</div>` : ''}

${hasArtist || m.artist_bio || albums.length ? `<h2>শিল্পী</h2>
${hasArtist ? `<p><b>${esc(m.artist)}</b></p>` : ''}
${m.artist_bio ? `<div class="story">${paras(m.artist_bio).map((p) => `<p>${html(p)}</p>`).join('')}</div>` : ''}
${albums.length ? `<div class="box"><b>উল্লেখযোগ্য কাজ / অ্যালবাম</b><ul class="albums">${albums.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}` : ''}

${m.entry_point || m.exit_point ? `<h2>প্রবেশ ও প্রস্থান</h2>
<div class="grid2">
  ${m.entry_point ? `<div class="box"><b>প্রবেশ পথ</b>${html(m.entry_point)}</div>` : ''}
  ${m.exit_point ? `<div class="box"><b>প্রস্থান পথ</b>${html(m.exit_point)}</div>` : ''}
</div>` : ''}

${pics.length > 1 ? `<h2>ছবি</h2><div class="gal">${pics.map((p) => `<a href="${esc(p)}" target="_blank" rel="noopener"><img src="${esc(p)}" loading="lazy" alt="${esc(name)}"></a>`).join('')}</div>` : ''}

<h2>শেয়ার করুন</h2>
${shareButtons(url, name)}`

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name,
    description: desc,
    url,
    image: pics.length ? pics : [image],
    ...(m.lat != null && m.lng != null ? { geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lng } } : {}),
    ...(m.address ? { address: m.address } : {}),
  }

  return { page: shell({ title, desc, url, image, jsonld, body }) }
}

// ---------- blog page ----------
async function blogPage(key) {
  const q = { select: '*', limit: '1' }
  q[isNum(key) ? 'id' : 'slug'] = `eq.${key}`
  const p = (await sbGet('blog_posts', q))[0]
  if (!p) return null
  if (isNum(key) && p.slug) return { redirect: `/b/${p.slug}` }

  const image = imgUrl(p.image_url) || DEFAULT_IMAGE
  const url = `${ORIGIN}/b/${encodeURIComponent(p.slug || p.id)}`
  const desc = cut(p.content, 200)
  const date = p.created_at ? new Date(p.created_at) : null
  const dateStr = date ? date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' }) : ''
  const title = `${p.title} | ${SITE}`

  const body = `
${imgUrl(p.image_url) ? `<img class="hero" src="${esc(image)}" alt="${esc(p.title)}">` : ''}
<h1>${esc(p.title)}</h1>
<p class="mu">${p.author_name ? `লেখক: ${esc(p.author_name)} · ` : ''}${esc(dateStr)}</p>
<div class="story">${paras(p.content).map((x) => `<p>${html(x)}</p>`).join('')}</div>
<h2>শেয়ার করুন</h2>
${shareButtons(url, p.title)}
<p><a href="${ORIGIN}/#/blog">← সব ব্লগ</a></p>`

  const extra = [
    date && `<meta property="article:published_time" content="${esc(date.toISOString())}">`,
    p.author_name && `<meta property="article:author" content="${esc(p.author_name)}">`,
  ].filter(Boolean).join('\n')

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    image: [image],
    ...(date ? { datePublished: date.toISOString() } : {}),
    ...(p.author_name ? { author: { '@type': 'Person', name: p.author_name } } : {}),
    mainEntityOfPage: url,
  }

  return { page: shell({ title, desc, url, image, type: 'article', extraMeta: extra, jsonld, body }) }
}

function notFound(res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30')
  return res.status(404).send(shell({
    title: `পাওয়া যায়নি | ${SITE}`,
    desc: 'এই পেজটি খুঁজে পাওয়া যায়নি।',
    url: ORIGIN,
    image: DEFAULT_IMAGE,
    body: `<h1>পেজটি পাওয়া যায়নি</h1><p><a class="btn pri" href="${ORIGIN}/">← হোমে ফিরুন</a></p>`,
  }))
}

export default async function handler(req, res) {
  const type = req.query.type === 'b' ? 'b' : 'm'
  const key = String(req.query.key || '').toLowerCase().replace(/[^0-9a-z-]/g, '')
  if (!key) return notFound(res)

  try {
    const r = type === 'b' ? await blogPage(key) : await mandapPage(key)
    if (!r) return notFound(res)
    if (r.redirect) {
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300')
      return res.redirect(301, r.redirect)
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=600')
    return res.status(200).send(r.page)
  } catch (e) {
    console.error('share error:', e.message)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(500).send('Server error')
  }
}
