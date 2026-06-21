# Task 8 Report: Birthday Cron API Route

## What was implemented

Created `src/app/api/cron/birthdays/route.ts` — a `GET` endpoint that:

1. **Verifies authorization** via a `Bearer` token in the `Authorization` header, checked against `CRON_SECRET` env var
2. **Fetches admin users** from `profiles` where `role = 'admin'`
3. **Computes today's date** and the next 3 days as `MM-DD` strings
4. **Queries students** (all with non-null `birth_date`) and **teachers** (profiles with `role = 'teacher'` and non-null `birth_date`)
5. **Filters** those whose birthday (`MM-DD` part) falls within the range
6. **Checks** for existing `birthday`-type notifications created today (to prevent duplicates)
7. **Inserts** one notification per matching person per admin into the `notifications` table

## Files changed

- `src/app/api/cron/birthdays/route.ts` — created (101 lines)

## Commits created

- `4eb36dc` feat: add birthday cron API route
