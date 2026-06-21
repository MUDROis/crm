'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { isValidEmail, isValidPhone } from '@/utils/validation'

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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    async function loadTeachers() {
      const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
      if (data) setTeachers(data)
    }
    loadTeachers()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateField = (name: string, value: string) => {
    if (name === 'email' && value) {
      if (!isValidEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Некорректный email' }))
        return false
      }
    }
    if ((name === 'phone' || name === 'customer_contact') && value) {
      if (!isValidPhone(value)) {
        setErrors(prev => ({ ...prev, [name]: 'Некорректный номер телефона' }))
        return false
      }
    }
    setErrors(prev => ({ ...prev, [name]: '' }))
    return true
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (form.email && !isValidEmail(form.email)) newErrors.email = 'Некорректный email'
    if (form.phone && !isValidPhone(form.phone)) newErrors.phone = 'Некорректный номер телефона'
    if (form.customer_contact && !isValidPhone(form.customer_contact)) newErrors.customer_contact = 'Некорректный номер телефона'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

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

  const handleDelete = async () => {
    if (!form.id) return
    if (window.confirm('Вы уверены, что хотите удалить этого ученика?')) {
      setLoading(true)
      const { error } = await supabase.from('students').delete().eq('id', form.id)
      if (error) {
        alert(error.message)
        setLoading(false)
      } else {
        setLoading(false)
        onSaved()
      }
    }
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
              <input name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur} className={`w-full border p-2 rounded ${errors.phone ? 'border-red-500' : ''}`} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} className={`w-full border p-2 rounded ${errors.email ? 'border-red-500' : ''}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
              <input name="customer_contact" value={form.customer_contact} onChange={handleChange} onBlur={handleBlur} className={`w-full border p-2 rounded ${errors.customer_contact ? 'border-red-500' : ''}`} />
              {errors.customer_contact && <p className="text-red-500 text-xs mt-1">{errors.customer_contact}</p>}
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
          <div className="flex justify-between items-center pt-4">
            {form.id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                title="Удалить ученика"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Удалить
              </button>
            )}
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Отмена</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
