import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/admin/students" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">👩‍🎓 Ученики</h2>
          <p className="text-gray-600">Управление учениками и группами</p>
        </Link>
        <Link href="/admin/groups" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">👥 Группы</h2>
          <p className="text-gray-600">Управление группами и составом</p>
        </Link>
        <Link href="/admin/lessons" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">📅 Расписание</h2>
          <p className="text-gray-600">Все уроки, статусы, комментарии</p>
        </Link>
        <Link href="/admin/reports" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">📊 Отчёты</h2>
          <p className="text-gray-600">Отчёты по ученикам и группам</p>
        </Link>
        <Link href="/admin/finance" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">💰 Финансы</h2>
          <p className="text-gray-600">Платежи, абонементы, расходы, зарплаты</p>
        </Link>
        <Link href="/admin/tasks" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">📋 Задачи</h2>
          <p className="text-gray-600">Управление задачами для преподавателей</p>
        </Link>
        <Link href="/admin/backup" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">💾 Резервное копирование</h2>
          <p className="text-gray-600">Полная копия данных, экспорт в Excel</p>
        </Link>
      </div>
    </div>
  )
}