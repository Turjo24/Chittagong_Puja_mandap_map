import { useEffect, useState } from 'react'
import Flame from './Flame'

export default function Intro({ ready, t, onEnter, onDone }) {
  const [p, setP] = useState(0), [img, setImg] = useState(true), [go, setGo] = useState(false)
  useEffect(() => { const i = setInterval(() => setP((x) => Math.min(x + 2, 90)), 60); return () => clearInterval(i) }, [])
  const pct = ready && p >= 90 ? 100 : p
  function enter() { setGo(true); onEnter(); setTimeout(onDone, 1800) }
  return (
    <div className={'intro' + (go ? ' go' : '')}>
      {Array.from({ length: 18 }, (_, i) => (
        <i key={i} className="spark" style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i % 7) * 0.8}s`, animationDuration: `${6 + (i % 5)}s` }} />
      ))}
      <div className="stage">
        <div className="halo" />
        {img ? <img className="cartoon" src="/intro.png" alt="" onError={() => setImg(false)} />
          : <div className="cartoon fb"><Flame size={96} /></div>}
      </div>
      <h1 className="jay">দুর্গা মাই কি জয়</h1>
      <p className="jay2">Durga Mai Ki Joy</p>
      <div className="bar"><div style={{ width: pct + '%' }} /></div>
      {pct === 100 ? <button className="enter" onClick={enter}>{t.enter}</button> : <small className="ld">{t.loading} {pct}%</small>}
    </div>
  )
}
