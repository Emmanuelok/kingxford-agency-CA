import { initialDesign, products, type Design, type DesignFace, type DesignLayer, type Product } from '../presswerk/catalog.ts';
import type { BrandKit } from './types.ts';

/** IDs are stable: saved campaigns and legacy template callers keep working. */
export const designTemplates = [
  {id:'atelier', name:'The independent', category:'Brand essentials', background:'#193d34', foreground:'#f4f1e6', accent:'#d8ed80', font:'Arial', title:'Your brand', product:'cards', layout:'identity', description:'A bold identity face paired with a complete contact reverse.'},
  {id:'linen', name:'Quiet luxury', category:'Brand essentials', background:'#f1eee5', foreground:'#30362d', accent:'#a39270', font:'Georgia', title:'Your name', product:'cards', layout:'editorial-card', description:'An understated personal card with an editorial name and contact grid.'},
  {id:'electric', name:'After hours', category:'Events & launches', background:'#d8ed80', foreground:'#17271e', accent:'#17271e', font:'Arial', title:'AFTER\nHOURS', product:'poster', layout:'event', description:'A concert poster with date, venue, programme and ticket details.'},
  {id:'gallery', name:'Gallery opening', category:'Events & launches', background:'#ede9e2', foreground:'#342e29', accent:'#a6543c', font:'Georgia', title:'Objects\n& ideas.', product:'poster', layout:'gallery', description:'A gallery announcement with a geometric artwork and exhibition information.'},
  {id:'terra', name:'The café menu', category:'Retail & hospitality', background:'#f4ecdf', foreground:'#573327', accent:'#a65339', font:'Georgia', title:'The daily menu', product:'menu', layout:'cafe', description:'Two menu columns with editable dishes, descriptions and price fields.'},
  {id:'mono', name:'Studio essentials', category:'Merch & apparel', background:'#f0ede3', foreground:'#232824', accent:'#232824', font:'Arial', title:'FORM\nFOLLOWS\nFEELING.', product:'tee', layout:'apparel', description:'A graphic typographic print with an editable geometric emblem.'},
  {id:'coffee', name:'The daily ritual', category:'Retail & hospitality', background:'#eee0c8', foreground:'#45352b', accent:'#9b6944', font:'Georgia', title:'Good mornings.', product:'mug', layout:'mug', description:'A wrap layout with a left-hand message and a separate right-hand maker mark.'},
  {id:'launch', name:'The product launch', category:'Events & launches', background:'#34355c', foreground:'#f6f1e7', accent:'#c5c3e8', font:'Arial', title:'Meet your\nnext favourite.', product:'brochure', layout:'launch', description:'A modular announcement with product benefits, supporting copy and a clear response.'},
  {id:'bloom', name:'The wedding suite', category:'Events & launches', background:'#f5e7e1', foreground:'#67392f', accent:'#b77365', font:'Georgia', title:'Name & Name', product:'invitation', layout:'wedding', description:'An invitation with names, date, venue and RSVP details.'},
  {id:'outdoor', name:'Outside together', category:'Merch & apparel', background:'#e3e7dc', foreground:'#244137', accent:'#728d70', font:'Arial', title:'THE\nOUTSIDE\nCLUB', product:'tote', layout:'outdoor', description:'A club graphic assembled from editable type and a stepped landscape.'},
  {id:'signal', name:'Make an entrance', category:'Events & launches', background:'#efeee9', foreground:'#202922', accent:'#cadb7a', font:'Arial', title:'Your next\nchapter.', product:'banner', layout:'banner', description:'A tall event banner with a large headline, schedule and destination.'},
  {id:'signature', name:'The signature', category:'Merch & apparel', background:'#192e2b', foreground:'#ede6d8', accent:'#a8b79c', font:'Georgia', title:'YB', product:'hoodie', layout:'signature', description:'A restrained monogram with small brand and collection details.'},
  {id:'contact-card', name:'The working card', category:'Brand essentials', background:'#faf8f3', foreground:'#202b42', accent:'#df6841', font:'Arial', title:'Your name', product:'cards', layout:'contact', description:'A practical contact card with a clear role, email, website and address.'},
  {id:'restaurant-menu', name:'The evening menu', category:'Retail & hospitality', background:'#203c35', foreground:'#f1ecd9', accent:'#cdb785', font:'Georgia', title:'At your table', product:'menu', layout:'restaurant', description:'Three courses with editable dish names, descriptions and prices.'},
  {id:'market-poster', name:'Meet at the market', category:'Events & launches', background:'#f6d555', foreground:'#282b27', accent:'#b74632', font:'Arial', title:'LOCAL\nMARKET', product:'poster', layout:'market', description:'A market poster with a strong date band, place and exhibitor information.'},
  {id:'retail-sale', name:'The weekend offer', category:'Retail & hospitality', background:'#f3ece3', foreground:'#b63626', accent:'#b63626', font:'Arial', title:'Your next\nfavourite.', product:'flyer', layout:'retail', description:'A retail promotion with an editable offer, conditions and store details.'},
  {id:'modern-wedding', name:'The modern invitation', category:'Events & launches', background:'#e9ecdd', foreground:'#3f5137', accent:'#758868', font:'Arial', title:'Name\n& Name', product:'invitation', layout:'modern-wedding', description:'An architectural invitation with large names and a compact event-information block.'},
  {id:'studio-letterhead', name:'The correspondence', category:'Brand essentials', background:'#fffdf8', foreground:'#293b3a', accent:'#54756d', font:'Arial', title:'Your brand', product:'letterhead', layout:'letterhead', description:'A complete letter layout with recipient, date, body, signature and footer fields.'},
  {id:'package-label', name:'The maker label', category:'Retail & hospitality', background:'#e7ddbf', foreground:'#3a4433', accent:'#78805d', font:'Georgia', title:'Your product', product:'roll', layout:'label', description:'A product label with editable descriptor, ingredients, weight and batch fields.'},
  {id:'thank-you', name:'The thank-you note', category:'Brand essentials', background:'#eacbc4', foreground:'#613d37', accent:'#b77365', font:'Georgia', title:'Thank you.', product:'postcard', layout:'thanks', description:'An enclosure card with a personal note, care details and contact information.'},
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
  // Prefer keeping ordinary words whole; only exceptional custom words longer
  // than the available width at minimum size are split.
  const longestWord=Math.max(1,...text.split(/\s+/).map(word=>lineWidth(word,font)));
  let low=minimum,high=Math.max(minimum,Math.min(preferred,width/longestWord));
  for(let i=0;i<30;i++) {
    const size=(low+high)/2;
    if(wrapText(text,font,size,width).length*size*1.1<=height) low=size;
    else high=size;
  }
  const lines=wrapText(text,font,low,width);
  return {text:lines.join('\n'),size:low,height:lines.length*low*1.1};
}


