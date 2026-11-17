import { useState } from 'react'
import { supabase } from './supabase.js'
import { errKk } from './util.js'

export default function Auth() {
  const [up, setUp] = useState(false)
  const [f, setF] = useState({ name: '', email: '', pass: '' })
  const [msg, setMsg] = useState({ t: '', ok: false })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg({ t: '', ok: false })
    const email = f.email.trim().toLowerCase()
    if (up) {
      const { data, error } = await supabase.auth.signUp({ email, password: f.pass, options: { data: { full_name: f.name.trim() } } })
      if (error) setMsg({ t: errKk(error), ok: false })
      else if (!data.session) setMsg({ t: 'Тіркелу сәтті. Поштаңызға келген хат арқылы email-ді растаңыз.', ok: true })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: f.pass })
      if (error) setMsg({ t: errKk(error), ok: false })
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="card p-6 sm:p-8 w-full max-w-md">
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-white text-xl font-bold mb-4" style={{ background: '#007EFF' }}>Ш</div>
        <h1 className="text-2xl font-bold">ШАМ академия</h1>
        <p className="mut mt-1 mb-6">{up ? 'Оқушы ретінде тіркелу' : 'Платформаға кіру'}</p>
        <form onSubmit={submit} className="space-y-3">
          {up && <input className="inp" placeholder="Аты-жөніңіз" value={f.name} onChange={set('name')} required />}
          <input className="inp" type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
          <input className="inp" type="password" placeholder="Құпиясөз (кемінде 6 таңба)" minLength={6} value={f.pass} onChange={set('pass')} required />
          {msg.t && <p className="text-sm font-medium" style={{ color: msg.ok ? '#1a9d5a' : '#d93025' }}>{msg.t}</p>}
          <button className="btn w-full" disabled={busy}>{busy ? 'Күтіңіз...' : up ? 'Тіркелу' : 'Кіру'}</button>
        </form>
        <button onClick={() => { setUp(!up); setMsg({ t: '', ok: false }) }} className="mt-4 text-sm font-medium" style={{ color: '#007EFF' }}>
          {up ? 'Тіркелгіңіз бар ма? Кіру' : 'Тіркелгі жоқ па? Тіркелу'}
        </button>
      </div>
    </div>
  )
}
