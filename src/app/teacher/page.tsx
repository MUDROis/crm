import Link from 'next/link'
import TeacherNavbar from '@/components/TeacherNavbar'
import { createClient } from '@/utils/supabase/server'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let pendingCount = 0
  if (user) {
    const { count } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('completed', false)
    if (count !== null) pendingCount = count
  }

  return (
    <div className="p-8">
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
