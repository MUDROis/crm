'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

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

interface Lesson {
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
}

interface Teacher {
  id: string
  full_name: string
}

// Вспомогательная функция: добавляет минуты к времени в формате HH:MM
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
}: {
  onClose: () => void
  onSaved: () => void
  lesson?: Lesson | null
  role: string
  onPostpone?: (data: Lesson) => void
  prefillData?: Lesson | null
}) {
  // Инициализация формы: при новом уроке автоматически ставим конец = начало + 50 мин
  const getDefaultEnd = (start: string) => addMinutes(start, 50)

  const initialData: Lesson = prefillData || lesson || {
    lesson_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: getDefaultEnd('09:00'), // 09:50
    type: 'individual',
    student_id: null,
    group_id: null,
    teacher_id: '',
    online_link: '',
    comment: '',
    status: 'planned',
  }

  const [form, setForm] = useState<Lesson>({ ...initialData })
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [repeatWeeks, setRepeatWeeks] = useState(1)
  const supabase = createClient()

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
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      // Если изменили время начала — автоматически сдвигаем время окончания на 50 минут
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

  // Проверка конфликтов: возвращает массив конфликтующих уроков
  async function getConflicts(teacherId: string, date: string, start: string, end: string, excludeId?: string) {
    // Находим уроки того же преподавателя в ту же дату
    let query = supabase
      .from('lessons')
      .select('id, start_time, end_time, type, student:students!student_id(full_name), group:groups!group_id(name)')
      .eq('teacher_id', teacherId)
      .eq('lesson_date', date)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: existingLessons, error } = await query
    if (error || !existingLessons) return []

    // Фильтруем пересекающиеся по времени
    return existingLessons.filter((l: any) => {
      const existStart = l.start_time
      const existEnd = l.end_time || addMinutes(l.start_time, 50) // если нет конца, считаем 50 мин
      // Пересечение: начало нового < конец существующего И конец нового > начало существующего
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

    // Проверка конфликтов, только если указан преподаватель и время
    if (dataToSave.teacher_id && dataToSave.start_time && dataToSave.end_time) {
      const conflicts = await getConflicts(
        dataToSave.teacher_id,
        dataToSave.lesson_date,
        dataToSave.start_time,
        dataToSave.end_time,
        form.id // исключаем текущий урок при редактировании
      )

      if (conflicts.length > 0) {
        const conflictDetails = conflicts.map((c: any) => {
          const name = c.student?.full_name || c.group?.name || '—'
          return `- ${c.start_time?.slice(0, 5)}–${c.end_time?.slice(0, 5)}, ${c.type === 'individual' ? 'ученик' : 'группа'} ${name}`
        }).join('\n')

        const proceed = confirm(
          `⚠️ Обнаружены конфликты у этого преподавателя на ${dataToSave.lesson_date}:\n\n` +
          conflictDetails +
          `\n\nВсё равно сохранить урок?`
        )

        if (!proceed) {
          setLoading(false)
          return // отмена сохранения
        }
      }
    }

    // Сохранение (повторяющиеся или одиночный урок)
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
        const { error } = await supabase.from('lessons').update(dataToSave).eq('id', form.id)
        if (error) alert(error.message)
      } else {
        const { error } = await supabase.from('lessons').insert(dataToSave)
        if (error) alert(error.message)
      }
    }

    setLoading(false)
    onSaved()
  }

  // Безопасное удаление
  const handleDelete = async () => {
    if (!form.id) return
    if (!confirm('Удалить урок навсегда? Это действие нельзя отменить.')) return
    setLoading(true)

    const { error: updateError } = await supabase
      .from('lessons')
      .update({ original_lesson_id: null })
      .eq('original_lesson_id', form.id)

    if (updateError) {
      alert('Ошибка при подготовке к удалению: ' + updateError.message)
      setLoading(false)
      return
    }

    const { error } = await supabase.from('lessons').delete().eq('id', form.id)
    if (error) {
      alert('Ошибка при удалении: ' + error.message)
      setLoading(false)
    } else {
      setLoading(false)
      onSaved()
    }
  }

  // Перенос урока
  const handlePostpone = async () => {
    if (!form.id) return
    setLoading(true)

    const { error: updateError } = await supabase.from('lessons').update({ status: 'postponed' }).eq('id', form.id)
    if (updateError) {
      alert('Ошибка при переносе: ' + updateError.message)
      setLoading(false)
      return
    }

    setLoading(false)

    if (onPostpone) {
      onPostpone({ ...form })
    } else {
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {prefillData ? 'Новый урок (перенос)' : form.id ? 'Редактировать урок' : 'Новый урок'}
        </h2>
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
            <div className="col-span-2">
              <label className="block text-sm">Ссылка на онлайн-урок</label>
              <input type="url" name="online_link" value={form.online_link} onChange={handleChange} className="w-full border p-2 rounded" placeholder="https://..." />
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

          <div className="flex justify-end space-x-3 pt-4">
            {form.id && !prefillData && (
              <button type="button" onClick={handlePostpone} disabled={loading} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50">
                Перенести урок
              </button>
            )}
            {role === 'admin' && form.id && !prefillData && (
              <button type="button" onClick={handleDelete} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                Удалить
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Отмена</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}