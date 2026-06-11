'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Expense {
  id: string
  amount: number
  expense_date: string
  category: string
  description: string
}

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState({
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false })
    if (!error && data) setExpenses(data)
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingExpense(null)
    setForm({ amount: '', expense_date: new Date().toISOString().split('T')[0], category: '', description: '' })
    setShowForm(true)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setForm({
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      category: expense.category || '',
      description: expense.description || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      category: form.category,
      description: form.description,
    }
    if (editingExpense) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', editingExpense.id)
      if (error) alert(error.message)
      else {
        setShowForm(false)
        loadExpenses()
      }
    } else {
      const { error } = await supabase.from('expenses').insert(payload)
      if (error) alert(error.message)
      else {
        setShowForm(false)
        loadExpenses()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить расход?')) {
      await supabase.from('expenses').delete().eq('id', id)
      loadExpenses()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Расходы</h2>
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ Добавить</button>
      </div>
      {loading ? <p>Загрузка...</p> : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Дата</th>
              <th className="border p-2 text-left">Категория</th>
              <th className="border p-2 text-left">Сумма</th>
              <th className="border p-2 text-left">Описание</th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td className="border p-2">{e.expense_date}</td>
                <td className="border p-2">{e.category}</td>
                <td className="border p-2">{e.amount}</td>
                <td className="border p-2">{e.description}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleEdit(e)} className="text-blue-600 hover:underline">Ред.</button>
                  <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:underline">Удал.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingExpense ? 'Редактировать расход' : 'Новый расход'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Сумма</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Дата</label>
                <input type="date" value={form.expense_date} onChange={(e) => setForm({...form, expense_date: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Категория</label>
                <input type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full border p-2 rounded" />
              </div>
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