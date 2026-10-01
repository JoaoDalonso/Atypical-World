-- Atypical World · Escuta Ativa
-- Rode este arquivo no SQL Editor do Supabase depois de criar o projeto.
-- Depois, crie o primeiro usuário administrador em Authentication > Users
-- e insira o UUID dele na tabela public.profiles como role='admin'.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (char_length(category) <= 80),
  title text not null check (char_length(title) between 1 and 90),
  body text not null check (char_length(body) between 10 and 1500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_reply text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists posts_status_created_idx on public.posts(status, created_at desc);
create index if not exists comments_post_status_idx on public.comments(post_id, status, created_at);
create index if not exists likes_post_idx on public.likes(post_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.public_like_counts(post_ids uuid[])
returns table(post_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select l.post_id, count(*)::bigint
  from public.likes l
  join public.posts p on p.id = l.post_id
  where l.post_id = any(post_ids) and p.status = 'approved'
  group by l.post_id;
$$;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

revoke all on table public.profiles, public.posts, public.comments, public.likes from anon, authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.posts, public.comments to anon, authenticated;
grant insert on table public.posts, public.comments to authenticated;
grant select, insert, delete on table public.likes to authenticated;
grant execute on function public.public_like_counts(uuid[]) to anon, authenticated;

-- Profiles: O usuário autenticado pode consultar apenas seu próprio registro de moderador
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (user_id = auth.uid());

create policy "Public can read approved posts"
on public.posts for select
to anon, authenticated
using (status = 'approved');

create policy "Anonymous authenticated users can submit posts"
on public.posts for insert
to authenticated
with check (
  user_id = auth.uid()
  and (select (auth.jwt()->>'is_anonymous')::boolean) is true
  and status = 'pending'
);

create policy "Admins can read all posts"
on public.posts for select
to authenticated
using ((select public.is_admin()));

create policy "Admins can update posts"
on public.posts for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


create policy "Public can read approved comments"
on public.comments for select
to anon, authenticated
using (
  status = 'approved'
  and exists (select 1 from public.posts p where p.id = post_id and p.status = 'approved')
);

create policy "Anonymous authenticated users can submit comments"
on public.comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and (select (auth.jwt()->>'is_anonymous')::boolean) is true
  and status = 'pending'
  and exists (select 1 from public.posts p where p.id = post_id and p.status = 'approved')
);

create policy "Admins can read all comments"
on public.comments for select
to authenticated
using ((select public.is_admin()));

create policy "Admins can update comments"
on public.comments for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Users can read their own like"
on public.likes for select
to authenticated
using (user_id = auth.uid());

create policy "Users can add their own like"
on public.likes for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.posts p where p.id = post_id and p.status = 'approved')
);

create policy "Users can remove their own like"
on public.likes for delete
to authenticated
using (user_id = auth.uid());

-- Only the backend-like RPC exposes aggregate counts; raw likes remain private.
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- =========================================================
-- MÉTRICAS E ANALYTICS DE ACESSO (PRIVACIDADE RESPEITADA)
-- =========================================================

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  section text not null default 'inicio',
  event_type text not null default 'page_view' check (event_type in ('page_view', 'share_click', 'directory_contact_click', 'new_story_click')),
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_idx on public.site_visits(created_at desc);
create index if not exists site_visits_event_idx on public.site_visits(event_type, created_at desc);

alter table public.site_visits enable row level security;
revoke all on table public.site_visits from anon, authenticated;

-- Permite inserção de eventos de métrica via função RPC segura
create or replace function public.track_site_event(
  target_section text default 'inicio',
  target_event text default 'page_view'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_visits(section, event_type)
  values (
    coalesce(nullif(trim(target_section), ''), 'inicio'),
    coalesce(nullif(trim(target_event), ''), 'page_view')
  );
end;
$$;

grant execute on function public.track_site_event(text, text) to anon, authenticated;

-- Função consolidada para o painel de moderação / administração ver todas as métricas do projeto
create or replace function public.get_admin_dashboard_metrics()
returns table(
  total_visits bigint,
  visits_today bigint,
  total_posts bigint,
  approved_posts bigint,
  pending_posts bigint,
  total_comments bigint,
  total_likes bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::bigint from public.site_visits where event_type = 'page_view') as total_visits,
    (select count(*)::bigint from public.site_visits where event_type = 'page_view' and created_at >= date_trunc('day', now())) as visits_today,
    (select count(*)::bigint from public.posts) as total_posts,
    (select count(*)::bigint from public.posts where status = 'approved') as approved_posts,
    (select count(*)::bigint from public.posts where status = 'pending') as pending_posts,
    (select count(*)::bigint from public.comments) as total_comments,
    (select count(*)::bigint from public.likes) as total_likes;
$$;

grant execute on function public.get_admin_dashboard_metrics() to authenticated;
