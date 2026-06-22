# Admin Settings Page — Design Spec

## Goal

Create an admin settings page (`/admin/settings`) that consolidates scattered configuration,
houses the backup/export functionality (moved from `/admin/backup`), and adds new management
capabilities (directories, roles, appearance, triggers, reports config).

## Changes Summary

1. **New page** `/admin/settings/` with 7 tabs
2. **Navbar**: replace 💾 (backup) with ⚙️ (settings) → `/admin/settings`
3. **Dashboard**: replace backup card with settings card
4. **Breadcrumbs**: add `settings: 'Настройки'`, remove `backup: 'Резервное копирование'`
5. **Delete** `/admin/backup/` (logic moves to SystemTab)
6. **New DB tables**: `settings`, `online_links` (subjects/rooms may already exist)

---

## Pages & Components

### `/admin/settings/page.tsx`
- Client component
- 7 horizontal tabs
- Renders the active tab's component below

### Tabs

#### ⚙️ GeneralTab
- School name, phone, email, working hours
- Stored in `settings` table (key-value, JSONB values)
- Auto-save on change (debounced upsert)

#### 📚 DirectoriesTab
- **Subjects** table: inline edit (name column), add/delete rows
- **Rooms** table: inline edit (name column), add/delete rows
- **Online links** table: inline edit (name + url columns), add/delete rows
- All rendered as `<table>` with editable cells
- Uses `subjects`, `rooms`, `online_links` tables

#### 🎨 AppearanceTab
- Dark theme toggle (stored in localStorage + settings table)
- Future: font size, compact mode

#### 🔔 TriggersTab
- Enable/disable email notifications for events (new student, task, payment)
- Stored in `settings` table as JSON

#### 📊 ReportsTab
- Checkboxes for which fields appear in reports
- Per-report-type configuration
- Stored in `settings` table as JSON

#### 🔐 RolesTab
- What a teacher can do: create lessons, manage tasks, view finance, etc.
- Stored in `settings` table as JSON (role permissions map)

#### 🔧 SystemTab
- CRM version display
- Clear browser cache button
- **Full JSON backup** (moved from `/admin/backup`)
- **Excel export per table** (moved from `/admin/backup`)

---

## Database

### New table: `settings`
```sql
create table if not exists settings (
  id bigint primary key generated always as identity,
  key text unique not null,
  value jsonb,
  description text,
  updated_at timestamptz default now()
);
alter table settings enable row level security;
create policy "Admins can manage settings" on settings
  to authenticated using (auth.jwt()->>'role' = 'admin')
  with check (auth.jwt()->>'role' = 'admin');
```

### New table: `online_links`
```sql
create table if not exists online_links (
  id bigint primary key generated always as identity,
  name text not null,
  url text not null,
  created_at timestamptz default now()
);
alter table online_links enable row level security;
create policy "Admins can manage online_links" on online_links
  to authenticated using (auth.jwt()->>'role' = 'admin')
  with check (auth.jwt()->>'role' = 'admin');
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/admin/settings/page.tsx` | Main settings page with tab navigation |
| `src/app/admin/settings/tabs/GeneralTab.tsx` | General school settings |
| `src/app/admin/settings/tabs/DirectoriesTab.tsx` | Subjects, rooms, online links tables |
| `src/app/admin/settings/tabs/AppearanceTab.tsx` | Dark theme, display |
| `src/app/admin/settings/tabs/TriggersTab.tsx` | Notification triggers |
| `src/app/admin/settings/tabs/ReportsTab.tsx` | Report field config |
| `src/app/admin/settings/tabs/RolesTab.tsx` | Teacher role permissions |
| `src/app/admin/settings/tabs/SystemTab.tsx` | Version, cache, backup/export |
| `migrations/add_settings_and_online_links.sql` | SQL migration |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/AdminNavbar.tsx` | Replace 💾 with ⚙️ → `/admin/settings` |
| `src/app/admin/page.tsx` | Replace backup card with settings card |
| `src/components/Breadcrumbs.tsx` | Add settings label, remove backup label |

## Files to Delete

| File | Reason |
|------|--------|
| `src/app/admin/backup/page.tsx` | Moved to SystemTab |

---

## Navigation Flow

```
AdminNavbar:  📅 📋 👩‍🎓 👥 💰 📊 👨‍🏫 ⚙️
Dashboard:    [📅] [📋] [👩‍🎓] [👥] [💰] [📊] [👨‍🏫] [⚙️]
Breadcrumbs:  Главная › Настройки
```

---

## Non-goals (future)

- Drag-and-drop reordering in directories
- Per-user theme persistence (server-side)
- Webhook configuration
- Two-factor auth
