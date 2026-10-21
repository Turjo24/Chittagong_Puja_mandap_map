
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))

export default async function handler(req, res) {
  const id = String(req.query.id || '').replace(/[^0-9a-zA-Z-]/g, '')

  // Use your actual production domain
  const origin = 'https://ctgpujamandap.vercel.app'
  const defaultImage = `${origin}/pintro.png `

  if (!id) {
    return res.status(400).send('Missing mandap ID')
  }

  const SB = process.env.VITE_SUPABASE_URL
  const KEY = process.env.VITE_SUPABASE_ANON_KEY

  if (!SB || !KEY) {
    console.error('Missing Supabase environment variables')
    return res.status(500).send('Server configuration error')
  }

  const headers = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
  }

  let m = null
  let img = defaultImage

  try {
    const query = new URLSearchParams({
      id: `eq.${id}`,
      status: 'eq.approved',
      select: 'id,name,name_bn,area,theme,artist',
      limit: '1',
    })

    const r1 = await fetch(
      `${SB.replace(/\/$/, '')}/rest/v1/mandaps?${query}`,
      { headers }
    )

    if (!r1.ok) {
      console.error('Mandap query failed:', r1.status)
      throw new Error('Could not fetch mandap')
    }

    const rows = await r1.json()
    m = rows[0] || null

    if (m) {
      const photoQuery = new URLSearchParams({
        mandap_id: `eq.${id}`,
        status: 'eq.approved',
        select: 'url',
        order: 'created_at.asc',
        limit: '1',
      })

      const r2 = await fetch(
        `${SB.replace(/\/$/, '')}/rest/v1/photos?${photoQuery}`,
        { headers }
      )

      if (r2.ok) {
        const photos = await r2.json()
        const candidate = photos[0]?.url

        // Only use absolute HTTP(S) image URLs
        if (
          typeof candidate === 'string' &&
          /^https?:\/\//i.test(candidate)
        ) {
          img = candidate
        }
      }
    }
  } catch (e) {
    console.error('Share metadata error:', e.message)
  }

  const name = m
    ? (m.name_bn || m.name || 'পূজা মণ্ডপ')
    : 'চট্টগ্রামের পূজা মণ্ডপ'

  const title = m
    ? `${name}${m.area ? ' · ' + m.area : ''} | Chattogram Puja Mandap Guide`
    : 'Chattogram Puja Mandap Guide'

  const desc = m
    ? [
        m.area && `এলাকা: ${m.area}`,
        m.theme && `থিম: ${m.theme}`,
        m.artist && m.artist !== 'Not Provided' &&
          `শিল্পী: ${m.artist}`,
        'মণ্ডপের ছবি ও অবস্থান দেখুন।',
      ].filter(Boolean).join(' · ')
    : 'চট্টগ্রামের পূজা মণ্ডপের ছবি, তথ্য ও অবস্থান দেখুন।'

  const shareUrl = `${origin}/m/${encodeURIComponent(id)}`
  const dest = `${origin}/?m=${encodeURIComponent(id)}#/`

  // Do not redirect Facebook/social crawlers away from OG HTML.
  const ua = req.headers['user-agent'] || ''
  const isCrawler =
    /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|Discordbot|Googlebot|bingbot/i.test(ua)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60')

  return res.status(200).send(`<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(shareUrl)}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Chattogram Puja Mandap Guide">
<meta property="og:locale" content="bn_BD">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(name)}">
<meta property="og:url" content="${esc(shareUrl)}">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
</head>
<body>
<p><a href="${esc(dest)}">মণ্ডপের বিস্তারিত দেখুন</a></p>
${isCrawler ? '' : `<script>location.replace(${JSON.stringify(dest)})</script>`}
</body>
</html>`)
}
