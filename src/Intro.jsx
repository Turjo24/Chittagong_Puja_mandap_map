import { useEffect, useState } from 'react'
import Flame from './Flame'

const introImage = 'public/intro.png'

export default function Intro({ ready, t, onEnter, onDone }) {
  const [progress, setProgress] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [exiting, setExiting] = useState(false)
  // Loading progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          clearInterval(timer)
          return 90
        }

        return Math.min(current + 2, 90)
      })
    }, 60)

    return () => clearInterval(timer)
  }, [])

  const percentage = ready && progress >= 90 ? 100 : progress

  const handleEnter = () => {
    setExiting(true)
    onEnter()

    window.setTimeout(() => {
      onDone()
    }, 1800)
  }

  return (
    <main
      className={`
        intro
        ${exiting ? 'go' : ''}

        relative
        min-h-screen
        w-full
        overflow-hidden

        flex
        flex-col
        items-center
        justify-center

        px-4
        text-center

        bg-[#160500]
      `}
    >
      {/* Background glow */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_center,rgba(255,120,0,0.14)_0%,transparent_55%)]
        "
      />

      {/* Large ambient glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2

          h-[500px]
          w-[500px]

          rounded-full

          bg-orange-500/10
          blur-3xl
        "
      />

      {/* Floating sparks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className="
              spark
              absolute
              bottom-[-20px]
              h-1
              w-1
              rounded-full
              bg-orange-300/70
            "
            style={{
              left: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 7) * 0.8}s`,
              animationDuration: `${6 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      <section
        className="
          relative
          z-10

          flex
          h-[390px]
          w-[390px]

          items-center
          justify-center

          sm:h-[420px]
          sm:w-[420px]
        "
      >
        {/* Outer rotating halo */}
        <div
          className="
            absolute

            h-[350px]
            w-[350px]

            rounded-full

            border-[3px]
            border-orange-300/30

            shadow-[0_0_45px_rgba(255,120,0,0.2)]

            animate-[spin_14s_linear_infinite]

            sm:h-[380px]
            sm:w-[380px]
          "
        >
          {/* Rotating light */}
          <span
            className="
              absolute
              left-1/2
              top-[-5px]

              h-3
              w-3

              -translate-x-1/2

              rounded-full

              bg-orange-300

              shadow-[0_0_18px_rgba(255,180,50,1)]
            "
          />
        </div>

        {/* Inner rotating halo */}
        <div
          className="
            absolute

            h-[300px]
            w-[300px]

            rounded-full

            border-2
            border-orange-400/40

            shadow-[inset_0_0_35px_rgba(255,120,0,0.15),0_0_35px_rgba(255,120,0,0.2)]

            animate-[spin_10s_linear_infinite_reverse]

            sm:h-[330px]
            sm:w-[330px]
          "
        />

        {/* Image glow */}
        <div
          className="
            absolute

            h-[290px]
            w-[290px]

            rounded-full

            bg-orange-500/15

            blur-3xl

            animate-pulse
          "
        />

        {/* Durga Image */}
        {!imageError ? (
          <img
            src={introImage}
            alt="Durga Maa"
            className="
              relative
              z-20

              h-[290px]
              w-[290px]

              object-contain

              drop-shadow-[0_0_30px_rgba(255,140,30,0.6)]

              select-none

              sm:h-[320px]
              sm:w-[320px]
            "
            draggable="false"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Fallback Flame */
          <div
            className="
              relative
              z-20

              flex
              h-[290px]
              w-[290px]

              items-center
              justify-center

              text-orange-400

              drop-shadow-[0_0_30px_rgba(255,140,30,0.8)]
            "
          >
            <Flame size={120} />
          </div>
        )}
      </section>

      {/* =========================
          TITLE
          ========================= */}
      <div
        className="
          relative
          z-20
          -mt-8
        "
      >
        <h1
          className="
            text-3xl
            font-bold

            tracking-wide

            text-orange-100

            drop-shadow-[0_0_12px_rgba(255,150,30,0.55)]

            sm:text-4xl
          "
        >
          দুর্গা মাই কি জয়
        </h1>

        <p
          className="
            mt-2

            text-xs
            uppercase

            tracking-[0.35em]

            text-orange-200/65

            sm:text-sm
          "
        >
          Durga Mai Ki Joy
        </p>
      </div>

      {/* =========================
          PROGRESS BAR
          ========================= */}
      <div
        className="
          relative
          z-20
          mt-8
        "
      >
        <div
          className="
            h-[5px]
            w-[250px]

            overflow-hidden
            rounded-full

            bg-orange-950/70

            ring-1
            ring-orange-400/15

            sm:w-[300px]
          "
        >
          <div
            className="
              h-full

              rounded-full

              bg-gradient-to-r
              from-orange-600
              via-orange-400
              to-yellow-300

              shadow-[0_0_12px_rgba(255,150,30,0.8)]

              transition-[width]
              duration-150
              ease-linear
            "
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

        {/* Loading text */}
        {percentage < 100 && (
          <p
            className="
              mt-3

              text-[11px]

              tracking-widest

              text-orange-200/50
            "
          >
            {t.loading} {percentage}%
          </p>
        )}
      </div>

      {/* =========================
          ENTER BUTTON
          ========================= */}
      {percentage === 100 && (
        <button
          type="button"
          onClick={handleEnter}
          className="
            relative
            z-20

            mt-7

            rounded-full

            border
            border-orange-300/50

            bg-orange-500/10

            px-9
            py-3

            text-sm
            font-semibold

            tracking-widest

            text-orange-100

            shadow-[0_0_25px_rgba(255,120,0,0.2)]

            backdrop-blur-sm

            transition-all
            duration-300

            hover:scale-105
            hover:border-orange-200/80
            hover:bg-orange-500/20
            hover:shadow-[0_0_35px_rgba(255,120,0,0.4)]

            active:scale-95
          "
        >
          {t.enter}
        </button>
      )}
    </main>
  )
}

