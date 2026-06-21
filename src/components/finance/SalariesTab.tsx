'use client'

import { useState } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useSort } from '@/hooks/useSort'
import { createClient } from '@/utils/supabase/client'

export default function SalariesTab() {
  const [showForm, setShowForm] = useState(false)
  const [editingSalary, setEditingSalary] = useState<any>(null)
  const [form, setForm] = useState({ teacher_id: '', amount: '', period_start: '', period_end: '' })
  const supabase = createClient()

  const { data: salaries, loading, refetch } = useSupabaseQuery('salaries-list', async (supabase) => {
    const { data, error } = await supabase
      .from('salaries')
      .select('*, profiles(full_name)')
      .order('period_start', { ascending: false })
    if (error) throw error
    return data || []
  })
  const { sorted: sortedSalaries, sortKey, sortAsc, toggleSort } = useSort(salaries ?? [], 'period_start')

  const { data: teachers } = useSupabaseQuery('teachers-for-salaries', async (supabase) => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
    return data || []
  })

  const handleAdd = () => {
    setEditingSalary(null)
    setForm({ teacher_id: '', amount: '', period_start: '', period_end: '' })
    setShowForm(true)
  }

  const handleEdit = (s: any) => {
    setEditingSalary(s)
    setForm({
      teacher_id: s.teacher_id,
      amount: s.amount.toString(),
      period_start: s.period_start || '',
      period_end: s.period_end || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      teacher_id: form.teacher_id,
      amount: parseFloat(form.amount),
      period_start: form.period_start,
      period_end: form.period_end,
    }
    if (editingSalary) {
      await supabase.from('salaries').update(payload).eq('id', editingSalary.id)
    } else {
      await supabase.from('salaries').insert(payload)
    }
    setShowForm(false)
    refetch()
  }

  const togglePaid = async (id: string, current: boolean) => {
    await supabase.from('salaries').update({ paid: !current }).eq('id', id)
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить запись о зарплате?')) {
      await supabase.from('salaries').delete().eq('id', id)
      refetch()
    }
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Зарплаты</h2>
        <button onClick={handleAdd} className="bg-success text-white px-4 py-2 rounded hover:bg-success">+ Добавить</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Преподаватель</th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('amount')}>
              Сумма {sortKey === 'amount' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Период</th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('paid')}>
              Статус {sortKey === 'paid' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedSalaries?.map((s: any) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="border p-2">{s.profiles?.full_name || '-'}</td>
              <td className="border p-2">{s.amount}</td>
              <td className="border p-2">{s.period_start} – {s.period_end}</td>
              <td className="border p-2">{s.paid ? 'Выплачено' : 'Не выплачено'}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(s)} className="text-brand-600 hover:underline">Ред.</button>
                <button onClick={() => handleDelete(s.id)} className="text-danger hover:underline">Удал.</button>
                <button onClick={() => togglePaid(s.id, s.paid)} className="text-success hover:underline">
                  {s.paid ? 'Отменить' : 'Выплатить'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingSalary ? 'Редактировать зарплату' : 'Начислить зарплату'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Преподаватель *</label>
                <select value={form.teacher_id} onChange={(e) => setForm({...form, teacher_id: e.target.value})} required className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">Сумма</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Период начала</label>
                <input type="date" value={form.period_start} onChange={(e) => setForm({...form, period_start: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Период окончания</label>
                <input type="date" value={form.period_end} onChange={(e) => setForm({...form, period_end: e.target.value})} className="w-full border p-2 rounded" />
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