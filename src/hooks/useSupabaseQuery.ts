'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

// Глобальный клиент – создаётся один раз для всего приложения
let globalSupabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!globalSupabase) {
    globalSupabase = createClient()
  }
  return globalSupabase
}

// Кэш на время жизни вкладки
const cache = new Map<string, any>()

export function useSupabaseQuery<T = any>(
  key: string,
  fetcher: (supabase: ReturnType<typeof createClient>) => Promise<T>
) {
  const [data, setData] = useState<T | null>(() => cache.get(key) || null)
  const [loading, setLoading] = useState(!cache.has(key))
  const [refreshCounter, setRefreshCounter] = useState(0)
  const supabase = getSupabase()
  const fetcherRef = useRef(fetcher)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Всегда используем актуальную версию fetcher
  fetcherRef.current = fetcher

  // Принудительное обновление данных
  const refetch = useCallback(() => {
    setRefreshCounter(prev => prev + 1)
  }, [])

  useEffect(() => {
    // Отменяем предыдущий запрос, если он ещё выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    const signal = controller.signal

    async function runQuery(retryCount = 0) {
      if (refreshCounter > 0) {
        cache.delete(key)
        setData(null)
        setLoading(true)
      } else if (cache.has(key)) {
        setData(cache.get(key))
        setLoading(false)
        return
      } else {
        setLoading(true)
      }

      try {
        const result = await fetcherRef.current(supabase)

        if (signal.aborted) return

        if (
          result &&
          typeof result === 'object' &&
          'error' in result &&
          result.error
        ) {
          throw result.error
        }

        cache.set(key, result)
        setData(result)
        setLoading(false)
        if (refreshCounter > 0) setRefreshCounter(0)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          const errorMessage = err?.message || err || 'Неизвестная ошибка'

          // Автоповтор при сетевых ошибках (до 3 раз, с задержкой)
          if (errorMessage.includes('Failed to fetch') && retryCount < 3) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 4000)
            console.warn(`Сетевая ошибка, повтор ${retryCount + 1}/3 через ${delay}мс...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            if (!signal.aborted) {
              return runQuery(retryCount + 1)
            }
          }

          console.error(`Ошибка запроса (${key}):`, errorMessage)

          if (errorMessage.includes('Failed to fetch')) {
            console.error(
              'Подсказка: Ошибка "Failed to fetch" обычно означает:\n' +
              '1. Supabase проект мог уснуть (бесплатный тариф) — зайдите в дашборд Supabase и нажмите "Wake up"\n' +
              '2. Проверьте подключение к интернету\n' +
              '3. Убедитесь, что NEXT_PUBLIC_SUPABASE_URL в .env.local правильный\n' +
              '4. Убедитесь, что NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local правильный\n' +
              '5. Проверьте настройки CORS в Supabase dashboard (Settings > API)'
            )
          }

          setLoading(false)
        }
      }
    }

    runQuery()

    return () => {
      controller.abort()
    }
  }, [key, refreshCounter, supabase])

  return { data, loading, refetch, supabase }
}
