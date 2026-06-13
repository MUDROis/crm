'use client'

import { useState } from 'react'

interface Teacher {
  id: string
  email: string
  full_name: string
  color?: string | null
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
    password: '',
    color: teacher?.color || '#3B82F6', // синий по умолчанию
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (teacher?.id) {
        // Редактирование существующего
        const res = await fetch(`/api/teachers/${teacher.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: form.full_name,
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
        // Создание нового
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            full_name: form.full_name,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">
          {teacher ? 'Редактировать преподавателя' : 'Новый преподаватель'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!teacher && (
            <div>
              <label className="block text-sm">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
          )}
          <div>
            <label className="block text-sm">Полное имя</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Цвет индикатора</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="color"
                value={form.color}
                onChange={handleChange}
                className="h-8 w-12 border rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{form.color}</span>
            </div>
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
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}