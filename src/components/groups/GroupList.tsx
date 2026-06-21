'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useSort } from '@/hooks/useSort'
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
  const { sorted: sortedGroups, sortKey, sortAsc, toggleSort } = useSort(groups ?? [], 'name')

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
        <button onClick={() => setFilterStatus('active')} className={`px-3 py-2 rounded ${filterStatus === 'active' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Активные</button>
        <button onClick={() => setFilterStatus('archived')} className={`px-3 py-2 rounded ${filterStatus === 'archived' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Архив</button>
        <button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded ${filterStatus === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Все</button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('name')}>
              Название {sortKey === 'name' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('subject')}>
              Предмет {sortKey === 'subject' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Преподаватель</th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedGroups?.map((g: any) => (
            <tr key={g.id} className="hover:bg-gray-50">
              <td className="border p-2"><button onClick={() => router.push(`/admin/groups/${g.id}`)} className="text-brand-600 hover:underline text-left">{g.name}</button></td>
              <td className="border p-2">{g.subject}</td>
              <td className="border p-2">{g.teacher?.full_name || '-'}</td>
              <td className="border p-2 space-x-2">
                {g.status === 'archived' ? (
                  <button onClick={() => handleRestore(g.id)} className="text-success hover:underline">Восстановить</button>
                ) : (
                  <button onClick={() => handleArchive(g.id)} className="text-danger hover:underline">В архив</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}