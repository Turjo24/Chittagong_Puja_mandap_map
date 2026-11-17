import { useEffect, useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'

/* ───────────────────────── কমন স্টাইল ও লেবেল ───────────────────────── */

const LOCATION_LABELS = {
  open_field: 'উন্মুক্ত মাঠ / প্রাঙ্গণ',
  building_under: 'বিল্ডিংয়ের নিচে / নিচতলা',
  temporary_pandal: 'অস্থায়ী মণ্ডপ (রাস্তায়/গলি)',
  permanent_premises: 'স্থায়ী মন্দির প্রাঙ্গণ'
}

const inp =
  'w-full p-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-100 outline-none focus:border-orange-500 placeholder:text-gray-500'
const lbl = 'text-xs font-bold text-gray-400 block mb-1'
const box = 'p-4 rounded-xl border border-gray-800 bg-gray-900/60 space-y-3'

const BLANK = {
  mandap_id: '',
  title: '',
  year: new Date().getFullYear(),
  location_type: 'open_field',
  location_changed: false,
  location_change_history: '',
  post_puja_site_status: '',
  pandal_architect: '',
  pandal_architect_photo: null,
  lighting_artist: '',
  lighting_artist_photo: null,
  statue_artist: '',
  statue_artist_photo: null,
  statue_height_ft: '',
  statue_theme: '',
  entry_point: '',
  entry_point_photo: null,
  exit_point: '',
  exit_point_photo: null,
  thumbnail_post: null,
  heritage_description: '',
  submitted_by: 'Admin'
}

/* ───────────────────── একটি ছবির স্লট (দেখা / পরিবর্তন / মুছা) ───────────────────── */

function ImageSlot({ label, hint, url, onChange, onZoom }) {
  const [files, setFiles] = useState([])
  const [up, setUp] = useState(false)

  // নতুন ছবি বাছাই হলেই অটো আপলোড হয়ে URL বসে যায়
  useEffect(() => {
    if (!files.length) return
    ;(async () => {
      setUp(true)
      try {
        const err = check(files)
        if (err) throw new Error(err)
        const u = (await uploadAll(files.slice(0, 1)))[0]
        if (u?.url) onChange(u.url)
      } catch (e) {
        alert(e.message)
      }
      setFiles([])
      setUp(false)
    })()
  }, [files])

  return (
    <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700 space-y-2">
      <div className="text-xs font-bold text-gray-300">{label}</div>
      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 flex items-center justify-center">
        {url ? (
          <img src={url} alt="" onClick={() => onZoom?.(url)} className="w-full h-full object-cover cursor-zoom-in" />
        ) : (
          <span className="text-xs text-gray-500">ছবি নেই</span>
        )}
        {up && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs text-amber-300 animate-pulse">
            আপলোড হচ্ছে…
          </div>
        )}
      </div>
      <PhotoPicker files={files} setFiles={setFiles} label={url ? '🔄 ছবি পরিবর্তন করুন' : '⬆ ছবি আপলোড করুন'} />
      {url && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="w-full px-2 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
        >
          🗑 এই ছবি মুছে ফেলুন
        </button>
      )}
      {hint && <p className="text-[10px] text-gray-500">{hint}</p>}
    </div>
  )
}

/* ───────────────────── অ্যালবামে একাধিক ছবি যোগ ───────────────────── */

function AlbumUploader({ onAdd }) {
  const [files, setFiles] = useState([])
  const [up, setUp] = useState(false)

  useEffect(() => {
    if (!files.length) return
    ;(async () => {
      setUp(true)
      try {
        const err = check(files)
        if (err) throw new Error(err)
        const uploaded = await uploadAll(files)
        onAdd(uploaded)
      } catch (e) {
        alert(e.message)
      }
      setFiles([])
      setUp(false)
    })()
  }, [files])

  return (
    <div className="space-y-1">
      <PhotoPicker files={files} setFiles={setFiles} label="➕ অ্যালবামে নতুন ছবি যোগ করুন (একাধিক)" />
      {up && <p className="text-xs text-amber-300 animate-pulse">ছবি আপলোড হচ্ছে…</p>}
    </div>
  )
}

