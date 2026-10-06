-- update.sql er pore, SQL Editor e SHUDHU ei file ta run koro

-- ===== NOTICES (notification) =====
create table notices (
  id bigint generated always as identity primary key,
  title text not null, body text,
  created_at timestamptz default now()
);
alter table notices enable row level security;
create policy "public read notices" on notices for select to anon, authenticated using (true);
create policy "admin notices" on notices for all to authenticated using (true) with check (true);
grant select on notices to anon;
grant all on notices to authenticated;

-- notun mandap approve hole auto notice
create or replace function notify_new_mandap() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='approved' and old.status is distinct from 'approved' then
    insert into notices(title, body) values ('নতুন মণ্ডপ যোগ হয়েছে · New mandap', new.name || coalesce(' · ' || new.area, ''));
  end if;
  return new;
end $$;
create trigger mandap_notice after update on mandaps for each row execute function notify_new_mandap();

-- ===== SPONSORS =====
create table sponsors (
  id bigint generated always as identity primary key,
  name text not null, tier text not null default 'supporter',
  tagline text, link text, logo_url text, logo_path text,
  sort int default 0, created_at timestamptz default now()
);
alter table sponsors enable row level security;
create policy "public read sponsors" on sponsors for select to anon, authenticated using (true);
create policy "admin sponsors" on sponsors for all to authenticated using (true) with check (true);
grant select on sponsors to anon;
grant all on sponsors to authenticated;

-- admin logo upload korte parbe
create policy "admin upload" on storage.objects for insert to authenticated with check (bucket_id='photos');
