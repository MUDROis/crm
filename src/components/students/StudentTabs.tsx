'use client'

import { useState } from 'react'
import StudentScheduleTab from './StudentScheduleTab'
import StudentSubscriptionsTab from './StudentSubscriptionsTab'
import StudentCommentsTab from './StudentCommentsTab'
import StudentPaymentsTab from './StudentPaymentsTab'

export default function StudentTabs({ studentId }: { studentId: string }) {
  const [tab, setTab] = useState('schedule')

  const tabs = [
    { key: 'schedule', label: 'Расписание' },
    { key: 'subscriptions', label: 'Абонементы' },
    { key: 'comments', label: 'Комментарии' },
    { key: 'payments', label: 'Платежи' },
  ]

  return (
    <div>
      <div className="flex gap-4 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded shadow p-6">
        {tab === 'schedule' && <StudentScheduleTab studentId={studentId} />}
        {tab === 'subscriptions' && <StudentSubscriptionsTab studentId={studentId} />}
        {tab === 'comments' && <StudentCommentsTab studentId={studentId} />}
        {tab === 'payments' && <StudentPaymentsTab studentId={studentId} />}
      </div>
    </div>
  )
}