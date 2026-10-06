import { useEffect, useRef, useState } from 'react'

// src/songs/ folder e mp3 rakhlei auto playlist hoye jabe
const files = import.meta.glob('./songs/*.{mp3,m4a,ogg,wav}', { eager: true, query: '?url', import: 'default' })
const songs = Object.entries(files).sort().map(([k, src]) => ({
  src, title: decodeURIComponent(k.split('/').pop()).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
}))

export default function Player() {
  const [i, setI] = useState(0), [play, setPlay] = useState(false), [open, setOpen] = useState(false)
  const a = useRef()
  useEffect(() => {
    const f = () => a.current?.play().then(() => setOpen(true)).catch(() => {})
    addEventListener('startmusic', f); return () => removeEventListener('startmusic', f)
  }, [])
  useEffect(() => { if (play && a.current) a.current.play() }, [i])
  if (!songs.length) return null
  const next = (d) => setI((i + d + songs.length) % songs.length)
  return (
    <>
      <audio ref={a} src={songs[i].src} preload="auto" onPlay={() => setPlay(true)} onPause={() => setPlay(false)} onEnded={() => next(1)} />
      {open ? (
        <div className="player">
          <button onClick={() => next(-1)}>⏮</button>
          <button onClick={() => (play ? a.current.pause() : a.current.play())}>{play ? '⏸' : '▶'}</button>
          <button onClick={() => next(1)}>⏭</button>
          <span>{songs[i].title}</span>
          <button onClick={() => setOpen(false)}>—</button>
        </div>
      ) : <button className="player round" onClick={() => setOpen(true)}>♪</button>}
    </>
  )
}
