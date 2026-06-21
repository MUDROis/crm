'use client'

import { useState } from 'react'
import { isValidEmail, isValidPhone } from '@/utils/validation'
import Modal from '@/components/ui/Modal'

interface Teacher {
  id: string
  email: string
  full_name: string
  phone?: string | null
  color?: string | null
  status?: string
}

export default function TeacherForm({
  onClose,
  onSaved,
  teacher,
}: {
  onClose: () => void
  onSaved: () => void
  teacher?: Teacher | null
}) {
  const [form, setForm] = useState({
    email: teacher?.email || '',
    full_name: teacher?.full_name || '',
    phone: teacher?.phone || '',
    password: '',
    color: teacher?.color || '#3B82F6',
    status: teacher?.status || 'active',
  })
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'email') setEmailError('')
    if (name === 'phone') setPhoneError('')
  }

  const validateEmail = () => {
    if (!teacher?.id && !form.email) {
      setEmailError('Email обязателен')
      return false
    }
    if (form.email && !isValidEmail(form.email)) {
      setEmailError('Некорректный email')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher?.id && !validateEmail()) return

    setLoading(true)
    try {
      if (teacher?.id) {
        const res = await fetch(`/api/teachers/${teacher.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: form.full_name,
            phone: form.phone || null,
            color: form.color,
            ...(form.password && { password: form.password }),
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          alert(data.error || 'Ошибка при сохранении')
          return
        }
      } else {
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            full_name: form.full_name,
            phone: form.phone || null,
            color: form.color,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          alert(data.error || 'Ошибка при создании')
          return
        }
      }
      onSaved()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={teacher ? 'Редактировать преподавателя' : 'Новый преподаватель'} maxWidth="md">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Полное имя</label>
            <input type="text" name="full_name" value={form.full_name} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Телефон</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} onBlur={() => { if (form.phone && !isValidPhone(form.phone)) setPhoneError('Некорректный номер'); else setPhoneError('') }} className={`w-full border p-2 rounded ${phoneError ? 'border-red-500' : ''}`} />
            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
          </div>
          <div>
            <label className="block text-sm">Email {!teacher ? '*' : ''}</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={validateEmail}
              required={!teacher}
              readOnly={!!teacher}
              className={`w-full border p-2 rounded ${emailError ? 'border-red-500' : ''} ${teacher ? 'bg-gray-100' : ''}`}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <label className="block text-sm">Цвет индикатора</label>
            <div className="flex items-center gap-2">
              <input type="color" name="color" value={form.color} onChange={handleChange} className="h-8 w-12 border rounded cursor-pointer" />
              <span className="text-sm text-gray-600">{form.color}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm">Статус</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="active">Активный</option>
              <option value="archived">Архивный</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">
              {teacher ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль *'}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!teacher}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Отмена</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
    </Modal>
  )
}