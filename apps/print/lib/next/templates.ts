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

// Layer font sizes are percentages of the physical width, while y positions are
// percentages of the height. Compose in millimetres first so a card, mug and tall
// banner all keep separate title and signature areas.
function lineWidth(text:string,font:string) {
  const estimated=Array.from(text).reduce((width,char)=>width+(font==='Courier New' ? .61 : /[MW@#%&]/.test(char) ? .98 : /[ilIjtf.,'!:;|]/.test(char) ? .38 : /\s/.test(char) ? .36 : /[A-Z]/.test(char) ? .79 : .69),0);
  return Math.max(estimated,text.length*.64);
}
function wrapText(text:string,font:string,size:number,width:number) {
  const lines:string[]=[];
  for(const paragraph of text.split('\n')) {
    let line='';
    for(const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      if(line && lineWidth(line+' '+word,font)*size>width) {lines.push(line);line='';}
      if(lineWidth(word,font)*size<=width) {line+=(line?' ':'')+word;continue;}
      // Preserve long custom words without letting them run through the trim.
      for(const char of Array.from(word)) {
        if(line && lineWidth(line+char,font)*size>width) {lines.push(line);line='';}
        line+=char;
      }
    }
    lines.push(line);
  }
  return lines;
}
function fitText(text:string,font:string,preferred:number,width:number,height:number,minimum:number) {
  // Excessive manual line breaks should reflow rather than create an unsaveable
  // layer below the shared schema's minimum size (1% of the artwork width).
  if(wrapText(text,font,minimum,width).length*minimum*1.1>height) text=text.replace(/\s+/g,' ');
  let low=minimum,high=Math.max(minimum,preferred);
  for(let i=0;i<30;i++) {
    const size=(low+high)/2;
    if(wrapText(text,font,size,width).length*size*1.1<=height) low=size;
    else high=size;
  }
  const lines=wrapText(text,font,low,width);
  return {text:lines.join('\n'),size:low,height:lines.length*low*1.1};
}

export function makeTemplate(id:string,productId?:string,brand?:BrandKit,headline?:string):Design {
  const template = designTemplates.find(t=>t.id===id) || designTemplates[0];
  const product = products.find(p=>p.id===(productId || template.product)) || products[0];
  const design = initialDesign(product.id);
  const {width,height}=product;
  const marginX=Math.max(3.3,width*.075),marginY=Math.max(3.3,height*.075);
  const availableWidth=width-marginX*2;
  const font=brand?.font||template.font;
  const title=(headline?.trim()||template.title).slice(0,100);
  const main=brand?.primary||template.background;
  const foreground=brand ? contrastingInk(main) : template.foreground;
  const accent=brand?.accent||template.accent;
  // The default signature stays above 6 pt even on a 50 × 25 mm label.
  // Unusually long custom copy is wrapped and fitted; preflight still reports
  // its actual physical type size if the supplied copy needs simplification.
  const signatureSize=Math.max(2.3,Math.min(width*.029,height*.035));
  const taglineSize=Math.max(2.2,signatureSize*.82);
  const name=fitText((brand?.name?.trim()||'AVALON STUDIO').toUpperCase(),'Arial',signatureSize,availableWidth,Math.max(2.6,height*.10),width*.01);
  const tagline=fitText(brand?.tagline?.trim()||'DESIGN WITH INTENTION.','Arial',taglineSize,availableWidth,Math.max(2.5,height*.08),width*.01);
  const signatureGap=Math.max(.9,height*.018);
  const taglineY=height-marginY-tagline.height;
  const nameY=taglineY-signatureGap-name.height;
  const markerY=Math.max(3.3,height*.09);
  const markerHeight=Math.max(.45,Math.min(width,height)*.018);
  const titleY=Math.max(height*.22,markerY+markerHeight+Math.max(1.5,height*.06));
  const titleBottom=nameY-Math.max(1.5,height*.065);
  const fitted=fitText(title,font,Math.min(width*.14,height*.16),availableWidth,titleBottom-titleY,width*.01);
  const textLayer=(text:string,y:number,size:number,textFont:string,weight:number):DesignLayer=>({id:crypto.randomUUID(),type:'text',text,x:marginX/width*100,y:y/height*100,size:size/width*100,color:foreground,rotation:0,opacity:1,font:textFont,weight});
  const layers:DesignLayer[]=[
    {id:crypto.randomUUID(),type:'shape',text:'Accent rule',x:marginX/width*100,y:markerY/height*100,size:5,color:accent,rotation:0,opacity:1,width:18,height:markerHeight/height*100},
    textLayer(fitted.text,titleY,fitted.size,font,font==='Georgia'?400:700),
    textLayer(name.text,nameY,name.size,'Arial',600),
    textLayer(tagline.text,taglineY,tagline.size,'Arial',400),
  ];
  return {...design,name:template.name+' · '+product.name,background:main,layers};
}

export function contrastingInk(hex:string){
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  return rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>.58?'#1b2822':'#fffdf4';
}
