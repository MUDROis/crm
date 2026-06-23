'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<Record<string, unknown>[]>([])
  const [students, setStudents] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState({ student_id: '', total_lessons: 0, remaining_lessons: 0, valid_until: '' })
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active')
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('subscriptions').select('*, students(full_name)').order('created_at', { ascending: false }),
      supabase.from('students').select('id, full_name').order('full_name'),
    ]).then(([subsRes, studsRes]) => {
      if (subsRes.data) setSubscriptions(subsRes.data as Record<string, unknown>[])
      if (studsRes.data) setStudents(studsRes.data as Record<string, unknown>[])
      setLoading(false)
    })
  }, [])

  const filtered = subscriptions.filter(s => {
    if (filter === 'active') return s.status === 'active'
    if (filter === 'archived') return s.status === 'archived'
    return true
  })

  const handleAdd = () => {
    setEditingSub(null)
    setForm({ student_id: '', total_lessons: 0, remaining_lessons: 0, valid_until: '' })
    setShowForm(true)
  }

  const handleEdit = (sub: Record<string, unknown>) => {
    setEditingSub(sub)
    setForm({
      student_id: sub.student_id as string,
      total_lessons: sub.total_lessons as number,
      remaining_lessons: sub.remaining_lessons as number,
      valid_until: (sub.valid_until as string) || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (editingSub) {
      await supabase.from('subscriptions').update(form).eq('id', editingSub.id as string)
    } else {
      await supabase.from('subscriptions').insert({ ...form, status: 'active' })
    }
    setSaving(false)
    setShowForm(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    const { data } = await supabase.from('subscriptions').select('*, students(full_name)').order('created_at', { ascending: false })
    if (data) setSubscriptions(data as Record<string, unknown>[])
  }

  const handleArchive = async (id: string) => {
    await supabase.from('subscriptions').update({ status: 'archived' }).eq('id', id)
    const { data } = await supabase.from('subscriptions').select('*, students(full_name)').order('created_at', { ascending: false })
    if (data) setSubscriptions(data as Record<string, unknown>[])
  }

  const handleRestore = async (id: string) => {
    await supabase.from('subscriptions').update({ status: 'active' }).eq('id', id)
    const { data } = await supabase.from('subscriptions').select('*, students(full_name)').order('created_at', { ascending: false })
    if (data) setSubscriptions(data as Record<string, unknown>[])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить абонемент навсегда?')) return
    await supabase.from('subscriptions').delete().eq('id', id)
    const { data } = await supabase.from('subscriptions').select('*, students(full_name)').order('created_at', { ascending: false })
    if (data) setSubscriptions(data as Record<string, unknown>[])
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Абонементы</h2>
        <button onClick={handleAdd} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">+ Добавить</button>
      </div>

      {saved && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">Сохранено</div>}

      <div className="flex gap-2">
        {(['active', 'archived', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-sm ${filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {f === 'active' ? 'Активные' : f === 'archived' ? 'Архив' : 'Все'}
          </button>
        ))}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Ученик</th>
            <th className="border p-2 text-left">Всего</th>
            <th className="border p-2 text-left">Осталось</th>
            <th className="border p-2 text-left">Действует до</th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(s => (
            <tr key={s.id as string} className="hover:bg-gray-50">
              <td className="border p-2">{(s.students as Record<string, string>)?.full_name || '-'}</td>
              <td className="border p-2">{s.total_lessons as number}</td>
              <td className="border p-2">{s.remaining_lessons as number}</td>
              <td className="border p-2">{(s.valid_until as string) || '—'}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(s as Record<string, unknown>)} className="text-brand-600 hover:underline text-sm">Ред.</button>
                {s.status === 'archived' ? (
                  <button onClick={() => handleRestore(s.id as string)} className="text-green-600 hover:underline text-sm">Восстановить</button>
                ) : (
                  <button onClick={() => handleArchive(s.id as string)} className="text-orange-600 hover:underline text-sm">В архив</button>
                )}
                <button onClick={() => handleDelete(s.id as string)} className="text-red-600 hover:underline text-sm">Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowForm(false)}>
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editingSub ? 'Редактировать абонемент' : 'Новый абонемент'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Ученик *</label>
                <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required className="w-full border p-2 rounded-lg mt-1">
                  <option value="">Выберите...</option>
                  {students.map(s => <option key={s.id as string} value={s.id as string}>{s.full_name as string}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Всего занятий *</label>
                <input type="number" value={form.total_lessons} onChange={e => setForm({ ...form, total_lessons: parseInt(e.target.value) })} required className="w-full border p-2 rounded-lg mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Осталось занятий *</label>
                <input type="number" value={form.remaining_lessons} onChange={e => setForm({ ...form, remaining_lessons: parseInt(e.target.value) })} required className="w-full border p-2 rounded-lg mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Действует до</label>
                <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} className="w-full border p-2 rounded-lg mt-1" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Отмена</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
