'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSort } from '@/hooks/useSort'
import * as XLSX from 'xlsx'

interface Student {
  id: string
  full_name: string
}

interface Group {
  id: string
  name: string
}

interface ReportRow {
  date: string
  time: string
  studentName: string
  groupName: string
  teacherName: string
  status: string
  comment: string
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'student' | 'group'>('student')
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [results, setResults] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadStudents()
    loadGroups()
  }, [])

  async function loadStudents() {
    const { data } = await supabase.from('students').select('id, full_name').order('full_name')
    if (data) setStudents(data)
  }

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('id, name').order('name')
    if (data) setGroups(data)
  }

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert('Выберите начальную и конечную даты')
      return
    }
    if (reportType === 'student' && !selectedStudentId) {
      alert('Выберите ученика')
      return
    }
    if (reportType === 'group' && !selectedGroupId) {
      alert('Выберите группу')
      return
    }

    setLoading(true)
    setGenerated(false)

    let rows: ReportRow[] = []

    if (reportType === 'student') {
      // Индивидуальные уроки
      const { data: individualLessons, error: indError } = await supabase
        .from('lessons')
        .select(`
          lesson_date, start_time, status, comment,
          student:students!student_id(full_name),
          group:groups!group_id(name),
          teacher:profiles!teacher_id(full_name)
        `)
        .eq('student_id', selectedStudentId)
        .eq('status', 'completed')
        .gte('lesson_date', startDate)
        .lte('lesson_date', endDate)
        .order('lesson_date')
        .order('start_time')

      if (indError) {
        alert('Ошибка при загрузке индивидуальных уроков: ' + indError.message)
        setLoading(false)
        return
      }

      if (individualLessons) {
        rows = individualLessons.map((l: any) => ({
          date: l.lesson_date,
          time: l.start_time?.slice(0, 5) || '',
          studentName: l.student?.full_name || '',
          groupName: l.group?.name || '',
          teacherName: l.teacher?.full_name || '',
          status: l.status,
          comment: l.comment || '',
        }))
      }

      // Групповые уроки через членство в группах
      const { data: memberGroups, error: grpError } = await supabase
        .from('group_students')
        .select('group_id')
        .eq('student_id', selectedStudentId)

      if (grpError) {
        alert('Ошибка при получении групп ученика: ' + grpError.message)
        setLoading(false)
        return
      }

      if (memberGroups && memberGroups.length > 0) {
        const groupIds = memberGroups.map((g: any) => g.group_id)
        const { data: groupLessons, error: glError } = await supabase
          .from('lessons')
          .select(`
            lesson_date, start_time, status, comment,
            student:students!student_id(full_name),
            group:groups!group_id(name),
            teacher:profiles!teacher_id(full_name)
          `)
          .in('group_id', groupIds)
          .eq('status', 'completed')
          .gte('lesson_date', startDate)
          .lte('lesson_date', endDate)
          .order('lesson_date')
          .order('start_time')

        if (glError) {
          alert('Ошибка при загрузке групповых уроков: ' + glError.message)
          setLoading(false)
          return
        }

        if (groupLessons) {
          const groupRows = groupLessons.map((l: any) => ({
            date: l.lesson_date,
            time: l.start_time?.slice(0, 5) || '',
            studentName: l.student?.full_name || '',
            groupName: l.group?.name || '',
            teacherName: l.teacher?.full_name || '',
            status: l.status,
            comment: l.comment || '',
          }))
          rows = [...rows, ...groupRows]
        }
      }
    } else {
      // Отчёт по группе: уроки с group_id
      const { data: groupLessons, error } = await supabase
        .from('lessons')
        .select(`
          lesson_date, start_time, status, comment,
          student:students!student_id(full_name),
          group:groups!group_id(name),
          teacher:profiles!teacher_id(full_name)
        `)
        .eq('group_id', selectedGroupId)
        .eq('status', 'completed')
        .gte('lesson_date', startDate)
        .lte('lesson_date', endDate)
        .order('lesson_date')
        .order('start_time')

      if (error) {
        alert('Ошибка при загрузке уроков группы: ' + error.message)
        setLoading(false)
        return
      }

      if (groupLessons) {
        rows = groupLessons.map((l: any) => ({
          date: l.lesson_date,
          time: l.start_time?.slice(0, 5) || '',
          studentName: l.student?.full_name || '',
          groupName: l.group?.name || '',
          teacherName: l.teacher?.full_name || '',
          status: l.status,
          comment: l.comment || '',
        }))
      }
    }

    // Сортируем по дате и времени
    rows.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    setResults(rows)
    setGenerated(true)
    setLoading(false)
  }
  const { sorted: sortedResults, sortKey, sortAsc, toggleSort } = useSort(results, 'date')

  const handleExportExcel = () => {
    if (results.length === 0) return
    const ws = XLSX.utils.json_to_sheet(results)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт')
    XLSX.writeFile(wb, `Отчёт_${reportType === 'student' ? 'ученик' : 'группа'}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm">Тип отчёта</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="w-full border p-2 rounded">
              <option value="student">По ученику</option>
              <option value="group">По группе</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">{reportType === 'student' ? 'Ученик' : 'Группа'}</label>
            {reportType === 'student' ? (
              <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Выберите ученика...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            ) : (
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Выберите группу...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm">Дата начала</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Дата окончания</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border p-2 rounded" />
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="bg-brand-600 text-white px-6 py-2 rounded hover:bg-brand-700 disabled:opacity-50">
          {loading ? 'Формирование...' : 'Сформировать отчёт'}
        </button>
      </div>

      {generated && (
        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Результаты ({results.length})</h2>
            <button onClick={handleExportExcel} className="bg-success text-white px-4 py-2 rounded hover:bg-success">
              Скачать Excel
            </button>
          </div>
          {results.length === 0 ? (
            <p>Нет проведённых уроков за выбранный период.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('date')}>
                      Дата {sortKey === 'date' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('time')}>
                      Время {sortKey === 'time' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('studentName')}>
                      Ученик {sortKey === 'studentName' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('groupName')}>
                      Группа {sortKey === 'groupName' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('teacherName')}>
                      Преподаватель {sortKey === 'teacherName' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('status')}>
                      Статус {sortKey === 'status' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('comment')}>
                      Комментарий {sortKey === 'comment' && (sortAsc ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2">{row.date}</td>
                      <td className="border p-2">{row.time}</td>
                      <td className="border p-2">{row.studentName}</td>
                      <td className="border p-2">{row.groupName}</td>
                      <td className="border p-2">{row.teacherName}</td>
                      <td className="border p-2">{row.status === 'completed' ? 'Проведён' : row.status}</td>
                      <td className="border p-2">{row.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}