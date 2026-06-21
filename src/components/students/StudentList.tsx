'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useSort } from '@/hooks/useSort'
import { createClient } from '@/utils/supabase/client'

interface Student {
  id: string
  full_name: string
  phone: string
  email: string
  subject: string
  teacher_id: string
  type: string
  customer_name: string
  status: string
  profiles: { full_name: string } | null
}

export default function StudentList() {
  const [search, setSearch] = useState('')
  const [filterTeacher, setFilterTeacher] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')

  const fetchTeachers = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
    return data || []
  }, [])

  const fetchStudents = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    let query = supabase.from('students').select('*, profiles!teacher_id(full_name)')
    if (search) query = query.ilike('full_name', `%${search}%`)
    if (filterTeacher) query = query.eq('teacher_id', filterTeacher)
    if (filterSubject) query = query.ilike('subject', `%${filterSubject}%`)
    if (filterStatus === 'active') query = query.eq('status', 'active')
    else if (filterStatus === 'archived') query = query.eq('status', 'archived')
    const { data, error } = await query.order('full_name')
    if (error) throw error
    return data || []
  }, [search, filterTeacher, filterSubject, filterStatus])

  const { data: teachers } = useSupabaseQuery('teachers-list', fetchTeachers)
  const filterKey = `students-${search}-${filterTeacher}-${filterSubject}-${filterStatus}`
  const { data: students, loading, refetch } = useSupabaseQuery(filterKey, fetchStudents)
  const { sorted: sortedStudents, sortKey, sortAsc, toggleSort } = useSort(students ?? [], 'full_name')

  const handleArchive = async (id: string) => {
    if (!confirm('Переместить ученика в архив?')) return
    const supabase = createClient()
    const { error } = await supabase.from('students').update({ status: 'archived' }).eq('id', id)
    if (error) {
      alert('Ошибка: ' + error.message)
      return
    }
    refetch()
  }

  const handleRestore = async (id: string) => {
    if (!confirm('Вернуть ученика в активные?')) return
    const supabase = createClient()
    const { error } = await supabase.from('students').update({ status: 'active' }).eq('id', id)
    if (error) {
      alert('Ошибка: ' + error.message)
      return
    }
    refetch()
  }

  if (loading && !students) {
    return <p>Загрузка...</p>
  }

  return (
    <div>
      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          placeholder="Поиск по ФИО"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className="border p-2 rounded">
          <option value="">Все преподаватели</option>
          {teachers?.map((t: any) => (
            <option key={t.id} value={t.id}>{t.full_name || t.id}</option>
          ))}
        </select>
        <input
          placeholder="Предмет"
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="border p-2 rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-2 rounded ${filterStatus === 'active' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}
          >
            Активные
          </button>
          <button
            onClick={() => setFilterStatus('archived')}
            className={`px-3 py-2 rounded ${filterStatus === 'archived' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}
          >
            Архив
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-2 rounded ${filterStatus === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}
          >
            Все
          </button>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('full_name')}>
              ФИО {sortKey === 'full_name' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('subject')}>
              Предмет {sortKey === 'subject' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Преподаватель</th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('type')}>
              Тип {sortKey === 'type' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('customer_name')}>
              Заказчик {sortKey === 'customer_name' && (sortAsc ? '↑' : '↓')}
            </th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents?.map((s: any) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="border p-2">
                <Link href={`/admin/students/${s.id}`} className="text-brand-600 hover:underline">
                  {s.full_name}
                </Link>
              </td>
              <td className="border p-2">{s.subject}</td>
              <td className="border p-2">{s.profiles?.full_name || '-'}</td>
              <td className="border p-2">{s.type === 'individual' ? 'Инд.' : 'Групп.'}</td>
              <td className="border p-2">{s.customer_name}</td>
              <td className="border p-2 space-x-2">
                {s.status === 'archived' ? (
                  <button onClick={() => handleRestore(s.id)} className="text-success hover:underline">Восстановить</button>
                ) : (
                  <button onClick={() => handleArchive(s.id)} className="text-danger hover:underline">В архив</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}