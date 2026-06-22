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
