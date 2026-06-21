### Task 2: Migration — add birth_date columns

**Files:**
- Create: `migrations/add_birth_date.sql`

- [ ] **Write migration SQL**

```sql
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
```

- [ ] **Verify migration**

- [ ] **Commit**

```bash
git add migrations/add_birth_date.sql
git commit -m "feat: add birth_date columns to students and profiles"
```
