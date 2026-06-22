# Admin Settings Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `/admin/settings` page with 7 tabs, move backup there, update navigation.

**Architecture:** Each tab is a separate client component in `tabs/`. Main page handles tab switching. Backup component from `backup/page.tsx` moves into SystemTab. Navbar/dashboard link changes are minimal edits. SQL migration creates `settings` and `online_links` tables.

**Tech Stack:** Next.js 16 (App Router), Supabase (client), Tailwind 4, xlsx (already in deps)

## Global Constraints

- All new pages go under `src/app/admin/settings/`
- Tab components go under `src/app/admin/settings/tabs/`
- Use `createClient` from `@/utils/supabase/client` for all DB access
- Use existing design patterns (Tailwind classes, card styles) from other admin pages
- No tests exist in the project — verify manually in browser
- Follow existing code style: no comments in code

---

## File Structure

```
src/app/admin/
├── settings/
│   ├── page.tsx              ← Main settings page with tab navigation (CREATE)
│   └── tabs/
│       ├── GeneralTab.tsx     ← School name, phone, email, hours (CREATE)
│       ├── DirectoriesTab.tsx  ← Subjects, rooms, online_links tables (CREATE)
│       ├── AppearanceTab.tsx   ← Dark theme toggle (CREATE)
│       ├── TriggersTab.tsx     ← Notification triggers (CREATE)
│       ├── ReportsTab.tsx      ← Report field config (CREATE)
│       ├── RolesTab.tsx        ← Teacher permissions (CREATE)
│       └── SystemTab.tsx       ← Version, cache, backup/export (CREATE)
├── backup/
│   └── page.tsx              ← DELETE (moved to SystemTab)

src/components/
├── AdminNavbar.tsx           ← MODIFY: replace 💾 with ⚙️
└── Breadcrumbs.tsx           ← MODIFY: add settings, remove backup

migrations/
└── add_settings_tables.sql   ← CREATE: settings + online_links tables

docs/superpowers/specs/
└── 2026-06-22-admin-settings-design.md  ← already written
```

---

### Task 1: SQL Migration

**Files:**
- Create: `migrations/add_settings_tables.sql`

**Interfaces:**
- Produces: `settings` table (key/value), `online_links` table (name/url)

- [ ] **Create migration file**

Write `migrations/add_settings_tables.sql`:

```sql
-- Settings key-value store
create table if not exists settings (
  id bigint primary key generated always as identity,
  key text unique not null,
  value jsonb,
  description text,
  updated_at timestamptz default now()
);

alter table settings enable row level security;

create policy "Admins can manage settings"
  on settings
  to authenticated
  using (auth.jwt()->>'role' = 'admin')
  with check (auth.jwt()->>'role' = 'admin');

-- Online links directory
create table if not exists online_links (
  id bigint primary key generated always as identity,
  name text not null,
  url text not null,
  created_at timestamptz default now()
);

alter table online_links enable row level security;

create policy "Admins can manage online_links"
  on online_links
  to authenticated
  using (auth.jwt()->>'role' = 'admin')
  with check (auth.jwt()->>'role' = 'admin');
```

- [ ] **Commit**

```bash
git add migrations/add_settings_tables.sql
git commit -m "feat: add settings and online_links tables"
```

---

### Task 2: SystemTab (backup moved here)

**Files:**
- Create: `src/app/admin/settings/tabs/SystemTab.tsx`
- Delete: `src/app/admin/backup/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/utils/supabase/client`
- Produces: `<SystemTab />` component (no props)

- [ ] **Create SystemTab.tsx**

This is a direct copy of the current `backup/page.tsx` with a title change and added version info + cache clear:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'

