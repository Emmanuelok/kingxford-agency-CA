import {products,categories} from '../lib/presswerk/catalog.ts';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {json,methodNotAllowed} from '../lib/presswerk/server.ts';
export default function handler(req:IncomingMessage,res:ServerResponse){if(req.method!=='GET')return methodNotAllowed(res,'GET');return json(res,200,{apiVersion:'1.0',currency:'CAD',priceStatus:'Proposed launch estimates',categories,products});}
