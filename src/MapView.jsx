import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const flame = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5c.9 3.2 5.2 5.2 5.2 10a5.2 5.2 0 0 1-10.4 0c0-2 1-3.4 2-4.6.9-1 1.9-2.3 3.2-5.4z"/><path d="M5 20.5h14c-.6 1.6-2.2 2.5-4 2.5H9c-1.8 0-3.4-.9-4-2.5z" opacity=".7"/></svg>'
const dot = L.divIcon({ className: 'pin', html: `<div class="dot">${flame}</div>`, iconSize: [36, 36], iconAnchor: [18, 43] })
const meIcon = L.divIcon({ className: 'pin', html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
const starIcon = L.divIcon({ className: 'pin', html: '<div class="star">★</div>', iconSize: [34, 34], iconAnchor: [17, 17] })

function Fly({ to }) { const m = useMap(); useEffect(() => { if (to) m.flyTo([to.lat, to.lng], 15, { duration: 1.2 }) }, [to]); return null }
function Pick({ on }) { useMapEvents({ click: (e) => on && on(e.latlng) }); return null }

export default function MapView({ items, onSelect, focus, me, picked, onPick, dark }) {
  return (
    <MapContainer center={[22.3569, 91.7832]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer key={String(dark)} className={dark ? "tiles-dark" : "tiles-light"} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution="&copy; OpenStreetMap contributors" />
      <Fly to={focus} />
      <Pick on={onPick} />
      {items.map((m) => <Marker key={m.id} position={[m.lat, m.lng]} icon={dot} eventHandlers={{ click: () => onSelect(m) }} />)}
      {me && <Marker position={[me.lat, me.lng]} icon={meIcon} />}
      {picked && <Marker position={[picked.lat, picked.lng]} icon={starIcon} />}
    </MapContainer>
  )
}
