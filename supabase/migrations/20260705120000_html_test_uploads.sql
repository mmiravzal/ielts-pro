-- HTML test uploads: raw interactive HTML tests served same-origin to students.
-- Adds task columns for the stored file reference and a private storage bucket.

alter table public.tasks add column if not exists source_type text;
alter table public.tasks add column if not exists html_path text;
alter table public.tasks add column if not exists html_url text;

-- Private bucket; only the server (service role) reads/writes it, so no public
-- access and no per-user storage policies are required.
insert into storage.buckets (id, name, public)
values ('html-tests', 'html-tests', false)
on conflict (id) do nothing;
