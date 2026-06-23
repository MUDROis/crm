'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

const permissions = [
  { key: 'teacher_create_lessons', label: 'Создавать уроки' },
  { key: 'teacher_edit_lessons', label: 'Редактировать уроки' },
  { key: 'teacher_manage_tasks', label: 'Управлять задачами' },
  { key: 'teacher_view_finance', label: 'Видеть финансы' },
  { key: 'teacher_view_reports', label: 'Смотреть отчёты' },
  { key: 'teacher_manage_students', label: 'Управлять учениками' },
]

export default function RolesTab() {
  const [perms, setPerms] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'teacher_permissions').then(({ data }) => {
      if (data?.[0]?.value) {
        setPerms(data[0].value as Record<string, boolean>)
      }
    })
  }, [])

  const toggle = (key: string) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function saveAll() {
    setSaving(true)
    await supabase.from('settings').upsert({ key: 'teacher_permissions', value: perms }, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Права преподавателей</h2>
      <p className="text-sm text-gray-600">Настройте, что могут делать преподаватели.</p>

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">Настройки сохранены</div>
      )}

      {permissions.map(p => (
        <label key={p.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
          <span>{p.label}</span>
          <input
            type="checkbox"
            checked={perms[p.key] || false}
            onChange={() => toggle(p.key)}
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
