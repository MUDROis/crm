-- Lesson types reference (drop + recreate for clean state)
drop table if exists lesson_types cascade;
create table lesson_types (
  id bigint primary key generated always as identity,
  name text not null unique
);
insert into lesson_types (name) values
  ('Индивидуальный'),
  ('Групповой');

alter table lesson_types enable row level security;

drop policy if exists "Anyone can read lesson_types" on lesson_types;
create policy "Anyone can read lesson_types"
  on lesson_types for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage lesson_types" on lesson_types;
create policy "Admins can manage lesson_types"
  on lesson_types for all
  to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Drop old tables for clean re-run (safe — no production data yet)
drop table if exists subscription_template_lesson_types;
drop table if exists subscription_template_subjects;
drop table if exists subscription_templates;

-- Subscription templates (products/catalog)
create table subscription_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tariff_type text not null check (tariff_type in ('per_lesson', 'monthly', 'weekly')),
  lesson_count integer check (lesson_count > 0),
  lesson_duration integer check (lesson_duration > 0),
  cost numeric(10, 2) not null check (cost >= 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  valid_until date,
  skip_respectful_coeff numeric(5, 2) not null default 0,
  skip_truant_coeff numeric(5, 2) not null default 1,
  created_at timestamptz default now()
);

-- Junction: template <-> subjects
create table subscription_template_subjects (
  id bigint primary key generated always as identity,
  template_id uuid not null references subscription_templates(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  unique(template_id, subject_id)
);

-- Junction: template <-> lesson types
create table subscription_template_lesson_types (
  id bigint primary key generated always as identity,
  template_id uuid not null references subscription_templates(id) on delete cascade,
  lesson_type_id bigint not null references lesson_types(id) on delete cascade,
  unique(template_id, lesson_type_id)
);

alter table subscription_templates enable row level security;
alter table subscription_template_subjects enable row level security;
alter table subscription_template_lesson_types enable row level security;

drop policy if exists "Admins can manage subscription_templates" on subscription_templates;
create policy "Admins can manage subscription_templates"
  on subscription_templates to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


drop policy if exists "Admins can manage subscription_template_subjects" on subscription_template_subjects;
create policy "Admins can manage subscription_template_subjects"
  on subscription_template_subjects to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "Admins can manage subscription_template_lesson_types" on subscription_template_lesson_types;
create policy "Admins can manage subscription_template_lesson_types"
  on subscription_template_lesson_types to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
