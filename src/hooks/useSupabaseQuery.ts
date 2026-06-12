'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

const cache = new Map<string, any>()

export function useSupabaseQuery<T = any>(
  key: string,
  fetcher: (supabase: ReturnType<typeof createClient>) => Promise<T>
) {
  const [data, setData] = useState<T | null>(() => cache.get(key) || null)
  const [loading, setLoading] = useState(!cache.has(key))
  const [refreshCounter, setRefreshCounter] = useState(0)
  const supabase = createClient()
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = useCallback(() => {
    setRefreshCounter(prev => prev + 1)
  }, [])

  useEffect(() => {
    if (refreshCounter > 0) {
      cache.delete(key)
      setData(null)
      setLoading(true)
      fetcherRef.current(supabase)
        .then((result) => {
          cache.set(key, result)
          setData(result)
          setLoading(false)
          setRefreshCounter(0)
        })
        .catch(() => setLoading(false))
      return
    }

    if (cache.has(key)) {
      setData(cache.get(key))
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetcherRef.current(supabase)
      .then((result) => {
        if (!cancelled) {
          cache.set(key, result)
          setData(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [key, refreshCounter, supabase])

  return { data, loading, refetch }
}