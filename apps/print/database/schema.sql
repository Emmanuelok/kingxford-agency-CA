-- PRESSWERK application schema. Apply once to a dedicated Supabase project.
-- No provider credentials, public artwork buckets or service keys are required by the browser.
begin;
create schema if not exists pw_private;
revoke all on schema pw_private from public;
grant usage on schema pw_private to authenticated;

create table public.pw_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null check (length(name) between 1 and 80),
  brand jsonb not null check(coalesce(jsonb_typeof(brand)='object' and brand ?& array['name','tagline','primary','secondary','accent','font'] and length(brand->>'name') between 1 and 60 and length(brand->>'tagline')<=100 and brand->>'primary' ~ '^#[0-9a-fA-F]{6}$' and brand->>'secondary' ~ '^#[0-9a-fA-F]{6}$' and brand->>'accent' ~ '^#[0-9a-fA-F]{6}$' and brand->>'font' in ('Arial','Georgia','Verdana','Courier New'),false)) default '{"name":"PRESSWERK","tagline":"Make your mark.","primary":"#2449f8","secondary":"#171719","accent":"#c6ee48","font":"Arial"}',
  created_at timestamptz not null default now()
);
create table public.pw_members (
  workspace_id uuid not null references public.pw_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('owner','admin','designer','operator','viewer')),
  primary key(workspace_id,user_id)
);
create index pw_members_user on public.pw_members(user_id,workspace_id);
create function pw_private.has_role(w uuid, roles text[] default array['owner','admin','designer','operator','viewer'])
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from public.pw_members m where m.workspace_id=w and m.user_id=auth.uid() and m.role=any(roles));
$$;
revoke all on function pw_private.has_role(uuid,text[]) from public;
grant execute on function pw_private.has_role(uuid,text[]) to authenticated;
create function pw_private.add_owner() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or new.owner_id <> auth.uid() then raise exception 'Workspace owner must match signed-in user'; end if;
  insert into public.pw_members values(new.id,new.owner_id,'owner');
  return new;
end $$;
revoke all on function pw_private.add_owner() from public;
create trigger pw_workspace_owner after insert on public.pw_workspaces for each row execute function pw_private.add_owner();

