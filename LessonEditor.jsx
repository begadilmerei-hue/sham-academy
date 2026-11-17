import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { useApp } from './AppContext.jsx'
import { errKk, ytId } from './util.js'

const empty = { id: null, text: '', opts: ['', '', '', ''], correct: 0 }

export default function LessonEditor({ id }) {
  const { findLesson, reload, nav } = useApp()
  const lesson = findLesson(id)
  const [qs, setQs] = useState([])
  const [correct, setCorrect] = useState({})
  const [form, setForm] = useState(empty)
  const [info, setInfo] = useState(() => (lesson ? { title: lesson.title, description: lesson.description || '', yt: lesson.youtube_url || '' } : null))
  const [uploading, setUploading] = useState(false)

  const loadQ = async () => {
    const { data: q } = await supabase.from('questions').select('*').eq('lesson_id', id).order('position')
    const ids = (q || []).map((x) => x.id)
    const a = {}
    if (ids.length) {
      const r = await supabase.from('question_answers').select('*').in('question_id', ids)
      ;(r.data || []).forEach((x) => { a[x.question_id] = x.correct_index })
    }
    setQs(q || []); setCorrect(a)
  }
  useEffect(() => { loadQ() }, [id])

  if (!lesson || !info) return <p className="mut">Сабақ табылмады.</p>

  const saveInfo = async (e) => {
    e.preventDefault()
    if (info.yt && !ytId(info.yt)) { alert('YouTube сілтемесі дұрыс емес'); return }
    const { error } = await supabase.from('lessons').update({ title: info.title.trim(), description: info.description.trim(), youtube_url: info.yt.trim() || null }).eq('id', id)
    if (error) alert(errKk(error)); else { await reload(); alert('Сақталды') }
  }

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const path = `${id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await supabase.storage.from('lesson-videos').upload(path, file, { contentType: file.type })
    if (error) alert('Жүктеу қатесі: ' + error.message)
    else {
      if (lesson.video_path) await supabase.storage.from('lesson-videos').remove([lesson.video_path])
      await supabase.from('lessons').update({ video_path: path }).eq('id', id)
      await reload()
    }
    setUploading(false); e.target.value = ''
  }
  const removeVideo = async () => {
    if (!confirm('Жүктелген видеоны өшіресіз бе?')) return
    await supabase.storage.from('lesson-videos').remove([lesson.video_path])
    await supabase.from('lessons').update({ video_path: null }).eq('id', id)
    await reload()
  }

  const saveQ = async (e) => {
    e.preventDefault()
    const o = form.opts.map((t, i) => ({ t: t.trim(), c: i === form.correct })).filter((x) => x.t)
    if (o.length < 2 || !o.some((x) => x.c)) { alert('Кемінде 2 жауап керек және дұрыс жауап бос болмауы керек'); return }
    const options = o.map((x) => x.t)
    const ci = o.findIndex((x) => x.c)
    let qid = form.id, err
    if (qid) {
      ;({ error: err } = await supabase.from('questions').update({ question_text: form.text.trim(), options }).eq('id', qid))
    } else {
      const r = await supabase.from('questions').insert({ lesson_id: id, question_text: form.text.trim(), options, position: qs.length + 1 }).select().single()
      err = r.error; qid = r.data?.id
    }
    if (!err) ({ error: err } = await supabase.from('question_answers').upsert({ question_id: qid, correct_index: ci }))
    if (err) { alert(errKk(err)); return }
    setForm(empty); loadQ()
  }
  const editQ = (q) => {
    setForm({ id: q.id, text: q.question_text, opts: [...q.options, '', '', '', ''].slice(0, 4), correct: correct[q.id] ?? 0 })
    scrollTo(0, document.body.scrollHeight)
  }
  const delQ = async (q) => { if (confirm('Сұрақты өшіресіз бе?')) { await supabase.from('questions').delete().eq('id', q.id); loadQ() } }

  return (
    <>
      <button onClick={() => nav('admin')} className="text-sm mut mb-4">← Панельге оралу</button>
      <h1 className="text-2xl font-bold mb-6">Сабақты өңдеу</h1>

      <form onSubmit={saveInfo} className="card p-5 mb-6 space-y-3">
        <h3 className="font-semibold">Сабақ туралы</h3>
        <input className="inp" value={info.title} onChange={(e) => setInfo({ ...info, title: e.target.value })} placeholder="Сабақ атауы" required />
        <textarea className="inp" rows={4} value={info.description} onChange={(e) => setInfo({ ...info, description: e.target.value })} placeholder="Сипаттамасы" />
        <input className="inp" value={info.yt} onChange={(e) => setInfo({ ...info, yt: e.target.value })} placeholder="YouTube сілтемесі (https://youtu.be/...)" />
        <button className="btn">Сақтау</button>
      </form>

      <div className="card p-5 mb-6 space-y-3">
        <h3 className="font-semibold">Видео файлды жүктеу</h3>
        <p className="mut text-sm">Тегін жоспарда бір файл шамамен 50 МБ-тан аспауы керек. Ұзақ видеоларды YouTube арқылы қосқан ыңғайлы. Жүктелген видео болса, ол YouTube-тың орнына көрсетіледі.</p>
        {lesson.video_path && <p className="text-sm" style={{ color: '#1a9d5a' }}>✓ Видео жүктелген: {lesson.video_path.split('/').pop()}</p>}
        <input type="file" accept="video/*" onChange={upload} disabled={uploading} className="text-sm" />
        {uploading && <p className="mut text-sm">Жүктелуде, күтіңіз...</p>}
        {lesson.video_path && <button onClick={removeVideo} className="dng text-sm block">Жүктелген видеоны өшіру</button>}
      </div>

      <h2 className="text-xl font-semibold mb-3">Тест сұрақтары</h2>
      {qs.map((q, i) => (
        <div key={q.id} className="card p-4 mb-3">
          <div className="font-semibold">{i + 1}. {q.question_text}</div>
          <ul className="text-sm mt-2 space-y-1">
            {q.options.map((x, j) => <li key={j} style={j === correct[q.id] ? { color: '#1a9d5a', fontWeight: 600 } : {}}>{j === correct[q.id] ? '✓ ' : '• '}{x}</li>)}
          </ul>
          <div className="flex gap-4 mt-3 text-sm">
            <button onClick={() => editQ(q)} style={{ color: '#007EFF' }} className="font-semibold">Өңдеу</button>
            <button onClick={() => delQ(q)} className="dng">Өшіру</button>
          </div>
        </div>
      ))}

      <form onSubmit={saveQ} className="card p-5 space-y-3 mt-6">
        <h3 className="font-semibold">{form.id ? 'Сұрақты өңдеу' : 'Жаңа сұрақ'}</h3>
        <input className="inp" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Сұрақ мәтіні" required />
        {form.opts.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={form.correct === i} onChange={() => setForm({ ...form, correct: i })} title="Дұрыс жауап" />
            <input className="inp" value={o} onChange={(e) => setForm({ ...form, opts: form.opts.map((x, k) => (k === i ? e.target.value : x)) })} placeholder={`${i + 1}-жауап${i > 1 ? ' (міндетті емес)' : ''}`} required={i < 2} />
          </div>
        ))}
        <p className="mut text-xs">Дұрыс жауаптың жанындағы дөңгелекті белгілеңіз.</p>
        <div className="flex gap-2">
          <button className="btn">{form.id ? 'Сақтау' : 'Сұрақ қосу'}</button>
          {form.id && <button type="button" className="btn2" onClick={() => setForm(empty)}>Болдырмау</button>}
        </div>
      </form>
    </>
  )
}
