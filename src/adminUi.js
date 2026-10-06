// ===== ADMIN THEME: sob color ekhane theke control hoy =====
// Main UI er color e match korte ei value gulo change koro (hex ba var(--tomar-css-variable) dewa jabe)
export const theme = {
  '--bg': '#fff8f1',    // page background
  '--card': '#ffffff',  // card / sidebar background
  '--bd': '#f0e0d0',    // border
  '--tx': '#2b1d12',    // main text
  '--mu': '#8a7565',    // muted text
  '--a': '#e8590c',     // accent (primary button, active menu)
  '--a2': '#c94a08',    // accent hover
  '--soft': '#fff0e3',  // light accent (hover bg)
}

const b = 'px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap'
const inp = 'w-full px-3 py-2 rounded-lg border border-[var(--bd)] bg-[var(--card)] text-[var(--tx)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--a)]'
export const C = {
  btn: `${b} border border-[var(--bd)] bg-[var(--card)] text-[var(--tx)] hover:bg-[var(--soft)]`,
  pri: `${b} bg-[var(--a)] text-white hover:bg-[var(--a2)]`,
  danger: `${b} border border-red-200 bg-[var(--card)] text-red-600 hover:bg-red-50`,
  input: inp,
  textarea: `${inp} min-h-32`,
  form: 'flex flex-col gap-2 bg-[var(--card)] border border-[var(--bd)] rounded-xl p-4 shadow-sm mb-4',
  list: 'flex flex-col gap-2',
  card: 'flex items-center gap-3 flex-wrap bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm',
  cardCol: 'flex flex-col gap-3 bg-[var(--card)] border border-[var(--bd)] rounded-xl p-4 shadow-sm',
  sec: 'text-base font-semibold text-[var(--tx)] mt-8 mb-3 pb-2 border-b border-[var(--bd)] first:mt-0',
  title: 'text-xl font-bold text-[var(--tx)]',
  name: 'font-semibold text-[var(--tx)]',
  muted: 'text-sm text-[var(--mu)]',
  msg: 'text-sm text-red-600',
  acts: 'flex gap-2 flex-wrap',
  img: 'w-16 h-16 rounded-lg object-cover bg-[var(--soft)]',
  thumb: 'w-20 h-20 rounded-lg object-cover bg-[var(--soft)]',
}
