-- Per-test group assignment.
-- A test (task) can be assigned to many groups. A student sees a test only if the
-- test is linked to that student's group. No link -> visible to nobody.
-- Non-destructive: backfills existing lesson-level group assignments.

begin;

create extension if not exists pgcrypto;

create table if not exists public.task_groups (
  task_id    uuid not null references public.tasks(id)  on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, group_id)
);

create index if not exists task_groups_group_idx on public.task_groups (group_id);
create index if not exists task_groups_task_idx  on public.task_groups (task_id);

-- Backfill: carry over each test's current single lesson group so nothing that is
-- already correctly scoped disappears. Tests whose lesson had no group stay
-- unlinked here, which means they become hidden until a teacher assigns a group.
insert into public.task_groups (task_id, group_id)
select t.id, l.group_id
from public.tasks t
join public.lessons l on l.id = t.lesson_id
where l.group_id is not null
on conflict do nothing;

grant select, insert, update, delete on public.task_groups to service_role;

commit;
