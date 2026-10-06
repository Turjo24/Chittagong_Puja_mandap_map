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
