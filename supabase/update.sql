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
