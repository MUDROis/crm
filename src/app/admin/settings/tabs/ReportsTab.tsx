'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

const reportFields = [
  { key: 'show_attendance', label: 'Посещаемость' },
  { key: 'show_payments', label: 'Платежи' },
  { key: 'show_debt', label: 'Задолженность' },
  { key: 'show_lesson_count', label: 'Количество уроков' },
  { key: 'show_teacher_notes', label: 'Заметки преподавателя' },
  { key: 'show_subject', label: 'Предмет' },
  { key: 'show_group', label: 'Группа' },
]

export default function ReportsTab() {
  const [fields, setFields] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'report_fields').then(({ data }) => {
      if (data?.[0]?.value) {
        setFields(data[0].value as Record<string, boolean>)
      }
    })
  }, [])

  const toggle = async (key: string) => {
    const next = { ...fields, [key]: !fields[key] }
    setFields(next)
    await supabase.from('settings').upsert({ key: 'report_fields', value: next }, { onConflict: 'key' })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Поля отчётности</h2>
      <p className="text-sm text-gray-600">Выберите, какие поля показывать в отчётах.</p>
      {reportFields.map(f => (
        <label key={f.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
          <span>{f.label}</span>
          <input
            type="checkbox"
            checked={fields[f.key] || false}
            onChange={() => toggle(f.key)}
            className="w-5 h-5"
          />
        </label>
      ))}
    </div>
  )
}
