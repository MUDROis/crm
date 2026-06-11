'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Salary {
  id: string
  teacher_id: string
  amount: number
  period_start: string
  period_end: string
  paid: boolean
  profiles: { full_name: string } | null
}

export default function SalariesTab() {
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null)
  const [form, setForm] = useState({
    teacher_id: '',
    amount: '',
    period_start: '',
    period_end: '',
  })
  const [teachers, setTeachers] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadSalaries()
    loadTeachers()
  }, [])

  async function loadSalaries() {
    const { data, error } = await supabase
      .from('salaries')
      .select('*, profiles(full_name)')
      .order('period_start', { ascending: false })
    if (!error && data) setSalaries(data)
    setLoading(false)
  }

  async function loadTeachers() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
    if (data) setTeachers(data)
  }

  const handleAdd = () => {
    setEditingSalary(null)
    setForm({ teacher_id: '', amount: '', period_start: '', period_end: '' })
    setShowForm(true)
  }

  const handleEdit = (salary: Salary) => {
    setEditingSalary(salary)
    setForm({
      teacher_id: salary.teacher_id,
      amount: salary.amount.toString(),
      period_start: salary.period_start || '',
      period_end: salary.period_end || '',
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
      const { error } = await supabase.from('salaries').update(payload).eq('id', editingSalary.id)
      if (error) alert(error.message)
      else {
        setShowForm(false)
        loadSalaries()
      }
    } else {
      const { error } = await supabase.from('salaries').insert(payload)
      if (error) alert(error.message)
      else {
        setShowForm(false)
        loadSalaries()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить запись о зарплате?')) {
      await supabase.from('salaries').delete().eq('id', id)
      loadSalaries()
    }
  }

  async function togglePaid(id: string, current: boolean) {
    await supabase.from('salaries').update({ paid: !current }).eq('id', id)
    loadSalaries()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Зарплаты</h2>
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ Добавить</button>
      </div>
      {loading ? <p>Загрузка...</p> : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Преподаватель</th>
              <th className="border p-2 text-left">Сумма</th>
              <th className="border p-2 text-left">Период</th>
              <th className="border p-2 text-left">Статус</th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map(s => (
              <tr key={s.id}>
                <td className="border p-2">{s.profiles?.full_name || '-'}</td>
                <td className="border p-2">{s.amount}</td>
                <td className="border p-2">{s.period_start} – {s.period_end}</td>
                <td className="border p-2">{s.paid ? 'Выплачено' : 'Не выплачено'}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline">Ред.</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Удал.</button>
                  <button onClick={() => togglePaid(s.id, s.paid)} className="text-green-600 hover:underline">
                    {s.paid ? 'Отменить' : 'Выплатить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingSalary ? 'Редактировать зарплату' : 'Начислить зарплату'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Преподаватель *</label>
                <select value={form.teacher_id} onChange={(e) => setForm({...form, teacher_id: e.target.value})} required className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}