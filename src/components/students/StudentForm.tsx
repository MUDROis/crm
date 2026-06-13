'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Student {
  id?: string
  full_name: string
  phone: string
  email: string
  subject: string
  teacher_id: string | null
  type: 'individual' | 'group'
  customer_name: string
  customer_contact: string
  notes: string
  online_link: string
  status: string
}

interface Teacher {
  id: string
  full_name: string
}

export default function StudentForm({
  onClose,
  onSaved,
  student,
}: {
  onClose: () => void
  onSaved: () => void
  student?: Student | null
}) {
  const [form, setForm] = useState<Student>(
    student || {
      full_name: '',
      phone: '',
      email: '',
      subject: '',
      teacher_id: null,
      type: 'individual',
      customer_name: '',
      customer_contact: '',
      notes: '',
      online_link: '',
      status: 'active',
    }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const dataToSave = { ...form }
    if (dataToSave.teacher_id === '') dataToSave.teacher_id = null

    if (form.id) {
      const { error } = await supabase.from('students').update(dataToSave).eq('id', form.id)
      if (error) alert(error.message)
    } else {
      const { error } = await supabase.from('students').insert(dataToSave)
      if (error) alert(error.message)
    }
    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{form.id ? 'Редактировать ученика' : 'Новый ученик'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">ФИО *</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Телефон</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border p-2 rounded" />
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
              <label className="block text-sm">Тип занятий</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="individual">Индивидуальные</option>
                <option value="group">Групповые</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Статус</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="active">Активный</option>
                <option value="paused">Приостановлен</option>
                <option value="stopped">Бросил</option>
                <option value="archived">Архивный</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">ФИО заказчика</label>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Контакты заказчика</label>
              <input name="customer_contact" value={form.customer_contact} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm">Ссылка на онлайн-урок</label>
              <input name="online_link" value={form.online_link} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm">Примечание</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border p-2 rounded" rows={3} />
            </div>
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