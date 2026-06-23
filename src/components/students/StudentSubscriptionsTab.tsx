'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useSort } from '@/hooks/useSort'
import { createClient } from '@/utils/supabase/client'
import Modal from '@/components/ui/Modal'

const tariffOptions = [
  { value: 'per_lesson', label: 'Поурочная' },
  { value: 'monthly', label: 'Помесячная' },
  { value: 'weekly', label: 'Недельная' },
]

const validityUnits = [
  { value: 'days', label: 'дней' },
  { value: 'weeks', label: 'недель' },
  { value: 'months', label: 'месяцев' },
  { value: 'years', label: 'лет' },
]

function addDuration(from: string, value: number, unit: string): string {
  const d = new Date(from)
  switch (unit) {
    case 'days': d.setDate(d.getDate() + value); break
    case 'weeks': d.setDate(d.getDate() + value * 7); break
    case 'months': d.setMonth(d.getMonth() + value); break
    case 'years': d.setFullYear(d.getFullYear() + value); break
  }
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function StudentSubscriptionsTab({ studentId }: { studentId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    tariff_type: 'per_lesson' as 'per_lesson' | 'monthly' | 'weekly',
    total_lessons: 0,
    remaining_lessons: 0,
    lesson_duration: '',
    cost: 0,
    validity_value: '',
    validity_unit: 'months',
    valid_until: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setTemplatesLoading(true)
    supabase.from('subscription_templates').select('*').order('name')
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error('Ошибка загрузки шаблонов:', error)
        } else if (data) {
          setTemplates(data)
        }
        setTemplatesLoading(false)
      })
      .catch((err: any) => {
        console.error('Ошибка загрузки шаблонов:', err)
        setTemplatesLoading(false)
      })
  }, [])

  const { data: subscriptions, loading, error: queryError, refetch } = useSupabaseQuery(`student-subscriptions-${studentId}`, async (supabase) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })
  const { sorted: sortedSubs, sortKey, sortAsc, toggleSort } = useSort(subscriptions ?? [], 'total_lessons')

  const isPerLesson = form.tariff_type === 'per_lesson'

  const pricePerLesson = useMemo(() => {
    if (!isPerLesson) return '—'
    if (!form.total_lessons || form.total_lessons <= 0) return '—'
    return (form.cost / form.total_lessons).toFixed(2) + ' ₽'
  }, [form.cost, form.total_lessons, isPerLesson])

  useEffect(() => {
    const val = parseInt(form.validity_value)
    if (!isNaN(val) && val > 0 && form.validity_unit) {
      const calculated = addDuration(new Date().toISOString().slice(0, 10), val, form.validity_unit)
      setForm(prev => ({ ...prev, valid_until: calculated }))
    }
  }, [form.validity_value, form.validity_unit])

  const handleAdd = () => {
    setEditingSub(null)
    setForm({
      name: '',
      tariff_type: 'per_lesson',
      total_lessons: 0,
      remaining_lessons: 0,
      lesson_duration: '',
      cost: 0,
      validity_value: '',
      validity_unit: 'months',
      valid_until: '',
    })
    setErrors({})
    setShowTemplatePicker(true)
  }

  const handleEdit = (sub: any) => {
    setEditingSub(sub)
    setForm({
      name: sub.name || '',
      tariff_type: sub.tariff_type || 'per_lesson',
      total_lessons: sub.total_lessons || 0,
      remaining_lessons: sub.remaining_lessons,
      lesson_duration: String(sub.lesson_duration ?? ''),
      cost: sub.cost || 0,
      validity_value: '',
      validity_unit: 'months',
      valid_until: sub.valid_until || '',
    })
    setErrors({})
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setShowTemplatePicker(false)
    setEditingSub(null)
    setErrors({})
  }

  const handleTemplatePick = (template: any) => {
    setForm({
      name: template.name || '',
      tariff_type: template.tariff_type || 'per_lesson',
      total_lessons: template.lesson_count || 0,
      remaining_lessons: template.lesson_count || 0,
      lesson_duration: String(template.lesson_duration ?? ''),
      cost: template.cost || 0,
      validity_value: '',
      validity_unit: 'months',
      valid_until: template.valid_until || '',
    })
    setShowTemplatePicker(false)
    setShowForm(true)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Заполните обязательное поле'
    if (isPerLesson) {
      if (!form.total_lessons || form.total_lessons <= 0) newErrors.total_lessons = 'Заполните обязательное поле'
    }
    if (form.cost < 0) newErrors.cost = 'Значение не может быть отрицательным'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      tariff_type: form.tariff_type,
      total_lessons: form.total_lessons,
      remaining_lessons: form.remaining_lessons,
      cost: form.cost,
      valid_until: form.valid_until || null,
    }
    if (isPerLesson) {
      payload.lesson_duration = parseInt(form.lesson_duration) || null
    } else {
      payload.lesson_duration = null
      payload.total_lessons = null
      payload.remaining_lessons = null
    }
    if (editingSub) {
      await supabase.from('subscriptions').update(payload).eq('id', editingSub.id)
    } else {
      await supabase.from('subscriptions').insert({ ...payload, student_id: studentId })
    }
    handleClose()
    refetch()
  }

  const handleDelete = async () => {
    if (!editingSub) return
    await supabase.from('subscriptions').delete().eq('id', editingSub.id)
    setShowDeleteConfirm(false)
    handleClose()
    refetch()
  }

  const handleTableDelete = async (id: string) => {
    if (!confirm('Удалить абонемент?')) return
    await supabase.from('subscriptions').delete().eq('id', id)
    refetch()
  }

  const tariffLabel = (t: string | null) => {
    if (!t) return 'Поурочная'
    const opt = tariffOptions.find(o => o.value === t)
    return opt ? opt.label : t
  }

  if (loading) return <p>Загрузка...</p>

  if (queryError) {
    console.warn('queryError:', queryError)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Абонементы</h3>
        <button onClick={handleAdd} className="bg-success text-white px-3 py-1 rounded">+ Добавить</button>
      </div>
      {queryError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm mb-2">
            Не удалось загрузить абонементы. Проверьте подключение к Supabase или нажмите "Повторить".
          </p>
          <button onClick={() => refetch()} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
            Повторить
          </button>
        </div>
      )}
      {!queryError && subscriptions?.length === 0 ? (
        <p>Нет абонементов</p>
      ) : !queryError && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Название</th>
              <th className="border p-2 text-left">Тарификация</th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('total_lessons')}>
                Всего {sortKey === 'total_lessons' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('remaining_lessons')}>
                Осталось {sortKey === 'remaining_lessons' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('cost')}>
                Стоимость {sortKey === 'cost' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left cursor-pointer hover:bg-gray-200 select-none" onClick={() => toggleSort('valid_until')}>
                Действует до {sortKey === 'valid_until' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedSubs?.map((sub: any) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="border p-2">{sub.name || '—'}</td>
                <td className="border p-2">{tariffLabel(sub.tariff_type)}</td>
                <td className="border p-2">{sub.total_lessons ?? '—'}</td>
                <td className="border p-2">{sub.remaining_lessons}</td>
                <td className="border p-2">{(sub.cost || 0).toLocaleString()} ₽</td>
                <td className="border p-2">{sub.valid_until || '—'}</td>
                <td className="border p-2 space-x-2">
                  <button onClick={() => handleEdit(sub)} className="text-brand-600 hover:underline">Ред.</button>
                  <button onClick={() => handleTableDelete(sub.id)} className="text-danger hover:underline">Удал.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Шаг 1: выбор шаблона */}
      {showTemplatePicker && (
        <Modal isOpen={showTemplatePicker} onClose={handleClose} title="Выберите шаблон абонемента" maxWidth="lg">
          {templatesLoading ? (
            <p className="text-gray-500">Загрузка шаблонов...</p>
          ) : templates.length === 0 ? (
            <p className="text-gray-500 mb-4">Нет доступных шаблонов. Создайте шаблон в разделе Финансы → Абонементы, либо создайте абонемент вручную.</p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">Выберите подходящий шаблон, поля заполнятся автоматически</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplatePick(t)}
                    className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{t.name as string}</div>
                      <div className="text-sm text-gray-500">
                        {tariffLabel(t.tariff_type as string)}
                        {t.lesson_count != null && ` · ${t.lesson_count} зн.`}
                        {t.lesson_duration != null && ` · ${t.lesson_duration} мин.`}
                      </div>
                    </div>
                    <div className="text-lg font-semibold">{(t.cost as number).toLocaleString()} ₽</div>
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => { setShowTemplatePicker(false); setShowForm(true) }}
              className="w-full text-center px-4 py-3 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition text-sm"
            >
              + Создать вручную (нет подходящего шаблона)
            </button>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleClose} className="px-4 py-2 border rounded-lg">Отмена</button>
          </div>
        </Modal>
      )}

      {/* Шаг 2: форма создания/редактирования */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleClose}
          title={editingSub ? 'Редактировать абонемент' : 'Новый абонемент'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }) }}
                className={`w-full border p-2 rounded-lg ${errors.name ? 'border-red-500' : ''}`}
                maxLength={255}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Тарификация *</label>
              <div className="flex gap-4">
                {tariffOptions.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tariff_type"
                      value={opt.value}
                      checked={form.tariff_type === opt.value}
                      onChange={() => setForm({ ...form, tariff_type: opt.value as 'per_lesson' | 'monthly' | 'weekly' })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {isPerLesson ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Кол-во уроков *</label>
                  <input
                    type="number"
                    value={form.total_lessons}
                    onChange={e => { setForm({ ...form, total_lessons: parseInt(e.target.value) || 0 }); if (errors.total_lessons) setErrors({ ...errors, total_lessons: '' }) }}
                    className={`w-full border p-2 rounded-lg ${errors.total_lessons ? 'border-red-500' : ''}`}
                    min="1"
                  />
                  {errors.total_lessons && <p className="text-red-500 text-xs mt-1">{errors.total_lessons}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Длительность урока, мин.</label>
                  <input
                    type="number"
                    value={form.lesson_duration}
                    onChange={e => setForm({ ...form, lesson_duration: e.target.value })}
                    className="w-full border p-2 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Стоимость *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={form.cost}
                      onChange={e => { setForm({ ...form, cost: parseFloat(e.target.value) || 0 }); if (errors.cost) setErrors({ ...errors, cost: '' }) }}
                      className={`w-full border p-2 rounded-lg pr-8 ${errors.cost ? 'border-red-500' : ''}`}
                      min="0"
                    />
                    <span className="absolute right-3 top-2 text-gray-400">₽</span>
                  </div>
                  {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost}</p>}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-w-xs">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Стоимость {form.tariff_type === 'monthly' ? 'в месяц' : 'в неделю'} *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={form.cost}
                      onChange={e => { setForm({ ...form, cost: parseFloat(e.target.value) || 0 }); if (errors.cost) setErrors({ ...errors, cost: '' }) }}
                      className={`w-full border p-2 rounded-lg pr-8 ${errors.cost ? 'border-red-500' : ''}`}
                      min="0"
                    />
                    <span className="absolute right-3 top-2 text-gray-400">₽</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {form.tariff_type === 'monthly' ? 'Сумма списывается раз в месяц' : 'Сумма списывается раз в неделю'}
                  </p>
                  {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost}</p>}
                </div>
              </div>
            )}

            {isPerLesson && (
              <div>
                <label className="block text-sm font-medium mb-1">Цена за один урок</label>
                <input
                  type="text"
                  value={pricePerLesson}
                  disabled
                  className="w-full border p-2 rounded-lg bg-gray-50 text-gray-500 max-w-xs"
                />
                <p className="text-xs text-gray-400 mt-0.5">Рассчитывается автоматически</p>
              </div>
            )}

            {isPerLesson && (
              <div>
                <label className="block text-sm font-medium mb-1">Осталось занятий</label>
                <input
                  type="number"
                  value={form.remaining_lessons}
                  onChange={e => setForm({ ...form, remaining_lessons: parseInt(e.target.value) || 0 })}
                  className="w-full border p-2 rounded-lg max-w-xs"
                  min="0"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Период действия</label>
              <div className="flex gap-3 items-end">
                <div>
                  <input
                    type="number"
                    value={form.validity_value}
                    onChange={e => setForm({ ...form, validity_value: e.target.value })}
                    placeholder="3"
                    className="w-24 border p-2 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <select
                    value={form.validity_unit}
                    onChange={e => setForm({ ...form, validity_unit: e.target.value })}
                    className="border p-2 rounded-lg"
                  >
                    {validityUnits.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <span className="text-sm text-gray-500 pb-2">— действует до</span>
                <div>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm({ ...form, valid_until: e.target.value })}
                    className="border p-2 rounded-lg"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Укажите период, дата рассчитается автоматически, или выберите вручную
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <div>
                {editingSub && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Удалить"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-lg">
                  Отмена
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                  Сохранить
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Подтверждение удаления" maxWidth="sm">
          <p className="text-gray-600 mb-4">
            Вы уверены, что хотите удалить абонемент? Это действие нельзя отменить.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border rounded-lg">
              Отмена
            </button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Удалить
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
