-- Add new columns to subscriptions
alter table subscriptions add column if not exists cost numeric(10,2) not null default 0;
alter table subscriptions add column if not exists name text;
alter table subscriptions add column if not exists lesson_duration integer;
alter table subscriptions add column if not exists tariff_type text check (tariff_type in ('per_lesson', 'monthly', 'weekly'));

-- RLS policies for subscriptions
alter table subscriptions enable row level security;

drop policy if exists "Admins can manage subscriptions" on subscriptions;
create policy "Admins can manage subscriptions"
  on subscriptions to authenticated
  using (auth.jwt()->>'role' = 'admin')
  with check (auth.jwt()->>'role' = 'admin');

drop policy if exists "Teachers can view subscriptions" on subscriptions;
create policy "Teachers can view subscriptions"
  on subscriptions for select
  to authenticated
  using (auth.jwt()->>'role' = 'teacher');
