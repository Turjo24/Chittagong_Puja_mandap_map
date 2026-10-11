import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const flame = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5c.9 3.2 5.2 5.2 5.2 10a5.2 5.2 0 0 1-10.4 0c0-2 1-3.4 2-4.6.9-1 1.9-2.3 3.2-5.4z"/><path d="M5 20.5h14c-.6 1.6-2.2 2.5-4 2.5H9c-1.8 0-3.4-.9-4-2.5z" opacity=".7"/></svg>`

// Choto icon (22px) — size/position inline, tai styles.css er upor depend kore na
const dot = L.divIcon({
  className: 'pin',
  html: `<div class="pj-dot">${flame(12)}</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})
// Selected icon — alo (glow) + pulse ring
const dotActive = L.divIcon({
  className: 'pin',
  html: `<div class="pj-dot pj-active"><span class="pj-ring"></span><span class="pj-ring pj-ring2"></span>${flame(14)}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})
const meIcon = L.divIcon({ className: 'pin', html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
const starIcon = L.divIcon({ className: 'pin', html: '<div class="star">★</div>', iconSize: [34, 34], iconAnchor: [17, 17] })

const CSS = `
.pj-dot{position:relative;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:#501126;color:#e4bf70;border:2px solid #c49a48;box-shadow:0 1px 4px rgba(0,0,0,.45);
  transition:transform .2s}
.pj-dot:hover{transform:scale(1.15)}
.pj-active{width:28px;height:28px;background:#e4bf70;color:#501126;border-color:#fff4df;
  box-shadow:0 0 0 3px rgba(228,191,112,.45),0 0 14px 6px rgba(255,200,80,.85),0 0 30px 12px rgba(255,160,40,.45);
  animation:pj-glow 1.6s ease-in-out infinite}
.pj-ring{position:absolute;inset:-2px;border-radius:50%;border:2px solid #ffc850;opacity:0;animation:pj-pulse 1.8s ease-out infinite}
.pj-ring2{animation-delay:.9s}
@keyframes pj-pulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(2.6);opacity:0}}
@keyframes pj-glow{0%,100%{box-shadow:0 0 0 3px rgba(228,191,112,.45),0 0 10px 4px rgba(255,200,80,.7),0 0 22px 8px rgba(255,160,40,.35)}
  50%{box-shadow:0 0 0 3px rgba(228,191,112,.6),0 0 18px 8px rgba(255,210,100,.95),0 0 38px 16px rgba(255,160,40,.55)}}
`

function Fly({ to, onId }) {
  const m = useMap()
  useEffect(() => {
    if (!to) return
    onId(to.id ?? null) // list theke click korle marker o active hobe
    m.flyTo([to.lat, to.lng], to.zoom || 15, { duration: 1.2 })
  }, [to])
  return null
}

function Pick({ on, onClear }) {
  useMapEvents({
    click: (e) => {
      onClear && onClear()
      on && on(e.latlng)
    },
  })
  return null
}

export default function MapView({ items, onSelect, focus, me, picked, onPick, dark }) {
  const [selId, setSelId] = useState(null)

  return (
    <>
      <style>{CSS}</style>
      <MapContainer center={[22.3569, 91.7832]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer key={String(dark)} className={dark ? 'tiles-dark' : 'tiles-light'} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution="&copy; OpenStreetMap contributors" />
        <Fly to={focus} onId={setSelId} />
        <Pick on={onPick} onClear={() => setSelId(null)} />
        {items.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={selId === m.id ? dotActive : dot}
            zIndexOffset={selId === m.id ? 1000 : 0}
            eventHandlers={{
              click: () => {
                setSelId(m.id)
                onSelect(m)
              },
            }}
          />
        ))}
        {me && <Marker position={[me.lat, me.lng]} icon={meIcon} />}
        {picked && <Marker position={[picked.lat, picked.lng]} icon={starIcon} />}
      </MapContainer>
    </>
  )
}
