'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'

const triggers = [
  { key: 'notify_new_student', label: 'Новый ученик' },
  { key: 'notify_new_task', label: 'Новая задача' },
  { key: 'notify_new_payment', label: 'Новый платёж' },
  { key: 'notify_lesson_change', label: 'Изменение урока' },
]

export default function TriggersTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'notification_triggers').then((res: PostgrestSingleResponse<unknown>) => {
      const row = (res.data as Record<string, unknown>[] | null)?.[0]
      if (row?.value) {
        setEnabled(row.value as Record<string, boolean>)
      }
    })
  }, [])

  const toggle = (key: string) => {
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function saveAll() {
    setSaving(true)
    await supabase.from('settings').upsert({ key: 'notification_triggers', value: enabled }, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Уведомления</h2>
      <p className="text-sm text-gray-600">Включите события, при которых будут отправляться уведомления.</p>

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">Настройки сохранены</div>
      )}

      {triggers.map(t => (
        <label key={t.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
          <span>{t.label}</span>
          <input
            type="checkbox"
            checked={enabled[t.key] || false}
            onChange={() => toggle(t.key)}
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
