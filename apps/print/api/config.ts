import type {IncomingMessage,ServerResponse} from 'node:http';
import {configured,publicConfig,json,methodNotAllowed} from '../lib/presswerk/server.ts';
export default function handler(req:IncomingMessage,res:ServerResponse){if(req.method!=='GET')return methodNotAllowed(res,'GET');json(res,200,{cloud:configured()?publicConfig():null});}