type Template = typeof designTemplates[number];
const fonts = ['Arial', 'Georgia', 'Verdana', 'Courier New'];
const cleanFont = (font:string) => fonts.includes(font) ? font : 'Arial';
const cleanColor = (color:string, fallback:string) => /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;

/** All measurements are composed inside a physical 3.3 mm minimum safe area. */
function composer(product:Product, background:string, ink:string, font:string) {
  const {width, height} = product;
  const mx = Math.max(3.3, width * .065), my = Math.max(3.3, height * .06);
  const w = width - mx * 2, h = height - my * 2;
  const layers:DesignLayer[] = [];
  const minimum = Math.max(width * .01, 2.2);
  const text = (copy:string, x:number, y:number, bw:number, bh:number, scale:number, options:{font?:string;weight?:number;color?:string;align?:'left'|'center'|'right'} = {}) => {
    const face = cleanFont(options.font || font);
    const boxWidth = bw / 100 * w, boxHeight = bh / 100 * h;
    const fitted = fitText(copy, face, Math.max(minimum, Math.min(w, h) * scale), boxWidth, boxHeight, minimum);
    const measured = Math.max(...fitted.text.split('\n').map(line => lineWidth(line,face) * fitted.size));
    const alignOffset = options.align === 'center' ? (boxWidth - measured) / 2 : options.align === 'right' ? boxWidth - measured : 0;
    layers.push({id:crypto.randomUUID(),type:'text',text:fitted.text,x:(mx + x / 100 * w + Math.max(0,alignOffset)) / width * 100,y:(my + y / 100 * h) / height * 100,size:fitted.size / width * 100,color:options.color || ink,rotation:0,opacity:1,font:face,weight:options.weight || (face === 'Georgia' ? 400 : 700)});
  };
  const rect = (label:string,x:number,y:number,bw:number,bh:number,color:string) => layers.push({id:crypto.randomUUID(),type:'shape',text:label,x:(mx+x/100*w)/width*100,y:(my+y/100*h)/height*100,size:5,width:bw/100*w/width*100,height:bh/100*h/height*100,color,rotation:0,opacity:1});
  const rule = (y:number,color:string,x=0,bw=100) => rect('Divider',x,y,bw,Math.max(.28, .3 / h * 100),color);
  return {layers,text,rect,rule,background};
}

