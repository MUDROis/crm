'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SearchResult {
  id: string
  full_name?: string
  name?: string
  subject?: string
}

interface SearchData {
  students: SearchResult[]
  groups: SearchResult[]
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchData | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isTeacher = pathname.startsWith('/teacher')

  const debouncedSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      setSelectedIdx(-1)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data: SearchData = await res.json()
      setResults(data)
      setOpen(true)
      setSelectedIdx(-1)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, debouncedSearch])

  useEffect(() => {
    setOpen(false)
    setQuery('')
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    const items = getFlattenedItems()
    if (!items.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault()
      navigateTo(items[selectedIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  function getFlattenedItems(): { href: string; label: string }[] {
    if (!results) return []
    const items: { href: string; label: string }[] = []
    const base = isTeacher ? '/teacher' : '/admin'

    for (const s of results.students) {
      items.push({ href: `${base}/students/${s.id}`, label: s.full_name || '' })
    }
    if (!isTeacher) {
      for (const g of results.groups) {
        items.push({ href: `${base}/groups/${g.id}`, label: g.name || '' })
      }
    }
    return items
  }

  function navigateTo(item: { href: string; label: string }) {
    setOpen(false)
    setQuery('')
    router.push(item.href)
  }

  const hasResults =
    results && (results.students.length > 0 || (results.groups.length > 0 && !isTeacher))

  return (
    <div className="relative flex-1 max-w-md mx-4">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Поиск учеников и групп..."
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-gray-50 focus:bg-white focus:border-brand-500 focus:outline-none transition-colors"
      />
      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600" />
        </div>
      )}
      {open && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {hasResults ? (
            <>
              {results!.students.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    Ученики
                  </div>
                  {results!.students.map((s, i) => {
                    const idx = i
                    const isSelected = idx === selectedIdx
                    return (
                      <button
                        key={s.id}
                        onClick={() => navigateTo({ href: `${isTeacher ? '/teacher' : '/admin'}/students/${s.id}`, label: s.full_name || '' })}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}
                      >
                        <div className="font-medium">{s.full_name}</div>
                        {s.subject && <div className="text-xs text-gray-500">{s.subject}</div>}
                      </button>
                    )
                  })}
                </div>
              )}
              {!isTeacher && results!.groups.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    Группы
                  </div>
                  {results!.groups.map((g, i) => {
                    const idx = results!.students.length + i
                    const isSelected = idx === selectedIdx
                    return (
                      <button
                        key={g.id}
                        onClick={() => navigateTo({ href: `/admin/groups/${g.id}`, label: g.name || '' })}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}
                      >
                        <div className="font-medium">{g.name}</div>
                        {g.subject && <div className="text-xs text-gray-500">{g.subject}</div>}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              {loading ? 'Поиск...' : 'Ничего не найдено'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
