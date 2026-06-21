import { useState, useMemo } from 'react'

export function useSort<T>(items: T[], defaultSort: string) {
  const [sortKey, setSortKey] = useState(defaultSort)
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const valA = (a as any)[sortKey] ?? ''
      const valB = (b as any)[sortKey] ?? ''
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [items, sortKey, sortAsc])

  const toggleSort = (key: string) => {
    if (key === sortKey) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  return { sorted, sortKey, sortAsc, toggleSort }
}
