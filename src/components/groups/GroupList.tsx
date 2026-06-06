'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  subject: string
  teacher_id: string
  teacher: { full_name: string } | null
}

export default function GroupList({ onEdit }: { onEdit: (group: any) => void }) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    const { data, error } = await supabase.from('groups').select('*, teacher:profiles!teacher_id(full_name)').order('name')
    if (!error && data) setGroups(data)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Удалить группу?')) {
      await supabase.from('groups').delete().eq('id', id)
      loadGroups()
    }
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Название</th>
          <th className="border p-2 text-left">Предмет</th>
          <th className="border p-2 text-left">Преподаватель</th>
          <th className="border p-2 text-left">Действия</th>
        </tr>
      </thead>
      <tbody>
        {groups.map((g) => (
          <tr key={g.id}>
            <td className="border p-2">{g.name}</td>
            <td className="border p-2">{g.subject}</td>
            <td className="border p-2">{g.teacher?.full_name || '-'}</td>
            <td className="border p-2 space-x-2">
              <button onClick={() => onEdit(g)} className="text-blue-600 hover:underline">Ред.</button>
              <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:underline">Удал.</button>
              <Link href={`/admin/groups/${g.id}/students`} className="text-green-600 hover:underline">Ученики</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}