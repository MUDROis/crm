'use client'

import { useState } from 'react'
import SubjectsTab from './tabs/SubjectsTab'
import RoomsTab from './tabs/RoomsTab'
import OnlineLinksTab from './tabs/OnlineLinksTab'
import AppearanceTab from './tabs/AppearanceTab'
import TriggersTab from './tabs/TriggersTab'
import ReportsTab from './tabs/ReportsTab'
import RolesTab from './tabs/RolesTab'
import SystemTab from './tabs/SystemTab'

const tabs = [
  { key: 'subjects', label: 'Предметы' },
  { key: 'rooms', label: 'Кабинеты' },
  { key: 'online_links', label: 'Онлайн-ссылки' },
  { key: 'appearance', label: 'Оформление' },
  { key: 'triggers', label: 'Триггеры' },
  { key: 'reports', label: 'Отчётность' },
  { key: 'roles', label: 'Роли' },
  { key: 'system', label: 'Система' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('subjects')

  return (
    <div className="p-6 dark:text-white">
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 pb-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg whitespace-nowrap text-sm transition ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        {activeTab === 'subjects' && <SubjectsTab />}
        {activeTab === 'rooms' && <RoomsTab />}
        {activeTab === 'online_links' && <OnlineLinksTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'triggers' && <TriggersTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'system' && <SystemTab />}
      </div>
    </div>
  )
}
