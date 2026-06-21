'use client'

import { useState } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useSort } from '@/hooks/useSort'
import { createClient } from '@/utils/supabase/client'

export default function ExpensesTab() {
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [form, setForm] = useState({ amount: '', expense_date: new Date().toISOString().split('T')[0], category: '', description: '' })
  const supabase = createClient()

  const { data: expenses, loading, refetch } = useSupabaseQuery('expenses-list', async (supabase) => {
    const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false })
    if (error) throw error
    return data || []
  })
  const { sorted: sortedExpenses, sortKey, sortAsc, toggleSort } = useSort(expenses ?? [], 'expense_date')

  const { data: categories } = useSupabaseQuery<string[]>('expense-categories', async (supabase) => {
    const { data } = await supabase.from('expenses').select('category')
    const cats: string[] = data?.map((e: any) => e.category).filter(Boolean) || []
    return [...new Set(cats)].sort()
  })

  const handleAdd = () => {
    setEditingExpense(null)
    setForm({ amount: '', expense_date: new Date().toISOString().split('T')[0], category: '', description: '' })
    setShowForm(true)
  }

  const handleEdit = (exp: any) => {
    setEditingExpense(exp)
    setForm({
      amount: exp.amount.toString(),
      expense_date: exp.expense_date,
      category: exp.category || '',
      description: exp.description || '',
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
      await supabase.from('expenses').update(payload).eq('id', editingExpense.id)
    } else {
      await supabase.from('expenses').insert(payload)
    }
    setShowForm(false)
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить расход?')) {
      await supabase.from('expenses').delete().eq('id', id)
      refetch()
    }
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Расходы</h2>
        <button onClick={handleAdd} className="bg-success text-white px-4 py-2 rounded hover:bg-success">+ Добавить</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('expense_date')}>
              Дата {sortKey === 'expense_date' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('category')}>
              Категория {sortKey === 'category' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('amount')}>
              Сумма {sortKey === 'amount' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('description')}>
              Описание {sortKey === 'description' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedExpenses?.map((e: any) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="border p-2">{e.expense_date}</td>
              <td className="border p-2">{e.category}</td>
              <td className="border p-2">{e.amount}</td>
              <td className="border p-2">{e.description}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(e)} className="text-brand-600 hover:underline">Ред.</button>
                <button onClick={() => handleDelete(e.id)} className="text-danger hover:underline">Удал.</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full border p-2 rounded">
                  <option value="">Без категории</option>
                  {categories?.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
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