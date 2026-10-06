-- ===== TABLES =====
create table mandaps (
  id bigint generated always as identity primary key,
  name text not null, name_bn text, area text, address text,
  lat double precision not null, lng double precision not null,
  theme text, artist text,
  status text not null default 'pending',
  suggested_by text, suggester_email text,
  created_at timestamptz default now()
);
create table photos (
  id bigint generated always as identity primary key,
  mandap_id bigint references mandaps(id) on delete cascade,
  url text not null, path text,
  uploader_name text not null, uploader_email text not null,
  year int default extract(year from now())::int,
  status text not null default 'pending',
  likes int not null default 0,
  created_at timestamptz default now()
);

-- ===== SECURITY (RLS) =====
alter table mandaps enable row level security;
alter table photos enable row level security;

create policy "public read approved mandaps" on mandaps for select to anon using (status='approved');
create policy "public suggest mandaps" on mandaps for insert to anon with check (status='pending');
create policy "admin all mandaps" on mandaps for all to authenticated using (true) with check (true);

create policy "public read approved photos" on photos for select to anon using (status='approved');
create policy "public upload photos" on photos for insert to anon with check (status='pending');
create policy "admin all photos" on photos for all to authenticated using (true) with check (true);

-- email column public e jabe na: anon er jonno column-level permission
revoke all on mandaps from anon; revoke all on photos from anon;
grant select (id,name,name_bn,area,address,lat,lng,theme,artist,status,created_at) on mandaps to anon;
grant insert (name,name_bn,area,address,lat,lng,theme,artist,suggested_by,suggester_email) on mandaps to anon;
grant select (id,mandap_id,url,uploader_name,year,status,likes,created_at) on photos to anon;
grant insert (mandap_id,url,path,uploader_name,uploader_email,year) on photos to anon;
grant all on mandaps, photos to authenticated;

-- ===== SPAM LIMIT: ek email theke din e max 5 photo =====
create or replace function limit_uploads() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from photos where lower(uploader_email)=lower(new.uploader_email) and created_at > now()-interval '1 day') >= 5 then
    raise exception 'Daily upload limit reached (5 photos)';
  end if;
  return new;
end $$;
create trigger photos_limit before insert on photos for each row execute function limit_uploads();

-- ===== LIKE =====
create or replace function like_photo(pid bigint) returns void language sql security definer set search_path=public as $$
  update photos set likes = likes + 1 where id = pid and status='approved'
$$;

-- ===== IMAGE STORAGE =====
insert into storage.buckets (id,name,public) values ('photos','photos',true) on conflict do nothing;
create policy "anon upload photos" on storage.objects for insert to anon with check (bucket_id='photos');
create policy "public read photos" on storage.objects for select using (bucket_id='photos');
create policy "admin delete photos" on storage.objects for delete to authenticated using (bucket_id='photos');

-- ===== SAMPLE DATA (dummy! pore nijer real mandap diye replace koro) =====
insert into mandaps (name,name_bn,area,address,lat,lng,theme,artist,status) values
('Sample Mandap - Agrabad','নমুনা মণ্ডপ - আগ্রাবাদ','Agrabad','Agrabad, Chattogram',22.3250,91.8100,'Traditional','Sample Artist','approved'),
('Sample Mandap - Pahartali','নমুনা মণ্ডপ - পাহাড়তলী','Pahartali','Pahartali, Chattogram',22.3700,91.8000,'Modern','Sample Artist','approved'),
('Sample Mandap - Nasirabad','নমুনা মণ্ডপ - নাসিরাবাদ','Nasirabad','Nasirabad, Chattogram',22.3600,91.8300,'Heritage','Sample Artist','approved');
-- Ager schema.sql run kora thakle, SHUDHU ei file ta SQL Editor e run koro

-- din e 20 ta photo porjonto (multi-upload er jonno)
create or replace function limit_uploads() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from photos where lower(uploader_email)=lower(new.uploader_email) and created_at > now()-interval '1 day') >= 20 then
    raise exception 'Daily upload limit reached (20 photos)';
  end if;
  return new;
