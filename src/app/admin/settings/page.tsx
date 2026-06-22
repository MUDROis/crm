'use client'

import { useState } from 'react'
import GeneralTab from './tabs/GeneralTab'
import SubjectsTab from './tabs/SubjectsTab'
import RoomsTab from './tabs/RoomsTab'
import OnlineLinksTab from './tabs/OnlineLinksTab'
import AppearanceTab from './tabs/AppearanceTab'
import TriggersTab from './tabs/TriggersTab'
import ReportsTab from './tabs/ReportsTab'
import RolesTab from './tabs/RolesTab'
import SystemTab from './tabs/SystemTab'

const tabs = [
  { key: 'general', label: 'Общие' },
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
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="p-6">
      <div className="flex gap-1 mb-6 border-b pb-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg whitespace-nowrap text-sm transition ${
              activeTab === tab.key
                ? 'bg-white text-brand-600 border-b-2 border-brand-600 font-medium'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {activeTab === 'general' && <GeneralTab />}
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
