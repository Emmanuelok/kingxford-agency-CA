import {calculateQuote} from '../lib/presswerk/catalog.ts';
import type {ServerResponse} from 'node:http';
import {bodyOf,json,failure,methodNotAllowed,type Request} from '../lib/presswerk/server.ts';

export default async function handler(req:Request,res:ServerResponse){
  if(req.method!=='POST')return methodNotAllowed(res,'POST','Use POST with a product specification.');
  try{
    const input=bodyOf(req) as Parameters<typeof calculateQuote>[0];
    const result=calculateQuote(input);
    if(result.quoteOnly)return json(res,200,{apiVersion:'1.0',status:'quote_required',product:result.product,quantity:input.quantity,currency:'CAD',estimate:null,notice:'Specialist quote required; no product price has been assigned.'});
    return json(res,200,{apiVersion:'1.0',...result,notice:'Planning estimate. No order created. Final material, finish, tax, delivery and capacity require confirmation.'});
  }catch(e){failure(res,e);}
}
