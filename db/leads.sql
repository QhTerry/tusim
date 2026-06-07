-- Таблица заявок с лендинга. Выполнить один раз в Supabase → SQL Editor.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  event_type text,
  source text default 'landing',
  handled boolean default false,
  created_at timestamptz default now()
);

-- RLS включён: запись идёт только с сервера (service role обходит политики).
-- Никаких политик для anon — значит, читать/писать leads из браузера нельзя.
alter table public.leads enable row level security;
