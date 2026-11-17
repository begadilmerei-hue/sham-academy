import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { useApp } from './AppContext.jsx'
import { ytId } from './util.js'

export default function Lesson({ id }) {
  const { courses, lessonsOf, nav, reload } = useApp()
  const course = courses.find((c) => c.modules.some((m) => m.lessons.some((l) => l.id === id)))
  const lesson = course && lessonsOf(course).find((l) => l.id === id)
  const [qs, setQs] = useState(null)
  const [ans, setAns] = useState({})
  const [res, setRes] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [video, setVideo] = useState('')

  useEffect(() => {
    supabase.from('questions').select('*').eq('lesson_id', id).order('position').then(({ data }) => setQs(data || []))
  }, [id])

  useEffect(() => {
    setVideo('')
    if (lesson?.video_path) {
      supabase.storage.from('lesson-videos').createSignedUrl(lesson.video_path, 7200)
        .then(({ data }) => setVideo(data?.signedUrl || ''))
    }
  }, [lesson?.video_path])

  if (!lesson) return <p className="mut">Сабақ табылмады.</p>
  const all = lessonsOf(course)
  const next = all[all.findIndex((l) => l.id === id) + 1]
  const yt = ytId(lesson.youtube_url)

  const submit = async (e) => {
    e.preventDefault()
    if (qs.some((q) => ans[q.id] === undefined)) { setMsg('Барлық сұраққа жауап беріңіз'); return }
    setBusy(true); setMsg('')
    const { data, error } = await supabase.rpc('submit_quiz', { p_lesson_id: id, p_answers: ans })
    setBusy(false)
    if (error) { setMsg(error.message); return }
    setRes(data)
    reload()
  }

  return (
    <>
      <button onClick={() => nav('course/' + course.id)} className="text-sm mut mb-4">← {course.title}</button>
      <div className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
        {video ? <video className="w-full h-full" src={video} controls controlsList="nodownload" />
          : yt ? <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${yt}`} allowFullScreen title={lesson.title} />
          : <div className="h-full grid place-items-center text-white/80 text-center px-4">Мұғалім бұл сабаққа видеоны әлі қоспаған</div>}
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mt-5">{lesson.title}</h1>
      {lesson.description && <p className="mut mt-2 whitespace-pre-line">{lesson.description}</p>}

      <h2 className="text-xl font-semibold mt-10 mb-4">Тест тапсырмалары</h2>
      {qs === null ? <p className="mut">Жүктелуде...</p> : !qs.length ? <p className="mut">Бұл сабаққа тест әлі қосылмаған.</p> : (
        <form onSubmit={submit} className="space-y-4">
          {qs.map((q, i) => {
            const d = res?.details.find((x) => x.question_id === q.id)
            return (
              <div key={q.id} className="card p-5">
                <p className="font-semibold mb-3">{i + 1}. {q.question_text}</p>
                <div className="space-y-2">
                  {q.options.map((o, j) => {
                    let cl = ''
                    if (d) { if (j === d.correct_index) cl = 'ok'; else if (ans[q.id] === j) cl = 'bad' }
                    return (
                      <label key={j} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${cl}`} style={{ borderColor: 'var(--bd)' }}>
                        <input type="radio" name={q.id} checked={ans[q.id] === j} disabled={!!res} onChange={() => setAns({ ...ans, [q.id]: j })} />
                        <span>{o}</span>
                        {d && j === d.correct_index && <b className="ml-auto text-xs" style={{ color: '#1a9d5a' }}>Дұрыс</b>}
                        {d && j === ans[q.id] && j !== d.correct_index && <b className="ml-auto text-xs dng">Қате</b>}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {res ? (
            <div className="card p-5">
              <div className="text-sm mut">Нәтиже</div>
              <div className="text-3xl font-bold" style={{ color: '#007EFF' }}>{res.score} / {res.total} ұпай</div>
              <p className="mut text-sm mt-1">{res.score / res.total >= 0.6 ? 'Тамаша! Сабақ сәтті өтілді.' : 'Сабақты қайталап көріңіз де, тестті қайта тапсырыңыз.'}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button type="button" className="btn2" onClick={() => { setAns({}); setRes(null) }}>Қайта тапсыру</button>
                {next
                  ? <button type="button" className="btn" onClick={() => nav('lesson/' + next.id)}>Келесі сабаққа өту →</button>
                  : <button type="button" className="btn" onClick={() => nav('course/' + course.id)}>Курсқа оралу</button>}
              </div>
            </div>
          ) : (
            <>
              {msg && <p className="dng text-sm">{msg}</p>}
              <button className="btn" disabled={busy}>{busy ? 'Тексерілуде...' : 'Жауаптарды тексеру'}</button>
            </>
          )}
        </form>
      )}
      {!res && next && <button onClick={() => nav('lesson/' + next.id)} className="btn2 mt-6">Келесі сабаққа өту →</button>}
    </>
  )
}
