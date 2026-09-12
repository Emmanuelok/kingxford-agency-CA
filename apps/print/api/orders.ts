import type {ServerResponse} from 'node:http';
import {z} from 'zod';
import {authenticated,privileged,bodyOf,json,failure,methodNotAllowed,type Request} from '../lib/presswerk/server.ts';
import {calculateQuote} from '../lib/presswerk/catalog.ts';
import {designSchema} from '../lib/presswerk/cloud.ts';
const orderSchema=z.object({workspaceId:z.string().uuid(),projectId:z.string().uuid(),version:z.number().int().positive(),idempotencyKey:z.string().uuid()});
export default async function handler(req:Request,res:ServerResponse){
  if(req.method!=='POST')return methodNotAllowed(res,'POST','Use POST to create a production request.');
  try{
    const {db,user}=await authenticated(req);const input=orderSchema.parse(bodyOf(req));
    const membership=await db.from('pw_members').select('role').eq('workspace_id',input.workspaceId).eq('user_id',user.id).single();
    if(membership.error||!['owner','admin','designer','operator'].includes(membership.data?.role))return json(res,403,{error:'Your workspace role cannot create production requests.'});
    const existing=await db.from('pw_orders').select('*').eq('workspace_id',input.workspaceId).eq('idempotency_key',input.idempotencyKey).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data){if(existing.data.project_id!==input.projectId||existing.data.version!==input.version)return json(res,409,{error:'Idempotency key was already used for another artwork revision.'});return json(res,200,{order:existing.data});}
    const {data:revision,error}=await db.from('pw_revisions').select('design').eq('workspace_id',input.workspaceId).eq('project_id',input.projectId).eq('version',input.version).single();
    if(error||!revision)return json(res,404,{error:'Artwork revision was not found in your workspace.'});
    const design=designSchema.parse(revision.design);const estimate={...calculateQuote({...design,shipping:0}),quantity:design.quantity,city:design.city,projectName:design.name};
    const {data:order,error:insertError}=await privileged().from('pw_orders').insert({workspace_id:input.workspaceId,project_id:input.projectId,version:input.version,idempotency_key:input.idempotencyKey,estimate,created_by:user.id}).select().single();
    if(insertError){if(insertError.code==='23505'){const retry=await db.from('pw_orders').select('*').eq('workspace_id',input.workspaceId).eq('idempotency_key',input.idempotencyKey).single();if(retry.data&&retry.data.project_id===input.projectId&&retry.data.version===input.version)return json(res,200,{order:retry.data});}throw insertError;}
    return json(res,201,{order,notice:'Production request saved. Estimates are non-binding; no payment or supplier order has been submitted.'});
  }catch(e){failure(res,e);}
}
