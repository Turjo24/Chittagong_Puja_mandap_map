import { useEffect, useRef, useState } from 'react'

// src/songs/ folder-এর সব গান automatically detect করবে
const files = import.meta.glob('./songs/*.{mp3,m4a,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default'
})

const songs = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => ({
    src,
    title: decodeURIComponent(path.split('/').pop())
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
  }))

export default function Player() {
  const audioRef = useRef(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  const currentSong = songs[currentIndex]

  const playSong = (index) => {
    setCurrentIndex(index)
    setPlaying(true)
  }

  useEffect(() => {
    if (playing && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [currentIndex, playing])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }

  const nextSong = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length)
    setPlaying(true)
  }

  const previousSong = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + songs.length) % songs.length
    )
    setPlaying(true)
  }

  if (!songs.length) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#501126' }}
      >
        <p className="text-xl text-[#D4AF37]">
          🎵 No songs found
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-white px-4 py-8 md:py-12"
      style={{ backgroundColor: '#501126' }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">

          <div className="text-5xl mb-4">
            🎵
          </div>

          <h1
            className="text-3xl md:text-5xl font-bold"
            style={{ color: '#D4AF37' }}
          >
            Pujo Songs
          </h1>

          <p className="mt-3 text-white/70">
            পূজার গানগুলো শুনুন
          </p>

          <div
            className="w-24 h-1 mx-auto mt-5 rounded-full"
            style={{ backgroundColor: '#D4AF37' }}
          />

        </div>


        {/* Current Player */}
        <div
          className="rounded-3xl p-6 md:p-8 mb-10 border"
          style={{
            backgroundColor: 'rgba(0,0,0,0.18)',
            borderColor: 'rgba(212,175,55,0.45)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
          }}
        >

          <div className="text-center mb-7">

            <p
              className="text-sm uppercase tracking-[0.25em] mb-3"
              style={{ color: '#D4AF37' }}
            >
              Now Playing
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold capitalize">
              {currentSong.title}
            </h2>

          </div>


          <audio
            ref={audioRef}
            src={currentSong.src}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={nextSong}
          />


          {/* Controls */}
          <div className="flex items-center justify-center gap-5">

            <button
              onClick={previousSong}
              className="w-12 h-12 rounded-full border transition-all hover:scale-110"
              style={{
                borderColor: '#D4AF37',
                color: '#D4AF37'
              }}
            >
              ⏮
            </button>


            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full text-2xl font-bold transition-all hover:scale-110"
              style={{
                backgroundColor: '#D4AF37',
                color: '#501126',
                boxShadow: '0 0 25px rgba(212,175,55,0.3)'
              }}
            >
              {playing ? '⏸' : '▶'}
            </button>


            <button
              onClick={nextSong}
              className="w-12 h-12 rounded-full border transition-all hover:scale-110"
              style={{
                borderColor: '#D4AF37',
                color: '#D4AF37'
              }}
            >
              ⏭
            </button>

          </div>

        </div>


        {/* Song List */}
        <div>

          <div className="flex items-center justify-between mb-5">

            <h2
              className="text-2xl font-bold"
              style={{ color: '#D4AF37' }}
            >
              All Songs
            </h2>

            <span className="text-white/60 text-sm">
              {songs.length} Songs
            </span>

          </div>


          <div className="space-y-3">

            {songs.map((song, index) => {

              const isCurrent = index === currentIndex

              return (
                <button
                  key={song.src}
                  onClick={() => playSong(index)}
                  className="w-full text-left flex items-center gap-4 p-4 md:p-5 rounded-2xl transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: isCurrent
                      ? '#D4AF37'
                      : 'rgba(0,0,0,0.16)',

                    color: isCurrent
                      ? '#501126'
                      : '#ffffff',

                    border: isCurrent
                      ? '1px solid #D4AF37'
                      : '1px solid rgba(212,175,55,0.22)',

                    boxShadow: isCurrent
                      ? '0 8px 25px rgba(212,175,55,0.18)'
                      : 'none'
                  }}
                >

                  {/* Number */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0"
                    style={{
                      backgroundColor: isCurrent
                        ? '#501126'
                        : 'rgba(212,175,55,0.12)',

                      color: isCurrent
                        ? '#D4AF37'
                        : '#D4AF37'
                    }}
                  >
                    {isCurrent && playing
                      ? '♪'
                      : index + 1}
                  </div>


                  {/* Song Name */}
                  <div className="flex-1 min-w-0">

                    <p className="font-semibold capitalize truncate">
                      {song.title}
                    </p>

                    {isCurrent && (
                      <p
                        className="text-xs mt-1 font-medium"
                        style={{
                          color: '#501126',
                          opacity: 0.7
                        }}
                      >
                        {playing
                          ? 'Playing now'
                          : 'Paused'}
                      </p>
                    )}

                  </div>


                  {/* Play icon */}
                  <div
                    className="text-xl shrink-0"
                    style={{
                      color: isCurrent
                        ? '#501126'
                        : '#D4AF37'
                    }}
                  >
                    {isCurrent && playing
                      ? '⏸'
                      : '▶'}
                  </div>

                </button>
              )
            })}

          </div>

        </div>


        {/* Footer */}
        <div className="text-center mt-12 pb-6">

          <div
            className="w-16 h-px mx-auto mb-4"
            style={{ backgroundColor: '#c9932e' }}
          />

          <p className="text-white/50 text-sm">
            শুভ শারদীয়া 🪔
          </p>

        </div>

      </div>
    </div>
  )
}