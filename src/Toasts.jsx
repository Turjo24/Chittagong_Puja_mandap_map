import { useEffect, useState } from 'react'
export default function Toasts() {
  const [list, setList] = useState([])
  useEffect(() => {
    const f = (e) => {
      const id = Math.random()
      setList((l) => [...l, { id, ...e.detail }])
      setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 7000)
    }
    addEventListener('toast', f); return () => removeEventListener('toast', f)
  }, [])
  return (
    <div className="toasts">
      {list.map((x) => (
        <div className="toast" key={x.id} onClick={() => setList((l) => l.filter((y) => y.id !== x.id))}>
          <b>🔔 {x.title}</b>{x.body && <p>{x.body}</p>}
        </div>
      ))}
    </div>
  )
}
