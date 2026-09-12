import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {initialDesign} from '../lib/presswerk/catalog.ts';
import * as configRoute from '../../../pages/api/print/config.ts';
import * as statusRoute from '../../../pages/api/print/status.ts';
import * as catalogueRoute from '../../../pages/api/print/catalogue.ts';
import * as quoteRoute from '../../../pages/api/print/quote.ts';
import * as ordersRoute from '../../../pages/api/print/orders.ts';
import * as assistantRoute from '../../../pages/api/print/assistant.ts';
import * as platformRoute from '../../../pages/api/print/platform.ts';

const routes={config:configRoute,status:statusRoute,catalogue:catalogueRoute,quote:quoteRoute,orders:ordersRoute,assistant:assistantRoute,platform:platformRoute};
const readOnly=new Set(['config','status','catalogue']);
const names=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','AI_GATEWAY_API_KEY','AI_MODEL'];
const envNames=names.flatMap(name=>[name,'AVALON_PRINT_'+name]);
const previous=new Map(envNames.map(name=>[name,process.env[name]]));
const defaults={productId:'cards',quantity:500,tier:'Value',finish:'Standard',sides:1,city:'Calgary',shipping:0};
async function request(name,method,body,headers={}){
  const response={statusCode:200,headers:{},setHeader(key,value){this.headers[key.toLowerCase()]=value;},end(value){this.body=JSON.parse(value);this.ended=true;}};
  await routes[name].default({method,body,headers},response);
  assert.equal(response.ended,true,`${name} must finish its response`);
  assert.equal(response.headers['content-type'],'application/json');
  assert.equal(response.headers['cache-control'],'no-store');
  return response;
}

test('Print API methods, input validation, activation boundaries and isolated credentials',async()=>{
  const originalFetch=globalThis.fetch;
  let externalRequests=0;
  globalThis.fetch=async()=>{externalRequests++;throw Error('Unexpected external request in an API boundary test.');};
  try{
    for(const name of names){delete process.env['AVALON_PRINT_'+name];process.env[name]='legacy-agency-value';}
    for(const [name,route] of Object.entries(routes)){
      assert.equal(route.config.api.bodyParser.sizeLimit,'600kb');
      const allowed=readOnly.has(name)?'GET':'POST';
      const result=await request(name,allowed==='GET'?'POST':'GET',{});
      assert.equal(result.statusCode,405,name);
      assert.equal(result.headers.allow,allowed,name);
    }
    assert.deepEqual((await request('config','GET')).body,{cloud:null});
    assert.deepEqual((await request('status','GET')).body,{storage:false,ai:false,orders:false,quoteApi:true,mode:'unconfigured',payments:false,productionConnections:false});
    const catalogue=await request('catalogue','GET');
    assert.equal(catalogue.statusCode,200);
    assert.equal(catalogue.body.products.length,51);
    assert.equal(catalogue.body.currency,'CAD');
    assert.equal((await request('quote','POST',defaults)).body.subtotal,29.95);
    const specialist=await request('quote','POST',{...defaults,productId:'box'});
    assert.equal(specialist.body.status,'quote_required');
    assert.equal(specialist.body.estimate,null);
    for(const invalid of ['{broken','null','[]','"text"',null,[],{...defaults,quantity:0},{...defaults,shipping:-1},{...defaults,productId:'missing'}]){
      assert.equal((await request('quote','POST',invalid)).statusCode,400);
    }
    assert.equal((await request('quote','POST',{...defaults,padding:'😀'.repeat(150001)})).statusCode,400,'UTF-8 body size is bounded');
    for(const name of ['orders','assistant','platform'])assert.equal((await request(name,'POST',{})).statusCode,503,name);
    process.env.AVALON_PRINT_SUPABASE_URL='https://print-workspace.example.test';
    process.env.AVALON_PRINT_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test_print';
    process.env.AVALON_PRINT_SUPABASE_SECRET_KEY='server-only-print-secret';
    const configured=await request('config','GET');
    assert.deepEqual(configured.body,{cloud:{url:'https://print-workspace.example.test',publishableKey:'sb_publishable_test_print'}});
    assert.doesNotMatch(JSON.stringify(configured.body),/server-only|legacy-agency/);
    assert.equal((await request('orders','POST',{})).statusCode,401,'Cloud orders require a user token');
    assert.equal((await request('platform','POST',{})).statusCode,401,'Platform requires its scoped API key');
    assert.equal((await request('assistant','POST',{})).statusCode,503,'Agency AI config cannot activate print AI');
    process.env.AVALON_PRINT_AI_GATEWAY_API_KEY='server-only-print-ai';
    process.env.AVALON_PRINT_AI_MODEL='test/provider-model';
    assert.equal((await request('assistant','POST',{})).statusCode,401,'Activated AI still requires authentication');
    assert.equal(externalRequests,0,'Disabled or unauthenticated requests never reach external services');
  }finally{
    globalThis.fetch=originalFetch;
    for(const [name,value] of previous){if(value===undefined)delete process.env[name];else process.env[name]=value;}
  }
});

