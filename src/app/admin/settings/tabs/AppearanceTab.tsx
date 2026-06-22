'use client'

import { useState, useEffect } from 'react'

export default function AppearanceTab() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Оформление</h2>
      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
        <span>Тёмная тема</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={toggleDark}
          className="w-5 h-5"
        />
      </label>
    </div>
  )
}
