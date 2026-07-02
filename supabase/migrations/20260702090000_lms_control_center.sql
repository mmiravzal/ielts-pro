-- LMS control-center data model additions.
-- Non-destructive: keeps existing students, lessons, tasks, and submissions.

begin;

create extension if not exists pgcrypto;

alter table public.groups
  add column if not exists slug text null,
  add column if not exists "order" integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

update public.groups
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

create unique index if not exists groups_slug_unique_idx
  on public.groups (slug)
  where slug is not null;

insert into public.groups (name, slug, "order")
values
  ('Introduction group', 'introduction', 1),
  ('Graduation group', 'graduation', 2),
  ('Pre-ielts group', 'pre-ielts', 3)
on conflict (slug) do update
set name = excluded.name,
    "order" = excluded."order",
    updated_at = now();

alter table public.lessons
  add column if not exists group_id uuid null references public.groups(id) on delete set null,
  add column if not exists status text not null default 'draft',
  add column if not exists updated_at timestamptz not null default now();

alter table public.lessons
  drop constraint if exists lessons_status_check;

alter table public.lessons
  add constraint lessons_status_check
  check (status in ('draft', 'published', 'archived'));

update public.lessons
set status = case when published is true then 'published' else 'draft' end
where status is null or status = 'draft';

create index if not exists lessons_group_publish_idx
  on public.lessons (group_id, published, "order");

alter table public.tasks
  add column if not exists source_type text not null default 'manual',
  add column if not exists content_status text not null default 'assigned',
  add column if not exists content_type text null,
  add column if not exists subtype text null,
  add column if not exists question_count integer not null default 0,
  add column if not exists answer_count integer not null default 0,
  add column if not exists audio_detected boolean not null default false,
  add column if not exists warnings jsonb not null default '[]'::jsonb,
  add column if not exists archived_at timestamptz null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.tasks
  drop constraint if exists tasks_content_status_check;

alter table public.tasks
  add constraint tasks_content_status_check
  check (content_status in ('draft', 'assigned', 'published', 'archived'));

update public.tasks t
set content_type = coalesce(content_type, skill),
    content_status = case when l.published is true then 'published' else content_status end,
    updated_at = now()
from public.lessons l
where l.id = t.lesson_id;

create index if not exists tasks_content_status_idx
  on public.tasks (content_status, skill, created_at desc);

create index if not exists tasks_lesson_order_idx
  on public.tasks (lesson_id, "order");

grant select, insert, update on public.groups to service_role;
grant select, insert, update on public.lessons to service_role;
grant select, insert, update on public.tasks to service_role;

commit;
