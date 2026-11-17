import { AppProvider, useApp } from './AppContext.jsx'
import { supabase } from './supabase.js'
import Auth from './Auth.jsx'
import Home from './Home.jsx'
import Course from './Course.jsx'
import Lesson from './Lesson.jsx'
import Cabinet from './Cabinet.jsx'
import Admin from './Admin.jsx'
import LessonEditor from './LessonEditor.jsx'

const Splash = () => <div className="min-h-screen grid place-items-center mut">Жүктелуде...</div>

function Shell() {
  const { session, profile, loading, error, hash, nav } = useApp()
  if (session === undefined) return <Splash />
  if (!session) return <Auth />
  if (loading) return <Splash />
  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <p className="dng mb-3">Профиль табылмады. {error}</p>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Шығу</button>
        </div>
      </div>
    )
  }
  const teacher = profile.role === 'teacher'
  const [r, a, b] = hash.split('/')
  let page = <Home />
  if (r === 'course') page = <Course key={a} id={a} />
  else if (r === 'lesson') page = <Lesson key={a} id={a} />
  else if (r === 'cabinet' && !teacher) page = <Cabinet />
  else if (r === 'admin' && teacher) page = a === 'lesson' ? <LessonEditor key={b} id={b} /> : <Admin />

  return (
    <>
      <header className="sticky top-0 z-20 backdrop-blur" style={{ background: 'color-mix(in srgb,var(--bg) 85%,transparent)', borderBottom: '1px solid var(--bd)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => nav('')} className="flex items-center gap-2 font-bold text-lg">
            <span className="w-8 h-8 rounded-xl grid place-items-center text-white" style={{ background: '#007EFF' }}>Ш</span>
            ШАМ академия
          </button>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <button onClick={() => nav('')} className="px-3 py-2 rounded-lg">Курстар</button>
            {teacher
              ? <button onClick={() => nav('admin')} className="px-3 py-2 rounded-lg">Басқару</button>
              : <button onClick={() => nav('cabinet')} className="px-3 py-2 rounded-lg">Кабинет</button>}
            <button onClick={() => supabase.auth.signOut()} className="px-3 py-2 rounded-lg mut">Шығу</button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">{page}</main>
    </>
  )
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>
}
