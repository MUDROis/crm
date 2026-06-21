'use client'

import { useState } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useSort } from '@/hooks/useSort'
import { createClient } from '@/utils/supabase/client'

export default function PaymentsTab() {
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [form, setForm] = useState({
    student_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'single',
    subscription_id: '',
  })
  const supabase = createClient()

  const { data: payments, loading, refetch } = useSupabaseQuery('payments-list', async (supabase) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, students(full_name)')
      .order('payment_date', { ascending: false })
    if (error) throw error
    return data || []
  })
  const { sorted: sortedPayments, sortKey, sortAsc, toggleSort } = useSort(payments ?? [], 'payment_date')

  const { data: students } = useSupabaseQuery('students-for-payments', async (supabase) => {
    const { data } = await supabase.from('students').select('id, full_name').order('full_name')
    return data || []
  })

  const { data: subscriptions } = useSupabaseQuery('subscriptions-for-payments', async (supabase) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, student_id, students(full_name)')
      .order('created_at', { ascending: false })
    return data || []
  })

  const handleAdd = () => {
    setEditingPayment(null)
    setForm({ student_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], description: '', type: 'single', subscription_id: '' })
    setShowForm(true)
  }

  const handleEdit = (p: any) => {
    setEditingPayment(p)
    setForm({
      student_id: p.student_id || '',
      amount: p.amount.toString(),
      payment_date: p.payment_date,
      description: p.description || '',
      type: p.type,
      subscription_id: p.subscription_id || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      student_id: form.student_id || null,
      amount: parseFloat(form.amount),
      payment_date: form.payment_date,
      description: form.description,
      type: form.type,
      subscription_id: form.subscription_id || null,
    }
    if (editingPayment) {
      await supabase.from('payments').update(payload).eq('id', editingPayment.id)
    } else {
      await supabase.from('payments').insert(payload)
    }
    setShowForm(false)
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить платёж?')) {
      await supabase.from('payments').delete().eq('id', id)
      refetch()
    }
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Платежи</h2>
        <button onClick={handleAdd} className="bg-success text-white px-4 py-2 rounded hover:bg-success">+ Добавить</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('payment_date')}>
              Дата {sortKey === 'payment_date' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Ученик</th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('amount')}>
              Сумма {sortKey === 'amount' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('type')}>
              Тип {sortKey === 'type' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('description')}>
              Описание {sortKey === 'description' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedPayments?.map((p: any) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="border p-2">{p.payment_date}</td>
              <td className="border p-2">{p.students?.full_name || '-'}</td>
              <td className="border p-2">{p.amount}</td>
              <td className="border p-2">{p.type === 'single' ? 'Разовый' : 'Абонемент'}</td>
              <td className="border p-2">{p.description}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(p)} className="text-brand-600 hover:underline">Ред.</button>
                <button onClick={() => handleDelete(p.id)} className="text-danger hover:underline">Удал.</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingPayment ? 'Редактировать платёж' : 'Новый платёж'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Ученик</label>
                <select value={form.student_id} onChange={(e) => setForm({...form, student_id: e.target.value})} className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {students?.map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">Сумма</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Дата</label>
                <input type="date" value={form.payment_date} onChange={(e) => setForm({...form, payment_date: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Тип</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full border p-2 rounded">
                  <option value="single">Разовый</option>
                  <option value="subscription">Абонемент</option>
                </select>
              </div>
              {form.type === 'subscription' && (
                <div>
                  <label className="block text-sm">Абонемент</label>
                  <select value={form.subscription_id} onChange={(e) => setForm({...form, subscription_id: e.target.value})} className="w-full border p-2 rounded">
                    <option value="">Выберите...</option>
                    {subscriptions?.filter((s: any) => s.student_id === form.student_id).map((s: any) => (
                      <option key={s.id} value={s.id}>Абонемент #{s.id?.slice(0,8)}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm">Описание</label>
                <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" />
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