/** Tiny labels and extreme strips cannot carry a menu or a contact directory.
 * Keep their identity readable; custom long copy is fitted and preflight discloses
 * any physical type-size warning. This also retains legacy campaign copy behavior.
 */
function compactComposition(product:Product, template:Template, background:string, ink:string, accent:string, font:string, brand?:BrandKit, headline?:string):DesignFace {
  const {width,height}=product;
  const marginX=Math.max(3.3,width*.075),marginY=Math.max(3.3,height*.075);
  const availableWidth=width-marginX*2;
  const signatureSize=Math.max(2.3,Math.min(width*.029,height*.035));
  const taglineSize=Math.max(2.2,signatureSize*.82);
  const name=fitText((brand?.name?.trim()||'YOUR BRAND').toUpperCase(),'Arial',signatureSize,availableWidth,Math.max(2.6,height*.10),width*.01);
  const tagline=fitText(brand?.tagline?.trim()||'MADE FOR YOU.','Arial',taglineSize,availableWidth,Math.max(2.5,height*.08),width*.01);
  const gap=Math.max(.9,height*.018);
  const taglineY=height-marginY-tagline.height;
  const nameY=taglineY-gap-name.height;
  const markerY=Math.max(3.3,height*.09),markerHeight=Math.max(.45,Math.min(width,height)*.018);
  const titleY=Math.max(height*.22,markerY+markerHeight+Math.max(1.5,height*.06));
  const titleBottom=nameY-Math.max(1.5,height*.065);
  const fitted=fitText((headline?.trim()||template.title).slice(0,100),font,Math.min(width*.14,height*.16),availableWidth,titleBottom-titleY,width*.01);
  const text=(copy:string,y:number,size:number,typeface:string,weight:number):DesignLayer=>({id:crypto.randomUUID(),type:'text',text:copy,x:marginX/width*100,y:y/height*100,size:size/width*100,color:ink,rotation:0,opacity:1,font:typeface,weight});
  return {background,layers:[
    {id:crypto.randomUUID(),type:'shape',text:'Accent rule',x:marginX/width*100,y:markerY/height*100,size:5,color:accent,rotation:0,opacity:1,width:18,height:markerHeight/height*100},
    text(fitted.text,titleY,fitted.size,font,font==='Georgia'?400:700),
    text(name.text,nameY,name.size,'Arial',600),
    text(tagline.text,taglineY,tagline.size,'Arial',400),
  ]};
}

