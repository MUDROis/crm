'use client'

import { useState, useMemo } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useSort } from '@/hooks/useSort'
import { createClient } from '@/utils/supabase/client'

export default function StudentPaymentsTab({ studentId }: { studentId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [form, setForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], description: '', type: 'single', subscription_id: '' })
  const supabase = createClient()

  const { data: payments, loading, refetch } = useSupabaseQuery(`student-payments-${studentId}`, async (supabase) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false })
    if (error) throw error
    return data || []
  })
  const { sorted: sortedPayments, sortKey, sortAsc, toggleSort } = useSort(payments ?? [], 'payment_date')

  const { data: subscriptions } = useSupabaseQuery(`student-subs-for-payments-${studentId}`, async (supabase) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    return data || []
  })

  const pricePerLesson = useMemo(() => {
    if (!form.subscription_id) return null
    const sub = subscriptions?.find((s: any) => s.id === form.subscription_id)
    if (!sub || !sub.total_lessons || sub.total_lessons <= 0) return null
    return (sub.cost || 0) / sub.total_lessons
  }, [form.subscription_id, subscriptions])

  const handleAdd = () => {
    setEditingPayment(null)
    setForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], description: '', type: 'single', subscription_id: '' })
    setShowForm(true)
  }

  const handleEdit = (payment: any) => {
    setEditingPayment(payment)
    setForm({
      amount: payment.amount.toString(),
      payment_date: payment.payment_date,
      description: payment.description || '',
      type: payment.type,
      subscription_id: payment.subscription_id || '',
    })
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingPayment(null)
  }

  const handleSubscriptionChange = (subId: string) => {
    const sub = subscriptions?.find((s: any) => s.id === subId)
    setForm({
      ...form,
      subscription_id: subId,
      amount: sub ? String(sub.cost || 0) : form.amount,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      amount: parseFloat(form.amount),
      payment_date: form.payment_date,
      description: form.description,
      type: form.type,
      subscription_id: form.type === 'subscription' ? (form.subscription_id || null) : null,
    }
    if (editingPayment) {
      await supabase.from('payments').update(payload).eq('id', editingPayment.id)
    } else {
      await supabase.from('payments').insert({
        ...payload,
        student_id: studentId,
      })
    }
    handleClose()
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
        <h3 className="text-lg font-semibold">Платежи</h3>
        <button onClick={handleAdd} className="bg-success text-white px-3 py-1 rounded">+ Добавить</button>
      </div>
      {payments?.length === 0 ? (
        <p>Нет платежей</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('payment_date')}>
                Дата {sortKey === 'payment_date' && (sortAsc ? '↑' : '↓')}
              </th>
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
                <td className="border p-2 cursor-pointer hover:text-brand-600" onClick={() => handleEdit(p)}>{p.payment_date}</td>
                <td className="border p-2">{p.amount}</td>
                <td className="border p-2">{p.type === 'single' ? 'Разовый' : 'Абонемент'}</td>
                <td className="border p-2">{p.description}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleDelete(p.id)} className="text-danger hover:underline" title="Удалить">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
          <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editingPayment ? 'Редактировать платёж' : 'Новый платёж'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value, subscription_id: e.target.value === 'single' ? '' : form.subscription_id})} className="w-full border p-2 rounded">
                  <option value="single">Разовый</option>
                  <option value="subscription">Абонемент</option>
                </select>
              </div>
              {form.type === 'subscription' && (
                <div>
                  <label className="block text-sm">Абонемент</label>
                  <select value={form.subscription_id} onChange={(e) => handleSubscriptionChange(e.target.value)} className="w-full border p-2 rounded">
                    <option value="">Выберите...</option>
                    {subscriptions?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.total_lessons} зн. · {(s.cost || 0).toLocaleString()} ₽ · ост. {s.remaining_lessons}
                      </option>
                    ))}
                  </select>
                  {pricePerLesson !== null && (
                    <p className="text-xs text-gray-500 mt-1">
                      Цена за занятие: {pricePerLesson.toFixed(2)} ₽
                    </p>
                  )}
                  {!editingPayment && form.subscription_id && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Сумма автоматически подставлена из стоимости абонемента. Вы можете изменить её вручную.
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm">Описание</label>
                <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                {editingPayment && (
                  <button type="button" onClick={() => { if (confirm('Удалить платёж?')) { handleDelete(editingPayment.id); handleClose(); } }} className="px-4 py-2 text-danger hover:bg-red-50 rounded">
                    🗑️ Удалить
                  </button>
                )}
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
