-- Team invitations and revocable developer keys. Apply after schema.sql.
begin;
create table pw_private.invites(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.pw_workspaces(id),email text not null,role text not null check(role in ('admin','designer','operator','viewer')),token_hash text not null unique,expires_at timestamptz not null default now()+interval '7 days',accepted_at timestamptz,created_by uuid not null references auth.users(id));
create table pw_private.api_keys(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.pw_workspaces(id),label text not null check(length(label) between 1 and 80),prefix text not null,key_hash text not null unique,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),revoked_at timestamptz,day date not null default current_date,requests integer not null default 0);
revoke all on pw_private.invites,pw_private.api_keys from public,anon,authenticated;
create function pw_private.team_action(w uuid,action text,email text default '',member_role text default 'viewer',token text default '',member uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare secret text; invitation pw_private.invites; result jsonb; account_email text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if action='accept' then
    select u.email into account_email from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null;
    select * into invitation from pw_private.invites i where i.token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') and i.accepted_at is null and i.expires_at>now() for update;
    if invitation.id is null or account_email is null or lower(account_email)<>invitation.email then raise exception 'Invitation is invalid, expired or addressed to another account'; end if;
    if not exists(select 1 from public.pw_members m where m.workspace_id=invitation.workspace_id and m.user_id=invitation.created_by and (m.role='owner' or (m.role='admin' and invitation.role<>'admin'))) then raise exception 'Invitation issuer is no longer an administrator'; end if;
    insert into public.pw_members(workspace_id,user_id,role) values(invitation.workspace_id,auth.uid(),invitation.role) on conflict(workspace_id,user_id) do nothing;
    update pw_private.invites set accepted_at=now() where id=invitation.id;
    return jsonb_build_object('workspaceId',invitation.workspace_id);
  end if;
  if not pw_private.has_role(w,array['owner','admin']) then raise exception 'Workspace administrator required'; end if;
  if action='list' then
    select coalesce(jsonb_agg(jsonb_build_object('userId',m.user_id,'role',m.role,'email',u.email)),'[]') into result from public.pw_members m join auth.users u on u.id=m.user_id where m.workspace_id=w;
    return result;
  elsif action='invite' then
    if member_role not in ('admin','designer','operator','viewer') or email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(email)>254 then raise exception 'Enter a valid email and role'; end if;
    if member_role='admin' and not pw_private.has_role(w,array['owner']) then raise exception 'Only the owner can invite administrators'; end if;
    secret:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
    insert into pw_private.invites(workspace_id,email,role,token_hash,created_by) values(w,lower(email),member_role,encode(sha256(convert_to(secret,'UTF8')),'hex'),auth.uid());
    return jsonb_build_object('token',secret,'expiresInDays',7);
  elsif action='remove' then
    if member=auth.uid() or exists(select 1 from public.pw_members m where m.workspace_id=w and m.user_id=member and (m.role='owner' or (m.role='admin' and not pw_private.has_role(w,array['owner'])))) then raise exception 'This member cannot be removed by your account'; end if;
    delete from public.pw_members where workspace_id=w and user_id=member;
    delete from pw_private.invites where workspace_id=w and created_by=member and accepted_at is null;
    return jsonb_build_object('removed',true);
  end if;
  raise exception 'Unknown team operation';
end $$;
revoke all on function pw_private.team_action(uuid,text,text,text,text,uuid) from public;
grant execute on function pw_private.team_action(uuid,text,text,text,text,uuid) to authenticated;
create function public.pw_team(workspace_id uuid,action text,email text default '',member_role text default 'viewer',token text default '',member uuid default null) returns jsonb language sql security invoker set search_path='' as $$select pw_private.team_action(workspace_id,action,email,member_role,token,member)$$;
revoke all on function public.pw_team(uuid,text,text,text,text,uuid) from public;
grant execute on function public.pw_team(uuid,text,text,text,text,uuid) to authenticated;

create function pw_private.manage_keys(w uuid,action text,label text default '',key_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare secret text; result jsonb;
begin
  if auth.uid() is null or not pw_private.has_role(w,array['owner','admin']) then raise exception 'Workspace administrator required'; end if;
  if action='create' then
    if length(label) not between 1 and 80 then raise exception 'Enter a key name'; end if;
    if (select count(*) from pw_private.api_keys k where k.workspace_id=w and k.revoked_at is null)>=10 then raise exception 'Revoke an unused key before creating another'; end if;
    secret:='pw_live_'||replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
    insert into pw_private.api_keys(workspace_id,label,prefix,key_hash,created_by) values(w,label,left(secret,16),encode(sha256(convert_to(secret,'UTF8')),'hex'),auth.uid());
    return jsonb_build_object('key',secret);
  elsif action='revoke' then
    update pw_private.api_keys k set revoked_at=now() where k.id=key_id and k.workspace_id=w;
    return jsonb_build_object('revoked',true);
  elsif action='list' then
    select coalesce(jsonb_agg(jsonb_build_object('id',k.id,'label',k.label,'prefix',k.prefix,'createdAt',k.created_at,'revokedAt',k.revoked_at,'requestsToday',case when k.day=current_date then k.requests else 0 end)),'[]') into result from pw_private.api_keys k where k.workspace_id=w;
    return result;
  end if;
  raise exception 'Unknown key operation';
end $$;
revoke all on function pw_private.manage_keys(uuid,text,text,uuid) from public;
grant execute on function pw_private.manage_keys(uuid,text,text,uuid) to authenticated;
create function public.pw_keys(workspace_id uuid,action text,label text default '',key_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$select pw_private.manage_keys(workspace_id,action,label,key_id)$$;
revoke all on function public.pw_keys(uuid,text,text,uuid) from public;
grant execute on function public.pw_keys(uuid,text,text,uuid) to authenticated;

-- Deliberate capability endpoint: a valid secret key is the principal here.
-- It cannot mutate orders or expose artwork; only catalogue/quote authorization and a scoped order list.
create function pw_private.platform_request(token text,operation text) returns jsonb language plpgsql security definer set search_path='' as $$
declare k pw_private.api_keys; result jsonb;
begin
  if length(token)<>72 or operation not in ('quote','catalogue','orders') then raise exception 'Invalid API request'; end if;
  select * into k from pw_private.api_keys a where a.key_hash=encode(sha256(convert_to(token,'UTF8')),'hex') and a.revoked_at is null for update;
  if k.id is null or not exists(select 1 from public.pw_members m where m.workspace_id=k.workspace_id and m.user_id=k.created_by and m.role in ('owner','admin')) then raise exception 'API key is invalid or revoked'; end if;
  if k.day=current_date and k.requests>=1000 then raise exception 'Daily API request allowance reached'; end if;
  update pw_private.api_keys set day=current_date,requests=case when k.day=current_date then k.requests+1 else 1 end where id=k.id;
  if operation='orders' then
    select coalesce(jsonb_agg(to_jsonb(o)),'[]') into result from (select id,project_id,version,status,created_at,estimate from public.pw_orders where workspace_id=k.workspace_id order by created_at desc limit 100) o;
    return jsonb_build_object('orders',result);
  end if;
  return jsonb_build_object('authorized',true,'workspaceId',k.workspace_id);
end $$;
revoke all on function pw_private.platform_request(text,text) from public;
grant usage on schema pw_private to anon;
grant execute on function pw_private.platform_request(text,text) to anon,authenticated;
create function public.pw_platform_request(token text,operation text) returns jsonb language sql security invoker set search_path='' as $$select pw_private.platform_request(token,operation)$$;
revoke all on function public.pw_platform_request(text,text) from public;
grant execute on function public.pw_platform_request(text,text) to anon,authenticated;
commit;
