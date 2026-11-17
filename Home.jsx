import { useApp } from './AppContext.jsx'

export default function Home() {
  const { profile, courses, lessonsOf, progress, nav } = useApp()
  const student = profile.role === 'student'
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-bold">Сәлем, {profile.full_name || profile.email}</h1>
      <p className="mut mt-2 mb-8">Оқуды жалғастыру үшін курсты таңдаңыз.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {courses.map((c) => (
          <button key={c.id} onClick={() => nav('course/' + c.id)} className="card p-6 text-left hover:shadow-lg transition">
            <div className="text-xs font-semibold mb-2" style={{ color: '#007EFF' }}>{lessonsOf(c).length} сабақ · {c.modules.length} модуль</div>
            <h3 className="text-xl font-semibold">{c.title}</h3>
            <p className="mut text-sm mt-2 mb-4">{c.description}</p>
            {student && (<><div className="bar"><i style={{ width: progress(c) + '%' }} /></div><div className="text-xs mut mt-2">Прогресс: {progress(c)}%</div></>)}
          </button>
        ))}
        {!courses.length && <p className="mut">Курстар әлі жоқ.</p>}
      </div>
    </>
  )
}
