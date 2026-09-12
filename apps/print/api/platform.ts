import {createClient} from '@supabase/supabase-js';
import type {ServerResponse} from 'node:http';
import {bodyOf,configured,publicConfig,json,failure,methodNotAllowed,type Request} from '../lib/presswerk/server.ts';
import {calculateQuote,products} from '../lib/presswerk/catalog.ts';
export default async function handler(req:Request,res:ServerResponse){
  if(req.method!=='POST')return methodNotAllowed(res,'POST','Use POST with operation catalogue, quote or orders.');
  try{
    if(!configured())return json(res,503,{error:'Developer API is awaiting activation.'});
    const token=req.headers.authorization?.match(/^Bearer (pw_live_[a-f0-9]{64})$/)?.[1];if(!token)return json(res,401,{error:'An Avalon Print API key is required.'});
    const body=bodyOf(req);if(!['catalogue','quote','orders'].includes(body.operation))return json(res,400,{error:'Unknown operation.'});
    const c=publicConfig();const db=createClient(c.url,c.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await db.rpc('pw_platform_request',{token,operation:body.operation});if(error)return json(res,error.message.includes('allowance')?429:403,{error:error.message});
    if(body.operation==='orders')return json(res,200,{apiVersion:'1.0',...data});
    if(body.operation==='catalogue')return json(res,200,{apiVersion:'1.0',currency:'CAD',products});
    const result=calculateQuote(body.specification);return json(res,200,{apiVersion:'1.0',estimate:result.quoteOnly?null:result,status:result.quoteOnly?'quote_required':'estimate'});
  }catch(e){failure(res,e);}
}
