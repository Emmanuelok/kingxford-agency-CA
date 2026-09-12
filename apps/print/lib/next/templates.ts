import { initialDesign, products, type Design, type DesignLayer } from '../presswerk/catalog.ts';
import type { BrandKit } from './types.ts';

export const designTemplates = [
  {id:'atelier', name:'The independent', category:'Brand essentials', background:'#193d34', foreground:'#e7efce', accent:'#d8ed80', font:'Arial', title:'Considered.\nCrafted.\nYours.', product:'cards'},
  {id:'linen', name:'Quiet luxury', category:'Brand essentials', background:'#f1eee5', foreground:'#30362d', accent:'#c5bba4', font:'Georgia', title:'A little\nextraordinary.', product:'cards'},
  {id:'electric', name:'New energy', category:'Events & launches', background:'#d8ed80', foreground:'#1c3024', accent:'#97b264', font:'Arial', title:'GOOD\nTHINGS\nAHEAD.', product:'poster'},
  {id:'gallery', name:'Gallery opening', category:'Events & launches', background:'#ede9e2', foreground:'#342e29', accent:'#a6aba0', font:'Georgia', title:'Objects\n& ideas.', product:'poster'},
  {id:'terra', name:'Earth & form', category:'Retail & hospitality', background:'#a65339', foreground:'#fff0df', accent:'#dca278', font:'Georgia', title:'Made with\nintention.', product:'menu'},
  {id:'mono', name:'Studio essentials', category:'Brand essentials', background:'#232824', foreground:'#f7f5ed', accent:'#718275', font:'Arial', title:'FORM\nFOLLOWS\nFEELING.', product:'tee'},
  {id:'coffee', name:'The daily ritual', category:'Retail & hospitality', background:'#eee0c8', foreground:'#45352b', accent:'#c08651', font:'Georgia', title:'Good mornings\nstart here.', product:'mug'},
  {id:'launch', name:'Something new', category:'Events & launches', background:'#34355c', foreground:'#f6f1e7', accent:'#a6a7d2', font:'Arial', title:'MEET YOUR\nNEXT FAVOURITE.', product:'brochure'},
  {id:'bloom', name:'In full bloom', category:'Retail & hospitality', background:'#eacbc4', foreground:'#67392f', accent:'#b77365', font:'Georgia', title:'A beautiful\nnew beginning.', product:'invitation'},
  {id:'outdoor', name:'Outside together', category:'Merch & apparel', background:'#d8dfd3', foreground:'#244137', accent:'#809c83', font:'Arial', title:'GO\nSOMEWHERE\nGOOD.', product:'tote'},
  {id:'signal', name:'Make an entrance', category:'Events & launches', background:'#efeee9', foreground:'#202922', accent:'#cadb7a', font:'Arial', title:'YOUR NEXT\nCHAPTER\nSTARTS HERE.', product:'banner'},
  {id:'signature', name:'The signature', category:'Merch & apparel', background:'#192e2b', foreground:'#ede6d8', accent:'#a8b79c', font:'Georgia', title:'Everyday,\nelevated.', product:'hoodie'},
] as const;

export function makeTemplate(id:string,productId?:string,brand?:BrandKit,headline?:string):Design {
  const template = designTemplates.find(t=>t.id===id) || designTemplates[0];
  const product = products.find(p=>p.id===(productId || template.product)) || products[0];
  const design = initialDesign(product.id);
  const portrait = product.height > product.width;
  const title=(headline || template.title).trim().slice(0,100);
  const longest=Math.max(...title.split('\n').map(s=>s.length));
  const textSize=Math.min(portrait?10:12,75/(Math.max(1,longest)*.65));
  const main=brand?.primary||template.background;
  const foreground=brand ? contrastingInk(main) : template.foreground;
  const accent=brand?.accent||template.accent;
  const layers:DesignLayer[]=[
    {id:crypto.randomUUID(),type:'shape',text:'',x:7,y:9,size:5,color:accent,rotation:0,opacity:1,width:portrait?18:8,height:portrait?2:3},
    {id:crypto.randomUUID(),type:'text',text:title,x:7,y:portrait?30:27,size:textSize,color:foreground,rotation:0,opacity:1,font:brand?.font||template.font,weight:template.font==='Georgia'?400:700},
    {id:crypto.randomUUID(),type:'text',text:(brand?.name||'AVALON STUDIO').toUpperCase(),x:7,y:portrait?78:80,size:portrait?3:2.4,color:foreground,rotation:0,opacity:1,font:'Arial',weight:600},
    {id:crypto.randomUUID(),type:'text',text:brand?.tagline||'DESIGN WITH INTENTION.',x:7,y:portrait?84:87,size:portrait?2.2:1.8,color:foreground,rotation:0,opacity:.7,font:'Arial',weight:400},
  ];
  return {...design,name:template.name+' · '+product.name,background:main,layers};
}

export function contrastingInk(hex:string){
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  return rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>.58?'#1b2822':'#fffdf4';
}
