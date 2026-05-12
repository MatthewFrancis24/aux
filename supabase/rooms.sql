create table if not exists rooms (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  layout      jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

alter table rooms enable row level security;

create policy "Users can read their own room"
  on rooms for select
  using (auth.uid() = user_id);

create policy "Users can insert their own room"
  on rooms for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own room"
  on rooms for update
  using (auth.uid() = user_id);
