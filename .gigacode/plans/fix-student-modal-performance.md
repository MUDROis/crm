# Performance Fix for StudentInfoModal

## Problem
The student info modal loads slowly due to sequential API calls and lack of error handling.

## Issues Found

1. **Sequential API calls** - 5 queries execute one after another instead of in parallel
2. **No request cancellation** - Previous queries continue running when modal is closed quickly
3. **No loading feedback** - Users see blank screen during loading
4. **No error handling** - Errors cause infinite loading state
5. **Missing timeout protection** - Hung requests freeze the UI

## Solution

### 1. Use `Promise.all()` for parallel loading
```typescript
const [studentResult, subsResult, individualLessonsResult, groupsResult] = await Promise.all([
  // ... all independent queries
])
```

### 2. Add AbortController for request cancellation
```typescript
useEffect(() => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
  }
  abortControllerRef.current = new AbortController()
  
  loadData()
  
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }
}, [studentId])
```

### 3. Improve loading state
- Show spinner with "Загрузка..." text
- Add visual feedback during data fetching

### 4. Add error handling
```typescript
} catch (err: any) {
  if (err.name === 'AbortError') return
  setError('Ошибка при загрузке данных ученика. Пожалуйста, попробуйте позже.')
}
```

### 5. Optimize queries
- Reduce selected fields
- Add proper null handling for sorting

## Implementation Files

- `src/components/students/StudentInfoModal.tsx` - Main component with fixes
- `src/utils/supabase/client.ts` - Already supports AbortController via `abortable()` method

## Testing Checklist

- [ ] Modal opens quickly (<1s for basic data)
- [ ] Closing modal cancels pending requests
- [ ] Error messages show properly on network failure
- [ ] Loading spinner appears during data fetch
- [ ] All tabs work correctly after loading