test('Production API validates both print faces before using the privileged order service',async()=>{
  const originalFetch=globalThis.fetch;
  const savedEnv=new Map(envNames.map(name=>[name,process.env[name]]));
  const userId=randomUUID(),workspaceId=randomUUID(),projectId=randomUUID();
  const design={...initialDesign(),id:projectId,sides:2,back:{background:'#ffffff',layers:[{...initialDesign().layers[0],text:'Reverse artwork'}]}};
  let revision=design,insertions=0;
  const json=value=>new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
  globalThis.fetch=async(input,options={})=>{
    const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
    assert.equal(url.origin,'https://print-workspace.example.test');
    if(url.pathname==='/auth/v1/user')return json({id:userId,email:'designer@example.test'});
    if(url.pathname==='/rest/v1/pw_members')return json({role:'designer'});
    if(url.pathname==='/rest/v1/pw_revisions')return json({design:revision});
    if(url.pathname==='/rest/v1/pw_orders'){
      if(options.method==='POST'){insertions++;return json({id:randomUUID(),...JSON.parse(options.body)});}
      return json(null);
    }
    throw Error('Unexpected mocked endpoint: '+url.pathname);
  };
  try{
    process.env.AVALON_PRINT_SUPABASE_URL='https://print-workspace.example.test';
    process.env.AVALON_PRINT_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test_print';
    process.env.AVALON_PRINT_SUPABASE_SECRET_KEY='server-only-print-secret';
    const submit=()=>request('orders','POST',{workspaceId,projectId,version:1,idempotencyKey:randomUUID()},{authorization:'Bearer test-user-token'});
    for(const [value,message] of [
      [{...design,back:undefined},/reverse artwork/],
      [{...design,back:{...design.back,layers:[]}},/reverse artwork/],
      [{...design,back:{...design.back,layers:[{...design.back.layers[0],text:' \n\t '}]}},/reverse artwork/],
      [{...design,back:{...design.back,layers:[{...design.back.layers[0],opacity:0}]}},/reverse artwork/],
      [{...design,productId:'tee'},/does not support/],
      [{...design,layers:[]},/front artwork/],
      [{...design,back:{background:'#ffffff',layers:'invalid'}},/layers/]
    ]){
      revision=value;
      const response=await submit();
      assert.equal(response.statusCode,400);
      assert.match(response.body.error,message);
      assert.equal(insertions,0,'Invalid artwork must never reach the privileged order insert');
    }
    revision=design;
    assert.equal((await submit()).statusCode,201);
    assert.equal(insertions,1,'Supported two-sided artwork reaches the order service');
    revision={...design,sides:1,back:undefined};
    assert.equal((await submit()).statusCode,201);
    assert.equal(insertions,2,'Legacy single-sided artwork remains supported');
  }finally{
    globalThis.fetch=originalFetch;
    for(const [name,value] of savedEnv){if(value===undefined)delete process.env[name];else process.env[name]=value;}
  }
});
