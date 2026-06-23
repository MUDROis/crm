'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'report_fields').then((res: PostgrestSingleResponse<unknown>) => {
      const row = (res.data as Record<string, unknown>[] | null)?.[0]
      if (row?.value) {
        setFields(row.value as Record<string, boolean>)
      }
    })
  }, [])

  const toggle = (key: string) => {
    setFields(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function saveAll() {
    setSaving(true)
    await supabase.from('settings').upsert({ key: 'report_fields', value: fields }, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Поля отчётности</h2>
      <p className="text-sm text-gray-600">Выберите, какие поля показывать в отчётах.</p>

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">Настройки сохранены</div>
      )}

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

      <button onClick={saveAll} disabled={saving} className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50">
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  )
}
