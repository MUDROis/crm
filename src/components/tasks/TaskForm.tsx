'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Task {
  id?: string
  assigned_to: string
  title: string
  description: string
  due_date: string
}

interface Teacher {
  id: string
  full_name: string
}

export default function TaskForm({
  onClose,
  onSaved,
  task,
}: {
  onClose: () => void
  onSaved: () => void
  task?: Task | null
}) {
  const [form, setForm] = useState<Task>(
    task || {
      assigned_to: '',
      title: '',
      description: '',
      due_date: '',
    }
  )
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadTeachers()
  }, [])

  async function loadTeachers() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
    if (data) setTeachers(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Получаем текущего пользователя (админ)
    const { data: { user } } = await supabase.auth.getUser()

    if (task?.id) {
      // Редактирование существующей задачи (created_by не меняем)
      const { error } = await supabase.from('tasks').update({
        assigned_to: form.assigned_to,
        title: form.title,
        description: form.description,
        due_date: form.due_date || null,
      }).eq('id', task.id)
      if (error) alert(error.message)
    } else {
      // Создание новой задачи
      const { error } = await supabase.from('tasks').insert({
        assigned_to: form.assigned_to,
        created_by: user?.id, // подставляем id текущего администратора
        title: form.title,
        description: form.description,
        due_date: form.due_date || null,
      })
      if (error) alert(error.message)
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{task ? 'Редактировать задачу' : 'Новая задача'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Преподаватель *</label>
            <select name="assigned_to" value={form.assigned_to} onChange={handleChange} required className="w-full border p-2 rounded">
              <option value="">Выберите...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name || t.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Заголовок *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Описание</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full border p-2 rounded" rows={3} />
          </div>
          <div>
            <label className="block text-sm">Срок выполнения</label>
            <input type="date" name="due_date" value={form.due_date} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Отмена</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}