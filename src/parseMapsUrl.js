// Google Maps link theke name, lat, lng ber kore.
// Panel.jsx (user request) ar AdminMandaps.jsx (bulk add) duto-te ekhane theke use hoy.
//
// Return: { name, lat, lng, short }
//  - short: true hole maps.app.goo.gl type short link. Er moddhe coordinates thake na,
//    browser theke redirect follow kora jay na (CORS), tai lat/lng manually dite hobe.

const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)'

const PATTERNS = [
  // Place er asol pin (full link er data= part e thake) — sobcheye accurate
  new RegExp(`!3d${NUM}!4d${NUM}`),
  // Map viewport center
  new RegExp(`@${NUM},${NUM}`),
  // ?q=lat,lng  ?query=lat,lng  destination=lat,lng  ll=lat,lng
  new RegExp(`[?&](?:q|query|destination|ll|center)=\\s*${NUM}\\s*,\\s*${NUM}`),
  // /maps/place/lat,lng
  new RegExp(`/maps/place/${NUM},\\s*${NUM}`)
]

const SHORT = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i

const validCoord = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180

export function parseMapsUrl(raw) {
  const out = { name: '', lat: null, lng: null, short: false }
  const url = (raw || '').trim()
  if (!/^https?:\/\//i.test(url)) return out

  out.short = SHORT.test(url)

  let s = url
  try {
    s = decodeURIComponent(url)
  } catch {
    // malformed % sequence — raw url diye-i cholbe
  }

  for (const p of PATTERNS) {
    const m = s.match(p)
    if (!m) continue
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (validCoord(lat, lng)) {
      out.lat = lat
      out.lng = lng
      break
    }
  }

  const nm = s.match(/\/maps\/place\/([^/@?]+)/)
  if (nm) {
    const name = nm[1].replace(/\+/g, ' ').trim()
    // /place/22.34,91.829 ba degree-minute format hole eta naam na
    const looksLikeCoords = /^-?\d+(\.\d+)?[,\s]+-?\d/.test(name) || name.includes('°')
    if (name && !looksLikeCoords) out.name = name
  }

  return out
}
