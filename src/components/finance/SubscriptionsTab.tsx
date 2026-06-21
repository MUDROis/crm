'use client'

import { useState } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'

export default function SubscriptionsTab() {
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<any>(null)
  const [form, setForm] = useState({ student_id: '', total_lessons: 0, remaining_lessons: 0, valid_until: '' })
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived' | 'all'>('active')
  const supabase = createClient()

  const queryKey = `subscriptions-${filterStatus}`
  const { data: subscriptions, loading, refetch } = useSupabaseQuery(queryKey, async (supabase) => {
    let query = supabase.from('subscriptions').select('*, students(full_name)').order('created_at', { ascending: false })
    if (filterStatus === 'active') query = query.eq('status', 'active')
    else if (filterStatus === 'archived') query = query.eq('status', 'archived')
    const { data, error } = await query
    if (error) throw error
    return data || []
  })

  const { data: students } = useSupabaseQuery('students-for-subscriptions', async (supabase) => {
    const { data } = await supabase.from('students').select('id, full_name').order('full_name')
    return data || []
  })

  const handleAdd = () => {
    setEditingSub(null)
    setForm({ student_id: '', total_lessons: 0, remaining_lessons: 0, valid_until: '' })
    setShowForm(true)
  }

  const handleEdit = (sub: any) => {
    setEditingSub(sub)
    setForm({
      student_id: sub.student_id,
      total_lessons: sub.total_lessons,
      remaining_lessons: sub.remaining_lessons,
      valid_until: sub.valid_until || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSub) {
      await supabase.from('subscriptions').update(form).eq('id', editingSub.id)
    } else {
      await supabase.from('subscriptions').insert({ ...form, status: 'active' })
    }
    setShowForm(false)
    refetch()
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Переместить абонемент в архив?')) return
    await supabase.from('subscriptions').update({ status: 'archived' }).eq('id', id)
    refetch()
  }

  const handleRestore = async (id: string) => {
    if (!confirm('Восстановить абонемент?')) return
    await supabase.from('subscriptions').update({ status: 'active' }).eq('id', id)
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить абонемент навсегда?')) return
    await supabase.from('subscriptions').delete().eq('id', id)
    refetch()
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Абонементы</h2>
        <button onClick={handleAdd} className="bg-success text-white px-4 py-2 rounded hover:bg-success">+ Добавить</button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterStatus('active')} className={`px-3 py-2 rounded ${filterStatus === 'active' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Активные</button>
        <button onClick={() => setFilterStatus('archived')} className={`px-3 py-2 rounded ${filterStatus === 'archived' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Архив</button>
        <button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded ${filterStatus === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Все</button>
      </div>

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
          {subscriptions?.map((s: any) => (
            <tr key={s.id}>
              <td className="border p-2">{s.students?.full_name || '-'}</td>
              <td className="border p-2">{s.total_lessons}</td>
              <td className="border p-2">{s.remaining_lessons}</td>
              <td className="border p-2">{s.valid_until || '—'}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(s)} className="text-brand-600 hover:underline">Ред.</button>
                {s.status === 'archived' ? (
                  <button onClick={() => handleRestore(s.id)} className="text-success hover:underline">Восстановить</button>
                ) : (
                  <button onClick={() => handleArchive(s.id)} className="text-danger hover:underline">В архив</button>
                )}
                <button onClick={() => handleDelete(s.id)} className="text-danger hover:underline">Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editingSub ? 'Редактировать абонемент' : 'Новый абонемент'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Ученик *</label>
                <select value={form.student_id} onChange={(e) => setForm({...form, student_id: e.target.value})} required className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {students?.map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
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
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}