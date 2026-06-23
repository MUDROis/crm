'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import Modal from '@/components/ui/Modal'

interface FormData {
  name: string
  tariff_type: 'per_lesson' | 'monthly' | 'weekly'
  lesson_count: string
  lesson_duration: string
  cost: string
  validity_value: string
  validity_unit: string
  valid_until: string
  subject_ids: string[]
  lesson_type_ids: number[]
  skip_respectful_coeff: string
  skip_truant_coeff: string
}

const initialForm: FormData = {
  name: '',
  tariff_type: 'per_lesson',
  lesson_count: '',
  lesson_duration: '',
  cost: '',
  validity_value: '',
  validity_unit: 'months',
  valid_until: '',
  subject_ids: [],
  lesson_type_ids: [],
  skip_respectful_coeff: '0',
  skip_truant_coeff: '1',
}

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

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

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

export default function SubscriptionsTab() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([])
  const [subjects, setSubjects] = useState<Record<string, unknown>[]>([])
  const [lessonTypes, setLessonTypes] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [massEndDate, setMassEndDate] = useState('')
  const [massCompleting, setMassCompleting] = useState(false)
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active')

  useEffect(() => {
    Promise.all([
      supabase.from('subscription_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('lesson_types').select('*').order('name'),
    ]).then(([templatesRes, subjectsRes, lessonTypesRes]) => {
      if (templatesRes.error) throw templatesRes.error
      if (subjectsRes.error) throw subjectsRes.error
      if (lessonTypesRes.error) throw lessonTypesRes.error
      setTemplates(templatesRes.data as Record<string, unknown>[])
      setSubjects(subjectsRes.data as Record<string, unknown>[])
      setLessonTypes(lessonTypesRes.data as Record<string, unknown>[])
      setLoading(false)
    }).catch(err => {
      console.error(err)
      showNotification('error', 'Ошибка загрузки данных: ' + (err.message || 'Failed to fetch'))
      setLoading(false)
    })
  }, [])

  const isPerLesson = form.tariff_type === 'per_lesson'

  const pricePerLesson = useMemo(() => {
    if (!isPerLesson) return '—'
    const cost = parseFloat(form.cost)
    const count = parseInt(form.lesson_count)
    if (!isNaN(cost) && !isNaN(count) && count > 0) {
      return (cost / count).toFixed(2) + ' ₽'
    }
    return '—'
  }, [form.cost, form.lesson_count, isPerLesson])

  useEffect(() => {
    const val = parseInt(form.validity_value)
    if (!isNaN(val) && val > 0 && form.validity_unit) {
      const calculated = addDuration(new Date().toISOString().slice(0, 10), val, form.validity_unit)
      setForm(prev => ({ ...prev, valid_until: calculated }))
    }
  }, [form.validity_value, form.validity_unit])

  const filteredTemplates = templates.filter(t => {
    if (filter === 'active') return (t.status as string) !== 'archived'
    if (filter === 'archived') return (t.status as string) === 'archived'
    return true
  })

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    const ms = type === 'error' ? 15000 : 3000
    setTimeout(() => setNotification(null), ms)
  }

  const handleAdd = () => {
    setEditingTemplate(null)
    setForm({ ...initialForm })
    setErrors({})
    setMassEndDate('')
    setShowForm(true)
  }

  const handleEdit = async (template: Record<string, unknown>) => {
    setEditingTemplate(template)
    setErrors({})
    setMassEndDate('')

    const [subjectsRes, lessonTypesRes] = await Promise.all([
      supabase.from('subscription_template_subjects').select('subject_id').eq('template_id', template.id),
      supabase.from('subscription_template_lesson_types').select('lesson_type_id').eq('template_id', template.id),
    ])

    const validUntil = (template.valid_until as string) || ''
    setForm({
      name: (template.name as string) || '',
      tariff_type: (template.tariff_type as FormData['tariff_type']) || 'per_lesson',
      lesson_count: String(template.lesson_count ?? ''),
      lesson_duration: String(template.lesson_duration ?? ''),
      cost: String(template.cost ?? ''),
      validity_value: '',
      validity_unit: 'months',
      valid_until: validUntil,
      subject_ids: (subjectsRes.data || []).map((s: Record<string, unknown>) => s.subject_id as string),
      lesson_type_ids: (lessonTypesRes.data || []).map((lt: Record<string, unknown>) => lt.lesson_type_id as number),
      skip_respectful_coeff: String(template.skip_respectful_coeff ?? '0'),
      skip_truant_coeff: String(template.skip_truant_coeff ?? '1'),
    })
    setShowForm(true)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = 'Заполните обязательное поле'

    if (isPerLesson) {
      const lessonCount = parseInt(form.lesson_count)
      if (!form.lesson_count || isNaN(lessonCount) || lessonCount <= 0)
        newErrors.lesson_count = 'Заполните обязательное поле'

      const lessonDuration = parseInt(form.lesson_duration)
      if (!form.lesson_duration || isNaN(lessonDuration) || lessonDuration <= 0)
        newErrors.lesson_duration = 'Заполните обязательное поле'
    }

    const cost = parseFloat(form.cost)
    if (!form.cost || isNaN(cost) || cost < 0)
      newErrors.cost = 'Заполните обязательное поле'

    if (form.subject_ids.length === 0)
      newErrors.subject_ids = 'Выберите хотя бы один предмет'

    if (form.lesson_type_ids.length === 0)
      newErrors.lesson_type_ids = 'Выберите хотя бы один тип урока'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        tariff_type: form.tariff_type,
        cost: parseFloat(form.cost),
        valid_until: form.valid_until || null,
        skip_respectful_coeff: parseFloat(form.skip_respectful_coeff) || 0,
        skip_truant_coeff: parseFloat(form.skip_truant_coeff) || 1,
      }

      if (isPerLesson) {
        payload.lesson_count = parseInt(form.lesson_count)
        payload.lesson_duration = parseInt(form.lesson_duration)
      } else {
        payload.lesson_count = null
        payload.lesson_duration = null
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('subscription_templates')
          .update(payload)
          .eq('id', editingTemplate.id)
        if (error) throw error

        await supabase.from('subscription_template_subjects').delete().eq('template_id', editingTemplate.id)
        if (form.subject_ids.length > 0) {
          await supabase.from('subscription_template_subjects').insert(
            form.subject_ids.map(subject_id => ({ template_id: editingTemplate.id, subject_id }))
          )
        }

        await supabase.from('subscription_template_lesson_types').delete().eq('template_id', editingTemplate.id)
        if (form.lesson_type_ids.length > 0) {
          await supabase.from('subscription_template_lesson_types').insert(
            form.lesson_type_ids.map(lesson_type_id => ({ template_id: editingTemplate.id, lesson_type_id }))
          )
        }
      } else {
        const { data, error } = await supabase
          .from('subscription_templates')
          .insert(payload)
          .select()
          .single()
        if (error) throw error

        if (form.subject_ids.length > 0) {
          await supabase.from('subscription_template_subjects').insert(
            form.subject_ids.map(subject_id => ({ template_id: data.id, subject_id }))
          )
        }

        if (form.lesson_type_ids.length > 0) {
          await supabase.from('subscription_template_lesson_types').insert(
            form.lesson_type_ids.map(lesson_type_id => ({ template_id: data.id, lesson_type_id }))
          )
        }
      }

      setShowForm(false)
      showNotification('success', editingTemplate ? 'Абонемент обновлён' : 'Абонемент создан')

      const { data } = await supabase.from('subscription_templates').select('*').order('created_at', { ascending: false })
      if (data) setTemplates(data as Record<string, unknown>[])
    } catch (err: unknown) {
      showNotification('error', (err as { message?: string })?.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingTemplate) return
    try {
      const { error } = await supabase.from('subscription_templates').delete().eq('id', editingTemplate.id)
      if (error) throw error

      setShowDeleteConfirm(false)
      setShowForm(false)
      showNotification('success', 'Абонемент удалён')

      const { data } = await supabase.from('subscription_templates').select('*').order('created_at', { ascending: false })
      if (data) setTemplates(data as Record<string, unknown>[])
    } catch (err: unknown) {
      showNotification('error', (err as { message?: string })?.message || 'Ошибка при удалении')
    }
  }

  const handleTableDelete = async (id: string) => {
    if (!confirm('Удалить абонемент навсегда?')) return
    try {
      await supabase.from('subscription_templates').delete().eq('id', id)
      showNotification('success', 'Абонемент удалён')
      const { data } = await supabase.from('subscription_templates').select('*').order('created_at', { ascending: false })
      if (data) setTemplates(data as Record<string, unknown>[])
    } catch (err: unknown) {
      showNotification('error', (err as { message?: string })?.message || 'Ошибка при удалении')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await supabase.from('subscription_templates').update({ status: 'archived' }).eq('id', id)
      showNotification('success', 'Абонемент архивирован')
      const { data } = await supabase.from('subscription_templates').select('*').order('created_at', { ascending: false })
      if (data) setTemplates(data as Record<string, unknown>[])
    } catch (err: unknown) {
      showNotification('error', (err as { message?: string })?.message || 'Ошибка при архивации')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await supabase.from('subscription_templates').update({ status: 'active' }).eq('id', id)
      showNotification('success', 'Абонемент восстановлен')
      const { data } = await supabase.from('subscription_templates').select('*').order('created_at', { ascending: false })
      if (data) setTemplates(data as Record<string, unknown>[])
    } catch (err: unknown) {
      showNotification('error', (err as { message?: string })?.message || 'Ошибка при восстановлении')
    }
  }

  const handleMassComplete = async () => {
    if (!editingTemplate || !massEndDate) return
    setMassCompleting(true)
    try {
      const { error } = await supabase.rpc('mass_complete_subscriptions', {
        p_template_id: editingTemplate.id,
        p_end_date: massEndDate,
      })
      if (error) throw error
      showNotification('success', 'Абонементы клиентов завершены')
    } catch (err: unknown) {
      showNotification('error', (err as { message?: string })?.message || 'Ошибка при массовом завершении')
    } finally {
      setMassCompleting(false)
    }
  }

  const toggleSubject = (id: string) => {
    setForm(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(id)
        ? prev.subject_ids.filter(s => s !== id)
        : [...prev.subject_ids, id],
    }))
    if (errors.subject_ids) setErrors(prev => ({ ...prev, subject_ids: '' }))
  }

  const toggleLessonType = (id: number) => {
    setForm(prev => ({
      ...prev,
      lesson_type_ids: prev.lesson_type_ids.includes(id)
        ? prev.lesson_type_ids.filter(t => t !== id)
        : [...prev.lesson_type_ids, id],
    }))
    if (errors.lesson_type_ids) setErrors(prev => ({ ...prev, lesson_type_ids: '' }))
  }

  const tariffLabel = (t: string) => {
    const opt = tariffOptions.find(o => o.value === t)
    return opt ? opt.label : t
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Абонементы</h2>
        <button onClick={handleAdd} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          + Добавить
        </button>
      </div>

      {notification && (
        <div className={`p-3 rounded-lg text-sm ${
          notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        {(['active', 'archived', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-sm ${filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {f === 'active' ? 'Активные' : f === 'archived' ? 'Архив' : 'Все'}
          </button>
        ))}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Название</th>
            <th className="border p-2 text-left">Тарификация</th>
            <th className="border p-2 text-left">Кол-во уроков</th>
            <th className="border p-2 text-left">Стоимость</th>
            <th className="border p-2 text-left">Действует до</th>
            <th className="border p-2 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredTemplates.length === 0 && (
            <tr>
              <td colSpan={6} className="border p-4 text-center text-gray-400">Нет абонементов</td>
            </tr>
          )}
          {filteredTemplates.map(t => (
            <tr key={t.id as string} className="hover:bg-gray-50">
              <td className="border p-2">
                <button onClick={() => handleEdit(t)} className="text-brand-600 hover:underline text-left">{t.name as string}</button>
              </td>
              <td className="border p-2">{tariffLabel(t.tariff_type as string)}</td>
              <td className="border p-2">{t.lesson_count != null ? t.lesson_count as number : '—'}</td>
              <td className="border p-2">{(t.cost as number).toLocaleString()} ₽</td>
              <td className="border p-2">{t.valid_until ? (t.valid_until as string) : '—'}</td>
              <td className="border p-2">
                {(t.status as string) === 'archived' ? (
                  <button onClick={() => handleRestore(t.id as string)} className="text-green-600 hover:underline text-sm">Восстановить</button>
                ) : (
                  <button onClick={() => handleArchive(t.id as string)} className="text-orange-600 hover:underline text-sm">В архив</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={editingTemplate ? 'Редактировать абонемент' : 'Новый абонемент'}
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
                      onChange={() => setForm({ ...form, tariff_type: opt.value as FormData['tariff_type'] })}
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
                    value={form.lesson_count}
                    onChange={e => { setForm({ ...form, lesson_count: e.target.value }); if (errors.lesson_count) setErrors({ ...errors, lesson_count: '' }) }}
                    className={`w-full border p-2 rounded-lg ${errors.lesson_count ? 'border-red-500' : ''}`}
                    min="1"
                  />
                  {errors.lesson_count && <p className="text-red-500 text-xs mt-1">{errors.lesson_count}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Длительность урока, мин. *</label>
                  <input
                    type="number"
                    value={form.lesson_duration}
                    onChange={e => { setForm({ ...form, lesson_duration: e.target.value }); if (errors.lesson_duration) setErrors({ ...errors, lesson_duration: '' }) }}
                    className={`w-full border p-2 rounded-lg ${errors.lesson_duration ? 'border-red-500' : ''}`}
                    min="1"
                  />
                  {errors.lesson_duration && <p className="text-red-500 text-xs mt-1">{errors.lesson_duration}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Стоимость *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={form.cost}
                      onChange={e => { setForm({ ...form, cost: e.target.value }); if (errors.cost) setErrors({ ...errors, cost: '' }) }}
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
                      onChange={e => { setForm({ ...form, cost: e.target.value }); if (errors.cost) setErrors({ ...errors, cost: '' }) }}
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

            <div>
              <label className="block text-sm font-medium mb-1">Предметы *</label>
              <div className={`grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto ${errors.subject_ids ? 'border-red-500' : ''}`}>
                {subjects.length === 0 && <p className="text-gray-400 text-sm col-span-2">Нет предметов</p>}
                {subjects.map(s => (
                  <label key={s.id as string} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.subject_ids.includes(s.id as string)}
                      onChange={() => toggleSubject(s.id as string)}
                      className="w-4 h-4"
                    />
                    <span>{s.name as string}</span>
                  </label>
                ))}
              </div>
              {errors.subject_ids && <p className="text-red-500 text-xs mt-1">{errors.subject_ids}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Типы уроков *</label>
              <div className={`grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto ${errors.lesson_type_ids ? 'border-red-500' : ''}`}>
                {lessonTypes.length === 0 && <p className="text-gray-400 text-sm col-span-2">Нет типов уроков</p>}
                {lessonTypes.map(lt => (
                  <label key={lt.id as number} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.lesson_type_ids.includes(lt.id as number)}
                      onChange={() => toggleLessonType(lt.id as number)}
                      className="w-4 h-4"
                    />
                    <span>{lt.name as string}</span>
                  </label>
                ))}
              </div>
              {errors.lesson_type_ids && <p className="text-red-500 text-xs mt-1">{errors.lesson_type_ids}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Причина пропуска (Уважительная) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.skip_respectful_coeff}
                  onChange={e => setForm({ ...form, skip_respectful_coeff: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-0.5">Множитель. По умолчанию 0</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Причина пропуска (Прогул) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.skip_truant_coeff}
                  onChange={e => setForm({ ...form, skip_truant_coeff: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-0.5">Множитель. По умолчанию 1</p>
              </div>
            </div>

            {editingTemplate && (
              <div className="border-t pt-4 mt-4 space-y-3">
                <h4 className="font-medium text-sm">Завершить абонементы для клиентов</h4>
                <div className="flex items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Завершить с</label>
                    <input
                      type="date"
                      value={massEndDate}
                      onChange={e => setMassEndDate(e.target.value)}
                      className="border p-2 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleMassComplete}
                    disabled={!massEndDate || massCompleting}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm"
                  >
                    {massCompleting ? 'Завершение...' : 'Массово завершить абонемент'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <div>
                {editingTemplate && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Удалить"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">
                  Отмена
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Подтверждение удаления" maxWidth="sm">
          <p className="text-gray-600 mb-4">
            Вы уверены, что хотите удалить абонемент «{editingTemplate?.name as string}»? Это действие нельзя отменить.
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
