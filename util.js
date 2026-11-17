export const ytId = (u) => {
  const m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : ''
}
export const fmtDate = (d) => new Date(d).toLocaleDateString('kk-KZ')
export const byPos = (a, b) => a.position - b.position
export const errKk = (e) => {
  const m = e?.message || ''
  if (/Invalid login/i.test(m)) return 'Email немесе құпиясөз қате'
  if (/already registered/i.test(m)) return 'Бұл email тіркелген'
  if (/Password should/i.test(m)) return 'Құпиясөз кемінде 6 таңба болуы керек'
  if (/not confirmed/i.test(m)) return 'Email расталмаған. Поштаңызды тексеріңіз'
  if (/rate limit/i.test(m)) return 'Тым көп әрекет жасалды. Біраз күтіңіз'
  return m || 'Қате пайда болды'
}
