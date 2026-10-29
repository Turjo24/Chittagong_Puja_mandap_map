import { useEffect, useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'

export default function AdminHeritage() {
  const [mandapList, setMandapList] = useState([])
  const [pending, setPending] = useState([])
  const [published, setPublished] = useState([])
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  // ---- এডমিন সরাসরি নতুন হেরিটেজ যোগ করার ফরম স্টেট ----
  const [createForm, setCreateForm] = useState({
    mandap_id: '',
    title: '',
    year: new Date().getFullYear(),
    location_type: 'open_field',
    location_changed: false,
    location_change_history: '',
    pandal_architect: '',
    lighting_artist: '',
    statue_artist: '',
    statue_height_ft: '',
    statue_theme: '',
    entry_point: '',
    exit_point: '',
    submitted_by: 'Admin'
  })

  // কাস্টম সেকশন স্টেট (নতুন পোস্টের জন্য)
  const [customSections, setCustomSections] = useState([])
  const [cTitle, setCTitle] = useState('')
  const [cContent, setCContent] = useState('')
  const [cFiles, setCFiles] = useState([])

  // এডিট মোডের জন্য নতুন কাস্টম সেকশন স্টেট
  const [editSecTitle, setEditSecTitle] = useState('')
  const [editSecContent, setEditSecContent] = useState('')
  const [editSecFiles, setEditSecFiles] = useState([])

  // ছবি আপলোড স্টেট (নতুন পোস্ট তৈরি করার জন্য)
  const [architectFiles, setArchitectFiles] = useState([])
  const [lightingFiles, setLightingFiles] = useState([])
  const [statueFiles, setStatueFiles] = useState([])
  const [entryFiles, setEntryFiles] = useState([])
  const [exitFiles, setExitFiles] = useState([])

  async function loadData() {
    const { data: mData } = await sb.from('mandaps').select('id, name, name_bn, area').eq('status', 'approved').order('name', { ascending: true })
    setMandapList(mData || [])

    const { data: pData } = await sb.from('heritage_docs').select('*, mandaps(name, name_bn)').eq('status', 'pending').order('created_at', { ascending: false })
    setPending(pData || [])

    const { data: aData } = await sb.from('heritage_docs').select('*, mandaps(name, name_bn)').eq('status', 'approved').order('created_at', { ascending: false })
    setPublished(aData || [])
  }

  useEffect(() => { loadData() }, [])

  // ---- এডমিন নতুন ডায়নামিক সেকশন যোগ করবে (নতুন পোস্টে) ----
  async function addCustomSectionToNew() {
    if (!cTitle.trim() && !cContent.trim()) return alert('সেকশনের শিরোনাম বা বিবরণ দিন')
    setBusy(true)
    try {
      let image_url = null
      if (cFiles.length) {
        const err = check(cFiles)
        if (err) throw new Error(err)
        image_url = (await uploadAll(cFiles.slice(0, 1)))[0]?.url
      }
      setCustomSections([...customSections, { title: cTitle.trim(), content: cContent.trim(), image_url }])
      setCTitle('')
      setCContent('')
      setCFiles([])
    } catch (err) {
      alert(err.message)
    }
    setBusy(false)
  }

  function removeCustomSectionNew(index) {
    setCustomSections(customSections.filter((_, i) => i !== index))
  }

  // ---- এডমিন নতুন হেরিটেজ ডাটা সরাসরি তৈরি করবে ----
  async function handleAdminCreate(e) {
    e.preventDefault()
    if (!createForm.mandap_id) return setMsg('অনুগ্রহ করে একটি মণ্ডপ সিলেক্ট করুন!')
    setBusy(true)
    setMsg('')

    try {
      let pandal_architect_photo = null
      let lighting_artist_photo = null
      let statue_artist_photo = null
      let entry_point_photo = null
      let exit_point_photo = null

      if (architectFiles.length) pandal_architect_photo = (await uploadAll(architectFiles.slice(0, 1)))[0]?.url
      if (lightingFiles.length) lighting_artist_photo = (await uploadAll(lightingFiles.slice(0, 1)))[0]?.url
      if (statueFiles.length) statue_artist_photo = (await uploadAll(statueFiles.slice(0, 1)))[0]?.url
      if (entryFiles.length) entry_point_photo = (await uploadAll(entryFiles.slice(0, 1)))[0]?.url
      if (exitFiles.length) exit_point_photo = (await uploadAll(exitFiles.slice(0, 1)))[0]?.url

      const { error } = await sb.from('heritage_docs').insert({
        ...createForm,
        mandap_id: +createForm.mandap_id,
        year: +createForm.year,
        title: createForm.title.trim() || null,
        statue_height_ft: createForm.statue_height_ft ? +createForm.statue_height_ft : null,
        pandal_architect_photo,
        lighting_artist_photo,
        statue_artist_photo,
        entry_point_photo,
        exit_point_photo,
        custom_sections: customSections,
        status: 'approved' // এডমিন তৈরি করায় সরাসরি Approved হবে
      })

      if (error) throw error

      setMsg('নতুন হেরিটেজ আর্টিকেল সফলভাবে প্রকাশিত হয়েছে!')
      setCreateForm({
        mandap_id: '', title: '', year: new Date().getFullYear(), location_type: 'open_field',
        location_changed: false, location_change_history: '', pandal_architect: '', lighting_artist: '',
        statue_artist: '', statue_height_ft: '', statue_theme: '', entry_point: '', exit_point: '', submitted_by: 'Admin'
      })
      setCustomSections([])
      setArchitectFiles([]); setLightingFiles([]); setStatueFiles([]); setEntryFiles([]); setExitFiles([])
      loadData()
    } catch (err) {
      setMsg(err.message)
    }
    setBusy(false)
  }

  // ---- Approve / Reject ----
  async function approve(id) {
    const { error } = await sb.from('heritage_docs').update({ status: 'approved' }).eq('id', id)
    if (error) setMsg(error.message)
    else { setMsg('অনুমোদিত হয়েছে!'); loadData() }
  }

  async function delDoc(id) {
    if (!confirm('আপনি কি এই হেরিটেজ ডাটা মুছে ফেলতে চান?')) return
    const { error } = await sb.from('heritage_docs').delete().eq('id', id)
    if (error) setMsg(error.message)
    else { setMsg('মুছে ফেলা হয়েছে!'); loadData() }
  }

  // ---- এডিট মোডে ডায়নামিক সেকশন যুক্ত করা ----
  async function addCustomSectionToEdit() {
    if (!editSecTitle.trim() && !editSecContent.trim()) return alert('সেকশনের শিরোনাম বা বিবরণ দিন')
    setBusy(true)
    try {
      let image_url = null
      if (editSecFiles.length) {
        const err = check(editSecFiles)
        if (err) throw new Error(err)
        image_url = (await uploadAll(editSecFiles.slice(0, 1)))[0]?.url
      }

      const existing = Array.isArray(editing.custom_sections) ? editing.custom_sections : []
      setEditing({ ...editing, custom_sections: [...existing, { title: editSecTitle.trim(), content: editSecContent.trim(), image_url }] })
      setEditSecTitle('')
      setEditSecContent('')
      setEditSecFiles([])
    } catch (err) {
      alert(err.message)
    }
    setBusy(false)
  }

  function removeCustomSectionEdit(index) {
    const updated = editing.custom_sections.filter((_, i) => i !== index)
    setEditing({ ...editing, custom_sections: updated })
  }

  // ---- Save Existing Edit ----
  async function saveEdit() {
    setBusy(true)
    try {
      const { error } = await sb.from('heritage_docs').update({
        title: editing.title,
        year: +editing.year,
        location_type: editing.location_type,
        location_changed: editing.location_changed,
        location_change_history: editing.location_change_history,
        pandal_architect: editing.pandal_architect,
        lighting_artist: editing.lighting_artist,
        statue_artist: editing.statue_artist,
        statue_height_ft: editing.statue_height_ft ? +editing.statue_height_ft : null,
        statue_theme: editing.statue_theme,
        entry_point: editing.entry_point,
        exit_point: editing.exit_point,
        custom_sections: editing.custom_sections || []
      }).eq('id', editing.id)

      if (error) throw error
      setMsg('সফলভাবে সেভ হয়েছে!')
      setEditing(null)
      loadData()
    } catch (err) {
      setMsg(err.message)
    }
    setBusy(false)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10 text-gray-100">
      <h2 className="text-3xl font-extrabold text-orange-500">📋 হেরিটেজ এডমিন কন্ট্রোল প্যানেল</h2>
      {msg && <p className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm">{msg}</p>}

      {/* ================= ১. এডমিন থেকে সরাসরি নতুন হেরিটেজ পোস্ট তৈরি ================= */}
      <form onSubmit={handleAdminCreate} className="p-6 bg-gray-900 border border-gray-800 rounded-2xl space-y-6">
        <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <span>➕</span> নতুন হেরিটেজ নথি প্রকাশ করুন (Admin Create)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">মণ্ডপ সিলেক্ট করুন *</label>
            <select
              required
              className="w-full p-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm outline-none"
              value={createForm.mandap_id}
              onChange={(e) => setCreateForm({ ...createForm, mandap_id: e.target.value })}
            >
              <option value="">-- মণ্ডপ নির্বাচন করুন --</option>
              {mandapList.map((m) => (
                <option key={m.id} value={m.id}>{m.name_bn || m.name} ({m.area})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">ব্লগ শিরোনাম</label>
            <input
              className="w-full p-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm outline-none"
              placeholder="শিরোনাম (Optional)"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">পূজার বছর *</label>
            <input
              type="number"
              required
              className="w-full p-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm outline-none"
              value={createForm.year}
              onChange={(e) => setCreateForm({ ...createForm, year: e.target.value })}
            />
          </div>
        </div>

        {/* রূপকার ও নেপথ্যের কারিগর */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-800/40 rounded-xl border border-gray-800">
          <div>
            <input className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm mb-2" placeholder="মণ্ডপ আর্কিটেক্ট" value={createForm.pandal_architect} onChange={(e) => setCreateForm({ ...createForm, pandal_architect: e.target.value })} />
            <PhotoPicker files={architectFiles} setFiles={setArchitectFiles} label="আর্কিটেক্ট ছবি" />
          </div>
          <div>
            <input className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm mb-2" placeholder="লাইটিং শিল্পী" value={createForm.lighting_artist} onChange={(e) => setCreateForm({ ...createForm, lighting_artist: e.target.value })} />
            <PhotoPicker files={lightingFiles} setFiles={setLightingFiles} label="লাইটিং ছবি" />
          </div>
          <div>
            <input className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm mb-2" placeholder="প্রতিমা ভাস্কর" value={createForm.statue_artist} onChange={(e) => setCreateForm({ ...createForm, statue_artist: e.target.value })} />
            <PhotoPicker files={statueFiles} setFiles={setStatueFiles} label="ভাস্কর ছবি" />
          </div>
        </div>

        {/* ডায়নামিক কাস্টম সেকশন সংযোজন বাক্স */}
        <div className="p-4 bg-gray-800/60 rounded-xl border border-dashed border-gray-700 space-y-3">
          <label className="text-sm font-bold text-emerald-400 block">🧩 যেকোনো কাস্টম সেকশন যুক্ত করুন (Custom Dynamic Sections)</label>

          {customSections.length > 0 && (
            <div className="space-y-2 mb-3">
              {customSections.map((sec, idx) => (
                <div key={idx} className="p-3 bg-gray-900 rounded-lg flex justify-between items-center text-xs">
                  <div><b>{sec.title || 'Untitled'}:</b> {sec.content?.slice(0, 40)}...</div>
                  <button type="button" onClick={() => removeCustomSectionNew(idx)} className="text-rose-400 font-bold">✕ রিমুভ</button>
                </div>
              ))}
            </div>
          )}

          <input className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm" placeholder="সেকশনের শিরোনাম (যেমন: ইতিহাস ও স্থান রূপান্তর)" value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
          <textarea rows={2} className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm" placeholder="সেকশনের বিস্তারিত টেক্সট বিবরণ..." value={cContent} onChange={(e) => setCContent(e.target.value)} />
          <PhotoPicker files={cFiles} setFiles={setCFiles} label="সেকশনের ছবি (Optional)" />
          
          <button type="button" disabled={busy} onClick={addCustomSectionToNew} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer">
            + কাস্টম সেকশন যুক্ত করুন
          </button>
        </div>

        <button disabled={busy} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 font-bold rounded-xl text-white shadow-lg cursor-pointer">
          {busy ? 'পাবলিশ হচ্ছে...' : '🚀 পাবলিশ করুন (Publish)'}
        </button>
      </form>

      {/* ================= ২. অপেক্ষায় থাকা ইউজার সাবমিশন ================= */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-amber-400">⏳ ইউজারদের প্যান্ডিং সাবমিশন ({pending.length})</h3>
        {!pending.length && <p className="text-sm text-gray-400">কোনো প্যান্ডিং সাবমিশন নেই।</p>}
        {pending.map((item) => (
          <div key={item.id} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-orange-400">{item.mandaps?.name_bn || item.mandaps?.name} ({item.year} সাল)</h4>
              <span className="text-xs text-gray-400">জমা দিয়েছেন: {item.submitted_by} ({item.submitter_email})</span>
            </div>
            <p className="text-sm text-gray-300"><b>আর্কিটেক্ট:</b> {item.pandal_architect || 'N/A'} | <b>ভাস্কর:</b> {item.statue_artist || 'N/A'}</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => approve(item.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-sm cursor-pointer">✓ Approve</button>
              <button onClick={() => delDoc(item.id)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 font-bold rounded-xl text-sm cursor-pointer">✕ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= ৩. প্রকাশিত আর্টিকেল সম্পাদনা ও ডিলেট (CRUD) ================= */}
      <div className="space-y-4 pt-6 border-t border-gray-800">
        <h3 className="text-xl font-bold text-emerald-400">✅ প্রকাশিত হেরিটেজ আর্টিকেলসমূহ ({published.length})</h3>
        {published.map((p) => (
          <div key={p.id} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
            {editing?.id === p.id ? (
              <div className="space-y-4 p-4 bg-gray-800/60 rounded-xl border border-gray-700">
                <h4 className="font-bold text-orange-400">সম্পাদনা করুন ({p.mandaps?.name})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm" placeholder="আর্টিকেলের শিরোনাম" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                  <input type="number" className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm" placeholder="সাল" value={editing.year || ''} onChange={(e) => setEditing({ ...editing, year: e.target.value })} />
                  <input className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm" placeholder="মণ্ডপ আর্কিটেক্ট" value={editing.pandal_architect || ''} onChange={(e) => setEditing({ ...editing, pandal_architect: e.target.value })} />
                  <input className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm" placeholder="লাইটিং কারিগর" value={editing.lighting_artist || ''} onChange={(e) => setEditing({ ...editing, lighting_artist: e.target.value })} />
                  <input className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm" placeholder="প্রতিমা ভাস্কর" value={editing.statue_artist || ''} onChange={(e) => setEditing({ ...editing, statue_artist: e.target.value })} />
                  <input className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm" placeholder="প্রতিমার থিম" value={editing.statue_theme || ''} onChange={(e) => setEditing({ ...editing, statue_theme: e.target.value })} />
                </div>

                {/* বিদ্যমান কাস্টম সেকশনসমূহ */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-orange-400">বিদ্যমান ডায়নামিক সেকশনসমূহ:</label>
                  {Array.isArray(editing.custom_sections) && editing.custom_sections.map((sec, idx) => (
                    <div key={idx} className="p-3 bg-gray-900 rounded-lg flex justify-between items-center text-xs">
                      <div><b>{sec.title || 'Untitled'}:</b> {sec.content?.slice(0, 50)}...</div>
                      <button type="button" onClick={() => removeCustomSectionEdit(idx)} className="text-rose-400 font-bold px-2">✕ রিমুভ</button>
                    </div>
                  ))}
                </div>

                {/* এডিটে নতুন সেকশন যোগ */}
                <div className="p-4 bg-gray-900/80 rounded-xl border border-dashed border-gray-700 space-y-3">
                  <label className="text-xs font-bold text-emerald-400">➕ নতুন কাস্টম সেকশন যুক্ত করুন</label>
                  <input className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm" placeholder="সেকশনের শিরোনাম" value={editSecTitle} onChange={(e) => setEditSecTitle(e.target.value)} />
                  <textarea rows={2} className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm" placeholder="সেকশনের বিষয়বস্তু..." value={editSecContent} onChange={(e) => setEditSecContent(e.target.value)} />
                  <PhotoPicker files={editSecFiles} setFiles={setEditSecFiles} label="ছবি (Optional)" />
                  <button type="button" disabled={busy} onClick={addCustomSectionToEdit} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                    + সেকশন যুক্ত করুন
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button disabled={busy} onClick={saveEdit} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm cursor-pointer">সেভ করুন</button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-700 text-white font-bold rounded-xl text-sm cursor-pointer">বাতিল</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">{p.title || `${p.mandaps?.name_bn || p.mandaps?.name} (${p.year})`}</h4>
                  <p className="text-xs text-gray-400">আর্কিটেক্ট: {p.pandal_architect || 'N/A'} · সাল: {p.year}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ ...p })} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer">Edit</button>
                  <button onClick={() => delDoc(p.id)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}