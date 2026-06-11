'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Subscription {
  id: string
  student_id: string
  total_lessons: number
  remaining_lessons: number
  valid_until: string
  students: { full_name: string } | null
}

export default function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [form, setForm] = useState({
    student_id: '',
    total_lessons: 0,
    remaining_lessons: 0,
    valid_until: '',
  })
  const [students, setStudents] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadSubscriptions()
    loadStudents()
  }, [])

  async function loadSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, students(full_name)')
      .order('created_at', { ascending: false })
    if (!error && data) setSubscriptions(data)
    setLoading(false)
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('id, full_name').order('full_name')
    if (data) setStudents(data)
  }

  const handleAdd = () => {
    setEditingSub(null)
    setForm({ student_id: '', total_lessons: 0, remaining_lessons: 0, valid_until: '' })
    setShowForm(true)
  }

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub)
    setForm({
      student_id: sub.student_id,
      total_lessons: sub.total_lessons,
      remaining_lessons: sub.remaining_lessons,
      valid_until: sub.valid_until,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSub) {
      const { error } = await supabase.from('subscriptions').update(form).eq('id', editingSub.id)
      if (error) alert(error.message)
      else {
        setShowForm(false)
        loadSubscriptions()
      }
    } else {
      const { error } = await supabase.from('subscriptions').insert(form)
      if (error) alert(error.message)
      else {
        setShowForm(false)
        loadSubscriptions()
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Удалить абонемент?')) {
      await supabase.from('subscriptions').delete().eq('id', id)
      loadSubscriptions()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Абонементы</h2>
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ Добавить</button>
      </div>
      {loading ? <p>Загрузка...</p> : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Ученик</th>
              <th className="border p-2 text-left">Всего занятий</th>
              <th className="border p-2 text-left">Осталось</th>
              <th className="border p-2 text-left">Действует до</th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(s => (
              <tr key={s.id}>
                <td className="border p-2">{s.students?.full_name || '-'}</td>
                <td className="border p-2">{s.total_lessons}</td>
                <td className="border p-2">{s.remaining_lessons}</td>
                <td className="border p-2">{s.valid_until}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline">Ред.</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Удал.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingSub ? 'Редактировать абонемент' : 'Новый абонемент'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Ученик *</label>
                <select value={form.student_id} onChange={(e) => setForm({...form, student_id: e.target.value})} required className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">Всего занятий *</label>
                <input type="number" value={form.total_lessons} onChange={(e) => setForm({...form, total_lessons: parseInt(e.target.value)})} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Осталось занятий *</label>
                <input type="number" value={form.remaining_lessons} onChange={(e) => setForm({...form, remaining_lessons: parseInt(e.target.value)})} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Действует до</label>
                <input type="date" value={form.valid_until} onChange={(e) => setForm({...form, valid_until: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}