
const PORTFOLIO_URL = 'https://turjodev.vercel.app'

const PURPOSE = [
  {
    number: '০১',
    icon: '🗺️',
    title: 'সব মণ্ডপ এক মানচিত্রে',
    description:
      'চট্টগ্রামের বিভিন্ন পূজামণ্ডপের অবস্থান ও ছবি সহজেই খুঁজে নিন ইন্টারেক্টিভ মানচিত্রের মাধ্যমে।'
  },
  {
    number: '০২',
    icon: '🧭',
    title: 'পরিক্রমা হোক সহজ',
    description:
      'কোন পথে ঘুরবেন, কোন দিন কোথায় পরিক্রমা হবে এবং যাতায়াতের সম্ভাব্য ভাড়া কত—জেনে নিন এক জায়গায়।'
  },
  {
    number: '০৩',
    icon: '📸',
    title: 'আপনার ছবিও হোক সবার',
    description:
      'আপনার তোলা পূজামণ্ডপের ছবি জমা দিয়ে এই উদ্যোগকে সমৃদ্ধ করুন। অনুমোদনের পর ছবিটি সবার জন্য উন্মুক্ত হবে।'
  }
]

const NEXT = [
  {
    icon: '📍',
    title: 'আরও মণ্ডপ ও নতুন এলাকা',
    description: 'চট্টগ্রামের আরও পূজামণ্ডপ ও নতুন নতুন এলাকা যুক্ত করা হবে।'
  },
  {
    icon: '✨',
    title: 'নতুন সুবিধা',
    description: 'মণ্ডপ খোঁজা, যাতায়াত ও পূজার পরিকল্পনাকে আরও সহজ করতে নতুন ফিচার যোগ করা হবে।'
  },
  {
    icon: '🤝',
    title: 'সবার অংশগ্রহণে এগিয়ে চলা',
    description: 'সবার সহযোগিতায় এই উদ্যোগকে আরও সমৃদ্ধ ও নির্ভরযোগ্য করে তোলা হবে।'
  }
]