create table public.pw_projects (
  id uuid primary key,
  workspace_id uuid not null references public.pw_workspaces(id),
  design jsonb not null check (jsonb_typeof(design)='object' and octet_length(design::text)<524288),
  version integer not null default 1 check(version>0),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id)
);
create index pw_projects_workspace on public.pw_projects(workspace_id,updated_at desc);
create table public.pw_revisions (
  project_id uuid not null references public.pw_projects(id),
  version integer not null,
  workspace_id uuid not null references public.pw_workspaces(id),
  design jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  primary key(project_id,version)
);
create index pw_revisions_workspace on public.pw_revisions(workspace_id);
create function pw_private.valid_design(d jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare l jsonb; k text;
begin
  if not coalesce(jsonb_typeof(d)='object' and d ?& array['layers','name','productId','background','quantity','tier','finish','sides','city'] and jsonb_typeof(d->'layers')='array' and jsonb_array_length(d->'layers')<=100 and jsonb_typeof(d->'name')='string' and length(d->>'name') between 1 and 80 and d->>'background' ~ '^#[0-9a-fA-F]{6}$' and jsonb_typeof(d->'quantity')='number' and (d->>'quantity')::numeric between 1 and 100000 and mod((d->>'quantity')::numeric,1)=0 and d->>'tier' in ('Value','Design Plus','Priority') and (d->>'sides')::integer in (1,2) and jsonb_typeof(d->'city')='string' and length(d->>'city') between 1 and 100,false) then return false; end if;
  if not coalesce((d->>'productId' in ('cards','brochure','bw','colour','flyer','postcard','letterhead','envelope','invitation','menu','photobook','book','magazine','notebook','calendar') and d->>'finish' in ('Standard','Soft touch','Gloss laminate','Foil accent')) or (d->>'productId' in ('tee','box','mug','hoodie','tote','cap','sport','fabric','security','tissue','tape','mailer','pouch','bottle','award','plans','model','parts','braille','electronics','edible') and d->>'finish' in ('Standard')) or (d->>'productId' in ('stickers','poster','banner','canvas','roll','clear','yard','vinyl','wrap','acrylic','booth','photos','metal','wall','floor') and d->>'finish' in ('Standard','Gloss laminate')),false) then return false; end if;
  for l in select value from jsonb_array_elements(d->'layers') loop
    if not coalesce(l ?& array['id','type','text','x','y','size','color','rotation','opacity'] and jsonb_typeof(l->'text')='string' and length(l->>'text')<=10000 and jsonb_typeof(l->'id')='string' and length(l->>'id') between 1 and 80 and l->>'type' in ('text','image','shape') and l->>'color' ~ '^#[0-9a-fA-F]{6}$',false) then return false; end if;
    foreach k in array array['x','y','size','rotation','opacity'] loop if jsonb_typeof(l->k) is distinct from 'number' then return false; end if; end loop;
    if (l->>'x')::numeric not between 0 and 100 or (l->>'y')::numeric not between 0 and 100 or (l->>'size')::numeric not between 1 and 50 or (l->>'rotation')::numeric not between -360 and 360 or (l->>'opacity')::numeric not between 0 and 1 then return false; end if;
    foreach k in array array['width','height'] loop if l ? k and not coalesce(jsonb_typeof(l->k)='number' and (l->>k)::numeric>0 and (l->>k)::numeric<=100,false) then return false; end if; end loop;
    if l ? 'font' and not coalesce(l->>'font' in ('Arial','Georgia','Verdana','Courier New'),false) then return false; end if;
    if l ? 'weight' and not coalesce(jsonb_typeof(l->'weight')='number' and (l->>'weight')::numeric between 100 and 900,false) then return false; end if;
  end loop;
  if (select count(*) from jsonb_array_elements(d->'layers'))<>(select count(distinct value->>'id') from jsonb_array_elements(d->'layers')) then return false; end if;
  return true;
exception when others then return false;
end $$;
revoke all on function pw_private.valid_design(jsonb) from public;
create function pw_private.project_revision() returns trigger language plpgsql security definer set search_path='' as $$
declare layer jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if tg_op='UPDATE' and (new.workspace_id<>old.workspace_id or new.id<>old.id or new.created_by<>old.created_by) then raise exception 'Project ownership is immutable'; end if;
  if new.created_by<>auth.uid() and tg_op='INSERT' then raise exception 'Invalid project creator'; end if;
  if not pw_private.valid_design(new.design) then raise exception 'Invalid design fields'; end if;
  if not (new.design ?& array['layers','name','productId','background','quantity','tier','finish','sides','city']) or jsonb_typeof(new.design->'layers') is distinct from 'array' or jsonb_array_length(new.design->'layers')>100 or coalesce(length(new.design->>'name'),0) not between 1 and 80 then raise exception 'Invalid design'; end if;
  for layer in select value from jsonb_array_elements(new.design->'layers') loop
    if layer ? 'src' then raise exception 'Store artwork in the private bucket first'; end if;
    if layer->>'type'='image' and (layer->>'assetPath' is null or split_part(layer->>'assetPath','/',1)<>new.workspace_id::text) then raise exception 'Artwork belongs to another workspace'; end if;
  end loop;
  new.version := case when tg_op='INSERT' then 1 else old.version+1 end;
  new.updated_at:=clock_timestamp();
  new.design:=new.design || jsonb_build_object('id',new.id,'version',new.version,'updatedAt',new.updated_at);
  return new;
end $$;
revoke all on function pw_private.project_revision() from public;
create trigger pw_revision_before before insert or update on public.pw_projects for each row execute function pw_private.project_revision();
create function pw_private.record_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.pw_revisions(project_id,version,workspace_id,design,created_by) values(new.id,new.version,new.workspace_id,new.design,auth.uid());
  return new;
end $$;
revoke all on function pw_private.record_revision() from public;
create trigger pw_revision_after after insert or update on public.pw_projects for each row execute function pw_private.record_revision();

create table public.pw_proofs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.pw_workspaces(id),
  project_id uuid not null,
  version integer not null,
  approved_by uuid not null default auth.uid() references auth.users(id),
  approved_at timestamptz not null default now(),
  note text not null default 'Artwork and spelling reviewed' check(length(note)<=1000),
  foreign key(project_id,version) references public.pw_revisions(project_id,version),
  unique(project_id,version,approved_by)
);
create index pw_proofs_workspace on public.pw_proofs(workspace_id);
create table public.pw_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.pw_workspaces(id),
  project_id uuid not null,
  version integer not null,
  idempotency_key uuid not null,
  estimate jsonb not null check(jsonb_typeof(estimate)='object'),
  status text not null default 'Artwork review' check(status in ('Artwork review','Ready to produce','Printing','Finishing','Dispatched')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(project_id,version) references public.pw_revisions(project_id,version),
  unique(workspace_id,idempotency_key)
);
create index pw_orders_workspace on public.pw_orders(workspace_id,created_at desc);
create table public.pw_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pw_orders(id),
  workspace_id uuid not null references public.pw_workspaces(id),
  actor_id uuid not null references auth.users(id),
  from_status text,
  to_status text not null,
  created_at timestamptz not null default now()
);
create index pw_events_workspace on public.pw_order_events(workspace_id,created_at desc);
create function pw_private.check_order() returns trigger language plpgsql security definer set search_path='' as $$
declare stages text[]:=array['Artwork review','Ready to produce','Printing','Finishing','Dispatched']; actor uuid:=auth.uid();
begin
  if actor is null and current_setting('request.jwt.claims',true)::jsonb->>'role'='service_role' then actor:=new.created_by; end if;
  if actor is null or not exists(select 1 from public.pw_members m where m.workspace_id=new.workspace_id and m.user_id=actor and m.role in ('owner','admin','designer','operator')) then raise exception 'Workspace access required'; end if;
  if not exists(select 1 from public.pw_revisions r where r.project_id=new.project_id and r.version=new.version and r.workspace_id=new.workspace_id) then raise exception 'Invalid artwork revision'; end if;
  if tg_op='INSERT' then
    if new.created_by<>actor or new.status<>'Artwork review' then raise exception 'New orders require artwork review'; end if;
  else
    if (new.workspace_id,new.project_id,new.version,new.estimate,new.created_by,new.idempotency_key) is distinct from (old.workspace_id,old.project_id,old.version,old.estimate,old.created_by,old.idempotency_key) then raise exception 'Order specification is immutable'; end if;
    if array_position(stages,new.status)<>array_position(stages,old.status)+1 then raise exception 'Move the job to the next production stage'; end if;
    if not exists(select 1 from public.pw_proofs p where p.project_id=new.project_id and p.version=new.version and p.workspace_id=new.workspace_id) then raise exception 'This artwork revision needs proof approval'; end if;
  end if;
  new.updated_at:=clock_timestamp();
  return new;
