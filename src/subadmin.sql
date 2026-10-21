-- Supabase > SQL Editor e paste kore Run koro

-- 1) Role table
create table if not exists admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'sub' check (role in ('super','sub')),
  perms text[] not null default '{}',
  created_at timestamptz default now()
);
alter table admin_roles enable row level security;

create or replace function is_super() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from admin_roles where user_id = auth.uid() and role = 'super')
$$;

-- perm key (dash, mandaps, routes...) ache kina; super hole sob e true
create or replace function has_perm(p text) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from admin_roles
    where user_id = auth.uid() and (role = 'super' or p = any(perms)))
$$;

create policy "read own or super" on admin_roles for select to authenticated
  using (user_id = auth.uid() or is_super());
create policy "super insert" on admin_roles for insert to authenticated with check (is_super());
create policy "super update" on admin_roles for update to authenticated using (is_super());
create policy "super delete" on admin_roles for delete to authenticated using (is_super());

-- 2) Tomar nijer account ke main admin banao (email ta bodlao)
insert into admin_roles (user_id, email, role)
select id, email, 'super' from auth.users where email = 'TOMAR_EMAIL@gmail.com'
on conflict (user_id) do update set role = 'super';

-- 3) SOBCHEYE JARURI: purono "authenticated hole sob kora jay" policy gulo soriye
--    permission-based policy dao. Na korle je keu login korle (sub-admin o) sob kichu korte parbe.
--    Dashboard > Authentication > Policies e purono admin policy er naam dekho, tarpor:
--    drop policy "<purono naam>" on mandaps;
--
-- Pattern (public select/insert policy gulo jemon ache temon thakbe):
create policy "perm write mandaps" on mandaps for all to authenticated
  using (has_perm('mandaps') or has_perm('dash')) with check (has_perm('mandaps') or has_perm('dash'));
create policy "perm write photos" on photos for all to authenticated
  using (has_perm('mandaps') or has_perm('dash')) with check (has_perm('mandaps') or has_perm('dash'));
create policy "perm write routes" on routes for all to authenticated
  using (has_perm('routes')) with check (has_perm('routes'));
create policy "perm write route_fares" on route_fares for all to authenticated
  using (has_perm('routes')) with check (has_perm('routes'));
-- Baki table (notices, sponsors, reps, parikroma, vote, blog, schedule...) e ekhi pattern:
-- create policy "perm write <table>" on <table> for all to authenticated
--   using (has_perm('<page key>')) with check (has_perm('<page key>'));

-- Storage: admin photo upload/delete
create policy "perm storage photos" on storage.objects for all to authenticated
  using (bucket_id = 'photos' and (has_perm('mandaps') or has_perm('dash')))
  with check (bucket_id = 'photos' and (has_perm('mandaps') or has_perm('dash')));
