import { useEffect, useMemo } from 'react'
export default function PhotoPicker({ files, setFiles, label }) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return (
    <div>
      <label className="drop">
        <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const l = [...e.target.files]; e.target.value = ''; setFiles([...files, ...l].slice(0, 8)) }} />
        📷 {label}
      </label>
      <div className="thumbs">
        {urls.map((u, i) => (
          <div key={i}><img src={u} /><button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>×</button></div>
        ))}
      </div>
    </div>
  )
}