end $$;

-- notun mandap + tar photo gulo ekshathe submit
create or replace function suggest_mandap(
  p_name text, p_area text, p_address text, p_theme text, p_artist text,
  p_lat double precision, p_lng double precision,
  p_by text, p_email text, p_year int, p_photos jsonb
) returns void language plpgsql security definer set search_path=public as $$
declare mid bigint; ph jsonb; arr jsonb := coalesce(p_photos,'[]'::jsonb);
begin
  if (select count(*) from mandaps where lower(suggester_email)=lower(p_email) and created_at > now()-interval '1 day') >= 3 then
    raise exception 'Daily suggestion limit reached (3)';
  end if;
  if jsonb_array_length(arr) > 8 then raise exception 'Max 8 photos'; end if;
  insert into mandaps(name,area,address,theme,artist,lat,lng,suggested_by,suggester_email,status)
    values (p_name,p_area,p_address,p_theme,p_artist,p_lat,p_lng,p_by,p_email,'pending') returning id into mid;
  for ph in select * from jsonb_array_elements(arr) loop
    insert into photos(mandap_id,url,path,uploader_name,uploader_email,year,status)
      values (mid, ph->>'url', ph->>'path', p_by, p_email, p_year, 'pending');
  end loop;
end $$;
grant execute on function suggest_mandap to anon;
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
-- update.sql ar update2.sql run kora thakle, SHUDHU ei file ta run koro

-- ===== ROUTES (bhara / khoroch) =====
create table routes (
  id bigint generated always as identity primary key,
  from_place text not null, to_place text not null,
  mandap_id bigint references mandaps(id) on delete set null,
  mode text not null default 'cng', note text,
  status text not null default 'pending',
  suggested_by text, suggester_email text,
  created_at timestamptz default now()
);
create table route_fares (
  id bigint generated always as identity primary key,
  route_id bigint references routes(id) on delete cascade,
  fare int not null check (fare >= 0 and fare <= 100000),
  status text not null default 'pending',
  suggested_by text, suggester_email text,
  created_at timestamptz default now()
);
alter table routes enable row level security;
alter table route_fares enable row level security;
create policy "read routes" on routes for select to anon using (status='approved');
create policy "admin routes" on routes for all to authenticated using (true) with check (true);
create policy "read fares" on route_fares for select to anon using (status='approved');
create policy "report fare" on route_fares for insert to anon with check (status='pending');
create policy "admin fares" on route_fares for all to authenticated using (true) with check (true);
revoke all on routes, route_fares from anon;
grant select (id,from_place,to_place,mandap_id,mode,note,status,created_at) on routes to anon;
grant select (id,route_id,fare,status,created_at) on route_fares to anon;
grant insert (route_id,fare,suggested_by,suggester_email) on route_fares to anon;
grant all on routes, route_fares to authenticated;

create or replace function limit_fares() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from route_fares where lower(suggester_email)=lower(new.suggester_email) and created_at > now()-interval '1 day') >= 10 then
    raise exception 'Daily limit reached';
  end if;
  return new;
end $$;
create trigger fares_limit before insert on route_fares for each row execute function limit_fares();

create or replace function suggest_route(p_from text,p_to text,p_mandap bigint,p_mode text,p_fare int,p_note text,p_by text,p_email text)
returns void language plpgsql security definer set search_path=public as $$
declare rid bigint;
begin
  if (select count(*) from routes where lower(suggester_email)=lower(p_email) and created_at > now()-interval '1 day') >= 5 then
    raise exception 'Daily limit reached';
  end if;
  insert into routes(from_place,to_place,mandap_id,mode,note,suggested_by,suggester_email,status)
    values (p_from,p_to,p_mandap,p_mode,p_note,p_by,p_email,'pending') returning id into rid;
  insert into route_fares(route_id,fare,suggested_by,suggester_email,status) values (rid,p_fare,p_by,p_email,'pending');
