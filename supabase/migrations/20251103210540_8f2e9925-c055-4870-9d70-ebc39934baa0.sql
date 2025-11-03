-- ============================================
-- FORO RED AKASHA - MIGRACIÓN COMPLETA (CORREGIDA)
-- ============================================

-- 1. ENUMS
create type public.app_role as enum ('admin', 'moderator', 'user', 'verified', 'guest');
create type public.thread_type as enum ('debate_abierto', 'pregunta_encuesta', 'debate_moderado', 'hilo_recursos', 'anuncio');
create type public.report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');
create type public.sanction_type as enum ('warning', 'temporary_suspension', 'permanent_ban');
create type public.badge_type as enum ('bronze', 'silver', 'gold', 'special', 'merit');

-- 2. TABLA DE PERFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  reputation_points integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Perfiles visibles por todos"
  on public.profiles for select
  using (true);

create policy "Usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuarios pueden insertar su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. TABLA DE ROLES (SEPARADA - SEGURIDAD CRÍTICA)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role not null,
  assigned_at timestamptz default now(),
  assigned_by uuid references public.profiles(id),
  unique(user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Roles visibles por todos"
  on public.user_roles for select
  using (true);

create policy "Solo admins pueden insertar roles"
  on public.user_roles for insert
  with check (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ));

create policy "Solo admins pueden actualizar roles"
  on public.user_roles for update
  using (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ));

create policy "Solo admins pueden eliminar roles"
  on public.user_roles for delete
  using (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ));

-- Función de seguridad para verificar roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- 4. CATEGORÍAS DEL FORO
create table public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  icono text,
  orden integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.forum_categories enable row level security;

create policy "Categorías visibles por todos"
  on public.forum_categories for select
  using (true);

create policy "Solo admins pueden insertar categorías"
  on public.forum_categories for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Solo admins pueden actualizar categorías"
  on public.forum_categories for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Solo admins pueden eliminar categorías"
  on public.forum_categories for delete
  using (public.has_role(auth.uid(), 'admin'));

