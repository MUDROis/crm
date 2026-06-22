-- Settings key-value store
create table if not exists settings (
  id bigint primary key generated always as identity,
  key text unique not null,
  value jsonb,
  description text,
  updated_at timestamptz default now()
);

alter table settings enable row level security;

create policy "Admins can manage settings"
  on settings
  to authenticated
  using (auth.jwt()->>'role' = 'admin')
  with check (auth.jwt()->>'role' = 'admin');

-- Online links directory
create table if not exists online_links (
  id bigint primary key generated always as identity,
  name text not null,
  url text not null,
  created_at timestamptz default now()
);

alter table online_links enable row level security;

create policy "Admins can manage online_links"
  on online_links
  to authenticated
  using (auth.jwt()->>'role' = 'admin')
  with check (auth.jwt()->>'role' = 'admin');
