'use client'

import { useState } from 'react'
import PaymentsTab from '@/components/finance/PaymentsTab'
import SubscriptionsTab from '@/components/finance/SubscriptionsTab'
import ExpensesTab from '@/components/finance/ExpensesTab'
import SalariesTab from '@/components/finance/SalariesTab'

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('payments')

  const tabs = [
    { key: 'payments', label: 'Платежи' },
    { key: 'subscriptions', label: 'Абонементы' },
    { key: 'expenses', label: 'Расходы' },
    { key: 'salaries', label: 'Зарплаты' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Финансы</h1>
      <div className="flex gap-4 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded ${activeTab === tab.key ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white p-6 rounded shadow">
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'salaries' && <SalariesTab />}
      </div>
    </div>
  )
}