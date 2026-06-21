'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useSort } from '@/hooks/useSort'
import TeacherForm from '@/components/teachers/TeacherForm'

interface Teacher {
  id: string
  email: string
  full_name: string
  status: string
}

export default function TeachersPage() {
  const router = useRouter()
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
  const { sorted: sortedTeachers, sortKey, sortAsc, toggleSort } = useSort(teachers, 'full_name')

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
      <div className="flex justify-end items-center mb-6">
        <button onClick={handleAdd} className="bg-success text-white px-4 py-2 rounded hover:bg-success">
          + Добавить преподавателя
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterStatus('active')} className={`px-3 py-2 rounded ${filterStatus === 'active' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Активные</button>
        <button onClick={() => setFilterStatus('archived')} className={`px-3 py-2 rounded ${filterStatus === 'archived' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Архив</button>
        <button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded ${filterStatus === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Все</button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('full_name')}>
              Имя {sortKey === 'full_name' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('email')}>
              Email {sortKey === 'email' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeachers.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="border p-2"><button onClick={() => router.push(`/admin/teachers/${t.id}`)} className="text-brand-600 hover:underline text-left">{t.full_name || '—'}</button></td>
              <td className="border p-2">{t.email}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(t)} className="text-brand-600 hover:underline">Ред.</button>
                {t.status === 'archived' ? (
                  <button onClick={() => handleRestore(t.id)} className="text-success hover:underline">Восстановить</button>
                ) : (
                  <button onClick={() => handleArchive(t.id)} className="text-danger hover:underline">В архив</button>
                )}
                <button onClick={() => handleDelete(t.id)} className="text-danger hover:underline">Удалить</button>
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