end $$;
grant execute on function suggest_route to anon;

-- ===== REPRESENTATIVES (protinidhi) =====
create table reps (
  id bigint generated always as identity primary key,
  name text not null, role text, mandap_name text, contact text,
  photo_url text, photo_path text, sort int default 0,
  created_at timestamptz default now()
);
alter table reps enable row level security;
create policy "read reps" on reps for select to anon, authenticated using (true);
create policy "admin reps" on reps for all to authenticated using (true) with check (true);
grant select on reps to anon;
grant all on reps to authenticated;
insert into reps(name,role,mandap_name,sort) values
('Sample Protinidhi 1','Sovapoti','Sample Mandap - Agrabad',1),
('Sample Protinidhi 2','Sodosso Sochib','Sample Mandap - Pahartali',2),
('Sample Protinidhi 3','Kosadhokkho','Sample Mandap - Nasirabad',3);

-- ===== SCHEDULE (tithi) : tarikh gulo TENTATIVE, admin theke edit koro =====
create table schedule (
  id bigint generated always as identity primary key,
  title text not null, title_bn text, day date not null, note text,
  created_at timestamptz default now()
);
alter table schedule enable row level security;
create policy "read schedule" on schedule for select to anon, authenticated using (true);
create policy "admin schedule" on schedule for all to authenticated using (true) with check (true);
grant select on schedule to anon;
grant all on schedule to authenticated;
insert into schedule(title,title_bn,day,note) values
('Mahalaya','মহালয়া','2026-10-10','Devi pokkho shuru'),
('Maha Shashthi','মহাষষ্ঠী','2026-10-16','Bodhon, Amontron o Adhibas'),
('Maha Saptami','মহাসপ্তমী','2026-10-17','Nabopatrika snan o puja'),
('Maha Ashtami','মহাঅষ্টমী','2026-10-19','Ashtami Anjali, Kumari Puja, Sandhi Puja'),
('Maha Navami','মহানবমী','2026-10-20','Navami puja o pushpanjali'),
('Vijaya Dashami','বিজয়া দশমী','2026-10-21','Protima bisorjon o Sindur Khela');

-- ===== VOTING =====
create table votes (
  id bigint generated always as identity primary key,
  voter_key text not null, email text not null,
  mandap_id bigint references mandaps(id) on delete cascade,
  created_at timestamptz default now(),
  unique (voter_key, mandap_id), unique (email, mandap_id)
);
alter table votes enable row level security;
revoke all on votes from anon;
create policy "admin votes" on votes for all to authenticated using (true) with check (true);
grant all on votes to authenticated;

create or replace function cast_votes(p_key text, p_email text, p_ids bigint[])
returns void language plpgsql security definer set search_path=public as $$
declare e text := lower(trim(p_email)); n int := coalesce(array_length(p_ids,1),0);
begin
  if n < 1 or n > 5 then raise exception 'Choose 1 to 5 pujas'; end if;
  if (select count(distinct x) from unnest(p_ids) x) <> n then raise exception 'Duplicate choices'; end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Valid email dao'; end if;
  if exists (select 1 from votes where voter_key = p_key or email = e) then raise exception 'Apni already vote diyechen'; end if;
  insert into votes(voter_key,email,mandap_id) select p_key, e, m.id from mandaps m where m.id = any(p_ids) and m.status='approved';
end $$;

create or replace function vote_results()
returns table(mandap_id bigint, name text, name_bn text, area text, votes bigint)
language sql security definer set search_path=public as $$
  select m.id, m.name, m.name_bn, m.area, count(v.id)
  from mandaps m left join votes v on v.mandap_id = m.id
  where m.status='approved' group by m.id order by count(v.id) desc, m.name limit 20
$$;
grant execute on function cast_votes, vote_results to anon;

-- ===== REALTIME =====
alter publication supabase_realtime add table notices, mandaps, photos, routes, route_fares;
