import { sb } from './supabase'
export const MAX = 15 * 1024 * 1024, MAXN = 8, OK = ['image/jpeg', 'image/png', 'image/webp']
export function check(files) {
  if (files.length > MAXN) return `Max ${MAXN} ta photo`
  for (const f of files) {
    if (!OK.includes(f.type)) return 'Shudhu JPG / PNG / WEBP'
    if (f.size > MAX) return `${f.name}: max 15MB`
  }
  return ''
}
// photo auto-compress (max 1600px, JPEG) -> site fast + storage kom
async function compress(f) {
  try {
    const bmp = await createImageBitmap(f)
    const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s)
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82))
    return blob && blob.size < f.size ? new File([blob], 'p.jpg', { type: 'image/jpeg' }) : f
  } catch { return f }
}
export async function uploadAll(files, raw = false) {
  const out = []
  for (const f0 of files) {
    const f = raw ? f0 : await compress(f0)
    const path = `${crypto.randomUUID()}.${f.type.split('/')[1]}`
    const { error } = await sb.storage.from('photos').upload(path, f, { contentType: f.type, cacheControl: '31536000' })
    if (error) throw error
    out.push({ path, url: sb.storage.from('photos').getPublicUrl(path).data.publicUrl })
  }
  return out
}
