'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Group {
  id?: string
  name: string
  subject: string
  teacher_id: string | null
  online_link: string
}

interface Teacher {
  id: string
  full_name: string
}

export default function GroupForm({
  onClose,
  onSaved,
  group,
}: {
  onClose: () => void
  onSaved: () => void
  group?: Group | null
}) {
    const cleanGroup = group ? {
    id: group.id,
    name: group.name,
    subject: group.subject,
    teacher_id: group.teacher_id,
    online_link: group.online_link,
  } : null;

  const [form, setForm] = useState<Group>(
    cleanGroup || { name: '', subject: '', teacher_id: '', online_link: '' }
  )
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadTeachers() {
      const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
      if (data) setTeachers(data)
    }
    loadTeachers()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const dataToSave = { ...form }
    if (dataToSave.teacher_id === '') dataToSave.teacher_id = null

    // Удаляем возможный вложенный teacher
    delete (dataToSave as any).teacher

    if (form.id) {
      const { error } = await supabase.from('groups').update(dataToSave).eq('id', form.id)
      if (error) alert(error.message)
    } else {
      const { error } = await supabase.from('groups').insert(dataToSave)
      if (error) alert(error.message)
    }
    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">{form.id ? 'Редактировать группу' : 'Новая группа'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Название *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Предмет</label>
            <input name="subject" value={form.subject} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Преподаватель</label>
            <select name="teacher_id" value={form.teacher_id ?? ''} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="">Выберите...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name || t.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Ссылка на онлайн-урок</label>
            <input name="online_link" value={form.online_link} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Отмена</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}