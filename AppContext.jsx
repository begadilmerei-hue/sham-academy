import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { byPos } from './util.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [courses, setCourses] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hash, setHash] = useState(location.hash.slice(1))

  useEffect(() => {
    const f = () => setHash(location.hash.slice(1))
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  const nav = (p) => { location.hash = p; scrollTo(0, 0) }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const reload = useCallback(async () => {
    if (!session) return
    const uid = session.user.id
    const [p, c, a] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('courses').select('*, modules(*, lessons(*))').order('position'),
      supabase.from('attempts').select('*').eq('user_id', uid).order('created_at'),
    ])
    const err = p.error || c.error || a.error
    setError(err ? err.message : '')
    setProfile(p.data)
    setCourses((c.data || []).map((co) => ({
      ...co,
      modules: (co.modules || []).sort(byPos).map((m) => ({ ...m, lessons: (m.lessons || []).sort(byPos) })),
    })))
    setAttempts(a.data || [])
    setLoading(false)
  }, [session])

  useEffect(() => {
    if (session) { setLoading(true); reload() }
    else { setProfile(null); setCourses([]); setAttempts([]) }
  }, [session, reload])

  const lessonsOf = (c) => c.modules.flatMap((m) => m.lessons)
  const best = (id) => attempts.filter((a) => a.lesson_id === id)
    .reduce((b, a) => (!b || a.score / a.total > b.score / b.total ? a : b), null)
  const done = (id) => { const b = best(id); return !!b && b.score / b.total >= 0.6 }
  const progress = (c) => {
    const ls = lessonsOf(c)
    return ls.length ? Math.round((ls.filter((l) => done(l.id)).length / ls.length) * 100) : 0
  }
  const points = () => [...new Set(attempts.map((a) => a.lesson_id))].reduce((s, id) => s + best(id).score, 0)
  const findLesson = (id) => courses.flatMap(lessonsOf).find((l) => l.id === id)

  return (
    <Ctx.Provider value={{ session, profile, courses, attempts, loading, error, reload, hash, nav,
      lessonsOf, best, done, progress, points, findLesson }}>
      {children}
    </Ctx.Provider>
  )
}
