-- ============================================================================
--  tusi'm — безопасность событий и фото. Выполнить ОДИН РАЗ в Supabase → SQL Editor.
--  Идемпотентно: можно запускать повторно, ничего не сломает.
-- ============================================================================

-- 1. Гарантируем нужные колонки в events (add if not exists — существующие данные целы).
alter table public.events add column if not exists organizer_id uuid references public.organizers(id) on delete cascade;
alter table public.events add column if not exists code        text;
alter table public.events add column if not exists name        text;
alter table public.events add column if not exists plan        text default 'free';
alter table public.events add column if not exists status      text default 'active';
alter table public.events add column if not exists photo_limit int  default 2;
alter table public.events add column if not exists guest_limit int  default 5;
alter table public.events add column if not exists starts_at   timestamptz default now();
alter table public.events add column if not exists ends_at     timestamptz;
alter table public.events add column if not exists created_at  timestamptz default now();

-- Код события уникален (по нему гость находит альбом).
create unique index if not exists events_code_key on public.events (code);
-- Быстрый список событий организатора.
create index if not exists events_organizer_idx on public.events (organizer_id);

-- ============================================================================
-- 2. RLS. Принцип: из браузера (anon) можно ТОЛЬКО читать. Любая запись — с сервера
--    через service_role, который RLS обходит. Так гость по-прежнему сканирует QR и
--    грузит фото без регистрации (запись делает наш /api/upload), но удалить/закрыть
--    чужое из браузера невозможно.
-- ============================================================================

-- ---- events --------------------------------------------------------------
alter table public.events enable row level security;
drop policy if exists events_anon_select on public.events;
create policy events_anon_select on public.events
  for select to anon, authenticated using (true);
-- INSERT/UPDATE/DELETE политик для anon НЕТ → запись из браузера запрещена.

-- ---- photos --------------------------------------------------------------
alter table public.photos enable row level security;
drop policy if exists photos_anon_select on public.photos;
create policy photos_anon_select on public.photos
  for select to anon, authenticated using (true);
-- Загрузка/удаление фото — только через серверные роуты (service_role).

-- ---- reactions -----------------------------------------------------------
alter table public.reactions enable row level security;
drop policy if exists reactions_anon_select on public.reactions;
create policy reactions_anon_select on public.reactions
  for select to anon, authenticated using (true);
-- Реакции ставятся через /api/react (service_role).

-- ============================================================================
--  Готово. Storage-бакет 'photos' оставляем публичным на чтение (картинки в галерее),
--  запись в Storage идёт только из /api/upload.
-- ============================================================================
