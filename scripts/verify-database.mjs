import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Keep this PostgreSQL test runtime outside the application dependencies.
// Usage: node scripts/verify-database.mjs /absolute/path/to/test-runtime
const runtimeRoot = process.argv[2];
if (!runtimeRoot) {
  console.error("Provide the directory containing the scratch-only @electric-sql/pglite@0.5.8 installation. See docs/LAUNCH.md.");
  process.exit(1);
}
const { PGlite } = await import(pathToFileURL(resolve(runtimeRoot, "node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
const a = "11111111-1111-4111-8111-111111111111";
const b = "22222222-2222-4222-8222-222222222222";
const c = "33333333-3333-4333-8333-333333333333";
let assertions = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
const denied = async (sql, code = "42501") => {
  await assert.rejects(() => db.query(sql), (error) => error.code === code);
  assertions++;
};
async function identity(sub = a, access = true, anonymous = false, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub, is_anonymous: anonymous, app_metadata: { kingxford_access: access } })]);
  await db.exec(`set role ${role}`);
}
async function admin(sql) {
  await db.exec("reset role");
  return db.exec(sql);
}

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
    $$;
    create function auth.uid() returns uuid language sql stable as $$
      select (auth.jwt()->>'sub')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    insert into auth.users(id) values ('${a}'), ('${b}'), ('${c}');
  `);
  await db.exec(await readFile(new URL("../database/setup.sql", import.meta.url), "utf8"));

  await identity(a);
  check((await db.query(`insert into public.kingxford_workspaces(owner_id,payload) values ('${a}', '{"owner":"a"}') returning revision`)).rows, [{ revision: 1 }]);
  check((await db.query("select owner_id from public.kingxford_workspaces")).rows, [{ owner_id: a }]);
  await denied(`insert into public.kingxford_workspaces(owner_id,payload) values ('${b}', '{}')`);

  await identity(b);
  check((await db.query(`insert into public.kingxford_workspaces(owner_id,payload) values ('${b}', '{"owner":"b"}') returning revision`)).rows, [{ revision: 1 }]);
  check((await db.query("select owner_id from public.kingxford_workspaces")).rows, [{ owner_id: b }]);
  check((await db.query(`update public.kingxford_workspaces set revision=2 where owner_id='${a}' returning owner_id`)).rows, []);
  check((await db.query(`delete from public.kingxford_workspaces where owner_id='${a}' returning owner_id`)).rows, []);
  await denied(`update public.kingxford_workspaces set owner_id='${c}' where owner_id='${b}'`);

  await identity(a);
  check((await db.query(`update public.kingxford_workspaces set revision=2 where owner_id='${a}' and revision=1 returning revision`)).rows, [{ revision: 2 }]);
  check((await db.query(`update public.kingxford_workspaces set revision=3 where owner_id='${a}' and revision=1 returning revision`)).rows, []);
  await denied(`update public.kingxford_workspaces set payload='[]' where owner_id='${a}'`, "23514");
  await denied(`update public.kingxford_workspaces set revision=0 where owner_id='${a}'`, "23514");
  check((await db.query("select public.kingxford_reserve_agent_run() as allowed")).rows, [{ allowed: true }]);
  check((await db.query("select public.kingxford_reserve_agent_run() as allowed")).rows, [{ allowed: false }]);
  await denied("select * from kingxford_private.agent_quota");
  await denied("update kingxford_private.agent_quota set requests=0");
  await admin(`update kingxford_private.agent_quota set requests=19,last_request=now()-interval '10 seconds' where owner_id='${a}'`);
  await identity(a);
  check((await db.query("select public.kingxford_reserve_agent_run() as allowed")).rows, [{ allowed: true }]);
  await admin(`update kingxford_private.agent_quota set last_request=now()-interval '10 seconds' where owner_id='${a}'`);
  await identity(a);
  check((await db.query("select public.kingxford_reserve_agent_run() as allowed")).rows, [{ allowed: false }]);
  await admin(`update kingxford_private.agent_quota set utc_day=(now() at time zone 'UTC')::date-1,last_request=now()-interval '10 seconds' where owner_id='${a}'`);
  await identity(a);
  check((await db.query("select public.kingxford_reserve_agent_run() as allowed")).rows, [{ allowed: true }]);
  await identity(b);
  check((await db.query("select public.kingxford_reserve_agent_run() as allowed")).rows, [{ allowed: true }]);

  for (const [access, anonymous] of [[false, false], ["true", false], [null, false], [true, true]]) {
    await identity(a, access, anonymous);
    check((await db.query("select owner_id from public.kingxford_workspaces")).rows, []);
    await denied(`insert into public.kingxford_workspaces(owner_id,payload) values ('${c}', '{}')`);
    await denied("select public.kingxford_reserve_agent_run()", "P0001");
  }
  await identity(a, true, false, "anon");
  await denied("select * from public.kingxford_workspaces");
  await denied("select public.kingxford_reserve_agent_run()");

  await identity(a);
  check((await db.query(`delete from public.kingxford_workspaces where owner_id='${a}' returning owner_id`)).rows, [{ owner_id: a }]);
  await identity(b);
  check((await db.query("select owner_id from public.kingxford_workspaces")).rows, [{ owner_id: b }]);
  console.log(`PASS ${assertions} isolated PostgreSQL assertions: ownership, writes, strict entitlement, anonymous access, revisions, constraints, quota isolation, interval, cap and UTC rollover.`);
} finally {
  await db.close();
}
