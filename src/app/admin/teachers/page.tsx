'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import TeacherForm from '@/components/teachers/TeacherForm'

interface Teacher {
  id: string
  email: string
  full_name: string
  status: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived' | 'all'>('active')
  const supabase = createClient()

  useEffect(() => {
    loadTeachers()
  }, [filterStatus])

  async function loadTeachers() {
    setLoading(true)
    let query = supabase.from('profiles').select('id, email, full_name, status').eq('role', 'teacher')
    if (filterStatus === 'active') query = query.eq('status', 'active')
    else if (filterStatus === 'archived') query = query.eq('status', 'archived')
    const { data, error } = await query.order('full_name')
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

  const handleArchive = async (id: string) => {
    if (!confirm('Переместить преподавателя в архив?')) return
    await supabase.from('profiles').update({ status: 'archived' }).eq('id', id)
    loadTeachers()
  }

  const handleRestore = async (id: string) => {
    if (!confirm('Восстановить преподавателя?')) return
    await supabase.from('profiles').update({ status: 'active' }).eq('id', id)
    loadTeachers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить преподавателя полностью? Все данные будут безвозвратно удалены.')) return
    const res = await fetch('/api/teachers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) loadTeachers()
    else alert('Ошибка при удалении')
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

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterStatus('active')} className={`px-3 py-2 rounded ${filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Активные</button>
        <button onClick={() => setFilterStatus('archived')} className={`px-3 py-2 rounded ${filterStatus === 'archived' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Архив</button>
        <button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Все</button>
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
                <button onClick={() => handleEdit(t)} className="text-blue-600 hover:underline">Ред.</button>
                {t.status === 'archived' ? (
                  <button onClick={() => handleRestore(t.id)} className="text-green-600 hover:underline">Восстановить</button>
                ) : (
                  <button onClick={() => handleArchive(t.id)} className="text-red-600 hover:underline">В архив</button>
                )}
                <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">Удалить</button>
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