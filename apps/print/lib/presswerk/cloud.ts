import {createClient, type SupabaseClient, type Session} from '@supabase/supabase-js';
import {z} from 'zod';
import {calculateQuote, products, type Design, type DesignLayer} from './catalog.ts';

export type CloudConfig={url:string;publishableKey:string};
export type Brand={name:string;tagline:string;primary:string;secondary:string;accent:string;font:string};
export type Workspace={id:string;name:string;owner_id:string;brand:Brand};
export type CloudOrder={id:string;workspace_id:string;project_id:string;version:number;status:string;created_at:string;estimate:ReturnType<typeof calculateQuote> & {quantity:number;city:string;projectName:string};artwork?:Design};
export type Role='owner'|'admin'|'designer'|'operator'|'viewer';
export const brandSchema=z.object({name:z.string().min(1).max(60),tagline:z.string().max(100),primary:z.string().regex(/^#[0-9a-f]{6}$/i),secondary:z.string().regex(/^#[0-9a-f]{6}$/i),accent:z.string().regex(/^#[0-9a-f]{6}$/i),font:z.enum(['Arial','Georgia','Verdana','Courier New'])});
export const imageCropSchema=z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1),width:z.number().min(.001).max(1),height:z.number().min(.001).max(1)}).strict().refine(crop=>crop.x+crop.width<=1+1e-9&&crop.y+crop.height<=1+1e-9,'The crop must remain within the original image.');
const layerSchema=z.object({id:z.string().min(1).max(80),type:z.enum(['text','image','shape']),text:z.string().max(10000),x:z.number().min(0).max(100),y:z.number().min(0).max(100),size:z.number().min(.01).max(50),color:z.string().regex(/^#[0-9a-f]{6}$/i),rotation:z.number().min(-360).max(360),opacity:z.number().min(0).max(1),src:z.string().max(17000000).optional(),assetPath:z.string().max(200).optional(),width:z.number().positive().max(100).optional(),height:z.number().positive().max(100).optional(),font:z.enum(['Arial','Georgia','Verdana','Courier New']).optional(),weight:z.number().int().min(100).max(900).optional(),naturalWidth:z.number().int().positive().max(60000).optional(),naturalHeight:z.number().int().positive().max(60000).optional(),crop:imageCropSchema.optional()}).refine(layer=>!layer.crop||layer.type==='image','Only images can have a crop.');
const faceLayersSchema=z.array(layerSchema).max(100).refine(layers=>new Set(layers.map(layer=>layer.id)).size===layers.length,'Each print face needs unique layer identifiers.');
const designFaceSchema=z.object({background:z.string().regex(/^#[0-9a-f]{6}$/i),layers:faceLayersSchema});
export const designSchema=z.object({id:z.string().uuid(),name:z.string().min(1).max(80),productId:z.string().refine(id=>products.some(p=>p.id===id)),background:z.string().regex(/^#[0-9a-f]{6}$/i),layers:faceLayersSchema,back:designFaceSchema.optional(),quantity:z.number().int().min(1).max(100000),tier:z.enum(['Value','Design Plus','Priority']),finish:z.string(),sides:z.number().int().min(1).max(2),city:z.string().min(1).max(100),imageWidth:z.number().positive().optional(),imageHeight:z.number().positive().optional(),version:z.number().int().min(1),updatedAt:z.string().refine(s=>Number.isFinite(Date.parse(s)))});
let client:SupabaseClient|null=null;
export function connectCloud(config:CloudConfig){
  if(!/^https:\/\//.test(config.url)||!config.publishableKey)throw Error('Account service is not configured.');
  client??=createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
  return client;
}
export function cloud(){if(!client)throw Error('Cloud workspace is awaiting activation.');return client;}
function check(error:{message:string}|null){if(error)throw Error(error.message);}
export async function authHeaders():Promise<Record<string,string>>{const {data,error}=await cloud().auth.getSession();check(error);if(!data.session)throw Error('Sign in to continue.');return{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'};}
export async function listWorkspaces(){const {data,error}=await cloud().from('pw_workspaces').select('*').order('created_at');check(error);return(data||[]) as Workspace[];}
export async function createWorkspace(name:string,userId:string){const {data,error}=await cloud().from('pw_workspaces').insert({name,owner_id:userId}).select().single();check(error);return data as Workspace;}
const readBlob=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(Error('Artwork could not be read'));r.readAsDataURL(blob);});
export async function hydrateDesign(value:unknown){
  const d=designSchema.parse(value) as Design;
  const hydrateLayers=(layers:DesignLayer[])=>Promise.all(layers.map(async l=>{if(!l.assetPath)return l;const {data,error}=await cloud().storage.from('presswerk-artwork').download(l.assetPath);check(error);if(!data)throw Error('Artwork is missing.');return{...l,src:await readBlob(data)};}));
  const [layers,backLayers]=await Promise.all([hydrateLayers(d.layers),d.back?hydrateLayers(d.back.layers):undefined]);
  return{...d,layers,...(d.back&&backLayers?{back:{...d.back,layers:backLayers}}:{})};
}
export async function loadWorkspace(workspaceId:string,userId:string){
  const results=await Promise.all([
    cloud().from('pw_projects').select('design').eq('workspace_id',workspaceId).order('updated_at',{ascending:false}),
    cloud().from('pw_orders').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false}),
    cloud().from('pw_members').select('role').eq('workspace_id',workspaceId).eq('user_id',userId).single()
  ]);results.forEach(r=>check(r.error));
  const designs=await Promise.all((results[0].data||[]).map(row=>hydrateDesign(row.design)));
  if(!results[2].data)throw Error('Workspace membership was not found.');
  return{projects:designs,orders:(results[1].data||[]) as CloudOrder[],role:results[2].data.role as Role};
}
export async function saveCloudProject(workspaceId:string,design:Design,expectedVersion:number){
  const parsed=designSchema.parse(design) as Design;calculateQuote({...parsed,shipping:0});
  const storeLayers=(faceLayers:DesignLayer[])=>Promise.all(faceLayers.map(async l=>{
    if(l.type!=='image')return l;
    if(l.assetPath?.startsWith(workspaceId+'/')){const {src:_,...rest}=l;return rest;}
    if(!l.src||!/^data:image\/(png|jpeg|webp);base64,/.test(l.src))throw Error('Upload a supported artwork image first.');
    const blob=await(await fetch(l.src)).blob();if(blob.size>12582912)throw Error('Artwork files must be under 12MB.');
    const path=workspaceId+'/'+crypto.randomUUID()+'.'+(blob.type==='image/jpeg'?'jpg':blob.type.split('/')[1]);
    const {error}=await cloud().storage.from('presswerk-artwork').upload(path,blob,{contentType:blob.type,upsert:false});check(error);
    const {src:_,...rest}=l;return{...rest,assetPath:path};
  }));
  const [layers,backLayers]=await Promise.all([storeLayers(parsed.layers),parsed.back?storeLayers(parsed.back.layers):undefined]);
  const stored={...parsed,layers,...(parsed.back&&backLayers?{back:{...parsed.back,layers:backLayers}}:{})};
  const query=expectedVersion===0?cloud().from('pw_projects').insert({id:parsed.id,workspace_id:workspaceId,design:stored}):cloud().from('pw_projects').update({design:stored}).eq('id',parsed.id).eq('workspace_id',workspaceId).eq('version',expectedVersion);
  const {data,error}=await query.select('design').maybeSingle();check(error);
  if(!data)throw Error('This project changed in another session. Reload the workspace before saving.');
  const saved=designSchema.parse(data.design) as Design;
  const restoreSources=(layers:DesignLayer[],source:DesignLayer[])=>layers.map(l=>({...l,src:source.find(x=>x.id===l.id)?.src}));
  return {...saved,layers:restoreSources(saved.layers,parsed.layers),...(saved.back?{back:{...saved.back,layers:restoreSources(saved.back.layers,parsed.back?.layers||[])}}:{})};
}
export async function approveCloudProof(workspaceId:string,design:Design){const {data,error}=await cloud().from('pw_proofs').insert({workspace_id:workspaceId,project_id:design.id,version:design.version}).select().single();check(error);return data;}
export async function saveCloudBrand(workspaceId:string,brand:Brand){const value=brandSchema.parse(brand);const {data,error}=await cloud().from('pw_workspaces').update({brand:value}).eq('id',workspaceId).select('id').single();check(error);return data;}
export async function submitCloudOrder(workspaceId:string,design:Design,key:string){
  const response=await fetch('/api/print/orders',{method:'POST',headers:await authHeaders(),body:JSON.stringify({workspaceId,projectId:design.id,version:design.version,idempotencyKey:key})});
  const data=await response.json() as {error?:string;order:CloudOrder};if(!response.ok)throw Error(data.error||'The job could not be created.');return data.order;
}
export async function transitionOrder(workspaceId:string,id:string,from:string,to:string){const {data,error}=await cloud().from('pw_orders').update({status:to}).eq('workspace_id',workspaceId).eq('id',id).eq('status',from).select().maybeSingle();check(error);if(!data)throw Error('The job changed. Refresh the workspace.');return data as CloudOrder;}
export async function orderHistory(id:string){const {data,error}=await cloud().from('pw_order_events').select('*').eq('order_id',id).order('created_at');check(error);return data||[];}
export type {Session};
