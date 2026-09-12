import type {Design} from './catalog';
function canonical(value:unknown):unknown{if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));return value;}
export function designFingerprint(d:Design){const {version,updatedAt,...rest}=d;return JSON.stringify(canonical({...rest,layers:d.layers.map(({assetPath,...layer})=>layer)}));}
