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

    async function runQuery() {
      if (refreshCounter > 0) {
        // Ручное обновление – сбрасываем кэш
        cache.delete(key)
        setData(null)
        setLoading(true)
      } else if (cache.has(key)) {
        // Данные уже в кэше – сразу отдаём
        setData(cache.get(key))
        setLoading(false)
        return
      } else {
        setLoading(true)
      }

      try {
        const result = await fetcherRef.current(supabase)

        // Если запрос был отменён, не обновляем состояние
        if (signal.aborted) return

        // Если результат содержит поле error (как у Supabase), выбрасываем его
        if (
          result &&
          typeof result === 'object' &&
          'error' in result &&
          result.error
        ) {
          throw result.error
        }

        // Сохраняем результат в кэш
        cache.set(key, result)
        setData(result)
        setLoading(false)
        if (refreshCounter > 0) setRefreshCounter(0)
      } catch (err: any) {
        // AbortError – нормальная ситуация при отмене запроса
        if (err.name !== 'AbortError') {
          const errorMessage = err?.message || err || 'Неизвестная ошибка'
          console.error(`Ошибка запроса (${key}):`, errorMessage)
          
          // Добавляем подсказку для типичных проблем
          if (errorMessage.includes('Failed to fetch')) {
            console.error(
              'Подсказка: Ошибка "Failed to fetch" обычно означает:\n' +
              '1. Проверьте подключение к интернету\n' +
              '2. Убедитесь, что NEXT_PUBLIC_SUPABASE_URL в .env.local правильный\n' +
              '3. Убедитесь, что NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local правильный\n' +
              '4. Проверьте, что Supabase проект не заблокирован или не истёк срок действия\n' +
              '5. Проверьте настройки CORS в Supabase dashboard (Network > API Settings)'
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