end $$;
revoke all on function pw_private.check_order() from public;
create trigger pw_order_guard before insert or update on public.pw_orders for each row execute function pw_private.check_order();
create function pw_private.record_order_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.pw_order_events(order_id,workspace_id,actor_id,from_status,to_status) values(new.id,new.workspace_id,case when tg_op='INSERT' then new.created_by else auth.uid() end,case when tg_op='UPDATE' then old.status else null end,new.status);
  return new;
end $$;
revoke all on function pw_private.record_order_event() from public;
create trigger pw_order_audit after insert or update on public.pw_orders for each row execute function pw_private.record_order_event();

alter table public.pw_workspaces enable row level security;
alter table public.pw_members enable row level security;
alter table public.pw_projects enable row level security;
alter table public.pw_revisions enable row level security;
alter table public.pw_proofs enable row level security;
alter table public.pw_orders enable row level security;
alter table public.pw_order_events enable row level security;
revoke all on public.pw_workspaces,public.pw_members,public.pw_projects,public.pw_revisions,public.pw_proofs,public.pw_orders,public.pw_order_events from anon,authenticated;
grant select,insert on public.pw_workspaces to authenticated;
grant update(name,brand) on public.pw_workspaces to authenticated;
grant select on public.pw_members,public.pw_revisions,public.pw_order_events to authenticated;
grant select,insert on public.pw_projects to authenticated;
grant select on public.pw_proofs,public.pw_orders to authenticated;
grant insert(workspace_id,project_id,version,note) on public.pw_proofs to authenticated;
grant select,insert on public.pw_orders to service_role;
grant update(design) on public.pw_projects to authenticated;
grant update(status) on public.pw_orders to authenticated;
create policy pw_workspaces_read on public.pw_workspaces for select to authenticated using(pw_private.has_role(id));
create policy pw_workspaces_create on public.pw_workspaces for insert to authenticated with check(owner_id=(select auth.uid()));
create policy pw_workspaces_edit on public.pw_workspaces for update to authenticated using(pw_private.has_role(id,array['owner','admin'])) with check(pw_private.has_role(id,array['owner','admin']));
create policy pw_members_read on public.pw_members for select to authenticated using(pw_private.has_role(workspace_id));
create policy pw_projects_read on public.pw_projects for select to authenticated using(pw_private.has_role(workspace_id));
create policy pw_projects_create on public.pw_projects for insert to authenticated with check(pw_private.has_role(workspace_id,array['owner','admin','designer']) and created_by=(select auth.uid()));
create policy pw_projects_edit on public.pw_projects for update to authenticated using(pw_private.has_role(workspace_id,array['owner','admin','designer'])) with check(pw_private.has_role(workspace_id,array['owner','admin','designer']));
create policy pw_revisions_read on public.pw_revisions for select to authenticated using(pw_private.has_role(workspace_id));
create policy pw_proofs_read on public.pw_proofs for select to authenticated using(pw_private.has_role(workspace_id));
create policy pw_proofs_create on public.pw_proofs for insert to authenticated with check(pw_private.has_role(workspace_id,array['owner','admin','designer']) and approved_by=(select auth.uid()) and exists(select 1 from public.pw_revisions r where r.project_id=pw_proofs.project_id and r.version=pw_proofs.version and r.workspace_id=pw_proofs.workspace_id));
create policy pw_orders_read on public.pw_orders for select to authenticated using(pw_private.has_role(workspace_id));
create policy pw_orders_create on public.pw_orders for insert to authenticated with check(pw_private.has_role(workspace_id,array['owner','admin','designer','operator']) and created_by=(select auth.uid()));
create policy pw_orders_edit on public.pw_orders for update to authenticated using(pw_private.has_role(workspace_id,array['owner','admin','operator'])) with check(pw_private.has_role(workspace_id,array['owner','admin','operator']));
create policy pw_events_read on public.pw_order_events for select to authenticated using(pw_private.has_role(workspace_id));

