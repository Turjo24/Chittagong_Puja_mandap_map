let ctx
export function enableSound() { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume() }
export function ting() {
  if (!ctx) return
  const t = ctx.currentTime
  ;[880, 1318].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * 0.13
    o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination)
    g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.4, s + 0.01); g.gain.exponentialRampToValueAtTime(0.001, s + 0.9)
    o.start(s); o.stop(s + 1)
  })
}
export const toast = (title, body) => window.dispatchEvent(new CustomEvent('toast', { detail: { title, body } }))
