# Fix Review Report

## Changes

### `src/contexts/NotificationContext.tsx`
1. **Removed unused `toastsRef`** — `const toastsRef = useRef<Toast[]>([])` and its write `toastsRef.current = next` were dead code (never read).
2. **Added `timerRef`** — `useRef<NodeJS.Timeout[]>([])` to track `setTimeout` IDs from the Realtime callback.
3. **SetTimeout cleanup** — stored timer IDs in `timerRef.current`, added `clearTimeout` loop in the `useEffect` cleanup before `supabase.removeChannel(channel)`.
4. **Error handling** — added `.catch(console.error)` to the initial notifications fetch `.then()` chain.

### `src/app/api/cron/birthdays/route.ts`
5. **Per-person birthday dedup** — changed from skipping ALL birthday notifications if *any* were sent today, to checking existing notification `body` text per person. The `existingBodies` Set tracks already-notified names, and the insert loop skips individuals whose `"У ученика {name} сегодня день рождения"` or `"У преподавателя {name} сегодня день рождения"` body already exists.

## TypeScript Compilation

`npx tsc --noEmit` — PASS (no errors)