function composeLayout(template:Template, product:Product, main:string, ink:string, accent:string, font:string, brand?:BrandKit):DesignFace {
  const c=composer(product,main,ink,font),{text:t,rect:r,rule}=c;
  const name=brand?.name?.trim() || 'Your brand';
  const tagline=brand?.tagline?.trim() || 'Thoughtfully made. Yours to make.';
  const sans={font:'Arial'}, normal={font:'Arial',weight:400};
  const small=.032;
  const title=template.title;
  const tall=product.height / product.width > 1.7;
  const narrow=product.width / product.height < .7;
  const landscape=product.width / product.height > 1.5;
  switch(template.layout) {
    case 'identity':
      r('Signature stripe',0,0,4,100,accent);
      t(name.toUpperCase(),12,7,86,22,.17);
      t(tagline,12,39,83,15,.065,normal);
      rule(72,accent,12,87);
      t('Your name',12,80,48,15,.078);
      t('Your role',66,82,33,12,.047,normal);
      break;
    case 'editorial-card':
      t(name.toUpperCase(),0,0,100,12,.065,sans);
      rule(20,accent);
      t(title,0,30,100,24,.16,{weight:400});
      t('Your role / Your discipline',0,57,100,13,.052,normal);
      t('hello@yourbrand.ca',0,83,57,12,.048,normal);
      t('yourbrand.ca',63,83,37,12,.045,normal);
      break;
    case 'contact':
      r('Identity column',0,0,3,100,accent);
      t(title,10,0,90,22,.145);
      t('Your role',10,24,90,13,.06,normal);
      rule(45,accent,10,90);
      t('hello@yourbrand.ca',10,54,90,13,.055,normal);
      t('yourbrand.ca',10,70,50,12,.048,normal);
      t('Your city',66,70,34,12,.048,normal);
      t(name.toUpperCase(),10,88,90,12,.06);
      break;
    case 'event':
      t(name.toUpperCase()+' PRESENTS',0,0,100,8,small,sans);
      t(title,0,13,100,37,.25);
      r('Date band',0,54,100,13,ink);
      t('DAY / MONTH / YEAR',4,57,92,8,.05,{...sans,color:contrastingInk(ink)});
      t('Your venue',0,73,100,9,.067);
      t('Your artists · Your programme',0,84,100,6,small,normal);
      t('Doors: your time   /   Tickets: yourbrand.ca',0,95,100,5,.027,normal);
      break;
    case 'gallery':
      t(name.toUpperCase()+' / EXHIBITIONS',0,0,100,7,small,sans);
      t(title,0,12,100,23,.15);
      r('Artwork field',0,39,100,32,accent);
      r('Sculptural block',12,45,27,20,ink);
      r('Open space',48,45,40,8,main);
      r('Lower plane',48,59,28,6,main);
      t('An exhibition by Your artist',0,76,100,7,.042,normal);
      t('Opening: Your date · Your time',0,87,100,6,small,normal);
      t('Your gallery / Your address',0,96,100,4,.025,normal);
      break;
    case 'cafe': {
      t(name.toUpperCase(),0,0,100,7,small,{...sans,align:'center'});
      t(title,0,10,100,16,.115,{align:'center'});
      rule(31,accent);
      const column=(x:number,label:string,entries:string[])=>{
        t(label,x,37,45,7,.043,sans);
        entries.forEach((entry,i)=>{t(entry,x,49+i*15,45,6,.035,{weight:400});t('Your description · $0.00',x,56+i*15,45,5,.025,normal);});
      };
      if(narrow) {
        t('COFFEE & BREAKFAST',0,37,100,7,.04,sans);
        ['Your coffee','Your breakfast','Your pastry'].forEach((entry,i)=>{t(entry,0,49+i*15,100,6,.046);t('Your description · $0.00',0,56+i*15,100,5,.028,normal);});
      } else { column(0,'COFFEE',['Your espresso','Your flat white','Your filter coffee']);column(55,'FROM THE KITCHEN',['Your breakfast','Your lunch','Your pastry']); }
      rule(94,accent);
      t('Ask us about ingredients and dietary options.',0,97,100,3,.022,normal);
      break;
    }
    case 'restaurant':
      t(name.toUpperCase(),0,0,100,7,small,{...sans,align:'center'});
      t(title,0,12,100,13,.12,{align:'center'});
      rule(30,accent);
      ['TO BEGIN','FROM THE KITCHEN','SOMETHING SWEET'].forEach((label,i)=>{
        const y=37+i*19;
        t(label,0,y,100,5,.03,sans);
        t('Your signature dish',0,y+7,76,6,.043);
        t('$0.00',81,y+7,19,6,.035,{...normal,align:'right'});
        t('Your ingredients and preparation',0,y+14,100,4,.024,normal);
      });
      t('Please ask about ingredients before ordering.',0,97,100,3,.022,normal);
      break;
    case 'apparel':
      r('Graphic bar one',0,0,18,10,ink);r('Graphic bar two',25,0,18,10,ink);r('Graphic bar three',50,0,50,10,ink);
      t(title,0,21,100,48,.215);
      rule(79,ink);
      t(name.toUpperCase(),0,86,100,6,.04,sans);
      t('YOUR COLLECTION / YOUR YEAR',0,96,100,4,.028,normal);
      break;
    case 'outdoor':
      t('YOUR LOCAL ADVENTURE CLUB',0,0,100,7,.031,sans);
      t(title,0,14,100,41,.19);
      r('Lower landscape',0,73,100,9,accent);r('Middle landscape',17,65,66,8,accent);r('Upper landscape',35,57,30,8,accent);
      t(name.toUpperCase(),0,88,100,6,.042,sans);
      t('A GOOD DAY TO GET OUTSIDE',0,97,100,3,.025,normal);
      break;
    case 'signature':
      rule(9,accent,32,36);
      t(title,0,28,100,35,.34,{align:'center'});
      t(name.toUpperCase(),0,70,100,8,.058,{...sans,align:'center'});
      t('YOUR COLLECTION',0,84,100,5,.028,{...normal,align:'center'});
      rule(96,accent,32,36);
      break;
    case 'mug':
      if(landscape) {
        t(title,0,15,56,43,.185);
        t('A moment. Just for you.',0,77,54,10,.06,normal);
        r('Wrap divider',62,0,.6,100,accent);
        t('YB',72,20,28,34,.27,{align:'center'});
        t(name.toUpperCase(),70,73,30,19,.065,{...sans,align:'center'});
      } else {
        t(title,0,5,100,30,.17);rule(44,accent);t('YB',0,55,100,22,.2,{align:'center'});t(name.toUpperCase(),0,88,100,10,.05,{...sans,align:'center'});
      }
      break;
    case 'launch':
      t(name.toUpperCase()+' / NEW COLLECTION',0,0,100,7,.032,sans);
      t(title,0,14,100,28,.17);
      rule(48,accent);
      ['01  Your first benefit','02  Your second benefit','03  Your third benefit'].forEach((copy,i)=>t(copy,0,55+i*11,100,7,.042,normal));
      r('Response block',0,91,100,9,accent);
      t('Discover more at yourbrand.ca',4,93,92,5,.028,{...sans,color:contrastingInk(accent)});
      break;
    case 'wedding':
      rule(0,accent);
      t('TOGETHER WITH THEIR FAMILIES',0,7,100,5,.028,{...sans,align:'center'});
      t(title,0,24,100,25,.18,{align:'center'});
      t('Invite you to celebrate their wedding',0,54,100,7,.038,{weight:400,align:'center'});
      t('Your date · Your time',0,66,100,7,.042,{weight:400,align:'center'});
      t('Your venue\nYour address',0,78,100,11,.034,{weight:400,align:'center'});
      t('RSVP by Your date · yourbrand.ca',0,96,100,4,.025,{...normal,align:'center'});
      break;
    case 'modern-wedding':
      t('WE ARE GETTING MARRIED',0,0,100,6,.033,sans);
      t(title,0,15,100,41,.24);
      rule(63,accent);
      t('YOUR DATE',0,70,100,6,.044,sans);
      t('Your time · Your venue',0,80,100,6,.039,normal);
      t('Your address',0,88,100,5,.028,normal);
      t('RSVP: Your date / yourbrand.ca',0,96,100,4,.026,normal);
      break;
    case 'banner':
      t(name.toUpperCase(),0,0,100,7,.055,sans);
      r('Headline accent',0,13,18,1.2,accent);
      t(title,0,21,100,tall?31:37,tall?.23:.18);
      t('Your event / Your occasion',0,64,100,8,.07,normal);
      t('Your date · Your venue',0,77,100,7,.05,normal);
      rule(89,accent);
      t('Discover more: yourbrand.ca',0,95,100,5,.035,sans);
      break;
    case 'market':
      t(name.toUpperCase()+' PRESENTS',0,0,100,6,.03,sans);
      t(title,0,14,100,34,.24);
      r('Market date band',0,54,100,15,accent);
      t('YOUR DATE / YOUR TIME',4,58,92,7,.046,{...sans,color:contrastingInk(accent)});
      t('Your market venue',0,76,100,8,.06);
      t('Local makers · Good food · Great company',0,88,100,5,.028,normal);
      t('Your address / yourbrand.ca',0,96,100,4,.025,normal);
      break;
    case 'retail':
      t(name.toUpperCase(),0,0,100,7,.04,sans);
      t(title,0,14,100,24,.17);
      r('Offer panel',0,45,100,26,accent);
      t('YOUR OFFER',5,52,90,13,.09,{...sans,color:contrastingInk(accent)});
      t('Your offer dates / Selected products',0,78,100,6,.034,normal);
      t('Your offer conditions go here.',0,87,100,5,.027,normal);
      t('Visit: yourbrand.ca / Your address',0,96,100,4,.025,sans);
      break;
    case 'letterhead':
      t(name.toUpperCase(),0,0,59,10,.066,sans);
      t('Your address\nhello@yourbrand.ca',65,0,35,10,.025,normal);
      rule(15,accent);
      t('Your date',0,21,100,5,.029,normal);
      t('Recipient name\nRecipient organisation\nRecipient address',0,30,100,13,.031,normal);
      t('Subject: Your correspondence',0,48,100,7,.038,sans);
      t('Dear Recipient,',0,60,100,6,.031,normal);
      t('Write your message here. Replace this text with your letter, keeping each paragraph clear and concise.',0,69,100,12,.031,normal);
      t('Kind regards,\nYour name / Your role',0,85,100,10,.029,normal);
      rule(97,accent);
      break;
    case 'label':
      t(name.toUpperCase(),0,0,100,8,.044,{...sans,align:'center'});
      rule(15,accent);
      t(title,0,24,100,20,.15,{align:'center'});
      t('Your product descriptor',0,50,100,8,.042,{weight:400,align:'center'});
      rule(66,accent);
      t('Ingredients: Your ingredients',0,73,100,9,.034,normal);
      t('NET WT. YOUR WEIGHT',0,87,100,5,.031,sans);
      t('Batch: Your batch / yourbrand.ca',0,96,100,4,.025,normal);
      break;
    case 'thanks':
      r('Note accent',0,0,4,100,accent);
      t(title,11,4,89,27,.23);
      t('Your support means a lot.\nWe hope you love your order.',11,39,89,21,.075,{weight:400});
      t('Care: Add your product care instructions.',11,70,89,10,.043,normal);
      t(name.toUpperCase(),11,86,47,12,.049,sans);
      t('yourbrand.ca',63,86,37,12,.044,normal);
      break;
  }
  return {background:main,layers:c.layers};
}

