'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Student {
  id: string
  full_name: string
  phone: string
  email: string
  subject: string
  teacher_id: string
  type: string
  customer_name: string
  teacher: { full_name: string } | null
}

export default function StudentList({ onEdit }: { onEdit: (student: any) => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [filterTeacher, setFilterTeacher] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStudents()
    loadTeachers()
  }, [])

  async function loadStudents() {
    let query = supabase.from('students').select('*, teacher:profiles!teacher_id(full_name)')
    if (search) query = query.ilike('full_name', `%${search}%`)
    if (filterTeacher) query = query.eq('teacher_id', filterTeacher)
    if (filterSubject) query = query.ilike('subject', `%${filterSubject}%`)
    const { data, error } = await query.order('full_name')
    if (!error && data) setStudents(data)
    setLoading(false)
  }

  async function loadTeachers() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
    if (data) setTeachers(data)
  }

  async function handleDelete(id: string) {
    if (confirm('Удалить ученика?')) {
      await supabase.from('students').delete().eq('id', id)
      loadStudents()
    }
  }

  useEffect(() => {
    loadStudents()
  }, [search, filterTeacher, filterSubject])

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <input
          placeholder="Поиск по ФИО"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="border p-2 rounded">
          <option value="">Все преподаватели</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.full_name || t.id}</option>
          ))}
        </select>
        <input
          placeholder="Предмет"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">ФИО</th>
              <th className="border p-2 text-left">Предмет</th>
              <th className="border p-2 text-left">Преподаватель</th>
              <th className="border p-2 text-left">Тип</th>
              <th className="border p-2 text-left">Заказчик</th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="border p-2">{s.full_name}</td>
                <td className="border p-2">{s.subject}</td>
                <td className="border p-2">{s.teacher?.full_name || '-'}</td>
                <td className="border p-2">{s.type === 'individual' ? 'Инд.' : 'Групп.'}</td>
                <td className="border p-2">{s.customer_name}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => onEdit(s)} className="text-blue-600 hover:underline">Ред.</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Удал.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}