'use client'

import { useState } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'

export default function StudentPaymentsTab({ studentId }: { studentId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [form, setForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], description: '', type: 'single' })
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

  const handleAdd = () => {
    setEditingPayment(null)
    setForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], description: '', type: 'single' })
    setShowForm(true)
  }

  const handleEdit = (payment: any) => {
    setEditingPayment(payment)
    setForm({
      amount: payment.amount.toString(),
      payment_date: payment.payment_date,
      description: payment.description || '',
      type: payment.type,
    })
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingPayment(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPayment) {
      await supabase.from('payments').update({
        amount: parseFloat(form.amount),
        payment_date: form.payment_date,
        description: form.description,
        type: form.type,
      }).eq('id', editingPayment.id)
    } else {
      await supabase.from('payments').insert({
        student_id: studentId,
        amount: parseFloat(form.amount),
        payment_date: form.payment_date,
        description: form.description,
        type: form.type,
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
        <button onClick={handleAdd} className="bg-green-600 text-white px-3 py-1 rounded">+ Добавить</button>
      </div>
      {payments?.length === 0 ? (
        <p>Нет платежей</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Дата</th>
              <th className="border p-2 text-left">Сумма</th>
              <th className="border p-2 text-left">Тип</th>
              <th className="border p-2 text-left">Описание</th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {payments?.map((p: any) => (
              <tr key={p.id}>
                <td className="border p-2 cursor-pointer hover:text-blue-600" onClick={() => handleEdit(p)}>{p.payment_date}</td>
                <td className="border p-2">{p.amount}</td>
                <td className="border p-2">{p.type === 'single' ? 'Разовый' : 'Абонемент'}</td>
                <td className="border p-2">{p.description}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline" title="Удалить">
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
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full border p-2 rounded">
                  <option value="single">Разовый</option>
                  <option value="subscription">Абонемент</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Описание</label>
                <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                {editingPayment && (
                  <button type="button" onClick={() => { if (confirm('Удалить платёж?')) { handleDelete(editingPayment.id); handleClose(); } }} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded">
                    🗑️ Удалить
                  </button>
                )}
                <button type="button" onClick={handleClose} className="px-4 py-2 border rounded">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}