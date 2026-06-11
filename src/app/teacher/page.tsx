import Link from 'next/link'

export default function TeacherDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Панель преподавателя</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/teacher/lessons" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">📅 Мои уроки</h2>
          <p className="text-gray-600">Расписание, статусы, комментарии</p>
        </Link>
        <Link href="/teacher/tasks" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">📋 Мои задачи</h2>
          <p className="text-gray-600">Список задач от администратора</p>
        </Link>
      </div>
    </div>
  )
}