function contactReverse(product:Product, main:string, ink:string, accent:string, font:string, brand?:BrandKit):DesignFace {
  const c=composer(product,main,ink,font),{text:t,rule}=c;
  t('Your name',0,0,100,22,.15);
  t('Your role / Your discipline',0,27,100,12,.055,{font:'Arial',weight:400});
  rule(47,accent);
  t('hello@yourbrand.ca',0,56,100,12,.055,{font:'Arial',weight:400});
  t('yourbrand.ca',0,73,54,12,.05,{font:'Arial',weight:400});
  t('Your city',62,73,38,12,.05,{font:'Arial',weight:400});
  t((brand?.name?.trim()||'Your brand').toUpperCase(),0,91,100,9,.045,{font:'Arial'});
  return {background:main,layers:c.layers};
}

export function makeTemplate(id:string,productId?:string,brand?:BrandKit,headline?:string):Design {
  const template=designTemplates.find(t=>t.id===id)||designTemplates[0];
  const product=products.find(p=>p.id===(productId||template.product))||products[0];
  const design=initialDesign(product.id);
  const main=cleanColor(brand?.primary||template.background,template.background);
  const ink=brand?contrastingInk(main):template.foreground;
  const accent=cleanColor(brand?.accent||template.accent,template.accent);
  const font=cleanFont(brand?.font||template.font);
  const compact=Math.min(product.width,product.height)<44 || product.width/product.height<.2 || product.width/product.height>3.2;
  // Campaign generation intentionally supplies its own headline. Keep all of that
  // copy and the brand signature, instead of silently replacing a menu item field.
  const custom=!!headline?.trim() || !!brand && (brand.name.length>36 || brand.tagline.length>70 || /\n/.test(brand.name+brand.tagline));
  let face=compact||custom
    ? compactComposition(product,template,main,ink,accent,font,brand,headline)
    : composeLayout(template,product,main,ink,accent,font,brand);
  // The same template can be applied to all 51 formats. On formats too small to
  // carry its information hierarchy, retain the editable identity composition.
  const invalidText=face.layers.some(layer=>{
    if(layer.type!=='text')return false;
    const physicalSize=layer.size/100*product.width;
    return layer.y/100*product.height+layer.text.split('\n').length*physicalSize*1.1>product.height-3.1 || physicalSize<2.1167;
  });
  if(invalidText&&!custom)face=compactComposition(product,template,main,ink,accent,font,brand);
  const paired=product.id==='cards' && ['identity','editorial-card','contact'].includes(template.layout) && !custom;
  const back=paired?contactReverse(product,'#faf8f2','#243830',accent,font,brand):undefined;
  return {...design,name:template.name+' · '+product.name,...face,...(back?{back}:{})};
}

export function contrastingInk(hex:string){
  const luminance=(color:string)=>{
    const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
    return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  };
  const base=luminance(cleanColor(hex,'#193d34'));
  const contrast=(color:string)=>{const value=luminance(color);return (Math.max(base,value)+.05)/(Math.min(base,value)+.05);};
  return contrast('#1b2822')>=contrast('#fffdf4')?'#1b2822':'#fffdf4';
}
