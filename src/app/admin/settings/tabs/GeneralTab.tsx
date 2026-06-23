'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function GeneralTab() {
  const [settings, setSettings] = useState({
    school_name: '',
    school_phone: '',
    school_email: '',
    working_hours: { start: '09:00', end: '21:00' },
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .in('key', ['school_name', 'school_phone', 'school_email', 'working_hours'])
      .then(({ data }) => {
        if (data) {
          const obj: Record<string, unknown> = {}
          data.forEach(item => { obj[item.key] = item.value })
          setSettings(prev => ({
            ...prev,
            school_name: (obj.school_name as string) ?? prev.school_name,
            school_phone: (obj.school_phone as string) ?? prev.school_phone,
            school_email: (obj.school_email as string) ?? prev.school_email,
            working_hours: (obj.working_hours as { start: string; end: string }) ?? prev.working_hours,
          }))
        }
      })
  }, [])

  async function saveAll() {
    setSaving(true)
    const entries = [
      { key: 'school_name', value: settings.school_name },
      { key: 'school_phone', value: settings.school_phone },
      { key: 'school_email', value: settings.school_email },
      { key: 'working_hours', value: settings.working_hours },
    ]
    await Promise.all(entries.map(e => supabase.from('settings').upsert(e, { onConflict: 'key' })))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Общие настройки школы</h2>

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">Настройки сохранены</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Название школы</label>
          <input
            type="text"
            value={settings.school_name}
            onChange={e => setSettings(p => ({ ...p, school_name: e.target.value }))}
            className="mt-1 w-full border p-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Телефон</label>
          <input
            type="text"
            value={settings.school_phone}
            onChange={e => setSettings(p => ({ ...p, school_phone: e.target.value }))}
            className="mt-1 w-full border p-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={settings.school_email}
            onChange={e => setSettings(p => ({ ...p, school_email: e.target.value }))}
            className="mt-1 w-full border p-2 rounded-lg"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Рабочие часы</label>
          <div className="flex gap-4 mt-1">
            <input
              type="time"
              value={settings.working_hours.start}
              onChange={e => setSettings(p => ({ ...p, working_hours: { ...p.working_hours, start: e.target.value } }))}
              className="border p-2 rounded-lg w-32"
            />
            <span className="self-center">—</span>
            <input
              type="time"
              value={settings.working_hours.end}
              onChange={e => setSettings(p => ({ ...p, working_hours: { ...p.working_hours, end: e.target.value } }))}
              className="border p-2 rounded-lg w-32"
            />
          </div>
        </div>
      </div>

      <button onClick={saveAll} disabled={saving} className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50">
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  )
}
