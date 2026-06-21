'use client'

import Link from 'next/link'
import GlobalSearch from '@/components/GlobalSearch'

export default function AdminNavbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center gap-4">
      <Link href="/admin" className="text-xl font-bold text-gray-800 hover:text-brand-600 shrink-0">
        ИНТЕРАКТИВНАЯ ШКОЛА МУДРО
      </Link>
      <GlobalSearch />
      <div className="flex items-center gap-6 shrink-0">
        <Link href="/admin/lessons" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          📅
        </Link>
        <Link href="/admin/tasks" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          📋
        </Link>
        <Link href="/admin/students" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          👩‍🎓
        </Link>
        <Link href="/admin/groups" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          👥
        </Link>
        <Link href="/admin/finance" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          💰
        </Link>
        <Link href="/admin/reports" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          📊
        </Link>
        <Link href="/admin/teachers" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          👨‍🏫
        </Link>
        <Link href="/admin/backup" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          💾
        </Link>
      </div>
    </nav>
  )
}
