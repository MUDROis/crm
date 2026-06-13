'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMyStudents()
  }, [])

  async function loadMyStudents() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('students')
      .select('*, full_name')
      .eq('teacher_id', user.id)
      .eq('status', 'active')
      .order('full_name')

    if (!error && data) setStudents(data)
    setLoading(false)
  }

  if (loading) return <div className="p-6">Загрузка...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Мои ученики</h1>
      {students.length === 0 ? (
        <p>У вас пока нет учеников</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">ФИО</th>
              <th className="border p-2 text-left">Предмет</th>
              <th className="border p-2 text-left">Тип</th>
              <th className="border p-2 text-left">Статус</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="border p-2">
                  <Link href={`/teacher/students/${s.id}`} className="text-blue-600 hover:underline">
                    {s.full_name}
                  </Link>
                </td>
                <td className="border p-2">{s.subject}</td>
                <td className="border p-2">{s.type === 'individual' ? 'Индив.' : 'Групп.'}</td>
                <td className="border p-2">{s.status === 'active' ? 'Активен' : s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
