'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { updateSubscriptionUsage } from '@/utils/subscriptions'
import Modal from '@/components/ui/Modal'

// Переименовываем, чтобы не конфликтовать с LessonData из LessonCardModal
interface LessonFormData {
  id?: string
  lesson_date: string
  start_time: string
  end_time: string
  type: 'individual' | 'group'
  student_id?: string | null
  group_id?: string | null
  teacher_id: string | null
  online_link: string
  comment: string
  status: string
  subject_id?: string | null
  room_id?: string | null
}

interface Student {
  id: string
  full_name: string
  online_link: string | null
}

interface Group {
  id: string
  name: string
  online_link: string | null
}

interface Teacher {
  id: string
  full_name: string
}

interface Subject {
  id: string
  name: string
}

interface Room {
  id: string
  name: string
}

function getCurrentTime(): string {
  const now = new Date()
  let minutes = now.getMinutes()
  if (minutes % 5 !== 0) minutes = Math.ceil(minutes / 5) * 5
  const hours = now.getHours().toString().padStart(2, '0')
  const mins = minutes.toString().padStart(2, '0')
  return `${hours}:${mins}`
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m + minutes, 0, 0)
  return date.toTimeString().slice(0, 5)
}

export default function LessonForm({
  onClose,
  onSaved,
  lesson,
  role,
  onPostpone,
  prefillData,
  onConduct,
  showDeleteButton,
  showPostponeButton,
  showConductButton,
  showSaveButton,
  onDelete,
}: {
  onClose: () => void
  onSaved: () => void
  lesson?: LessonFormData | null
  role: string
  onPostpone?: (data: LessonFormData) => void
  prefillData?: LessonFormData | null
  onConduct?: (data: Omit<LessonFormData, 'id'>) => void
  showDeleteButton?: boolean
  showPostponeButton?: boolean
  showConductButton?: boolean
  showSaveButton?: boolean
  onDelete?: () => void
}) {
  const isNew = !prefillData && !lesson
  const initialData: LessonFormData = prefillData || lesson || {
    lesson_date: new Date().toISOString().split('T')[0],
    start_time: isNew ? getCurrentTime() : '09:00',
    end_time: isNew ? addMinutes(getCurrentTime(), 50) : addMinutes('09:00', 50),
    type: 'individual',
    student_id: null,
    group_id: null,
    teacher_id: '',
    online_link: '',
    comment: '',
    status: 'planned',
    subject_id: null,
    room_id: null,
  }

  const [form, setForm] = useState<LessonFormData>({ ...initialData })
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [repeatWeeks, setRepeatWeeks] = useState(1)

  const [showNewSubject, setShowNewSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  const supabase = createClient()

  const _showDelete = showDeleteButton ?? false
  const _showPostpone = showPostponeButton ?? false
  const _showConduct = showConductButton ?? false
  const _showSave = showSaveButton ?? true

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    let studentsQuery = supabase.from('students').select('id, full_name, online_link')
    if (role === 'teacher') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) studentsQuery = studentsQuery.eq('teacher_id', user.id)
    }
    const { data: studentsData } = await studentsQuery.order('full_name')
    if (studentsData) setStudents(studentsData)

    let groupsQuery = supabase.from('groups').select('id, name, online_link')
    if (role === 'teacher') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) groupsQuery = groupsQuery.eq('teacher_id', user.id)
    }
    const { data: groupsData } = await groupsQuery.order('name')
    if (groupsData) setGroups(groupsData)

    if (role === 'admin') {
      const { data: teachersData } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher')
      if (teachersData) setTeachers(teachersData)
    }

    const { data: subjectsData } = await supabase.from('subjects').select('id, name').order('name')
    if (subjectsData) setSubjects(subjectsData)

    const { data: roomsData } = await supabase.from('rooms').select('id, name').order('name')
    if (roomsData) setRooms(roomsData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'start_time') {
        updated.end_time = addMinutes(value, 50)
      }
      return updated
    })
  }

  const handleTypeChange = (type: 'individual' | 'group') => {
    setForm((prev) => ({
      ...prev,
      type,
      student_id: type === 'individual' ? prev.student_id : null,
      group_id: type === 'group' ? prev.group_id : null,
    }))
  }

  const handleEntityChange = (id: string) => {
    if (form.type === 'individual') {
      const student = students.find(s => s.id === id)
      setForm(prev => ({
        ...prev,
        student_id: id,
        online_link: student?.online_link || prev.online_link
      }))
    } else {
      const group = groups.find(g => g.id === id)
      setForm(prev => ({
        ...prev,
        group_id: id,
        online_link: group?.online_link || prev.online_link
      }))
    }
  }

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return
    const { data, error } = await supabase.from('subjects').insert({ name: newSubjectName.trim() }).select('id, name').single()
    if (error) { alert(error.message); return }
    setSubjects(prev => [...prev, data!].sort((a, b) => a.name.localeCompare(b.name)))
    setForm(prev => ({ ...prev, subject_id: data!.id }))
    setNewSubjectName('')
    setShowNewSubject(false)
  }

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return
    const { data, error } = await supabase.from('rooms').insert({ name: newRoomName.trim() }).select('id, name').single()
    if (error) { alert(error.message); return }
    setRooms(prev => [...prev, data!].sort((a, b) => a.name.localeCompare(b.name)))
    setForm(prev => ({ ...prev, room_id: data!.id }))
    setNewRoomName('')
    setShowNewRoom(false)
  }

  async function getConflicts(teacherId: string, date: string, start: string, end: string, excludeId?: string) {
    let query = supabase
      .from('lessons')
      .select('id, start_time, end_time, type, student:students!student_id(full_name), group:groups!group_id(name)')
      .eq('teacher_id', teacherId)
      .eq('lesson_date', date)
    if (excludeId) query = query.neq('id', excludeId)
    const { data: existingLessons, error } = await query
    if (error || !existingLessons) return []
    return existingLessons.filter((l: any) => {
      const existStart = l.start_time
      const existEnd = l.end_time || addMinutes(l.start_time, 50)
      return start < existEnd && end > existStart
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const dataToSave = { ...form }
    if (dataToSave.teacher_id === '') dataToSave.teacher_id = null
    if (dataToSave.student_id === '') dataToSave.student_id = null
    if (dataToSave.group_id === '') dataToSave.group_id = null

    if (role === 'teacher' && !dataToSave.teacher_id) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) dataToSave.teacher_id = user.id
    }

    if (dataToSave.teacher_id && dataToSave.start_time && dataToSave.end_time) {
      const conflicts = await getConflicts(dataToSave.teacher_id, dataToSave.lesson_date, dataToSave.start_time, dataToSave.end_time, form.id)
      if (conflicts.length > 0) {
        const conflictDetails = conflicts.map((c: any) => {
          const name = c.student?.full_name || c.group?.name || '—'
          return `- ${c.start_time?.slice(0, 5)}–${c.end_time?.slice(0, 5)}, ${c.type === 'individual' ? 'ученик' : 'группа'} ${name}`
        }).join('\n')
        if (!confirm(`⚠️ Обнаружены конфликты у этого преподавателя на ${dataToSave.lesson_date}:\n\n${conflictDetails}\n\nВсё равно сохранить урок?`)) {
          setLoading(false)
          return
        }
      }
    }

    if (repeat && !form.id && !prefillData) {
      const startDate = new Date(dataToSave.lesson_date)
      for (let i = 0; i < repeatWeeks; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i * 7)
        const lessonToInsert = { ...dataToSave, lesson_date: date.toISOString().split('T')[0] }
        const { error } = await supabase.from('lessons').insert(lessonToInsert)
        if (error) alert(`Ошибка при создании урока на ${lessonToInsert.lesson_date}: ${error.message}`)
      }
    } else {
      if (form.id) {
        const oldStatus = lesson?.status
        const { error } = await supabase.from('lessons').update(dataToSave).eq('id', form.id)
        if (error) alert(error.message)
        else {
          if (oldStatus && dataToSave.status !== oldStatus) {
            await updateSubscriptionUsage(form.id, dataToSave.status, oldStatus)
          }
        }
      } else {
        const { error } = await supabase.from('lessons').insert(dataToSave)
        if (error) alert(error.message)
      }
    }

    setLoading(false)
    onSaved()
  }

  const handleDelete = async () => {
    if (!form.id) return
    if (!confirm('Удалить урок навсегда?')) return
    setLoading(true)
    await supabase.from('lessons').update({ original_lesson_id: null }).eq('original_lesson_id', form.id)
    const { error } = await supabase.from('lessons').delete().eq('id', form.id)
    if (error) alert(error.message)
    else onSaved()
    setLoading(false)
  }

  const handlePostpone = async () => {
    if (!form.id) return
    setLoading(true)
    const { error } = await supabase.from('lessons').update({ status: 'postponed' }).eq('id', form.id)
    if (error) alert(error.message)
    setLoading(false)
    if (onPostpone) onPostpone({ ...form })
    else onSaved()
  }

  return (
    <Modal isOpen onClose={onClose} title={prefillData ? 'Новый урок (перенос)' : form.id ? 'Редактировать урок' : 'Новый урок'} maxWidth="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Дата *</label>
              <input type="date" name="lesson_date" value={form.lesson_date} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Время начала *</label>
              <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Время окончания</label>
              <input type="time" name="end_time" value={form.end_time} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Тип *</label>
              <select value={form.type} onChange={(e) => handleTypeChange(e.target.value as any)} className="w-full border p-2 rounded">
                <option value="individual">Индивидуальный</option>
                <option value="group">Групповой</option>
              </select>
            </div>
            {form.type === 'individual' ? (
              <div>
                <label className="block text-sm">Ученик</label>
                <select value={form.student_id ?? ''} onChange={(e) => handleEntityChange(e.target.value)} className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm">Группа</label>
                <select value={form.group_id ?? ''} onChange={(e) => handleEntityChange(e.target.value)} className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
            {role === 'admin' && (
              <div>
                <label className="block text-sm">Преподаватель *</label>
                <select name="teacher_id" value={form.teacher_id ?? ''} onChange={handleChange} required className="w-full border p-2 rounded">
                  <option value="">Выберите...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm">Предмет</label>
              <div className="flex gap-1">
                <select
                  name="subject_id"
                  value={form.subject_id ?? ''}
                  onChange={(e) => {
                    if (e.target.value === '__new__') { setShowNewSubject(true) } else { handleChange(e) }
                  }}
                  className="flex-1 border p-2 rounded"
                >
                  <option value="">Не выбран</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value="__new__">+ Добавить предмет...</option>
                </select>
              </div>
              {showNewSubject && (
                <div className="flex gap-1 mt-1">
                  <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Название предмета" className="flex-1 border p-2 rounded" autoFocus />
                  <button type="button" onClick={handleAddSubject} className="bg-success text-white px-3 py-2 rounded text-sm">OK</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm">Кабинет</label>
              <div className="flex gap-1">
                <select
                  name="room_id"
                  value={form.room_id ?? ''}
                  onChange={(e) => {
                    if (e.target.value === '__new__') { setShowNewRoom(true) } else { handleChange(e) }
                  }}
                  className="flex-1 border p-2 rounded"
                >
                  <option value="">Не выбран</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  <option value="__new__">+ Добавить кабинет...</option>
                </select>
              </div>
              {showNewRoom && (
                <div className="flex gap-1 mt-1">
                  <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Название кабинета" className="flex-1 border p-2 rounded" autoFocus />
                  <button type="button" onClick={handleAddRoom} className="bg-success text-white px-3 py-2 rounded text-sm">OK</button>
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm">Ссылка на онлайн-урок</label>
              <input type="url" name="online_link" value={form.online_link} onChange={handleChange} className="w-full border p-2 rounded" placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm">Комментарий</label>
              <textarea name="comment" value={form.comment} onChange={handleChange} className="w-full border p-2 rounded" rows={3} placeholder="Комментарий к уроку..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm">Статус</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="planned">Запланирован</option>
                <option value="completed">Проведён</option>
                <option value="cancelled">Отменён</option>
              </select>
            </div>
            {!form.id && !prefillData && (
              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
                  <span>Повторять еженедельно</span>
                </label>
                {repeat && (
                  <div className="mt-2">
                    <label className="block text-sm">Количество недель</label>
                    <input type="number" min="1" max="52" value={repeatWeeks} onChange={(e) => setRepeatWeeks(parseInt(e.target.value) || 1)} className="border p-2 rounded w-20" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {_showDelete && form.id && (
                <button type="button" onClick={() => onDelete ? onDelete() : handleDelete()} disabled={loading} className="px-3 py-2 text-danger hover:bg-red-50 rounded" title="Удалить урок">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {_showPostpone && form.id && (
                <button type="button" onClick={handlePostpone} disabled={loading} className="px-3 py-2 text-warning hover:bg-yellow-50 rounded" title="Перенести урок">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Отменить</button>
              {_showSave && (
                <button type="submit" disabled={loading} className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50">
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              )}
              {_showConduct && form.id && (
                <button type="button" onClick={() => {
                  if (onConduct) {
                    const { id, ...data } = form
                    onConduct(data)
                  }
                }} disabled={loading} className="px-4 py-2 bg-success text-white rounded disabled:opacity-50">
                  Провести
                </button>
              )}
            </div>
          </div>
        </form>
    </Modal>
  )
}