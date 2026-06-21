'use client'

import { useState } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useSort } from '@/hooks/useSort'
import { createClient } from '@/utils/supabase/client'

export default function StudentPausesTab({ studentId }: { studentId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editingPause, setEditingPause] = useState<any>(null)
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' })
  const supabase = createClient()

  const { data: pauses, loading, refetch } = useSupabaseQuery(`student-pauses-${studentId}`, async (supabase) => {
    const { data, error } = await supabase
      .from('pauses')
      .select('*')
      .eq('student_id', studentId)
      .order('start_date', { ascending: false })
    if (error) throw error
    return data || []
  })
  const { sorted: sortedPauses, sortKey, sortAsc, toggleSort } = useSort(pauses ?? [], 'start_date')

  const handleAdd = () => {
    setEditingPause(null)
    setForm({ start_date: '', end_date: '', reason: '' })
    setShowForm(true)
  }

  const handleEdit = (pause: any) => {
    setEditingPause(pause)
    setForm({
      start_date: pause.start_date,
      end_date: pause.end_date,
      reason: pause.reason || '',
    })
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingPause(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPause) {
      await supabase.from('pauses').update({
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
      }).eq('id', editingPause.id)
    } else {
      const { error: pauseError } = await supabase.from('pauses').insert({
        student_id: studentId,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
      })
      if (pauseError) {
        alert('Ошибка при создании паузы: ' + pauseError.message)
        return
      }

      // Автоматически отменяем индивидуальные уроки в этом периоде (только при создании)
      const { error: lessonError } = await supabase
        .from('lessons')
        .update({ status: 'cancelled' })
        .eq('student_id', studentId)
        .eq('type', 'individual')
        .gte('lesson_date', form.start_date)
        .lte('lesson_date', form.end_date)

      if (lessonError) {
        alert('Пауза создана, но не удалось отменить уроки: ' + lessonError.message)
      }
    }
    handleClose()
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить паузу?')) return
    await supabase.from('pauses').delete().eq('id', id)
    refetch()
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Приостановки занятий</h3>
        <button onClick={handleAdd} className="bg-success text-white px-3 py-1 rounded">+ Добавить</button>
      </div>
      {pauses?.length === 0 ? (
        <p>Нет периодов приостановки</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('start_date')}>
                Начало {sortKey === 'start_date' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('end_date')}>
                Окончание {sortKey === 'end_date' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('reason')}>
                Причина {sortKey === 'reason' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedPauses?.map((pause: any) => (
              <tr key={pause.id} className="hover:bg-gray-50">
                <td className="border p-2 cursor-pointer hover:text-brand-600" onClick={() => handleEdit(pause)}>
                  {pause.start_date}
                </td>
                <td className="border p-2 cursor-pointer hover:text-brand-600" onClick={() => handleEdit(pause)}>
                  {pause.end_date}
                </td>
                <td className="border p-2">{pause.reason || '-'}</td>
                <td className="border p-2">
                  <button onClick={() => handleDelete(pause.id)} className="text-danger hover:underline">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
          <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editingPause ? 'Редактировать паузу' : 'Новый период приостановки'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Дата начала *</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Дата окончания *</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Причина</label>
                <input type="text" value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full border p-2 rounded" />
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