// Share-card HTML used by BOTH hosts:
//   Vercel            -> api/share.js            (Node style handler)
//   Cloudflare Pages  -> functions/api/share.js  (Fetch-API style handler)
// Behaviour is the same as the original handler (OG meta tags for Facebook/WhatsApp + instant redirect
// for humans). Difference: every user-supplied value is escaped, so the page can't be used for XSS,
// and a stray "%" in a title no longer crashes the function.

const SITE = 'Chattogram Puja Mandap Guide'

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const safeDecode = (s) => {
  try { return decodeURIComponent(s) } catch { return s }
}

// only an absolute https image URL is allowed in og:image, otherwise the default is used
const safeImg = (u, fallback) => {
  const s = safeDecode(String(u || '')).trim()
  return /^https:\/\//i.test(s) ? s : fallback
}

// "ctg.example.com" or "localhost:3000" only; anything odd -> fall back to the configured origin
export function originFrom(envOrigin, host, fallback = 'https://ctgpujamandap.vercel.app') {
  if (envOrigin) return String(envOrigin).replace(/\/$/, '')
  if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) return `https://${host}`
  return fallback
}

export function buildShareCard({ type = '', id = '', title = '', img = '' }, origin) {
  type = String(type); id = String(id)
  const enc = encodeURIComponent

  let redirectUrl = `${origin}/?m=${enc(id)}`
  if (type === 'heritage') redirectUrl = `${origin}/heritage?docId=${enc(id)}`
  else if (type === 'blog') redirectUrl = `${origin}/blog?id=${enc(id)}`

  const name = safeDecode(title || 'Mandap')
  const image = safeImg(img, `${origin}/pntro.png`)
  const pageUrl = `${origin}/api/share?type=${enc(type)}&id=${enc(id)}&title=${enc(name)}&img=${enc(image)}`
  const jsRedirect = JSON.stringify(redirectUrl).replace(/</g, '\\u003c')
  const t = `${esc(name)} — ${SITE}`

  return `<!DOCTYPE html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <title>${t}</title>
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="মণ্ডপ বা হেরিটেজ সম্পর্কে বিস্তারিত জানতে লিংকে ক্লিক করুন।" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${t}" />
    <meta property="twitter:image" content="${esc(image)}" />
    <script>window.location.replace(${jsRedirect});</script>
  </head>
  <body style="background-color:#f3f4f6;text-align:center;padding-top:50px;font-family:sans-serif;">
    <p>আপনাকে <b>${esc(name)}</b>-এর পেজে নিয়ে যাওয়া হচ্ছে...</p>
    <p><a href="${esc(redirectUrl)}" style="color:#0066cc;">যদি নিজে থেকে না যায়, তাহলে এখানে ক্লিক করুন</a></p>
  </body>
</html>`
}
