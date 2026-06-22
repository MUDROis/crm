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
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .in('key', ['school_name', 'school_phone', 'school_email', 'working_hours'])

    if (data) {
      const obj: any = {}
      data.forEach(item => { obj[item.key] = item.value })
      setSettings(prev => ({
        ...prev,
        school_name: obj.school_name ?? prev.school_name,
        school_phone: obj.school_phone ?? prev.school_phone,
        school_email: obj.school_email ?? prev.school_email,
        working_hours: obj.working_hours ?? prev.working_hours,
      }))
    }
  }

  async function saveSetting(key: string, value: any) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' })
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Общие настройки школы</h2>

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
          Настройки сохранены
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Название школы</label>
          <input
            type="text"
            value={settings.school_name}
            onChange={e => { setSettings(p => ({ ...p, school_name: e.target.value })); saveSetting('school_name', e.target.value) }}
            className="mt-1 w-full border p-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Телефон</label>
          <input
            type="text"
            value={settings.school_phone}
            onChange={e => { setSettings(p => ({ ...p, school_phone: e.target.value })); saveSetting('school_phone', e.target.value) }}
            className="mt-1 w-full border p-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={settings.school_email}
            onChange={e => { setSettings(p => ({ ...p, school_email: e.target.value })); saveSetting('school_email', e.target.value) }}
            className="mt-1 w-full border p-2 rounded-lg"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Рабочие часы</label>
          <div className="flex gap-4 mt-1">
            <input
              type="time"
              value={settings.working_hours.start}
              onChange={e => { const updated = { ...settings.working_hours, start: e.target.value }; setSettings(p => ({ ...p, working_hours: updated })); saveSetting('working_hours', updated) }}
              className="border p-2 rounded-lg w-32"
            />
            <span className="self-center">—</span>
            <input
              type="time"
              value={settings.working_hours.end}
              onChange={e => { const updated = { ...settings.working_hours, end: e.target.value }; setSettings(p => ({ ...p, working_hours: updated })); saveSetting('working_hours', updated) }}
              className="border p-2 rounded-lg w-32"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
