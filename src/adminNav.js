// Admin sidebar er sob page ekhane. perm key = page key.
// 'team' sudhu main (super) admin dekhbe.
export const NAV = [
  ['dash', '📊 Dashboard'],
  ['mandaps', '🛕 Mandaps'],
  ['emails', '✉ User emails'],
  ['routes', '🚌 Routes & fares'],
  ['schedule', '📅 Schedule'],
  ['notices', '🔔 Notices'],
  ['sponsors', '⭐ Sponsors'],
  ['reps', '👤 Representatives'],
  ['parikromas', '🕉 Parikrama'],
  ['vote', '🔥 Vote'],
  ['blog', '📝 Blog'],
  ['team', '👥 Team (sub-admin)'],
  ['heritage', '🏛 Heritage']
]
export const PERM_KEYS = NAV.filter(([k]) => k !== 'team')
