'use client'

import { useState } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'

export default function StudentSubscriptionsTab({ studentId }: { studentId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<any>(null)
  const [form, setForm] = useState({ total_lessons: 0, remaining_lessons: 0, valid_until: '' })
  const supabase = createClient()

  const { data: subscriptions, loading, refetch } = useSupabaseQuery(`student-subscriptions-${studentId}`, async (supabase) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })

  const handleAdd = () => {
    setEditingSub(null)
    setForm({ total_lessons: 0, remaining_lessons: 0, valid_until: '' })
    setShowForm(true)
  }

  const handleEdit = (sub: any) => {
    setEditingSub(sub)
    setForm({
      total_lessons: sub.total_lessons,
      remaining_lessons: sub.remaining_lessons,
      valid_until: sub.valid_until || '',
    })
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingSub(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSub) {
      await supabase.from('subscriptions').update(form).eq('id', editingSub.id)
    } else {
      await supabase.from('subscriptions').insert({ ...form, student_id: studentId })
    }
    handleClose()
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить абонемент?')) {
      await supabase.from('subscriptions').delete().eq('id', id)
      refetch()
    }
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Абонементы</h3>
        <button onClick={handleAdd} className="bg-success text-white px-3 py-1 rounded">+ Добавить</button>
      </div>
      {subscriptions?.length === 0 ? (
        <p>Нет абонементов</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Всего занятий</th>
              <th className="border p-2 text-left">Осталось</th>
              <th className="border p-2 text-left">Действует до</th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions?.map((sub: any) => (
              <tr key={sub.id}>
                <td className="border p-2">{sub.total_lessons}</td>
                <td className="border p-2">{sub.remaining_lessons}</td>
                <td className="border p-2">{sub.valid_until || '—'}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleEdit(sub)} className="text-brand-600 hover:underline">Ред.</button>
                  <button onClick={() => handleDelete(sub.id)} className="text-danger hover:underline">Удал.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
          <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editingSub ? 'Редактировать' : 'Новый абонемент'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                <button type="button" onClick={handleClose} className="px-4 py-2 border rounded">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}