/* ───────────────────── কাস্টম সেকশন এডিটর (একটি সেকশন) ───────────────────── */

function SectionEditor({ sec, index, total, onChange, onMove, onRemove, onZoom }) {
  return (
    <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-emerald-400">সেকশন {index + 1}</span>
        <div className="flex gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(index, -1)} className="px-2 py-1 rounded bg-gray-700 text-xs disabled:opacity-30 cursor-pointer">↑</button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(index, 1)} className="px-2 py-1 rounded bg-gray-700 text-xs disabled:opacity-30 cursor-pointer">↓</button>
          <button type="button" onClick={() => onRemove(index)} className="px-2 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-xs font-bold cursor-pointer">✕ মুছুন</button>
        </div>
      </div>
      <input className={inp} placeholder="সেকশনের শিরোনাম" value={sec.title || ''} onChange={(e) => onChange(index, { ...sec, title: e.target.value })} />
      <textarea rows={4} className={inp} placeholder="সেকশনের বিস্তারিত লেখা..." value={sec.content || ''} onChange={(e) => onChange(index, { ...sec, content: e.target.value })} />
      <div className="max-w-xs">
        <ImageSlot label="সেকশনের ছবি (Optional)" url={sec.image_url} onChange={(u) => onChange(index, { ...sec, image_url: u })} onZoom={onZoom} />
      </div>
    </div>
  )
}

/* ───────────────────── মূল এডিটর (নতুন তৈরি + এডিট, দুটোতেই) ───────────────────── */

