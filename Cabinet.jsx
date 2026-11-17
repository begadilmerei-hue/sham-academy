import { useApp } from './AppContext.jsx'
import { fmtDate } from './util.js'

export default function Cabinet() {
  const { courses, attempts, lessonsOf, done, progress, points, findLesson } = useApp()
  const finished = courses.flatMap(lessonsOf).filter((l) => done(l.id)).length
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Менің кабинетім</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5"><div className="mut text-sm">Жинаған балл</div><div className="text-3xl font-bold" style={{ color: '#007EFF' }}>{points()}</div></div>
        <div className="card p-5"><div className="mut text-sm">Тапсырылған тест</div><div className="text-3xl font-bold">{attempts.length}</div></div>
        <div className="card p-5"><div className="mut text-sm">Өтілген сабақ</div><div className="text-3xl font-bold">{finished}</div></div>
      </div>
      <h2 className="text-xl font-semibold mb-3">Курс прогресі</h2>
      {courses.map((c) => (
        <div key={c.id} className="card p-5 mb-3">
          <div className="flex justify-between mb-2"><b>{c.title}</b><span className="text-sm mut">{progress(c)}%</span></div>
          <div className="bar"><i style={{ width: progress(c) + '%' }} /></div>
        </div>
      ))}
      <h2 className="text-xl font-semibold mt-8 mb-3">Тест тарихы</h2>
      {attempts.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm"><tbody>
            {[...attempts].reverse().map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--bd)' }}>
                <td className="p-3">{findLesson(a.lesson_id)?.title || '—'}</td>
                <td className="p-3 font-semibold">{a.score}/{a.total}</td>
                <td className="p-3 mut">{fmtDate(a.created_at)}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      ) : <p className="mut">Әзірге тест тапсырылған жоқ.</p>}
    </>
  )
}