-- 5. SUBFOROS
create table public.forum_subforos (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.forum_categories(id) on delete cascade not null,
  nombre text not null,
  descripcion text,
  orden integer default 0,
  requires_approval boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.forum_subforos enable row level security;

create policy "Subforos visibles por todos"
  on public.forum_subforos for select
  using (true);

create policy "Solo admins pueden insertar subforos"
  on public.forum_subforos for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Solo admins pueden actualizar subforos"
  on public.forum_subforos for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Solo admins pueden eliminar subforos"
  on public.forum_subforos for delete
  using (public.has_role(auth.uid(), 'admin'));

-- 6. HILOS (THREADS)
create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  subforo_id uuid references public.forum_subforos(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  thread_type thread_type default 'debate_abierto',
  is_pinned boolean default false,
  is_closed boolean default false,
  requires_approval boolean default false,
  approved boolean default true,
  approved_by uuid references public.profiles(id),
  views_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.forum_threads enable row level security;

create policy "Hilos visibles por todos los autenticados"
  on public.forum_threads for select
  to authenticated
  using (approved = true or author_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Usuarios autenticados pueden crear hilos"
  on public.forum_threads for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Autores pueden actualizar sus hilos"
  on public.forum_threads for update
  using (auth.uid() = author_id or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Solo admins y moderadores pueden eliminar hilos"
  on public.forum_threads for delete
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

-- 7. POSTS (RESPUESTAS)
create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.forum_threads(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_post_id uuid references public.forum_posts(id) on delete cascade,
  is_best_answer boolean default false,
  approved boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.forum_posts enable row level security;

create policy "Posts visibles por todos los autenticados"
  on public.forum_posts for select
  to authenticated
  using (approved = true or author_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Usuarios autenticados pueden crear posts"
  on public.forum_posts for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Autores pueden actualizar sus posts"
  on public.forum_posts for update
  using (auth.uid() = author_id or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Solo admins y moderadores pueden eliminar posts"
  on public.forum_posts for delete
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

-- 8. SISTEMA DE VOTACIÓN
create table public.forum_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.forum_posts(id) on delete cascade,
  thread_id uuid references public.forum_threads(id) on delete cascade,
  vote_value integer check (vote_value in (-1, 1)),
  created_at timestamptz default now(),
  constraint vote_target_check check ((post_id is not null and thread_id is null) or (post_id is null and thread_id is not null)),
  unique(user_id, post_id),
  unique(user_id, thread_id)
);

alter table public.forum_votes enable row level security;

create policy "Votos visibles por todos"
  on public.forum_votes for select
  using (true);

create policy "Usuarios pueden votar"
  on public.forum_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuarios pueden cambiar su voto"
  on public.forum_votes for update
  using (auth.uid() = user_id);

create policy "Usuarios pueden eliminar su voto"
  on public.forum_votes for delete
  using (auth.uid() = user_id);

-- 9. BADGES (INSIGNIAS)
create table public.forum_badges (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  badge_type badge_type not null,
  icon text,
  requirement_description text,
  created_at timestamptz default now()
);

alter table public.forum_badges enable row level security;

create policy "Badges visibles por todos"
  on public.forum_badges for select
  using (true);

create policy "Solo admins pueden insertar badges"
  on public.forum_badges for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Solo admins pueden actualizar badges"
  on public.forum_badges for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Solo admins pueden eliminar badges"
  on public.forum_badges for delete
  using (public.has_role(auth.uid(), 'admin'));

-- 10. BADGES DE USUARIOS
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.forum_badges(id) on delete cascade not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Badges de usuarios visibles por todos"
  on public.user_badges for select
  using (true);

create policy "Solo admins pueden otorgar badges"
  on public.user_badges for insert
  with check (public.has_role(auth.uid(), 'admin'));

-- 11. REPORTES
create table public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_content_type text check (reported_content_type in ('thread', 'post')),
  thread_id uuid references public.forum_threads(id) on delete cascade,
  post_id uuid references public.forum_posts(id) on delete cascade,
  reason text not null,
  status report_status default 'pending',
  reviewed_by uuid references public.profiles(id),
  resolution_notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz,
  constraint report_target_check check ((thread_id is not null and post_id is null) or (thread_id is null and post_id is not null))
);

alter table public.forum_reports enable row level security;

create policy "Usuarios pueden ver sus propios reportes"
  on public.forum_reports for select
  using (auth.uid() = reporter_id or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Usuarios autenticados pueden crear reportes"
  on public.forum_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "Solo moderadores y admins pueden actualizar reportes"
  on public.forum_reports for update
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

-- 12. SANCIONES
create table public.forum_sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  sanctioned_by uuid references public.profiles(id) not null,
  sanction_type sanction_type not null,
  reason text not null,
  duration_days integer,
  start_date timestamptz default now(),
  end_date timestamptz,
  is_active boolean default true,
  appeal_text text,
  appeal_status text check (appeal_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table public.forum_sanctions enable row level security;

create policy "Usuarios pueden ver sus propias sanciones"
  on public.forum_sanctions for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Solo moderadores y admins pueden crear sanciones"
  on public.forum_sanctions for insert
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Solo moderadores y admins pueden actualizar sanciones"
  on public.forum_sanctions for update
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

-- 13. FUNCIONES Y TRIGGERS

-- Función para actualizar updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers para updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_categories_updated_at before update on public.forum_categories
  for each row execute function public.update_updated_at_column();

create trigger update_subforos_updated_at before update on public.forum_subforos
  for each row execute function public.update_updated_at_column();

create trigger update_threads_updated_at before update on public.forum_threads
  for each row execute function public.update_updated_at_column();

create trigger update_posts_updated_at before update on public.forum_posts
  for each row execute function public.update_updated_at_column();

-- Función para crear perfil automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Asignar rol de usuario por defecto
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

-- Trigger para crear perfil automáticamente
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();