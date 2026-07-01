-- Private student access and device session management.
-- Apply before deploying the matching student/admin auth changes.

begin;

alter table public.students
  add column if not exists is_active boolean not null default true,
  add column if not exists access_status text not null default 'open',
  add column if not exists max_devices integer null,
  add column if not exists last_login_at timestamptz null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.students
  drop constraint if exists students_access_status_check;

alter table public.students
  add constraint students_access_status_check
  check (access_status in ('open', 'closed'));

create unique index if not exists students_student_code_unique_idx
  on public.students (student_code);

create index if not exists students_access_status_idx
  on public.students (access_status, is_active);

create table if not exists public.student_device_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  device_label text null,
  user_agent text null,
  device_fingerprint_hash text null,
  session_token_hash text not null,
  is_active boolean not null default true,
  revoked_at timestamptz null,
  revoked_by uuid null,
  revoked_by_email text null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists student_device_sessions_student_idx
  on public.student_device_sessions (student_id, is_active, last_seen_at desc);

create index if not exists student_device_sessions_token_idx
  on public.student_device_sessions (student_id, id, session_token_hash)
  where is_active is true and revoked_at is null;

create table if not exists public.student_login_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid null references public.students(id) on delete set null,
  access_id_attempted text null,
  success boolean not null default false,
  reason text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists student_login_events_student_idx
  on public.student_login_events (student_id, created_at desc);

alter table public.student_device_sessions enable row level security;
alter table public.student_login_events enable row level security;

drop policy if exists "teachers can manage student device sessions" on public.student_device_sessions;
create policy "teachers can manage student device sessions"
on public.student_device_sessions
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

drop policy if exists "teachers can read student login events" on public.student_login_events;
create policy "teachers can read student login events"
on public.student_login_events
for select
to authenticated
using (public.is_teacher());

-- Server routes use the service role key. These explicit grants are included
-- because new Supabase projects may not expose newly-created tables to roles
-- automatically through the Data API.
grant select, insert, update on public.student_device_sessions to service_role;
grant select, insert on public.student_login_events to service_role;
grant select, insert, update on public.students to service_role;

commit;
