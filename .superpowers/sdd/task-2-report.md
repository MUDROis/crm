# Task 2 Report: Add birth_date columns

## What was implemented

- Created `migrations/add_birth_date.sql` with ALTER TABLE statements adding `birth_date date` columns (with `IF NOT EXISTS` guard) to both `students` and `profiles` tables.

## Files changed

- `migrations/add_birth_date.sql` (new)

## Commits created

- `e343b41` feat: add birth_date columns to students and profiles
