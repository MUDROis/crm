'use client'

import Link from 'next/link'

export default function AdminNavbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <Link href="/admin" className="text-xl font-bold text-gray-800 hover:text-blue-600">
        ИНТЕРАКТИВНАЯ ШКОЛА МУДРО
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/admin/lessons" className="text-2xl text-gray-600 hover:text-blue-600 transition">
          📅
        </Link>
        <Link href="/admin/tasks" className="text-2xl text-gray-600 hover:text-blue-600 transition">
          📋
        </Link>
        <Link href="/admin/students" className="text-2xl text-gray-600 hover:text-blue-600 transition">
          👩‍🎓
        </Link>
        <Link href="/admin/groups" className="text-2xl text-gray-600 hover:text-blue-600 transition">
          👥
        </Link>
        <Link href="/admin/finance" className="text-2xl text-gray-600 hover:text-blue-600 transition">
          💰
        </Link>
        <Link href="/admin/reports" className="text-2xl text-gray-600 hover:text-blue-600 transition">
          📊
        </Link>
        <Link href="/admin/teachers" className="text-2xl text-gray-600 hover:text-blue-600 transition">
          👨‍🏫
        </Link>
        <Link href="/admin/backup" className="text-2xl text-gray-600 hover:text-blue-600 transition">
          💾
        </Link>
      </div>
    </nav>
  )
}