export default function About() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-12 sm:px-6 sm:py-12 lg:px-8">

      {/* Hero section */}
      <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#c49a48]/25 bg-gradient-to-br from-[#501126] via-[#3b0b1c] to-[#190711] px-5 py-12 text-center text-white shadow-xl sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#c49a48]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-rose-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e4bf70]/30 bg-white/[0.07] text-3xl shadow-lg">
            🪔
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#e4bf70] sm:text-sm">
            আমাদের উদ্যোগ · আমাদের চট্টগ্রাম
          </p>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            চট্টগ্রাম পূজা গাইড
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
            শারদীয় দুর্গোৎসবের আনন্দ ছড়িয়ে পড়ুক সবার মাঝে।
            চট্টগ্রামের পূজামণ্ডপ খুঁজে পাওয়া, পরিক্রমার পরিকল্পনা
            করা এবং পূজার প্রয়োজনীয় তথ্য জানা হোক আরও সহজ।
          </p>
          

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-[#e4bf70]/30 bg-[#e4bf70]/10 px-4 py-2 text-xs font-medium text-[#f5d995]">
              🗺️ মণ্ডপের মানচিত্র
            </span>
            <span className="rounded-full border border-[#e4bf70]/30 bg-[#e4bf70]/10 px-4 py-2 text-xs font-medium text-[#f5d995]">
              🧭 পরিক্রমার তথ্য
            </span>
            <span className="rounded-full border border-[#e4bf70]/30 bg-[#e4bf70]/10 px-4 py-2 text-xs font-medium text-[#f5d995]">
              📸 সবার অংশগ্রহণ
            </span>

            
          </div>

          
<div className="mt-10 flex justify-center">
  <div className="group inline-flex items-center gap-3 rounded-2xl border border-[#c49a48]/30 bg-gradient-to-r from-[#501126]/5 via-[#c49a48]/10 to-[#501126]/5 px-6 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#c49a48]/60 hover:shadow-lg dark:from-[#501126]/40 dark:via-[#c49a48]/10 dark:to-[#501126]/40">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#501126] text-lg text-[#e4bf70] shadow-md">
      ✦
    </span>

   
<div className="mt-10 flex justify-center">
  <div className="group inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#c49a48]/60 hover:shadow-lg">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#501126] text-xl text-[#e4bf70] shadow-sm">
      ✦
    </span>

    <div className="text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Designed & Developed by
      </p>

      <a
        href={PORTFOLIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-2 text-lg font-extrabold tracking-wide text-[#501126] transition-colors duration-300 hover:text-[#b58b3b]"
      >
        Turjo.Dev
        <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">
          ↗
        </span>
      </a>
    </div>
  </div>
</div>

  </div>
</div>

        </div>
      </section>

      {/* Project introduction */}
      <section className="mb-10 grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#501126]/10 text-xl dark:bg-[#c49a48]/10">
              ❤️
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              এই উদ্যোগের গল্প
            </h2>
          </div>

          <p className="text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base sm:leading-8">
            দুর্গাপূজার সময় চট্টগ্রামের বিভিন্ন পূজামণ্ডপ ঘুরে দেখা
            অনেকের কাছেই আনন্দের, কিন্তু কোন মণ্ডপ কোথায়, কীভাবে
            সেখানে পৌঁছাবেন কিংবা কোন পথে ঘুরলে বেশি মণ্ডপ দেখা যাবে—
            এসব তথ্য খুঁজে পেতে বেশ সময় লাগে।
          </p>

          <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base sm:leading-8">
            এই সমস্যার সমাধানে তৈরি হয়েছে চট্টগ্রাম পূজা গাইড।
            পূজামণ্ডপের অবস্থান, ছবি, পরিক্রমার রুট, সময়সূচি ও
            যাতায়াতের তথ্য এক জায়গায় তুলে ধরাই আমাদের লক্ষ্য।
            যেন সবাই সহজে পরিকল্পনা করে নিশ্চিন্তে উপভোগ করতে পারেন
            শারদীয় দুর্গোৎসব।
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-[#c49a48]/25 bg-gradient-to-br from-[#501126] to-[#2b0917] p-6 text-white shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bf70]">
              আমাদের লক্ষ্য
            </p>
            <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
              পূজার আনন্দ হোক সবার জন্য আরও সহজ ও সুন্দর।
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              তথ্য, প্রযুক্তি ও মানুষের অংশগ্রহণকে একসঙ্গে নিয়ে
              একটি কার্যকর পূজা নির্দেশিকা গড়ে তোলাই আমাদের প্রত্যাশা।
            </p>
          </div>

          <div className="mt-7 border-t border-white/15 pt-5">
            <p className="text-sm font-semibold text-[#e4bf70]">
              আমাদের চট্টগ্রাম, আমাদের উৎসব। 🪔
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#b58b3b]">
            কী কী থাকছে
          </p>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
            আপনার পূজার সঙ্গী
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            পূজামণ্ডপ খোঁজা থেকে পরিক্রমার পরিকল্পনা—প্রয়োজনীয় তথ্য এক জায়গায়।
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PURPOSE.map((item) => (
            <article
              key={item.number}
              className="group rounded-3xl border border-gray-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c49a48]/50 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#501126]/10 text-2xl transition group-hover:bg-[#501126]/15 dark:bg-[#c49a48]/10">
                  {item.icon}
                </span>
                <span className="text-sm font-bold tracking-widest text-[#b58b3b]">
                  {item.number}
                </span>
              </div>

              <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
                {item.title}
              </h3>

              <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Future plans */}
      <section className="mb-12 rounded-3xl border border-gray-200/80 bg-gray-50/80 p-6 dark:border-white/10 dark:bg-white/[0.025] sm:p-8">
        <div className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#b58b3b]">
            আমাদের আগামী
          </p>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
            পথচলা কেবল শুরু
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500 dark:text-gray-400">
            আপনাদের সহযোগিতায় চট্টগ্রাম পূজা গাইডকে আরও সমৃদ্ধ
            করে তোলার পরিকল্পনা রয়েছে।
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {NEXT.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#501126]/10 text-xl dark:bg-[#c49a48]/10">
                {item.icon}
              </span>
              <div>
                <h3 className="mb-2 font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community message */}
      <section className="mb-10 rounded-3xl border border-[#c49a48]/25 bg-[#501126]/[0.045] px-5 py-9 text-center dark:bg-[#c49a48]/[0.06] sm:px-8">
        <span className="text-3xl">🌼</span>
        <h2 className="mt-4 text-xl font-extrabold text-gray-900 dark:text-white sm:text-2xl">
          আপনার অংশগ্রহণই আমাদের অনুপ্রেরণা
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base">
          আপনার জানা কোনো পূজামণ্ডপের তথ্য কিংবা নিজের তোলা ছবি
          আমাদের সঙ্গে ভাগ করে নিন। আপনার ছোট্ট অবদানও অন্য কারও
          পূজার পথচলাকে সহজ করে দিতে পারে।
        </p>
      </section>

      {/* Developer credit - always at the bottom */}
      <footer className="border-t border-gray-200/80 pt-7 text-center dark:border-white/10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
          Crafted with ❤️ for the community
        </p>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Developed by{' '}
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-[#8b263f] underline decoration-[#c49a48]/60 decoration-2 underline-offset-4 transition hover:text-[#b58b3b] dark:text-[#e4bf70] dark:hover:text-white"
          >
            Turjo.Dev
          </a>
        </p>

        <p className="mt-2 text-xs text-gray-400">
          একটি সুন্দর পূজার অভিজ্ঞতার প্রত্যাশায়। 🪔
        </p>
      </footer>
    </main>
  )
}
