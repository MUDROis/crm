'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [loadingTable, setLoadingTable] = useState<string | null>(null)
  const supabase = createClient()

  // Выгрузка всей базы в JSON
  const handleBackupJSON = async () => {
    setLoading(true)
    try {
      const [
        { data: profiles },
        { data: students },
        { data: groups },
        { data: group_students },
        { data: lessons },
        { data: subscriptions },
        { data: payments },
        { data: expenses },
        { data: salaries },
        { data: tasks },
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('students').select('*'),
        supabase.from('groups').select('*'),
        supabase.from('group_students').select('*'),
        supabase.from('lessons').select('*'),
        supabase.from('subscriptions').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('salaries').select('*'),
        supabase.from('tasks').select('*'),
      ])

      const backup = {
        exported_at: new Date().toISOString(),
        data: {
          profiles,
          students,
          groups,
          group_students,
          lessons,
          subscriptions,
          payments,
          expenses,
          salaries,
          tasks,
        },
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crm-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Ошибка: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Экспорт конкретной таблицы в Excel
  const exportTableToExcel = async (tableName: string, fileName: string) => {
    setLoadingTable(tableName)
    try {
      const { data, error } = await supabase.from(tableName).select('*')
      if (error) throw error
      if (!data || data.length === 0) {
        alert('Нет данных для экспорта')
        return
      }

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, tableName)
      XLSX.writeFile(wb, `${fileName}.xlsx`)
    } catch (err: any) {
      alert('Ошибка экспорта: ' + err.message)
    } finally {
      setLoadingTable(null)
    }
  }

  const tables = [
    { key: 'profiles', label: 'Профили' },
    { key: 'students', label: 'Ученики' },
    { key: 'groups', label: 'Группы' },
    { key: 'group_students', label: 'Состав групп' },
    { key: 'lessons', label: 'Уроки' },
    { key: 'subscriptions', label: 'Абонементы' },
    { key: 'payments', label: 'Платежи' },
    { key: 'expenses', label: 'Расходы' },
    { key: 'salaries', label: 'Зарплаты' },
    { key: 'tasks', label: 'Задачи' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Резервное копирование</h1>

      {/* Полный бэкап */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Полная копия всех данных</h2>
        <p className="mb-4 text-gray-600">Все таблицы будут сохранены в одном JSON-файле.</p>
        <button
          onClick={handleBackupJSON}
          disabled={loading}
          className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Выгрузка...' : 'Скачать резервную копию (JSON)'}
        </button>
      </div>

      {/* Экспорт отдельных таблиц */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Экспорт таблиц в Excel</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tables.map((t) => (
            <button
              key={t.key}
              onClick={() => exportTableToExcel(t.key, t.key)}
              disabled={loadingTable === t.key}
              className="border rounded p-3 text-left hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium">{t.label}</div>
              <div className="text-xs text-gray-500 mt-1">
                {loadingTable === t.key ? 'Экспорт...' : '.xlsx'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}