import type {IncomingMessage,ServerResponse} from 'node:http';
import {configured,json,methodNotAllowed} from '../lib/presswerk/server.ts';
export default function handler(req:IncomingMessage,res:ServerResponse){if(req.method!=='GET')return methodNotAllowed(res,'GET');json(res,200,{storage:configured(),ai:configured()&&!!process.env.AVALON_PRINT_AI_GATEWAY_API_KEY&&!!process.env.AVALON_PRINT_AI_MODEL,orders:configured()&&!!process.env.AVALON_PRINT_SUPABASE_SECRET_KEY,quoteApi:true,mode:configured()?'cloud':'unconfigured',payments:false,productionConnections:false});}
