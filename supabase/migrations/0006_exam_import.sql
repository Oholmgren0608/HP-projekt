-- new question columns
alter table public.questions
  add column if not exists exam_id text,
  add column if not exists exam_date date,
  add column if not exists pass_number smallint,
  add column if not exists question_number smallint,
  add column if not exists figure_url text,
  add column if not exists source_url text,
  add column if not exists status text not null default 'published';

alter table public.questions
  add constraint questions_status_check check (status in ('draft','published','rejected'));

create index if not exists idx_questions_exam on public.questions (exam_id);
create index if not exists idx_questions_status on public.questions (status);
create index if not exists idx_questions_exam_pass on public.questions (exam_id, pass_number);

-- exams registry table (powers the old-exams browser UI)
create table if not exists public.exams (
  id text primary key,
  exam_date date not null,
  title text not null,
  status text not null default 'imported' check (status in ('imported','published','rejected')),
  created_at timestamptz not null default now()
);

alter table public.exams enable row level security;
create policy "public read exams" on public.exams
  for select to anon, authenticated using (true);

-- public figure bucket (anonymous users must be able to see extracted figures)
insert into storage.buckets (id, name, public) values ('prov-figures','prov-figures', true)
  on conflict (id) do nothing;