-- Immutable, private artwork. Team membership controls read and upload access.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('presswerk-artwork','presswerk-artwork',false,12582912,array['image/png','image/jpeg','image/webp']);
create policy pw_artwork_read on storage.objects for select to authenticated using(bucket_id='presswerk-artwork' and pw_private.has_role((storage.foldername(name))[1]::uuid));
create policy pw_artwork_upload on storage.objects for insert to authenticated with check(bucket_id='presswerk-artwork' and pw_private.has_role((storage.foldername(name))[1]::uuid,array['owner','admin','designer']));

-- Bounded AI requests. The browser cannot reset usage counters.
create table pw_private.ai_usage(user_id uuid not null references auth.users(id),day date not null,requests integer not null default 0,primary key(user_id,day));
revoke all on pw_private.ai_usage from public,anon,authenticated;
create function pw_private.consume_ai(w uuid) returns integer language plpgsql security definer set search_path='' as $$
declare count_used integer;
begin
  if auth.uid() is null or not pw_private.has_role(w,array['owner','admin','designer']) then raise exception 'Workspace access required'; end if;
  insert into pw_private.ai_usage(user_id,day,requests) values(auth.uid(),current_date,1)
  on conflict(user_id,day) do update set requests=pw_private.ai_usage.requests+1 where pw_private.ai_usage.requests<30 returning requests into count_used;
  if count_used is null then raise exception 'Daily AI request allowance reached'; end if;
  return 30-count_used;
end $$;
revoke all on function pw_private.consume_ai(uuid) from public;
grant execute on function pw_private.consume_ai(uuid) to authenticated;
create function public.pw_consume_ai(workspace_id uuid) returns integer language sql security invoker set search_path='' as $$select pw_private.consume_ai(workspace_id)$$;
revoke all on function public.pw_consume_ai(uuid) from public;
grant execute on function public.pw_consume_ai(uuid) to authenticated;
commit;
