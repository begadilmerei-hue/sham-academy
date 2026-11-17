import { useApp } from './AppContext.jsx'

export default function Course({ id }) {
  const { profile, courses, progress, done, nav } = useApp()
  const c = courses.find((x) => x.id === id)
  if (!c) return <p className="mut">Курс табылмады.</p>
  const student = profile.role === 'student'
  return (
    <>
      <button onClick={() => nav('')} className="text-sm mut mb-4">← Курстарға оралу</button>
      <h1 className="text-3xl font-bold">{c.title}</h1>
      <p className="mut mt-2 mb-6">{c.description}</p>
      {student && <div className="bar mb-8"><i style={{ width: progress(c) + '%' }} /></div>}
      {c.modules.map((m) => (
        <section key={m.id} className="card p-5 mb-4">
          <h3 className="font-semibold mb-3">{m.title}</h3>
          {m.lessons.map((l, i) => (
            <button key={l.id} onClick={() => nav('lesson/' + l.id)} className="w-full flex items-center justify-between gap-3 py-3 text-left" style={{ borderTop: '1px solid var(--bd)' }}>
              <span><span className="mut text-sm mr-2">{i + 1}.</span>{l.title}</span>
              <span className="text-xs font-semibold shrink-0" style={{ color: done(l.id) ? '#1a9d5a' : '#007EFF' }}>
                {student ? (done(l.id) ? '✓ Өтілді' : 'Бастау') : 'Қарау'}
              </span>
            </button>
          ))}
          {!m.lessons.length && <p className="mut text-sm">Сабақтар жоқ</p>}
        </section>
      ))}
    </>
  )
}
