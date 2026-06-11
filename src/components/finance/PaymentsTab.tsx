'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Payment {
  id: string
  student_id: string
  amount: number
  payment_date: string
  description: string
  type: string
  subscription_id: string | null
  students: { full_name: string } | null
}

export default function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [form, setForm] = useState({
    student_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'single',
    subscription_id: '',
  })
  const [students, setStudents] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadPayments()
    loadStudents()
    loadSubscriptions()
  }, [])

  async function loadPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*, students(full_name)')
      .order('payment_date', { ascending: false })
    if (!error && data) setPayments(data)
    setLoading(false)
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('id, full_name').order('full_name')
    if (data) setStudents(data)
  }

  async function loadSubscriptions() {
    const { data } = await supabase.from('subscriptions').select('id, student_id, students(full_name)').order('created_at', { ascending: false })
    if (data) setSubscriptions(data)
  }

  const handleAdd = () => {
    setEditingPayment(null)
    setForm({
      student_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      description: '',
      type: 'single',
      subscription_id: '',
    })
    setShowForm(true)
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setForm({
      student_id: payment.student_id || '',
      amount: payment.amount.toString(),
      payment_date: payment.payment_date,
      description: payment.description || '',
      type: payment.type,
      subscription_id: payment.subscription_id || '',
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
      const { error } = await supabase.from('payments').update(payload).eq('id', editingPayment.id)
      if (error) alert(error.message)
      else {
        setShowForm(false)
        loadPayments()
      }
    } else {
      const { error } = await supabase.from('payments').insert(payload)
      if (error) alert(error.message)
      else {
        setShowForm(false)
        loadPayments()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить платёж?')) {
      await supabase.from('payments').delete().eq('id', id)
      loadPayments()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Платежи</h2>
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ Добавить</button>
      </div>
      {loading ? <p>Загрузка...</p> : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Дата</th>
              <th className="border p-2 text-left">Ученик</th>
              <th className="border p-2 text-left">Сумма</th>
              <th className="border p-2 text-left">Тип</th>
              <th className="border p-2 text-left">Описание</th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td className="border p-2">{p.payment_date}</td>
                <td className="border p-2">{p.students?.full_name || '-'}</td>
                <td className="border p-2">{p.amount}</td>
                <td className="border p-2">{p.type === 'single' ? 'Разовый' : 'Абонемент'}</td>
                <td className="border p-2">{p.description}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">Ред.</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Удал.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingPayment ? 'Редактировать платёж' : 'Новый платёж'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Ученик</label>
                <select value={form.student_id} onChange={(e) => setForm({...form, student_id: e.target.value})} className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
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
                    {subscriptions.filter(s => s.student_id === form.student_id).map(s => (
                      <option key={s.id} value={s.id}>Абонемент #{s.id?.slice(0,8)} ({s.students?.full_name})</option>
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}