function DocEditor({ mode, doc, existingAlbums, mandapList, onSaved, onCancel, notify, onZoom }) {
  const [form, setForm] = useState(() => {
    if (!doc) return { ...BLANK }
    const f = { ...BLANK }
    Object.keys(BLANK).forEach((k) => {
      if (doc[k] !== undefined && doc[k] !== null) f[k] = doc[k]
    })
    return f
  })
  const [sections, setSections] = useState(() => (Array.isArray(doc?.custom_sections) ? doc.custom_sections.map((s) => ({ ...s })) : []))
  const [oldAlbum, setOldAlbum] = useState(existingAlbums || [])
  const [removedIds, setRemovedIds] = useState([])
  const [newAlbum, setNewAlbum] = useState([])
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const changeSection = (i, s) => setSections((arr) => arr.map((x, j) => (j === i ? s : x)))
  const moveSection = (i, d) =>
    setSections((arr) => {
      const a = [...arr]
      const j = i + d
      if (j < 0 || j >= a.length) return a
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
  const removeSection = (i) => setSections((arr) => arr.filter((_, j) => j !== i))

  async function save(approveAfter = false) {
    if (!form.mandap_id) return notify('অনুগ্রহ করে একটি মণ্ডপ সিলেক্ট করুন!', 'err')
    if (!form.year) return notify('পূজার বছর দিন!', 'err')
    setBusy(true)
    try {
      const payload = {
        mandap_id: +form.mandap_id,
        title: (form.title || '').trim() || null,
        year: +form.year,
        location_type: form.location_type,
        location_changed: !!form.location_changed,
        location_change_history: (form.location_change_history || '').trim() || null,
        post_puja_site_status: (form.post_puja_site_status || '').trim() || null,
        pandal_architect: (form.pandal_architect || '').trim() || null,
        pandal_architect_photo: form.pandal_architect_photo || null,
        lighting_artist: (form.lighting_artist || '').trim() || null,
        lighting_artist_photo: form.lighting_artist_photo || null,
        statue_artist: (form.statue_artist || '').trim() || null,
        statue_artist_photo: form.statue_artist_photo || null,
        statue_height_ft: form.statue_height_ft ? +form.statue_height_ft : null,
        statue_theme: (form.statue_theme || '').trim() || null,
        entry_point: (form.entry_point || '').trim() || null,
        entry_point_photo: form.entry_point_photo || null,
        exit_point: (form.exit_point || '').trim() || null,
        exit_point_photo: form.exit_point_photo || null,
        thumbnail_post: form.thumbnail_post || null,
        heritage_description: (form.heritage_description || '').trim() || null,
        submitted_by: (form.submitted_by || '').trim() || 'Admin',
        custom_sections: sections
          .filter((s) => (s.title || '').trim() || (s.content || '').trim() || s.image_url)
          .map((s) => ({ title: (s.title || '').trim(), content: (s.content || '').trim(), image_url: s.image_url || null }))
      }

      let id = doc?.id
      if (mode === 'create') {
        const { data, error } = await sb.from('heritage_docs').insert({ ...payload, status: 'approved' }).select().single()
        if (error) throw error
        id = data.id
      } else {
        const upd = approveAfter ? { ...payload, status: 'approved' } : payload
        const { error } = await sb.from('heritage_docs').update(upd).eq('id', id)
        if (error) throw error
      }

      // অ্যালবাম: মুছে ফেলা ছবি ডিলিট
      if (removedIds.length) {
        const { error } = await sb.from('heritage_albums').delete().in('id', removedIds)
        if (error) throw error
      }
      // অ্যালবাম: নতুন ছবি ইনসার্ট
      if (newAlbum.length) {
        const rows = newAlbum.map((u) => ({ heritage_id: id, category: 'pandal', image_url: u.url, image_path: u.path }))
        const { error } = await sb.from('heritage_albums').insert(rows)
        if (error) throw error
      }

      notify(mode === 'create' ? 'নতুন হেরিটেজ নথি প্রকাশিত হয়েছে!' : approveAfter ? 'সেভ ও অনুমোদন হয়েছে!' : 'সফলভাবে সেভ হয়েছে!')
      onSaved()
    } catch (err) {
      notify(err.message || 'কিছু একটা ভুল হয়েছে', 'err')
    }
    setBusy(false)
  }

  const photoHint = 'প্রস্তাবিত: ১২০০px চওড়া, ১ MB এর মধ্যে (JPG/WebP)'

  return (
    <div className="space-y-5">
      {/* ১. মূল তথ্য */}
      <div className={box}>
        <h4 className="font-bold text-amber-400">১. মূল তথ্য</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={lbl}>মণ্ডপ *</label>
            <select className={inp} value={form.mandap_id} onChange={(e) => set('mandap_id', e.target.value)}>
              <option value="">-- মণ্ডপ নির্বাচন করুন --</option>
              {mandapList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name_bn || m.name} ({m.area})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>ব্লগ শিরোনাম</label>
            <input className={inp} placeholder="Optional" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>পূজার বছর *</label>
            <input type="number" className={inp} value={form.year} onChange={(e) => set('year', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className={lbl}>সংগ্রাহক / জমা দাতা</label>
            <input className={inp} value={form.submitted_by} onChange={(e) => set('submitted_by', e.target.value)} />
          </div>
          <div className="sm:col-span-1 max-w-sm">
            <ImageSlot label="🖼 থাম্বনেইল পোস্ট (কার্ড ও প্রচ্ছদে দেখাবে)" hint="প্রস্তাবিত: স্কয়ার ১২০০×১২০০" url={form.thumbnail_post} onChange={(u) => set('thumbnail_post', u)} onZoom={onZoom} />
          </div>
        </div>
      </div>

      {/* ২. স্থান */}
      <div className={box}>
        <h4 className="font-bold text-amber-400">২. স্থান ও স্থানান্তর</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>স্থানের প্রকৃতি</label>
            <select className={inp} value={form.location_type} onChange={(e) => set('location_type', e.target.value)}>
              {Object.entries(LOCATION_LABELS).map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={!!form.location_changed} onChange={(e) => set('location_changed', e.target.checked)} />
            এই বছর স্থান পরিবর্তন হয়েছিল?
          </label>
        </div>
        {form.location_changed && (
          <textarea rows={3} className={inp} placeholder="স্থান পরিবর্তনের বিবরণ" value={form.location_change_history} onChange={(e) => set('location_change_history', e.target.value)} />
        )}
        <div>
          <label className={lbl}>পূজা-পরবর্তী স্থানের অবস্থা (Optional)</label>
          <input className={inp} value={form.post_puja_site_status} onChange={(e) => set('post_puja_site_status', e.target.value)} />
        </div>
      </div>

      {/* ৩. কারিগর */}
      <div className={box}>
        <h4 className="font-bold text-amber-400">৩. নেপথ্যের শিল্পী ও কারিগর (নাম ও ছবি)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ['pandal_architect', 'মণ্ডপ আর্কিটেক্ট'],
            ['lighting_artist', 'লাইটিং কারিগর'],
            ['statue_artist', 'প্রতিমা ভাস্কর']
          ].map(([k, t]) => (
            <div key={k} className="space-y-2">
              <input className={inp} placeholder={t} value={form[k]} onChange={(e) => set(k, e.target.value)} />
              <ImageSlot label={`${t} — ছবি`} hint="প্রস্তাবিত: স্কয়ার ৪০০×৪০০ (মুখ মাঝখানে)" url={form[`${k}_photo`]} onChange={(u) => set(`${k}_photo`, u)} onZoom={onZoom} />
            </div>
          ))}
        </div>
      </div>

      {/* ৪. প্রতিমা */}
      <div className={box}>
        <h4 className="font-bold text-amber-400">৪. প্রতিমা ও থিম</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="number" className={inp} placeholder="প্রতিমার উচ্চতা (ফুট)" value={form.statue_height_ft} onChange={(e) => set('statue_height_ft', e.target.value)} />
          <input className={inp} placeholder="প্রতিমার থিম / মূল ভাবনা" value={form.statue_theme} onChange={(e) => set('statue_theme', e.target.value)} />
        </div>
      </div>

      {/* ৫. সার্কুলেশন */}
      <div className={box}>
        <h4 className="font-bold text-amber-400">৫. প্রবেশ ও প্রস্থান পথ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <textarea rows={2} className={inp} placeholder="🟢 প্রবেশ পথের বর্ণনা" value={form.entry_point} onChange={(e) => set('entry_point', e.target.value)} />
            <ImageSlot label="প্রবেশ পথের ছবি" hint="প্রস্তাবিত: ল্যান্ডস্কেপ ১২০০×৬৭৫" url={form.entry_point_photo} onChange={(u) => set('entry_point_photo', u)} onZoom={onZoom} />
          </div>
          <div className="space-y-2">
            <textarea rows={2} className={inp} placeholder="🔴 প্রস্থান পথের বর্ণনা" value={form.exit_point} onChange={(e) => set('exit_point', e.target.value)} />
            <ImageSlot label="প্রস্থান পথের ছবি" hint="প্রস্তাবিত: ল্যান্ডস্কেপ ১২০০×৬৭৫" url={form.exit_point_photo} onChange={(u) => set('exit_point_photo', u)} onZoom={onZoom} />
          </div>
        </div>
      </div>

      {/* ৬. হেরিটেজ বর্ণনা */}
      <div className={box}>
        <h4 className="font-bold text-amber-400">৬. হেরিটেজ বর্ণনা (বিস্তারিত)</h4>
        <textarea rows={8} className={`${inp} resize-y`} placeholder="ইতিহাস, ঐতিহ্য, রীতিনীতি, স্মৃতি..." value={form.heritage_description} onChange={(e) => set('heritage_description', e.target.value)} />
        <p className="text-[11px] text-gray-500 text-right">{(form.heritage_description || '').length} অক্ষর</p>
      </div>

      {/* ৭. কাস্টম সেকশন */}
      <div className={box}>
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-emerald-400">🧩 ৭. কাস্টম সেকশন ({sections.length})</h4>
          <button
            type="button"
            onClick={() => setSections((a) => [...a, { title: '', content: '', image_url: null }])}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
          >
            + নতুন সেকশন
          </button>
        </div>
        {!sections.length && <p className="text-xs text-gray-500">কোনো কাস্টম সেকশন নেই।</p>}
        {sections.map((s, i) => (
          <SectionEditor key={i} sec={s} index={i} total={sections.length} onChange={changeSection} onMove={moveSection} onRemove={removeSection} onZoom={onZoom} />
        ))}
      </div>

      {/* ৮. ফটো অ্যালবাম */}
      <div className={box}>
        <h4 className="font-bold text-amber-400">
          🖼 ৮. ফটো অ্যালবাম ({oldAlbum.length - removedIds.length + newAlbum.length}টি ছবি)
        </h4>
        {(oldAlbum.length > 0 || newAlbum.length > 0) && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {oldAlbum.map((a) => {
              const removed = removedIds.includes(a.id)
              return (
                <div key={a.id} className={`relative rounded-lg overflow-hidden border ${removed ? 'border-rose-500 opacity-40' : 'border-gray-700'}`}>
                  <img src={a.image_url} alt="" onClick={() => onZoom(a.image_url)} className="w-full h-24 object-cover cursor-zoom-in" />
                  <button
                    type="button"
                    onClick={() => setRemovedIds((ids) => (removed ? ids.filter((x) => x !== a.id) : [...ids, a.id]))}
                    className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${removed ? 'bg-emerald-600' : 'bg-rose-600'}`}
                  >
                    {removed ? '↺ ফেরান' : '✕'}
                  </button>
                </div>
              )
            })}
            {newAlbum.map((u, i) => (
              <div key={u.url} className="relative rounded-lg overflow-hidden border border-emerald-500">
                <img src={u.url} alt="" onClick={() => onZoom(u.url)} className="w-full h-24 object-cover cursor-zoom-in" />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-[10px] font-bold">নতুন</span>
                <button
                  type="button"
                  onClick={() => setNewAlbum((arr) => arr.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <AlbumUploader onAdd={(uploaded) => setNewAlbum((arr) => [...arr, ...uploaded])} />
        <p className="text-[11px] text-gray-500">লাল ✕ চাপলে ছবিটি মুছে ফেলার জন্য চিহ্নিত হবে; "সেভ" চাপলে তবেই আসলে মুছবে।</p>
        <p className="text-[10px] text-gray-500">{photoHint}</p>
      </div>

      {/* অ্যাকশন */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => save(false)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-sm shadow-lg cursor-pointer disabled:opacity-60"
        >
          {busy ? 'সেভ হচ্ছে…' : mode === 'create' ? '🚀 পাবলিশ করুন' : '💾 সেভ করুন'}
        </button>
        {mode === 'edit' && doc?.status === 'pending' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => save(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer disabled:opacity-60"
          >
            ✓ সেভ ও অ্যাপ্রুভ
          </button>
        )}
        <button type="button" disabled={busy} onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm cursor-pointer">
          বাতিল
        </button>
      </div>
    </div>
  )
}

/* ───────────────────── একটি ডকুমেন্টের কার্ড (সব ছবি যাচাই করার প্রিভিউ) ───────────────────── */

const Info = ({ k, v }) =>
  v ? (
    <p className="text-sm text-gray-300 leading-relaxed">
      <b className="text-gray-400">{k}:</b> {v}
    </p>
  ) : null

function DocCard({ doc, albums, kind, onApprove, onEdit, onDelete, onUnpublish, onZoom }) {
  const [open, setOpen] = useState(kind === 'pending') // পেন্ডিং হলে সব খোলা, যাতে অ্যাডমিন সরাসরি যাচাই করতে পারে
  const mName = doc.mandaps?.name_bn || doc.mandaps?.name || ''

  const slots = [
    ['থাম্বনেইল', doc.thumbnail_post, ''],
    ['আর্কিটেক্ট', doc.pandal_architect_photo, doc.pandal_architect],
    ['লাইটিং', doc.lighting_artist_photo, doc.lighting_artist],
    ['ভাস্কর', doc.statue_artist_photo, doc.statue_artist],
    ['প্রবেশ পথ', doc.entry_point_photo, ''],
    ['প্রস্থান পথ', doc.exit_point_photo, '']
  ]
  const sections = Array.isArray(doc.custom_sections) ? doc.custom_sections : []
  const photoCount = slots.filter((s) => s[1]).length + albums.length + sections.filter((s) => s.image_url).length

  return (
    <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
      <div className="flex gap-4 items-start flex-wrap">
        {doc.thumbnail_post ? (
          <img src={doc.thumbnail_post} alt="" onClick={() => onZoom(doc.thumbnail_post)} className="w-24 h-24 rounded-xl object-cover cursor-zoom-in border border-gray-700" />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-orange-500/10 border border-dashed border-orange-500/40 flex items-center justify-center text-xs text-orange-300 text-center p-1">থাম্বনেইল নেই</div>
        )}
        <div className="flex-1 min-w-[200px]">
          <h4 className="text-lg font-bold text-orange-400">{doc.title || `${mName} (${doc.year})`}</h4>
          <p className="text-xs text-gray-400">
            {mName} · {doc.year} সাল · জমা: {doc.submitted_by || 'Admin'}
            {doc.submitter_email ? ` (${doc.submitter_email})` : ''} · {new Date(doc.created_at).toLocaleDateString('bn-BD')}
          </p>
          <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">📷 মোট ছবি: {photoCount}</span>
            {!doc.heritage_description && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">⚠ বর্ণনা নেই</span>}
            {!doc.thumbnail_post && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">⚠ থাম্বনেইল নেই</span>}
          </div>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-bold cursor-pointer">
          {open ? '▲ গুটিয়ে নিন' : '▼ সব তথ্য ও ছবি দেখুন'}
        </button>
      </div>

      {open && (
        <div className="space-y-4 pt-2 border-t border-gray-800">
          {/* প্রধান ছবিগুলো */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {slots.map(([t, url, name]) => (
              <div key={t} className="text-center">
                {url ? (
                  <img src={url} alt="" onClick={() => onZoom(url)} className="w-full h-24 object-cover rounded-lg border border-gray-700 cursor-zoom-in" />
                ) : (
                  <div className="w-full h-24 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-[11px] text-gray-500">নেই</div>
                )}
                <div className="text-[11px] text-gray-400 mt-1">{t}</div>
                {name && <div className="text-[11px] font-semibold text-gray-200 truncate">{name}</div>}
              </div>
            ))}
          </div>

          {/* লেখা */}
          <div className="space-y-1.5">
            <Info k="স্থানের প্রকৃতি" v={LOCATION_LABELS[doc.location_type]} />
            {doc.location_changed && <Info k="স্থান পরিবর্তনের বিবরণ" v={doc.location_change_history} />}
            <Info k="পূজা-পরবর্তী স্থানের অবস্থা" v={doc.post_puja_site_status} />
            <Info k="প্রতিমার উচ্চতা" v={doc.statue_height_ft ? `${doc.statue_height_ft} ফুট` : ''} />
            <Info k="প্রতিমার থিম" v={doc.statue_theme} />
            <Info k="প্রবেশ পথ" v={doc.entry_point} />
            <Info k="প্রস্থান পথ" v={doc.exit_point} />
          </div>

          {doc.heritage_description && (
            <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700">
              <div className="text-xs font-bold text-orange-400 mb-1">হেরিটেজ বর্ণনা</div>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">{doc.heritage_description}</p>
            </div>
          )}

          {sections.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-400">কাস্টম সেকশন ({sections.length})</div>
              {sections.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-800/60 border border-gray-700 flex gap-3">
                  {s.image_url && <img src={s.image_url} alt="" onClick={() => onZoom(s.image_url)} className="w-20 h-20 rounded-lg object-cover cursor-zoom-in shrink-0" />}
                  <div className="text-sm">
                    <b className="text-gray-100">{s.title || 'Untitled'}</b>
                    <p className="text-gray-300 whitespace-pre-line line-clamp-4">{s.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {albums.length > 0 && (
            <div>
              <div className="text-xs font-bold text-amber-400 mb-2">ফটো অ্যালবাম ({albums.length}টি)</div>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
                {albums.map((a) => (
                  <img key={a.id} src={a.image_url} alt="" onClick={() => onZoom(a.image_url)} className="w-full h-20 object-cover rounded-lg border border-gray-700 cursor-zoom-in" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* অ্যাকশন বাটন */}
      <div className="flex flex-wrap gap-2 pt-1">
        {kind === 'pending' && (
          <button onClick={() => onApprove(doc.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-sm cursor-pointer">✓ Approve</button>
        )}
        <button onClick={() => onEdit(doc.id)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 font-bold rounded-xl text-sm cursor-pointer">✏ Edit (ছবি ও তথ্য)</button>
        {kind === 'published' && (
          <>
            <a href={`/heritage?docId=${doc.id}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 font-bold rounded-xl text-sm no-underline text-white">📖 বইটি দেখুন</a>
            <button onClick={() => onUnpublish(doc.id)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 font-bold rounded-xl text-sm cursor-pointer">↩ Unpublish</button>
          </>
        )}
        <button onClick={() => onDelete(doc.id)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 font-bold rounded-xl text-sm cursor-pointer">🗑 Delete</button>
      </div>
    </div>
  )
}

/* ───────────────────────── মূল অ্যাডমিন হেরিটেজ প্যানেল ───────────────────────── */

export default function AdminHeritage() {
  const [mandapList, setMandapList] = useState([])
  const [pending, setPending] = useState([])
  const [published, setPublished] = useState([])
  const [albumsByDoc, setAlbumsByDoc] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [zoom, setZoom] = useState(null)
  const [q, setQ] = useState('')
  const [note, setNote] = useState(null) // { text, type }

  function notify(text, type = 'ok') {
    setNote({ text, type })
    setTimeout(() => setNote(null), 6000)
  }

  async function loadData() {
    const { data: mData } = await sb.from('mandaps').select('id, name, name_bn, area').eq('status', 'approved').order('name', { ascending: true })
    setMandapList(mData || [])

    const { data: pData } = await sb.from('heritage_docs').select('*, mandaps(name, name_bn)').eq('status', 'pending').order('created_at', { ascending: false })
    const { data: aData } = await sb.from('heritage_docs').select('*, mandaps(name, name_bn)').eq('status', 'approved').order('created_at', { ascending: false })
    setPending(pData || [])
    setPublished(aData || [])

    const ids = [...(pData || []), ...(aData || [])].map((d) => d.id)
    if (ids.length) {
      const { data: alb } = await sb.from('heritage_albums').select('*').in('heritage_id', ids)
      const map = {}
      ;(alb || []).forEach((a) => {
        ;(map[a.heritage_id] ||= []).push(a)
      })
      setAlbumsByDoc(map)
    } else setAlbumsByDoc({})
  }

  useEffect(() => {
    loadData()
  }, [])

  async function approve(id) {
    const { error } = await sb.from('heritage_docs').update({ status: 'approved' }).eq('id', id)
    if (error) notify(error.message, 'err')
    else {
      notify('অনুমোদিত হয়েছে!')
      loadData()
    }
  }

  async function unpublish(id) {
    if (!confirm('এই আর্টিকেলটি পাবলিক পেজ থেকে সরিয়ে পেন্ডিং-এ পাঠাবেন?')) return
    const { error } = await sb.from('heritage_docs').update({ status: 'pending' }).eq('id', id)
    if (error) notify(error.message, 'err')
    else {
      notify('পেন্ডিং-এ পাঠানো হয়েছে।')
      loadData()
    }
  }

  async function delDoc(id) {
    if (!confirm('আপনি কি এই হেরিটেজ ডাটা (অ্যালবামসহ) মুছে ফেলতে চান? এটি আর ফেরত আসবে না।')) return
    await sb.from('heritage_albums').delete().eq('heritage_id', id)
    const { error } = await sb.from('heritage_docs').delete().eq('id', id)
    if (error) notify(error.message, 'err')
    else {
      notify('মুছে ফেলা হয়েছে!')
      if (editingId === id) setEditingId(null)
      loadData()
    }
  }

  const afterSave = () => {
    setEditingId(null)
    setShowCreate(false)
    loadData()
  }

  const needle = q.trim().toLowerCase()
  const filteredPublished = published.filter((p) =>
    !needle ? true : `${p.title || ''} ${p.mandaps?.name_bn || ''} ${p.mandaps?.name || ''} ${p.year} ${p.submitted_by || ''}`.toLowerCase().includes(needle)
  )

  const renderDoc = (d, kind) =>
    editingId === d.id ? (
      <div key={d.id} className="p-5 rounded-2xl bg-gray-900 border border-orange-500/40">
        <h4 className="font-bold text-orange-400 mb-4">✏ সম্পাদনা করুন — {d.mandaps?.name_bn || d.mandaps?.name} ({d.year})</h4>
        <DocEditor
          mode="edit"
          doc={d}
          existingAlbums={albumsByDoc[d.id] || []}
          mandapList={mandapList}
          onSaved={afterSave}
          onCancel={() => setEditingId(null)}
          notify={notify}
          onZoom={setZoom}
        />
      </div>
    ) : (
      <DocCard
        key={d.id}
        doc={d}
        albums={albumsByDoc[d.id] || []}
        kind={kind}
        onApprove={approve}
        onEdit={(id) => {
          setShowCreate(false)
          setEditingId(id)
        }}
        onDelete={delDoc}
        onUnpublish={unpublish}
        onZoom={setZoom}
      />
    )

  return (
    <div className="ah-root max-w-5xl mx-auto p-4 sm:p-6 space-y-8 bg-gray-950 text-gray-100 rounded-3xl border border-gray-800">
      {/* সাইটের গ্লোবাল input CSS যেন এই প্যানেলের লেখা/ব্যাকগ্রাউন্ড উল্টে না দেয় */}
      <style>{`
        .ah-root input:not([type='checkbox']):not([type='file']):not([type='radio']),
        .ah-root textarea,
        .ah-root select {
          background-color: #1f2937 !important;
          color: #f3f4f6 !important;
          border-color: #374151 !important;
        }
        .ah-root input::placeholder,
        .ah-root textarea::placeholder { color: #6b7280 !important; }
      `}</style>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-orange-500">📋 হেরিটেজ এডমিন কন্ট্রোল প্যানেল</h2>
        <button
          onClick={() => {
            setEditingId(null)
            setShowCreate((s) => !s)
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-sm shadow-lg cursor-pointer"
        >
          {showCreate ? '✕ ফর্ম বন্ধ করুন' : '➕ নতুন হেরিটেজ নথি'}
        </button>
      </div>

      {note && (
        <p
          className={`p-3 rounded-xl text-sm border ${
            note.type === 'err' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {note.text}
        </p>
      )}

      {/* নতুন তৈরি */}
      {showCreate && (
        <div className="p-5 rounded-2xl bg-gray-900 border border-amber-500/30">
          <h3 className="text-xl font-bold text-amber-400 mb-4">➕ নতুন হেরিটেজ নথি প্রকাশ করুন (Admin Create)</h3>
          <DocEditor mode="create" mandapList={mandapList} onSaved={afterSave} onCancel={() => setShowCreate(false)} notify={notify} onZoom={setZoom} />
        </div>
      )}

      {/* পেন্ডিং */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-amber-400">⏳ ইউজারদের পেন্ডিং সাবমিশন ({pending.length})</h3>
        {!pending.length && <p className="text-sm text-gray-400">কোনো পেন্ডিং সাবমিশন নেই।</p>}
        {pending.map((d) => renderDoc(d, 'pending'))}
      </div>

      {/* প্রকাশিত */}
      <div className="space-y-4 pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xl font-bold text-emerald-400">✅ প্রকাশিত হেরিটেজ আর্টিকেল ({published.length})</h3>
          <input className={`${inp} max-w-xs`} placeholder="🔍 মণ্ডপ / সাল / শিরোনাম খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!filteredPublished.length && <p className="text-sm text-gray-400">কিছু পাওয়া যায়নি।</p>}
        {filteredPublished.map((d) => renderDoc(d, 'published'))}
      </div>

      {/* ছবি বড় করে দেখা */}
      {zoom && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 text-white font-bold cursor-pointer">✕</button>
        </div>
      )}
    </div>
  )
}