import { useEffect, useState } from 'react'
import { sb } from './supabase'
import Flame from './Flame'
import { CONTACT } from './config'

const TIERS = [['title', 'Title Sponsor', 'টাইটেল স্পনসর'], ['gold', 'Gold Sponsors', 'গোল্ড স্পনসর'], ['silver', 'Silver Sponsors', 'সিলভার স্পনসর'], ['supporter', 'Supporters', 'সহযোগী']]

export default function Sponsors({ lang }) {
  const bn = lang === 'bn'
  const [list, setList] = useState(null)
  useEffect(() => { sb.from('sponsors').select('*').order('sort').order('created_at').then(({ data }) => setList(data || [])) }, [])
  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('Hello, I want to sponsor Chattogram Puja Map')}`
  return (
    <div className="page"><div className="wrap">
      <a href="#/">← {bn ? 'ফিরে যান' : 'Back to map'}</a>
      <div className="shero">
        <div className="logo big"><Flame size={30} /></div>
        <h2 className="title">{bn ? 'আমাদের স্পনসর' : 'Our Sponsors'}</h2>
        <p className="muted">{bn ? 'যাঁদের সহযোগিতায় এই পূজা মানচিত্র সম্ভব হয়েছে' : 'The people and brands who make this puja guide possible'}</p>
      </div>
      {TIERS.map(([k, en, b]) => {
        const items = (list || []).filter((s) => s.tier === k)
        if (!items.length) return null
        return (
          <div key={k}>
            <div className="sec">{bn ? b : en}</div>
            <div className={'sgrid ' + k}>
              {items.map((s) => (
                <a key={s.id} className="scard" href={s.link || undefined} target="_blank" rel="noreferrer">
                  {s.logo_url ? <img src={s.logo_url} alt={s.name} /> : <Flame size={40} />}
                  <b>{s.name}</b>{s.tagline && <small>{s.tagline}</small>}
                </a>
              ))}
            </div>
          </div>
        )
      })}
      {list && !list.length && <p className="muted" style={{ textAlign: 'center' }}>{bn ? 'শীঘ্রই স্পনসরদের নাম এখানে দেখা যাবে।' : 'Sponsors will appear here soon.'}</p>}
      <div className="cta">
        <h3>{bn ? 'আপনিও স্পনসর হতে চান?' : 'Want to become a sponsor?'}</h3>
        <p>{bn ? 'হাজার হাজার পূজা-প্রেমী মানুষের কাছে আপনার ব্র্যান্ড পৌঁছে দিন।' : 'Reach thousands of puja lovers across Chattogram.'}</p>
        <div className="acts" style={{ justifyContent: 'center' }}>
          <a href={`mailto:${CONTACT.email}?subject=Sponsorship`}><button className="btn pri">✉ Email</button></a>
          <a href={wa} target="_blank" rel="noreferrer"><button className="btn">WhatsApp</button></a>
        </div>
      </div>
    </div></div>
  )
}
