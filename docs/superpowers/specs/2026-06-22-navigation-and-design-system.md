# Navigation & Design System for CRM

## Overview

Three-part enhancement to the CRM: (1) global color system and visual hierarchy, (2) automatic breadcrumbs, (3) global search across students and groups.

## 1. Color System & Visual Hierarchy

### Problem
All cards and elements look the same — no distinction between primary/secondary. Colors are ad-hoc (`bg-blue-600`, `text-green-600`, `text-red-600`) scattered across components with no central token system.

### Solution
Extend Tailwind v4 via `@theme` in `src/app/globals.css`. No `tailwind.config.js` — idiomatic v4 approach.

```css
@theme {
  --color-brand-50: #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-200: #bfdbfe;
  --color-brand-300: #93c5fd;
  --color-brand-400: #60a5fa;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;
  --color-brand-800: #1e40af;
  --color-brand-900: #1e3a8a;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
}
```

### Migration pattern

| Old class              | New class            | Context                    |
|------------------------|----------------------|----------------------------|
| `bg-blue-600`          | `bg-brand-600`       | Primary buttons, tabs      |
| `text-blue-600`        | `text-brand-600`     | Links, active filters      |
| `hover:text-blue-600`  | `hover:text-brand-600`| Link hovers               |
| `bg-green-600`         | `bg-success`         | Add/create buttons         |
| `text-green-600`       | `text-success`       | Restore actions, completed |
| `text-red-600`         | `text-danger`        | Delete/archive, errors     |
| `text-yellow-600`      | `text-warning`       | Postpone, paused status    |
| `bg-gray-100`          | *unchanged*          | Table headers              |

**Background:** `#e8e8e8` → `bg-gray-50` (soft gray, easier on eyes).

### Scope
- `src/app/globals.css` — add `@theme` block, update `body` background
- `src/app/layout.tsx` — remove inline `backgroundColor`
- All `*.tsx` files under `src/` — replace color classes across ~30 files

## 2. Breadcrumbs

### Component
`src/components/Breadcrumbs.tsx` — client component using `usePathname()`.

### Path segment mapping

| Segment     | Label                  |
|-------------|------------------------|
| admin       | Главная                |
| teacher     | Главная                |
| students    | Ученики                |
| groups      | Группы                 |
| lessons     | Уроки                  |
| tasks       | Задания                |
| finance     | Финансы                |
| reports     | Отчёты                 |
| teachers    | Преподаватели          |
| backup      | Резервное копирование  |

UUID segments (entity detail pages) get a contextual label:
- After `students` → `Карточка ученика`
- After `groups` → `Карточка группы`

### Behavior
- Each segment is a clickable `<Link>` except the last (current page)
- Separator: `›` with `mx-2 text-gray-400`
- Styling: `text-sm text-gray-500 hover:text-brand-600`, last segment `text-gray-900 font-medium`
- No fetching — purely URL-driven

### Integration
- `src/app/admin/layout.tsx` — add `<Breadcrumbs />` between `<AdminNavbar />` and `<div>{children}</div>`
- `src/app/teacher/layout.tsx` — same for teacher layout

## 3. Global Search

### API Route
`src/app/api/search/route.ts` — server-side GET endpoint.

- Query param: `q` (string, min 2 chars)
- Uses Supabase server client (`@/utils/supabase/server`)
- Searches two tables:
  - `students`: `ilike('full_name', %q%)`, limit 5, status = 'active'
  - `groups`: `ilike('name', %q%)`, limit 5, status = 'active'
- Returns: `{ students: Student[], groups: Group[] }`
- Cache-control: `no-store` (real-time search)

### Component
`src/components/GlobalSearch.tsx` — client component.

- Text input with magnifying glass icon (🔍 or SVG)
- Debounce 300ms before calling API
- Dropdown with sections based on user role:
  - **Admin**: two sections — **Ученики** (→ `/admin/students/{id}`) and **Группы** (→ `/admin/groups/{id}`)
  - **Teacher**: one section — **Ученики** (→ `/teacher/students/{id}`). No groups (no `/teacher/groups` route).
- Empty state: "Ничего не найдено"
- No results yet state: "Введите минимум 2 символа"
- Closes on: click outside, Escape, navigation
- Role detection: via `usePathname()` — if path starts with `/teacher`, teacher mode
- Keyboard: up/down arrows to navigate, Enter to go

### Integration
- Add `<GlobalSearch />` to both `AdminNavbar` and `TeacherNavbar`
- Position between the logo and the nav icons, with `flex-1 max-w-md mx-4`

## Files Changed

| File | Action |
|------|--------|
| `src/app/globals.css` | Edit — add `@theme`, change body background |
| `src/app/layout.tsx` | Edit — remove inline bg style |
| `src/components/Breadcrumbs.tsx` | **New** |
| `src/components/GlobalSearch.tsx` | **New** |
| `src/app/api/search/route.ts` | **New** |
| `src/components/AdminNavbar.tsx` | Edit — add GlobalSearch, update colors |
| `src/components/TeacherNavbar.tsx` | Edit — add GlobalSearch, update colors |
| `src/app/admin/layout.tsx` | Edit — add Breadcrumbs |
| `src/app/teacher/layout.tsx` | Edit — add Breadcrumbs |
| ~20 additional `*.tsx` files | Edit — replace color classes (brand/success/danger/warning) |
