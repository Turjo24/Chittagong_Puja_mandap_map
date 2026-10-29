import { useEffect, useState } from 'react'
import { sb } from './supabase'
import ShareButton from './ShareButton'
import SubmitHeritage from './SubmitHeritage'

const getParam = (key) => {
  const hash = window.location.hash || ''
  const query = hash.split('?')[1] || ''
  return new URLSearchParams(query).get(key)
}

export default function HeritagePage({ mandapId: propMandapId }) {
  const [docId, setDocId] = useState(getParam('docId'))
  const [selectedMandap, setSelectedMandap] = useState(propMandapId || getParam('id') || '')
  
  const [mandapList, setMandapList] = useState([])
  const [allDocs, setAllDocs] = useState([])
  const [singleDoc, setSingleDoc] = useState(null)
  const [albums, setAlbums] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    sb.from('mandaps')
      .select('id, name, name_bn, area')
      .eq('status', 'approved')
      .order('name', { ascending: true })
      .then(({ data }) => setMandapList(data || []))
  }, [])

  // Load all approved docs for blog list
  async function loadApprovedDocs() {
    setLoading(true)
    let q = sb.from('heritage_docs').select('*, mandaps(name, name_bn, area)').eq('status', 'approved').order('created_at', { ascending: false })
    if (selectedMandap) q = q.eq('mandap_id', selectedMandap)
    
    const { data } = await q
    setAllDocs(data || [])
    setLoading(false)
  }

  // Load single doc details
  async function loadSingleDoc(id) {
    setLoading(true)
    const { data: docData } = await sb.from('heritage_docs').select('*, mandaps(name, name_bn, area)').eq('id', id).maybeSingle()
    if (docData) {
      setSingleDoc(docData)
      const { data: albumData } = await sb.from('heritage_albums').select('*').eq('heritage_id', id)
      setAlbums(albumData || [])
    } else {
      setSingleDoc(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    const currentDocId = getParam('docId') || docId
    if (currentDocId) {
      loadSingleDoc(currentDocId)
    } else {
      setSingleDoc(null)
      loadApprovedDocs()
    }
  }, [docId, selectedMandap])

  const currentMandapObj = mandapList.find(m => m.id == selectedMandap)

  // Single Blog Article View
  if (singleDoc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-gray-700/50 pb-4">
          <button
            onClick={() => {
              setDocId(null)
              window.location.hash = selectedMandap ? `#/heritage?id=${selectedMandap}` : '#/heritage'
            }}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
          >
            ← সব হেরিটেজ আর্টিকেলে ফিরুন
          </button>
          
          <ShareButton m={singleDoc} kind="heritage" title={singleDoc.title || `${singleDoc.mandaps?.name_bn || singleDoc.mandaps?.name} — ${singleDoc.year}`} />
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold">
            📅 {singleDoc.year} সাল · {singleDoc.mandaps?.name_bn || singleDoc.mandaps?.name} ({singleDoc.mandaps?.area})
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            {singleDoc.title || `${singleDoc.mandaps?.name_bn || singleDoc.mandaps?.name} এর হেরিটেজ নথি`}
          </h1>
          <p className="text-xs text-gray-400">
            সংগ্রাহক: {singleDoc.submitted_by || 'Admin'} · প্রকাশিত: {new Date(singleDoc.created_at).toLocaleDateString('bn-BD')}
          </p>
        </div>

        {/* Location & Evolution */}
        <div className="p-6 rounded-2xl bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 shadow-xl space-y-3">
          <h3 className="text-xl font-bold text-orange-500 flex items-center gap-2">🏙 স্থান ও নগরায়ণ প্রকৃতি</h3>
          {singleDoc.location_changed ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200">
              <b>⚠️ স্থান পরিবর্তনের বিবরণ:</b>
              <p className="mt-1 leading-relaxed">{singleDoc.location_change_history}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-300">✅ মণ্ডপটি শুরু থেকেই স্থায়ী নির্ধারিত স্থানে উদযাপিত হচ্ছে।</p>
          )}
        </div>

        {/* Artists & Architects */}
        <div className="p-6 rounded-2xl bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-gray-100">👨‍🎨 নেপথ্যের কারিগর ও রূপকার ({singleDoc.year})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/50 flex flex-col items-center text-center space-y-3">
              {singleDoc.pandal_architect_photo ? (
                <img src={singleDoc.pandal_architect_photo} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-orange-500" />
              ) : <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl">🏛</div>}
              <div>
                <span className="text-xs text-gray-400 block">মণ্ডপ আর্কিটেক্ট</span>
                <span className="font-bold text-gray-200">{singleDoc.pandal_architect || 'তথ্য নেই'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/50 flex flex-col items-center text-center space-y-3">
              {singleDoc.lighting_artist_photo ? (
                <img src={singleDoc.lighting_artist_photo} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-amber-500" />
              ) : <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl">💡</div>}
              <div>
                <span className="text-xs text-gray-400 block">লাইটিং কারিগর</span>
                <span className="font-bold text-gray-200">{singleDoc.lighting_artist || 'তথ্য নেই'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/50 flex flex-col items-center text-center space-y-3">
              {singleDoc.statue_artist_photo ? (
                <img src={singleDoc.statue_artist_photo} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-rose-500" />
              ) : <div className="w-24 h-24 rounded-full bg-rose-500/20 flex items-center justify-center text-2xl">🎨</div>}
              <div>
                <span className="text-xs text-gray-400 block">প্রতিমা ভাস্কর</span>
                <span className="font-bold text-gray-200">{singleDoc.statue_artist || 'তথ্য নেই'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Custom Sections (Admin Dynamic Sections) */}
        {Array.isArray(singleDoc.custom_sections) && singleDoc.custom_sections.map((sec, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 shadow-xl space-y-3">
            {sec.title && <h3 className="text-xl font-bold text-orange-400">{sec.title}</h3>}
            {sec.content && <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{sec.content}</p>}
            {sec.image_url && <img src={sec.image_url} alt="" className="w-full max-h-96 object-cover rounded-xl border border-gray-700" />}
          </div>
        ))}

        {/* Entry & Exit Circulation */}
        <div className="p-6 rounded-2xl bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-gray-100">🗺 সার্কুলেশন ও পথ পরিকল্পনা</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-sm font-bold text-emerald-400">🟢 প্রবেশ পথ</span>
              <p className="text-sm text-gray-300">{singleDoc.entry_point || 'বিবরণ নেই'}</p>
              {singleDoc.entry_point_photo && <img src={singleDoc.entry_point_photo} alt="" className="w-full h-48 object-cover rounded-xl" />}
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <span className="text-sm font-bold text-rose-400">🔴 প্রস্থান পথ</span>
              <p className="text-sm text-gray-300">{singleDoc.exit_point || 'বিবরণ নেই'}</p>
              {singleDoc.exit_point_photo && <img src={singleDoc.exit_point_photo} alt="" className="w-full h-48 object-cover rounded-xl" />}
            </div>
          </div>
        </div>

        {/* Albums */}
        {albums.length > 0 && (
          <div className="p-6 rounded-2xl bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-gray-100">🖼 ফটো অ্যালবাম</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {albums.map((img) => (
                <img key={img.id} src={img.image_url} alt="" className="w-full h-32 object-cover rounded-xl border border-gray-700" />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Blog Card Grid View
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-700/50 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 bg-clip-text text-transparent">
            🏛 হেরিটেজ ও আর্কিটেকচার আর্কাইভ
          </h1>
          <p className="text-sm text-gray-400 mt-1">মণ্ডপের ইতিহাস, নগরায়ণ ও স্থপতি বিবরণী ব্লগসমূহ</p>
        </div>

        <button
          onClick={() => {
            if (!selectedMandap) return alert('অনুগ্রহ করে প্রথমে একটি মণ্ডপ সিলেক্ট করুন!')
            setShowForm(true)
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg cursor-pointer"
        >
          ➕ হেরিটেজ তথ্য যোগ করুন
        </button>
      </div>

      {/* Filter Selector */}
      <div className="bg-white/5 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-center gap-4">
        <label className="font-semibold text-gray-300 min-w-max">মণ্ডপ ফিল্টার করুন:</label>
        <select
          value={selectedMandap}
          onChange={(e) => {
            setSelectedMandap(e.target.value)
            window.location.hash = e.target.value ? `#/heritage?id=${e.target.value}` : '#/heritage'
          }}
          className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:outline-none"
        >
          <option value="">-- চট্টগ্রাম শহরের সকল মণ্ডপ --</option>
          {mandapList.map((m) => (
            <option key={m.id} value={m.id}>{m.name_bn || m.name} ({m.area})</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500 animate-pulse text-center py-10">ব্লগ লোড হচ্ছে...</p>}

      {!loading && !allDocs.length && (
        <div className="text-center py-12 px-6 rounded-2xl bg-white/5 border border-gray-800 space-y-4">
          <p className="text-gray-400 text-lg">
            {selectedMandap ? `${currentMandapObj?.name_bn || currentMandapObj?.name} এর জন্য কোনো আর্কাইভ পাওয়া যায়নি।` : 'কোনো হেরিটেজ পোস্ট পাওয়া যায়নি।'}
          </p>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg cursor-pointer">
            প্রথম ব্লগ সাবমিট করুন
          </button>
        </div>
      )}

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allDocs.map((item) => {
          const coverImg = item.pandal_architect_photo || item.entry_point_photo || item.exit_point_photo
          return (
            <div
              key={item.id}
              onClick={() => {
                setDocId(item.id)
                window.location.hash = `#/heritage?docId=${item.id}`
              }}
              className="group bg-white/5 dark:bg-gray-900/60 border border-gray-800 hover:border-orange-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {coverImg ? (
                  <img src={coverImg} alt="" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center text-4xl">
                    🏛
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <span className="px-2.5 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-md">
                    📅 {item.year} · {item.mandaps?.name_bn || item.mandaps?.name}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                    {item.title || `${item.mandaps?.name_bn || item.mandaps?.name} এর হেরিটেজ নথি`}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {item.location_change_history || item.entry_point || 'আর্কিটেকচার ও ইতিহাস বিস্তারিত দেখতে ক্লিক করুন...'}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 border-t border-gray-800/60 flex justify-between items-center text-xs text-gray-400">
                <span>লেখক: {item.submitted_by || 'Admin'}</span>
                <span className="text-orange-500 font-bold group-hover:translate-x-1 transition-transform">পড়ুন →</span>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8">
            <button
              onClick={() => setShowForm(false)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold border border-gray-600 hover:bg-rose-600 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <SubmitHeritage mandapId={selectedMandap} onClose={() => { setShowForm(false); loadApprovedDocs(); }} />
          </div>
        </div>
      )}
    </div>
  )
}