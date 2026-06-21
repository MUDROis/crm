'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Group {
  id?: string
  name: string
  subject: string
  teacher_id: string | null
  online_link: string
}

interface Teacher {
  id: string
  full_name: string
}

interface Student {
  id: string
  full_name: string
  subject: string
}

export default function GroupForm({
  onClose,
  onSaved,
  group,
}: {
  onClose: () => void
  onSaved: () => void
  group?: Group | null
}) {
  const cleanGroup = group ? {
    id: group.id,
    name: group.name,
    subject: group.subject,
    teacher_id: group.teacher_id,
    online_link: group.online_link,
  } : null

  const [form, setForm] = useState<Group>(
    cleanGroup || { name: '', subject: '', teacher_id: '', online_link: '' }
  )
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [groupStudents, setGroupStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadTeachers()
    if (form.id) loadGroupStudents()
    else loadAllStudents()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadTeachers() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
    if (data) setTeachers(data)
  }

  async function loadGroupStudents() {
    const { data: all } = await supabase.from('students').select('id, full_name, subject').order('full_name')
    setAllStudents(all || [])

    const { data: inGroup } = await supabase
      .from('group_students')
      .select('student:students(id, full_name, subject)')
      .eq('group_id', form.id)
    setGroupStudents((inGroup || []).map((item: any) => item.student).filter(Boolean))
  }

  async function loadAllStudents() {
    const { data } = await supabase.from('students').select('id, full_name, subject').order('full_name')
    setAllStudents(data || [])
  }

  const filteredStudents = allStudents.filter(
    (s) => !groupStudents.find((gs) => gs.id === s.id) &&
      s.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const addStudent = async (student: Student) => {
    if (!form.id) return
    await supabase.from('group_students').insert({ group_id: form.id, student_id: student.id })
    setGroupStudents((prev) => [...prev, student])
    setSearch('')
    setShowDropdown(false)
  }

  const removeStudent = async (studentId: string) => {
    if (!form.id) return
    await supabase.from('group_students').delete().eq('group_id', form.id).eq('student_id', studentId)
    setGroupStudents((prev) => prev.filter((s) => s.id !== studentId))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleDelete = async () => {
    if (!form.id || !confirm('Удалить группу навсегда?')) return
    setLoading(true)
    await supabase.from('group_students').delete().eq('group_id', form.id)
    await supabase.from('groups').delete().eq('id', form.id)
    setLoading(false)
    onClose()
    onSaved()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const dataToSave = { ...form }
    if (dataToSave.teacher_id === '') dataToSave.teacher_id = null

    delete (dataToSave as any).teacher

    if (form.id) {
      const { error } = await supabase.from('groups').update(dataToSave).eq('id', form.id)
      if (error) alert(error.message)
    } else {
      const { error } = await supabase.from('groups').insert(dataToSave)
      if (error) { alert(error.message); setLoading(false); return }
    }
    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{form.id ? 'Редактировать группу' : 'Новая группа'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Название *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Предмет</label>
            <input name="subject" value={form.subject} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Преподаватель</label>
            <select name="teacher_id" value={form.teacher_id ?? ''} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="">Выберите...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name || t.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Ссылка на онлайн-урок</label>
            <input name="online_link" value={form.online_link} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          {form.id && (
            <div>
              <label className="block text-sm">Ученики</label>
              <div ref={searchRef} className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Поиск ученика..."
                  className="w-full border p-2 rounded mb-2"
                />
                {showDropdown && search && filteredStudents.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => addStudent(s)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      >
                        {s.full_name} {s.subject ? `(${s.subject})` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {groupStudents.length > 0 ? (
                <div className="space-y-1">
                  {groupStudents.map((s) => (
                    <div key={s.id} className="flex justify-between items-center border rounded px-3 py-2 text-sm">
                      <span>{s.full_name}</span>
                      <button type="button" onClick={() => removeStudent(s.id)} className="text-red-600 hover:underline text-xs">Удалить</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Нет учеников</p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            {form.id && (
              <button type="button" onClick={handleDelete} disabled={loading}
                className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50">
                Удалить
              </button>
            )}
            <div className="flex space-x-3 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Отмена</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
