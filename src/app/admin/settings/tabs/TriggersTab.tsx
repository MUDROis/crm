'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

const triggers = [
  { key: 'notify_new_student', label: 'Новый ученик' },
  { key: 'notify_new_task', label: 'Новая задача' },
  { key: 'notify_new_payment', label: 'Новый платёж' },
  { key: 'notify_lesson_change', label: 'Изменение урока' },
]

export default function TriggersTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'notification_triggers').then(({ data }) => {
      if (data?.[0]?.value) {
        setEnabled(data[0].value as Record<string, boolean>)
      }
    })
  }, [])

  const toggle = async (key: string) => {
    const next = { ...enabled, [key]: !enabled[key] }
    setEnabled(next)
    await supabase.from('settings').upsert({ key: 'notification_triggers', value: next }, { onConflict: 'key' })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Уведомления</h2>
      <p className="text-sm text-gray-600">Включите события, при которых будут отправляться уведомления.</p>
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
    </div>
  )
}
