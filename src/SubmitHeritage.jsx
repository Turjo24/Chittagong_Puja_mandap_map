import { useState } from 'react'
import { sb } from './supabase'
import PhotoPicker from './PhotoPicker'
import { check, uploadAll } from './upload'

export default function SubmitHeritage({ mandapId, onClose }) {
  const [form, setForm] = useState({
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
    post_puja_site_status: '',
    submitted_by: '',
    submitter_email: ''
  })

  // ছবির স্টেটসমূহ
  const [architectFiles, setArchitectFiles] = useState([])
  const [lightingFiles, setLightingFiles] = useState([])
  const [statueFiles, setStatueFiles] = useState([])
  const [entryFiles, setEntryFiles] = useState([])
  const [exitFiles, setExitFiles] = useState([])
  const [albumFiles, setAlbumFiles] = useState([])

  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!mandapId) return setMsg('অনুগ্রহ করে একটি মণ্ডপ সিলেক্ট করুন!')
    setBusy(true)
    setMsg('')

    try {
      // ১. প্রোফাইল ও ফিচারড ছবির আপলোড
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

      // ২. heritage_docs টেবিলে ইনসার্ট
      const { data: doc, error: docErr } = await sb
        .from('heritage_docs')
        .insert({
          ...form,
          mandap_id: +mandapId,
          year: +form.year,
          title: form.title.trim() || null,
          statue_height_ft: form.statue_height_ft ? +form.statue_height_ft : null,
          pandal_architect_photo,
          lighting_artist_photo,
          statue_artist_photo,
          entry_point_photo,
          exit_point_photo,
          status: 'pending'
        })
        .select()
        .single()

      if (docErr) throw docErr

      // ৩. ফটো অ্যালবামের ছবিগুলো আপলোড
      if (albumFiles.length) {
        const err = check(albumFiles)
        if (err) throw new Error(err)
        const uploaded = await uploadAll(albumFiles)
        const albumData = uploaded.map((u) => ({
          heritage_id: doc.id,
          category: 'pandal',
          image_url: u.url,
          image_path: u.path
        }))
        await sb.from('heritage_albums').insert(albumData)
      }

      setMsg('ধন্যবাদ! আপনার ডকুমেন্টেশন জমা হয়েছে। এডমিন রিভিউ করে অনুমোদন দিলেই এটি ব্লগে প্রদর্শিত হবে।')
      setTimeout(() => onClose?.(), 2000)
    } catch (err) {
      setMsg(err.message)
    }
    setBusy(false)
  }

  return (
    <div className="max-h-[85vh] overflow-y-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 space-y-6">
      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white text-center">
        🏛 বছরভিত্তিক হেরিটেজ ইনপুট ফর্ম
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* আর্টিকেলের মূল শিরোনাম ও সাল */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-orange-600 dark:text-orange-400 block mb-1">ব্লগ শিরোনাম (Optional)</label>
            <input
              type="text"
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
              placeholder="যেমন: জেএম সেন হলের শতবর্ষী পূজার রূপরেখা"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-orange-600 dark:text-orange-400 block mb-1">পূজার বছর *</label>
            <input
              type="number"
              min="1950"
              max="2100"
              required
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-center font-bold text-sm outline-none text-gray-800 dark:text-gray-100"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
        </div>

        {/* ১. স্থান ও নগরায়ণ ইতিহাস */}
        <div className="space-y-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-orange-600 dark:text-orange-400">১. স্থান ও স্থানান্তরের ইতিহাস</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">পূজার স্থান প্রকৃতি</label>
              <select
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
                value={form.location_type}
                onChange={(e) => setForm({ ...form, location_type: e.target.value })}
              >
                <option value="open_field">উন্মুক্ত মাঠ / প্রাঙ্গণ</option>
                <option value="building_under">বিল্ডিংয়ের নিচে / নিচতলা</option>
                <option value="temporary_pandal">অস্থায়ী মণ্ডপ (রাস্তায়/গলি)</option>
                <option value="permanent_premises">স্থায়ী মন্দির প্রাঙ্গণ</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="loc_change"
                checked={form.location_changed}
                onChange={(e) => setForm({ ...form, location_changed: e.target.checked })}
                className="w-5 h-5 accent-orange-500 cursor-pointer"
              />
              <label htmlFor="loc_change" className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">
                এই বছর স্থান পরিবর্তন হয়েছিল?
              </label>
            </div>
          </div>

          {form.location_changed && (
            <textarea
              rows={3}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
              placeholder="স্থান পরিবর্তনের বিশদ বর্ণনা (যেমন: আগে মাঠে হতো, নগরায়ণের ফলে বর্তমানে বিল্ডিংয়ের নিচে স্থানান্তরিত)..."
              value={form.location_change_history}
              onChange={(e) => setForm({ ...form, location_change_history: e.target.value })}
            />
          )}
        </div>

        {/* ২. শিল্পী ও নেপথ্যের কারিগর (নাম ও ছবি) */}
        <div className="space-y-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-orange-600 dark:text-orange-400">২. নেপথ্যের শিল্পী ও কারিগর (নাম ও ছবি)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <label className="text-xs font-bold block text-gray-700 dark:text-gray-300">মণ্ডপ আর্কিটেক্ট</label>
              <input
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
                placeholder="শিল্পীর নাম"
                value={form.pandal_architect}
                onChange={(e) => setForm({ ...form, pandal_architect: e.target.value })}
              />
              <PhotoPicker files={architectFiles} setFiles={setArchitectFiles} label="ছবি যুক্ত করুন" />
            </div>

            <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <label className="text-xs font-bold block text-gray-700 dark:text-gray-300">লাইটিং কারিগর</label>
              <input
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
                placeholder="শিল্পীর নাম"
                value={form.lighting_artist}
                onChange={(e) => setForm({ ...form, lighting_artist: e.target.value })}
              />
              <PhotoPicker files={lightingFiles} setFiles={setLightingFiles} label="ছবি যুক্ত করুন" />
            </div>

            <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <label className="text-xs font-bold block text-gray-700 dark:text-gray-300">প্রতিমা ভাস্কর</label>
              <input
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
                placeholder="ভাস্করের নাম"
                value={form.statue_artist}
                onChange={(e) => setForm({ ...form, statue_artist: e.target.value })}
              />
              <PhotoPicker files={statueFiles} setFiles={setStatueFiles} label="ছবি যুক্ত করুন" />
            </div>
          </div>
        </div>

        {/* ৩. প্রতিমার থিম ও পরিমাপ */}
        <div className="space-y-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-orange-600 dark:text-orange-400">৩. প্রতিমা ও থিম স্পেসিফিকেশন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              className="p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
              placeholder="প্রতিমার উচ্চতা (ফুটে, যেমন: ১৫)"
              value={form.statue_height_ft}
              onChange={(e) => setForm({ ...form, statue_height_ft: e.target.value })}
            />
            <input
              className="p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
              placeholder="প্রতিমার থিম / মূল ভাবনা"
              value={form.statue_theme}
              onChange={(e) => setForm({ ...form, statue_theme: e.target.value })}
            />
          </div>
        </div>

        {/* ৪. সার্কুলেশন ও এন্ট্রি-এক্সিট */}
        <div className="space-y-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-orange-600 dark:text-orange-400">৪. সার্কুলেশন (প্রবেশ ও প্রস্থান পথ)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
              <label className="text-xs font-bold block text-emerald-600 dark:text-emerald-400">🟢 প্রবেশ পথ (Entry Point)</label>
              <textarea
                rows={2}
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
                placeholder="প্রবেশ পথের বর্ণনা..."
                value={form.entry_point}
                onChange={(e) => setForm({ ...form, entry_point: e.target.value })}
              />
              <PhotoPicker files={entryFiles} setFiles={setEntryFiles} label="প্রবেশ পথের ছবি" />
            </div>

            <div className="space-y-2 p-3 bg-rose-500/5 rounded-xl border border-rose-500/20">
              <label className="text-xs font-bold block text-rose-600 dark:text-rose-400">🔴 প্রস্থান পথ (Exit Point)</label>
              <textarea
                rows={2}
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
                placeholder="প্রস্থান পথের বর্ণনা..."
                value={form.exit_point}
                onChange={(e) => setForm({ ...form, exit_point: e.target.value })}
              />
              <PhotoPicker files={exitFiles} setFiles={setExitFiles} label="প্রস্থান পথের ছবি" />
            </div>
          </div>
        </div>

        {/* ৫. ফটো অ্যালবাম */}
        <div className="space-y-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-orange-600 dark:text-orange-400">৫. ফটো অ্যালবাম</h3>
          <PhotoPicker files={albumFiles} setFiles={setAlbumFiles} label="মণ্ডপ ও আলোকসজ্জার একাধিক ছবি যুক্ত করুন" />
        </div>

        {/* ইউজার ইনফরমেশন */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <input
            required
            className="p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
            placeholder="আপনার নাম *"
            value={form.submitted_by}
            onChange={(e) => setForm({ ...form, submitted_by: e.target.value })}
          />
          <input
            required
            type="email"
            className="p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none text-gray-800 dark:text-gray-100"
            placeholder="আপনার ইমেইল *"
            value={form.submitter_email}
            onChange={(e) => setForm({ ...form, submitter_email: e.target.value })}
          />
        </div>

        <button
          disabled={busy}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {busy ? 'জমা হচ্ছে...' : 'জমা দিন'}
        </button>

        {msg && <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2">{msg}</p>}
      </form>
    </div>
  )
}