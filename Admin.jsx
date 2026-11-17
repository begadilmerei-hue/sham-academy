import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { useApp } from './AppContext.jsx'
import { errKk, fmtDate, ytId } from './util.js'

export default function Admin() {
  const { courses, reload, nav, lessonsOf } = useApp()
  const [tab, setTab] = useState('c')
  const [rows, setRows] = useState(null)
  const [people, setPeople] = useState({})

  const run = async (p) => {
    const { error } = await p
    if (error) alert(errKk(error)); else await reload()
    return !error
  }
  const val = (e) => Object.fromEntries(new FormData(e.currentTarget))

  const addCourse = async (e) => {
    const f = e.currentTarget, d = val(e); e.preventDefault()
    if (await run(supabase.from('courses').insert({ title: d.title.trim(), description: (d.description || '').trim(), position: courses.length + 1 }))) f.reset()
  }
  const addModule = async (e, c) => {
    const f = e.currentTarget, d = val(e); e.preventDefault()
    if (await run(supabase.from('modules').insert({ course_id: c.id, title: d.title.trim(), position: c.modules.length + 1 }))) f.reset()
  }
  const addLesson = async (e, m) => {
    const f = e.currentTarget, d = val(e); e.preventDefault()
    if (d.youtube_url && !ytId(d.youtube_url)) { alert('YouTube сілтемесі дұрыс емес'); return }
    if (await run(supabase.from('lessons').insert({
      module_id: m.id, title: d.title.trim(), description: (d.description || '').trim(),
      youtube_url: d.youtube_url?.trim() || null, position: m.lessons.length + 1,
    }))) f.reset()
  }
  const del = (table, id, text) => { if (confirm(text)) run(supabase.from(table).delete().eq('id', id)) }

  useEffect(() => {
    if (tab !== 'r') return
    ;(async () => {
      const [a, p] = await Promise.all([
        supabase.from('attempts').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('profiles').select('id,full_name,email'),
      ])
      setRows(a.data || [])
      setPeople(Object.fromEntries((p.data || []).map((x) => [x.id, x])))
    })()
  }, [tab])

  const titleOf = (id) => courses.flatMap(lessonsOf).find((l) => l.id === id)?.title || '—'
  const tb = (k, t) => <button onClick={() => setTab(k)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === k ? 'btn' : 'btn2'}`}>{t}</button>

  return (
    <>
      <h1 className="text-3xl font-bold mb-5">Мұғалім панелі</h1>
      <div className="flex gap-2 mb-6">{tb('c', 'Курстар мен сабақтар')}{tb('r', 'Оқушы нәтижелері')}</div>

      {tab === 'c' && (
        <>
          <form onSubmit={addCourse} className="card p-5 mb-6 space-y-3">
            <h3 className="font-semibold">Жаңа курс қосу</h3>
            <input className="inp" name="title" placeholder="Курс атауы" required />
            <textarea className="inp" name="description" placeholder="Сипаттамасы" rows={2} />
            <button className="btn">Курс қосу</button>
          </form>
          {courses.map((c) => (
            <div key={c.id} className="card p-5 mb-4">
              <div className="flex justify-between gap-3">
                <h3 className="font-semibold text-lg">{c.title}</h3>
                <button onClick={() => del('courses', c.id, 'Курсты барлық сабақтарымен өшіресіз бе?')} className="dng text-sm shrink-0">Өшіру</button>
              </div>
              <form onSubmit={(e) => addModule(e, c)} className="flex gap-2 my-3">
                <input className="inp" name="title" placeholder="Жаңа модуль атауы" required />
                <button className="btn2 whitespace-nowrap">+ Модуль</button>
              </form>
              {c.modules.map((m) => (
                <div key={m.id} className="rounded-xl p-4 mb-3" style={{ border: '1px solid var(--bd)' }}>
                  <div className="flex justify-between gap-3">
                    <b>{m.title}</b>
                    <button onClick={() => del('modules', m.id, 'Модульді өшіресіз бе?')} className="dng text-sm shrink-0">Өшіру</button>
                  </div>
                  {m.lessons.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm" style={{ borderTop: '1px solid var(--bd)' }}>
                      <span>{l.title}</span>
                      <span className="flex gap-3 shrink-0">
                        <button onClick={() => nav('admin/lesson/' + l.id)} style={{ color: '#007EFF' }} className="font-semibold">Өңдеу</button>
                        <button onClick={() => del('lessons', l.id, 'Сабақты өшіресіз бе?')} className="dng">Өшіру</button>
                      </span>
                    </div>
                  ))}
                  <form onSubmit={(e) => addLesson(e, m)} className="space-y-2 mt-3">
                    <input className="inp" name="title" placeholder="Сабақ атауы" required />
                    <input className="inp" name="youtube_url" placeholder="YouTube сілтемесі (міндетті емес, кейін қосуға болады)" />
                    <textarea className="inp" name="description" placeholder="Сипаттамасы" rows={2} />
                    <button className="btn2">+ Видеосабақ қосу</button>
                  </form>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {tab === 'r' && (rows === null ? <p className="mut">Жүктелуде...</p> : !rows.length ? <p className="mut">Оқушылар әлі тест тапсырған жоқ.</p> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="mut text-left"><tr><th className="p-3">Оқушы</th><th className="p-3">Сабақ</th><th className="p-3">Нәтиже</th><th className="p-3">Күні</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--bd)' }}>
                  <td className="p-3">{people[r.user_id]?.full_name || '—'}<div className="mut text-xs">{people[r.user_id]?.email}</div></td>
                  <td className="p-3">{titleOf(r.lesson_id)}</td>
                  <td className="p-3 font-semibold">{r.score}/{r.total}</td>
                  <td className="p-3 mut">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  )
}
