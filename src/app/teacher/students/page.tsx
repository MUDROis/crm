'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSort } from '@/hooks/useSort'
import Link from 'next/link'

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMyStudents()
  }, [])

  async function loadMyStudents() {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
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
  const { sorted: sortedStudents, sortKey, sortAsc, toggleSort } = useSort(students, 'full_name')

  if (loading) return <div className="p-6">Загрузка...</div>

  return (
    <div className="p-6">
      {students.length === 0 ? (
        <p>У вас пока нет учеников</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('full_name')}>
                ФИО {sortKey === 'full_name' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('subject')}>
                Предмет {sortKey === 'subject' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('type')}>
                Тип {sortKey === 'type' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('status')}>
                Статус {sortKey === 'status' && (sortAsc ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="border p-2">
                  <Link href={`/teacher/students/${s.id}`} className="text-brand-600 hover:underline">
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
