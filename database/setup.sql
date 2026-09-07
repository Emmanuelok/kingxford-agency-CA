-- Reviewed setup proposal for a dedicated Avalon Supabase project.
-- Existing KINGXFORD table, RPC, schema and entitlement names are intentionally
-- retained so that a visual rebrand does not orphan data or revoke accounts.
-- Not applied automatically. Run once on the selected project, then verify RLS
-- using two separate invited accounts before enabling cloud or AI in production.
begin;

create table if not exists public.kingxford_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 2500000),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.kingxford_workspaces enable row level security;
revoke all on public.kingxford_workspaces from anon;
grant select,insert,update,delete on public.kingxford_workspaces to authenticated;
-- Trust only app_metadata assigned by the owner, never editable user_metadata.
-- Enforce entitlement in the Data API too, not just Next.js route handlers.
create policy kingxford_workspace_select on public.kingxford_workspaces for select to authenticated
  using ((select auth.uid()) = owner_id and (select auth.jwt())->'app_metadata'->>'kingxford_access' = 'true'
    and not coalesce((select auth.jwt())->>'is_anonymous','false')::boolean);
create policy kingxford_workspace_insert on public.kingxford_workspaces for insert to authenticated
  with check ((select auth.uid()) = owner_id and (select auth.jwt())->'app_metadata'->>'kingxford_access' = 'true'
    and not coalesce((select auth.jwt())->>'is_anonymous','false')::boolean);
create policy kingxford_workspace_update on public.kingxford_workspaces for update to authenticated
  using ((select auth.uid()) = owner_id and (select auth.jwt())->'app_metadata'->>'kingxford_access' = 'true'
    and not coalesce((select auth.jwt())->>'is_anonymous','false')::boolean)
  with check ((select auth.uid()) = owner_id and (select auth.jwt())->'app_metadata'->>'kingxford_access' = 'true'
    and not coalesce((select auth.jwt())->>'is_anonymous','false')::boolean);
create policy kingxford_workspace_delete on public.kingxford_workspaces for delete to authenticated
  using ((select auth.uid()) = owner_id and (select auth.jwt())->'app_metadata'->>'kingxford_access' = 'true'
    and not coalesce((select auth.jwt())->>'is_anonymous','false')::boolean);

create schema if not exists kingxford_private;
revoke all on schema kingxford_private from public,anon;
grant usage on schema kingxford_private to authenticated;
create table if not exists kingxford_private.agent_quota (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  utc_day date not null,
  requests integer not null default 0,
  last_request timestamptz not null default '-infinity'
);
alter table kingxford_private.agent_quota enable row level security;
revoke all on kingxford_private.agent_quota from public,anon,authenticated;

-- Deliberately private SECURITY DEFINER boundary: callers cannot modify quota.
-- Identity is obtained from verified auth context, never a client-supplied ID.
create or replace function kingxford_private.reserve_agent_run()
returns boolean language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); day_key date := (now() at time zone 'UTC')::date; reserved uuid;
begin
  if caller is null or coalesce(auth.jwt()->>'is_anonymous','false')::boolean
    or not coalesce((auth.jwt()->'app_metadata'->>'kingxford_access')::boolean,false) then
    raise exception 'An invited authenticated account is required';
  end if;
  insert into kingxford_private.agent_quota (owner_id,utc_day,requests,last_request)
  values(caller,day_key,1,now())
  on conflict(owner_id) do update
  set utc_day=excluded.utc_day,
      requests=case when kingxford_private.agent_quota.utc_day=day_key then kingxford_private.agent_quota.requests+1 else 1 end,
      last_request=now()
  where (kingxford_private.agent_quota.utc_day<>day_key or kingxford_private.agent_quota.requests<20)
    and kingxford_private.agent_quota.last_request < now()-interval '5 seconds'
  returning owner_id into reserved;
  return reserved is not null;
end;
$$;
revoke all on function kingxford_private.reserve_agent_run() from public,anon;
grant execute on function kingxford_private.reserve_agent_run() to authenticated;
create or replace function public.kingxford_reserve_agent_run()
returns boolean language sql security invoker set search_path = '' as $$
  select kingxford_private.reserve_agent_run();
$$;
revoke all on function public.kingxford_reserve_agent_run() from public,anon;
grant execute on function public.kingxford_reserve_agent_run() to authenticated;
commit;
