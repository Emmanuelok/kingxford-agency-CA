import {createClient} from '@supabase/supabase-js';
import type {IncomingMessage,ServerResponse} from 'node:http';
export type Request=IncomingMessage & {body?:unknown};
export function json(res:ServerResponse,status:number,body:unknown){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
export function methodNotAllowed(res:ServerResponse,method:'GET'|'POST',message=`Use ${method}`){res.setHeader('Allow',method);return json(res,405,{error:message});}
export function publicConfig(){return{url:process.env.AVALON_PRINT_SUPABASE_URL||'',publishableKey:process.env.AVALON_PRINT_SUPABASE_PUBLISHABLE_KEY||''};}
export function configured(){const c=publicConfig();return !!(c.url&&c.publishableKey);}
export function privileged(){if(!process.env.AVALON_PRINT_SUPABASE_SECRET_KEY)throw Object.assign(Error('Order service is awaiting activation.'),{status:503});return createClient(publicConfig().url,process.env.AVALON_PRINT_SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function authenticated(req:Request){
  if(!configured())throw Object.assign(Error('Account service is awaiting activation.'),{status:503});
  const token=req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
  if(!token)throw Object.assign(Error('Sign in to continue.'),{status:401});
  const c=publicConfig();const db=createClient(c.url,c.publishableKey,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.auth.getUser(token);
  if(error||!data.user)throw Object.assign(Error('Your session has expired. Sign in again.'),{status:401});
  return{db,user:data.user};
}
export function bodyOf(req:Request){const text=typeof req.body==='string'?req.body:JSON.stringify(req.body??{});if(Buffer.byteLength(text,'utf8')>600000)throw Error('Request is too large.');const body=JSON.parse(text);if(!body||typeof body!=='object'||Array.isArray(body))throw Error('A JSON object is required.');return body;}
export function failure(res:ServerResponse,e:unknown){const error=e as Error & {status?:number};json(res,error.status||400,{error:error.message||'Request could not be completed.'});}