export default function SystemTab() {
  const [loading, setLoading] = useState(false)
  const [loadingTable, setLoadingTable] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)
  const supabase = createClient()

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
        data: { profiles, students, groups, group_students, lessons, subscriptions, payments, expenses, salaries, tasks },
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

  const handleClearCache = () => {
    if (confirm('Очистить кэш браузера для этого сайта?')) {
      localStorage.clear()
      sessionStorage.clear()
      setCleared(true)
      setTimeout(() => setCleared(false), 3000)
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Системная информация</h2>
        <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
          <div><span className="font-medium">Версия CRM:</span> 0.1.0</div>
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold mb-2">Инструменты</h3>
        <button
          onClick={handleClearCache}
          className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-100 transition"
        >
          Сбросить кэш браузера
        </button>
        {cleared && <span className="ml-2 text-green-600 text-sm">Кэш очищен</span>}
      </div>

      <hr />

      <div className="bg-white p-6 rounded shadow">
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
```

- [ ] **Delete `src/app/admin/backup/page.tsx`**

- [ ] **Commit**

```bash
git add src/app/admin/settings/tabs/SystemTab.tsx
git rm src/app/admin/backup/page.tsx
git commit -m "feat: move backup to SystemTab in settings"
```

---

### Task 3: GeneralTab

**Files:**
- Create: `src/app/admin/settings/tabs/GeneralTab.tsx`

**Interfaces:**
- Consumes: `settings` table (key/value pairs from supabase)
- Produces: `<GeneralTab />` component (no props)

- [ ] **Create GeneralTab.tsx**

```tsx
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
```

- [ ] **Commit**

```bash
git add src/app/admin/settings/tabs/GeneralTab.tsx
git commit -m "feat: add GeneralTab with school settings"
```

---

### Task 4: DirectoriesTab

**Files:**
- Create: `src/app/admin/settings/tabs/DirectoriesTab.tsx`

**Interfaces:**
- Consumes: `subjects`, `rooms`, `online_links` tables
- Produces: `<DirectoriesTab />` component (no props)

- [ ] **Create DirectoriesTab.tsx**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

type TableDef = {
  name: string
  label: string
  columns: { key: string; label: string }[]
}

const tables: TableDef[] = [
  { name: 'subjects', label: 'Предметы', columns: [{ key: 'name', label: 'Название' }] },
  { name: 'rooms', label: 'Кабинеты', columns: [{ key: 'name', label: 'Название' }] },
  { name: 'online_links', label: 'Ссылки на онлайн-занятия', columns: [{ key: 'name', label: 'Название' }, { key: 'url', label: 'URL' }] },
]

function EditableTable({ tableDef }: { tableDef: TableDef }) {
  const [rows, setRows] = useState<any[]>([])
  const [newRow, setNewRow] = useState<Record<string, string>>({})
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from(tableDef.name).select('*').order('id')
    setRows(data || [])
  }, [tableDef.name])

  useEffect(() => { load() }, [load])

  const addRow = async () => {
    const values = Object.fromEntries(tableDef.columns.map(c => [c.key, newRow[c.key] || '']))
    if (!values[tableDef.columns[0].key]) return
    await supabase.from(tableDef.name).insert(values)
    setNewRow({})
    await load()
  }

  const updateCell = async (id: number, key: string, value: string) => {
    await supabase.from(tableDef.name).update({ [key]: value }).eq('id', id)
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r))
  }

  const deleteRow = async (id: number) => {
    if (!confirm(`Удалить?`)) return
    await supabase.from(tableDef.name).delete().eq('id', id)
    await load()
  }

  return (
    <div>
      <h3 className="text-md font-semibold mb-3">{tableDef.label}</h3>
      <table className="w-full border-collapse mb-3">
        <thead>
          <tr className="bg-gray-100">
            {tableDef.columns.map(c => (
              <th key={c.key} className="text-left p-2 border">{c.label}</th>
            ))}
            <th className="p-2 border w-20"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {tableDef.columns.map(c => (
                <td key={c.key} className="p-1 border">
                  <input
                    type="text"
                    defaultValue={row[c.key]}
                    onBlur={e => updateCell(row.id, c.key, e.target.value)}
                    className="w-full p-1 border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-brand-500 rounded"
                  />
                </td>
              ))}
              <td className="p-1 border text-center">
                <button onClick={() => deleteRow(row.id)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        {tableDef.columns.map(c => (
          <input
            key={c.key}
            type="text"
            value={newRow[c.key] || ''}
            onChange={e => setNewRow(p => ({ ...p, [c.key]: e.target.value }))}
            placeholder={c.label}
            className="flex-1 border p-2 rounded-lg"
          />
        ))}
        <button onClick={addRow} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          Добавить
        </button>
      </div>
    </div>
  )
}

export default function DirectoriesTab() {
  return (
    <div className="space-y-8">
      {tables.map(t => (
        <div key={t.name}>
          <EditableTable tableDef={t} />
          <hr className="my-6" />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/settings/tabs/DirectoriesTab.tsx
git commit -m "feat: add DirectoriesTab with editable tables"
```

---

### Task 5: TriggersTab

**Files:**
- Create: `src/app/admin/settings/tabs/TriggersTab.tsx`

**Interfaces:**
- Consumes: `settings` table
- Produces: `<TriggersTab />` component (no props)

- [ ] **Create TriggersTab.tsx**

```tsx
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
```

- [ ] **Commit**

```bash
git add src/app/admin/settings/tabs/TriggersTab.tsx
git commit -m "feat: add TriggersTab"
```

---

### Task 6: ReportsTab

**Files:**
- Create: `src/app/admin/settings/tabs/ReportsTab.tsx`

**Interfaces:**
- Consumes: `settings` table
- Produces: `<ReportsTab />` component (no props)

- [ ] **Create ReportsTab.tsx**

```tsx
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
```

- [ ] **Commit**

```bash
git add src/app/admin/settings/tabs/ReportsTab.tsx
git commit -m "feat: add ReportsTab"
```

---

### Task 7: RolesTab

**Files:**
- Create: `src/app/admin/settings/tabs/RolesTab.tsx`

**Interfaces:**
- Consumes: `settings` table
- Produces: `<RolesTab />` component (no props)

- [ ] **Create RolesTab.tsx**

```tsx
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
  const supabase = createClient()

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'teacher_permissions').then(({ data }) => {
      if (data?.[0]?.value) {
        setPerms(data[0].value as Record<string, boolean>)
      }
    })
  }, [])

  const toggle = async (key: string) => {
    const next = { ...perms, [key]: !perms[key] }
    setPerms(next)
    await supabase.from('settings').upsert({ key: 'teacher_permissions', value: next }, { onConflict: 'key' })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Права преподавателей</h2>
      <p className="text-sm text-gray-600">Настройте, что могут делать преподаватели.</p>
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
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/settings/tabs/RolesTab.tsx
git commit -m "feat: add RolesTab"
```

---

### Task 8: AppearanceTab

**Files:**
- Create: `src/app/admin/settings/tabs/AppearanceTab.tsx`

**Interfaces:**
- Consumes: nothing (localStorage-based)
- Produces: `<AppearanceTab />` component (no props)

- [ ] **Create AppearanceTab.tsx**

```tsx
'use client'

import { useState, useEffect } from 'react'

export default function AppearanceTab() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Оформление</h2>
      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
        <span>Тёмная тема</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={toggleDark}
          className="w-5 h-5"
        />
      </label>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/settings/tabs/AppearanceTab.tsx
git commit -m "feat: add AppearanceTab with dark theme toggle"
```

---

### Task 9: Main Settings Page

**Files:**
- Create: `src/app/admin/settings/page.tsx`

**Interfaces:**
- Consumes: all tab components from Tasks 2-8
- Produces: Route page at `/admin/settings`

- [ ] **Create `src/app/admin/settings/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import GeneralTab from './tabs/GeneralTab'
import DirectoriesTab from './tabs/DirectoriesTab'
import AppearanceTab from './tabs/AppearanceTab'
import TriggersTab from './tabs/TriggersTab'
import ReportsTab from './tabs/ReportsTab'
import RolesTab from './tabs/RolesTab'
import SystemTab from './tabs/SystemTab'

const tabs = [
  { key: 'general', label: 'Общие' },
  { key: 'directories', label: 'Справочники' },
  { key: 'appearance', label: 'Оформление' },
  { key: 'triggers', label: 'Триггеры' },
  { key: 'reports', label: 'Отчётность' },
  { key: 'roles', label: 'Роли' },
  { key: 'system', label: 'Система' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Настройки</h1>

      <div className="flex gap-1 mb-6 border-b pb-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg whitespace-nowrap text-sm transition ${
              activeTab === tab.key
                ? 'bg-white text-brand-600 border-b-2 border-brand-600 font-medium'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'directories' && <DirectoriesTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'triggers' && <TriggersTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'system' && <SystemTab />}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/settings/page.tsx
git commit -m "feat: add main settings page with tab navigation"
```

---

### Task 10: Update Navigation

**Files:**
- Modify: `src/components/AdminNavbar.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/Breadcrumbs.tsx`

- [ ] **Update AdminNavbar.tsx** — replace backup icon with settings icon

Change:
```tsx
        <Link href="/admin/backup" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          💾
        </Link>
```
To:
```tsx
        <Link href="/admin/settings" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          ⚙️
        </Link>
```

- [ ] **Update admin dashboard page.tsx** — replace backup card with settings card

Change lines 35-38:
```tsx
        <Link href="/admin/backup" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">💾 Резервное копирование</h2>
          <p className="text-gray-600">Полная копия данных, экспорт в Excel</p>
        </Link>
```
To:
```tsx
        <Link href="/admin/settings" className="p-6 bg-white rounded shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold">⚙️ Настройки</h2>
          <p className="text-gray-600">Управление настройками школы</p>
        </Link>
```

- [ ] **Update Breadcrumbs.tsx** — add settings, remove backup

In `segmentLabels`, remove `backup: 'Резервное копирование'` and add:
```tsx
  settings: 'Настройки',
```

- [ ] **Commit**

```bash
git add src/components/AdminNavbar.tsx src/app/admin/page.tsx src/components/Breadcrumbs.tsx
git commit -m "feat: update navigation — replace backup with settings"
```

---

## Self-Review Checklist

- [ ] Every tab from the spec has a corresponding task ✓
- [ ] No placeholders or TODOs in the plan ✓
- [ ] All file paths are exact ✓
- [ ] Type/function names consistent across tasks ✓
- [ ] File structure matches previous exploration of codebase ✓
