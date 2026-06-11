'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import TeacherForm from '@/components/teachers/TeacherForm'

interface Teacher {
  id: string
  email: string
  full_name: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadTeachers()
  }, [])

  async function loadTeachers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'teacher')
      .order('full_name')

    if (!error && data) setTeachers(data)
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingTeacher(null)
    setShowForm(true)
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить преподавателя? Все его данные останутся, но аккаунт будет удалён.')) return

    const res = await fetch('/api/teachers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      loadTeachers()
    } else {
      const data = await res.json()
      alert(data.error || 'Ошибка при удалении')
    }
  }

  const handleSaved = () => {
    setShowForm(false)
    loadTeachers()
  }

  if (loading) return <p className="p-6">Загрузка...</p>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Преподаватели</h1>
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + Добавить преподавателя
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Имя</th>
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t.id}>
              <td className="border p-2">{t.full_name || '—'}</td>
              <td className="border p-2">{t.email}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(t)} className="text-blue-600 hover:underline">
                  Ред.
                </button>
                <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">
                  Удал.
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <TeacherForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          teacher={editingTeacher}
        />
      )}
    </div>
  )
}