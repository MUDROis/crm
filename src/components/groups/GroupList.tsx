'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'

export default function GroupList({ onEdit }: { onEdit: (group: any) => void }) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived' | 'all'>('active')
  const supabase = createClient()

  const queryKey = `groups-${filterStatus}`
  const { data: groups, loading, refetch } = useSupabaseQuery(queryKey, async (supabase) => {
    let query = supabase.from('groups').select('*, teacher:profiles!teacher_id(full_name)').order('name')
    if (filterStatus === 'active') query = query.eq('status', 'active')
    else if (filterStatus === 'archived') query = query.eq('status', 'archived')
    const { data, error } = await query
    if (error) throw error
    return data || []
  })

  const handleArchive = async (id: string) => {
    if (!confirm('Переместить группу в архив?')) return
    await supabase.from('groups').update({ status: 'archived' }).eq('id', id)
    refetch()
  }

  const handleRestore = async (id: string) => {
    if (!confirm('Восстановить группу?')) return
    await supabase.from('groups').update({ status: 'active' }).eq('id', id)
    refetch()
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterStatus('active')} className={`px-3 py-2 rounded ${filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Активные</button>
        <button onClick={() => setFilterStatus('archived')} className={`px-3 py-2 rounded ${filterStatus === 'archived' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Архив</button>
        <button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Все</button>
      </div>

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
          {groups?.map((g: any) => (
            <tr key={g.id}>
              <td className="border p-2"><button onClick={() => router.push(`/admin/groups/${g.id}`)} className="text-blue-600 hover:underline text-left">{g.name}</button></td>
              <td className="border p-2">{g.subject}</td>
              <td className="border p-2">{g.teacher?.full_name || '-'}</td>
              <td className="border p-2 space-x-2">
                {g.status === 'archived' ? (
                  <button onClick={() => handleRestore(g.id)} className="text-green-600 hover:underline">Восстановить</button>
                ) : (
                  <button onClick={() => handleArchive(g.id)} className="text-red-600 hover:underline">В архив</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}