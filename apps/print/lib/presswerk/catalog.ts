export type Product={id:string;name:string;category:string;description:string;price:number;quantity:number;unit:string;width:number;height:number;method:string;material:string;days:number;phase:number;image:string;quoteOnly?:boolean;tag?:string};
const p=(id:string,name:string,category:string,description:string,price:number,quantity:number,width:number,height:number,method:string,material:string,phase=1,image='cards',tag?:string):Product=>({id,name,category,description,price,quantity,unit:quantity===1?'item':'items',width,height,method,material,days:phase===1?3:phase===2?5:8,phase,image,tag,quoteOnly:price===0});
export const categories=['Everything','Paper & stationery','Apparel','Packaging','Signs & displays','Stickers & labels','Photo & art','Books & publishing','Gifts & merchandise','Technical & 3D','Interiors','Specialty'];
export const products:Product[]=[
 p('cards','Business cards','Paper & stationery','A small introduction. A lasting impression.',18.95,100,89,51,'Digital','14pt matte card',1,'cards','Bestseller'),
 p('tee','Classic T-shirt','Apparel','Your next favourite tee, with your name on it.',29.95,1,254,305,'DTG / DTF','180gsm cotton',1,'merch','Studio favourite'),
 p('box','Custom mailer box','Packaging','Make the unboxing part of the story.',0,25,203,152,'Digital corrugated','E-flute white board',2,'collection','Custom quote'),
 p('stickers','Die-cut stickers','Stickers & labels','A little personality. Anywhere you put it.',79.95,100,75,75,'Eco-solvent','Laminated vinyl',1,'cards'),
 p('poster','Art poster','Photo & art','Give your ideas some wall space.',19.95,1,457,610,'Pigment inkjet','200gsm matte paper',1,'collection'),
 p('mug','Everyday mug','Gifts & merchandise','Your design, on daily rotation.',14.95,1,210,90,'Sublimation','11oz white ceramic',1,'merch'),
 p('brochure','Tri-fold brochure','Paper & stationery','More room to tell your story.',49.95,50,279,216,'Digital','100lb gloss text',1),
 p('hoodie','Essential hoodie','Apparel','A comfortable canvas for big ideas.',59.95,1,254,305,'DTG / DTF','Cotton blend fleece',1,'merch'),
 p('banner','Retractable banner','Signs & displays','Stand tall. Be seen.',109,1,610,1829,'Wide-format','Outdoor vinyl + stand',2,'collection'),
 p('canvas','Stretched canvas','Photo & art','Art that belongs in the room.',89,1,406,508,'Pigment inkjet','Canvas, 1.25-inch wrap',2,'collection'),
 p('bw','Document printing','Paper & stationery','Every page, sharp and clear.',19,100,216,279,'Digital monochrome','20lb white paper',1),
 p('colour','Colour documents','Paper & stationery','Reports with a little more presence.',54.95,100,216,279,'Digital colour','24lb white paper',1),
 p('flyer','Flyers','Paper & stationery','Take your message into the world.',0,100,216,279,'Digital / offset','100lb gloss text',1),
 p('postcard','Postcards','Paper & stationery','Something worth sending.',0,100,152,102,'Digital','16pt card',1),
 p('letterhead','Letterheads','Paper & stationery','Put your identity on every page.',0,100,216,279,'Digital','Premium uncoated',1),
 p('envelope','Envelopes','Paper & stationery','A first impression, before opening.',0,100,241,105,'Digital','White wove',1),
 p('invitation','Invitations','Paper & stationery','Make the occasion feel special.',0,50,127,178,'Digital / letterpress','Textured 350gsm card',2),
 p('menu','Restaurant menus','Paper & stationery','A menu as considered as the food.',0,50,216,279,'Digital','Wipe-clean laminated card',1),
 p('tote','Cotton tote','Apparel','Good design goes everywhere.',0,1,280,300,'Screen / DTF','Natural cotton canvas',1,'merch'),
 p('cap','Embroidered cap','Apparel','Your signature, stitched in.',0,12,100,55,'Embroidery','Cotton twill',2,'merch'),
 p('sport','Teamwear','Apparel','One team. One identity.',0,12,300,400,'Dye sublimation','Performance polyester',2,'merch'),
 p('fabric','Fabric by the metre','Apparel','Pattern, without limits.',0,1,1400,1000,'Reactive / pigment textile','Fabric specified per job',3,'merch'),
 p('roll','Roll labels','Stickers & labels','The finishing touch for every product.',0,500,75,100,'Digital label press','Paper / BOPP',2),
 p('clear','Clear stickers','Stickers & labels','Let your product show through.',0,100,75,75,'UV + white ink','Clear vinyl',2),
 p('security','Security labels','Specialty','Traceability and tamper evidence.',0,1000,50,25,'Variable data / security','Destructible stock',3),
 p('tissue','Branded tissue','Packaging','Every layer considered.',0,250,500,700,'Flexographic','FSC tissue option',2,'collection'),
 p('tape','Packaging tape','Packaging','Seal it with your signature.',0,90,71,1000,'Flexographic','Water-activated kraft',2,'collection'),
 p('mailer','Poly mailers','Packaging','Brand presence to the doorstep.',0,100,191,267,'Flexographic','Poly mailer',2,'collection'),
 p('pouch','Stand-up pouches','Packaging','Shelf presence, beautifully packaged.',0,500,150,220,'Digital flexible packaging','Barrier film specified',3,'collection'),
 p('yard','Yard signs','Signs & displays','Made for the neighbourhood.',0,10,610,457,'UV flatbed','4mm corrugated plastic',2,'collection'),
 p('vinyl','Outdoor banners','Signs & displays','Big messages, made to last.',0,1,1220,610,'Wide-format','13oz vinyl, hems + grommets',2,'collection'),
 p('wrap','Vehicle wraps','Signs & displays','Turn every journey into an impression.',0,1,3000,1500,'Latex / eco-solvent','Cast vinyl + laminate',3,'collection'),
 p('acrylic','Acrylic signage','Signs & displays','Clean lines. Brilliant detail.',0,1,600,400,'UV direct print','Clear acrylic',2,'collection'),
 p('booth','Exhibition displays','Signs & displays','Build a space around your brand.',0,1,3000,2400,'Dye sublimation','Tension fabric + frame',3,'collection'),
 p('photos','Fine art prints','Photo & art','Every detail, faithfully reproduced.',0,1,203,254,'Giclée','Archival cotton rag',1,'collection'),
 p('metal','Metal prints','Photo & art','Colour with extraordinary depth.',0,1,203,254,'Dye sublimation','Coated aluminium',2,'collection'),
 p('photobook','Photo books','Books & publishing','Give your memories a spine.',0,1,279,216,'Digital photo','Lay-flat photo stock',2,'cards'),
 p('book','Perfect-bound books','Books & publishing','From manuscript to something real.',0,50,152,229,'Digital / offset','200-page B&W interior',2),
 p('magazine','Magazines','Books & publishing','Editorial ideas in their best form.',0,100,210,297,'Offset / digital','Saddle stitch',2),
 p('notebook','Notebooks & journals','Books & publishing','Room for the next idea.',0,50,148,210,'Digital + binding','Uncoated writing paper',2),
 p('calendar','Calendars','Books & publishing','A year of your best work.',0,25,297,210,'Digital + wire binding','Silk coated paper',2),
 p('bottle','Water bottles','Gifts & merchandise','Make everyday essentials your own.',0,24,100,150,'UV / sublimation','Insulated stainless steel',2,'merch'),
 p('award','Awards & plaques','Gifts & merchandise','Recognition with lasting presence.',0,1,150,200,'UV / engraving','Acrylic / wood / metal',2,'merch'),
 p('wall','Wallcoverings','Interiors','Create a room with a point of view.',0,1,1000,2500,'Latex / UV','Wallcovering substrate',3,'collection'),
 p('floor','Floor graphics','Interiors','Lead the way with your brand.',0,1,1000,1000,'Wide-format','Anti-slip laminate',2,'collection'),
 p('plans','Architectural plans','Technical & 3D','Scale, clarity and precision.',0,1,841,594,'Technical inkjet','Bond paper, A1',1,'cards'),
 p('model','Architectural models','Technical & 3D','See your design in another dimension.',0,1,200,200,'FDM / SLA','PLA / resin',3,'collection'),
 p('parts','Functional 3D parts','Technical & 3D','From a model to a working prototype.',0,1,100,100,'FDM / SLS / metal','Material and tolerance review',3,'collection'),
 p('braille','Tactile & Braille signs','Specialty','Information everyone can access.',0,1,150,200,'Raised UV / fabrication','Application-specific substrate',3,'collection'),
 p('electronics','Printed electronics','Specialty','Conductive patterns for new products.',0,1,100,100,'Conductive ink deposition','Engineering review required',4,'cards'),
 p('edible','Edible printing','Specialty','Personal details for special occasions.',0,1,210,297,'Edible inkjet','Food-grade wafer / icing sheet',3,'cards'),
];
export const money=(n:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(n);
export function finishesFor(p:Product){return ['Paper & stationery','Books & publishing'].includes(p.category)?['Standard','Soft touch','Gloss laminate','Foil accent']:['Signs & displays','Stickers & labels','Photo & art','Interiors'].includes(p.category)?['Standard','Gloss laminate']:['Standard'];}
export type Tier='Value'|'Design Plus'|'Priority';
export type QuoteInput={productId:string;quantity:number;tier:Tier;finish:string;sides:number;city:string;shipping:number;discount?:number};
export function calculateQuote(input:QuoteInput){
 const product=products.find(x=>x.id===input.productId); if(!product)throw new Error('Choose a valid product.');
 if(!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>100000)throw new Error('Quantity must be a whole number between 1 and 100,000.');
 if(!['Value','Design Plus','Priority'].includes(input.tier))throw new Error('Choose a valid service tier.');
 if(!['Standard','Soft touch','Gloss laminate','Foil accent'].includes(input.finish))throw new Error('Choose a valid finish.');
 if(![1,2].includes(input.sides))throw new Error('Choose one or two sides.');
 if(!Number.isFinite(input.shipping)||input.shipping<0)throw new Error('Enter a valid delivery allowance.');
 const quantity=input.quantity;let base=product.price*(quantity/product.quantity)*Math.pow(Math.max(1,quantity/product.quantity),-.12);
 const interpolate=(points:number[][])=>{const upper=points.findIndex(x=>x[0]>=quantity);if(upper===0)return points[0][1];if(upper<0){const a=points[points.length-1];return a[1]*quantity/a[0];}const a=points[upper-1],b=points[upper];return a[1]+(quantity-a[0])/(b[0]-a[0])*(b[1]-a[1]);};
 if(product.id==='cards')base=interpolate([[1,5],[100,18.95],[250,24.95],[500,29.95],[1000,49.95],[2500,99.95],[10000,329.95],[100000,2499.95]]);
 if(product.id==='brochure')base=interpolate([[1,5],[50,49.95],[100,84.95],[500,259],[1000,469],[10000,3499],[100000,29999]]);
 if(input.discount!==undefined&&(!Number.isFinite(input.discount)||input.discount<0||input.discount>.3))throw new Error('Discount must be between 0 and 0.3.');
 if(!finishesFor(product).includes(input.finish))throw new Error('This finish is not available for the selected product.');
 const finishRate:Record<string,number>={'Standard':0,'Soft touch':.2,'Gloss laminate':.15,'Foil accent':.65};
 const finish=base*finishRate[input.finish];const sides=input.sides===2?base*.18:0;
 const service=input.tier==='Design Plus'?Math.max(15,base*.3):input.tier==='Priority'?Math.max(10,base*.35):0;
 const discount=Math.min(.3,Math.max(0,input.discount||0));
 const subtotal=product.quoteOnly?0:+(Math.max(5,base+finish+sides+service)*(1-discount)).toFixed(2);
 return {product,base:+base.toFixed(2),finish:+finish.toFixed(2),sides:+sides.toFixed(2),service:+service.toFixed(2),subtotal,shipping:input.shipping,total:+(subtotal+input.shipping).toFixed(2),unit:+(subtotal/quantity).toFixed(3),days:input.tier==='Priority'?Math.max(1,product.days-2):product.days,quoteOnly:!!product.quoteOnly,currency:'CAD',status:'estimate',taxes:'Not included; final tax depends on supply and destination'};
}
export type DesignLayer={id:string;type:'text'|'image'|'shape';text:string;x:number;y:number;size:number;color:string;rotation:number;opacity:number;src?:string;assetPath?:string;width?:number;height?:number;font?:string;weight?:number;naturalWidth?:number;naturalHeight?:number};
export type Design={id:string;name:string;productId:string;background:string;layers:DesignLayer[];quantity:number;tier:Tier;finish:string;sides:number;city:string;imageWidth?:number;imageHeight?:number;version:number;updatedAt:string};
export const initialDesign=(productId='cards'):Design=>({id:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2),name:'Untitled project',productId,background:'#2449f8',layers:[{id:'headline',type:'text',text:'Make your\nmark.',x:10,y:27,size:16,color:'#ffffff',rotation:0,opacity:1,font:'Arial',weight:700},{id:'caption',type:'text',text:'AVALON PRINT  /  CREATED BY YOU',x:10,y:85,size:3,color:'#ffffff',rotation:0,opacity:1,font:'Arial',weight:400}],quantity:products.find(p=>p.id===productId)?.quantity||100,tier:'Value',finish:'Standard',sides:1,city:'Calgary',version:1,updatedAt:new Date().toISOString()});
export const templates=[{id:'bold',name:'Bold statement',color:'#2449f8',text:'Make your\nmark.',type:'Modern / high contrast'},{id:'editorial',name:'The editorial',color:'#f2f0ea',text:'Good things.\nIn the making.',type:'Quiet / considered'},{id:'night',name:'After hours',color:'#171719',text:'OFF\nSCRIPT.',type:'Minimal / expressive'},{id:'green',name:'Fresh perspective',color:'#c6ee48',text:'A fresh\nperspective.',type:'Bright / contemporary'},{id:'orange',name:'The independent',color:'#f57439',text:'Made to\nstand out.',type:'Warm / confident'},{id:'mono',name:'Studio notes',color:'#e5e8ed',text:'IDEAS\nIN PRINT.',type:'Monochrome / technical'}];
export const competitorRows=[{product:'Business cards',qty:100,us:18.95,company:'Staples',price:18.99,detail:'One side; standard gloss',url:'https://shop.staplescopyandprint.ca/products/business-cards'},{product:'Business cards',qty:500,us:29.95,company:'VistaPrint',price:26,detail:'One side; 14pt matte',url:'https://www.vistaprint.ca/business-cards/standard'},{product:'Business cards',qty:500,us:29.95,company:'Flyer Shop',price:39.99,detail:'One side; 14pt semigloss',url:'https://www.flyershop.com/standard-business-cards/'},{product:'Tri-fold brochures',qty:500,us:259,company:'VistaPrint',price:272.99,detail:'Gloss; paper weight not matched',url:'https://www.vistaprint.ca/marketing-materials/brochures/tri-fold'},{product:'11oz mug',qty:1,us:14.95,company:'Walmart',price:13.97,detail:'White ceramic; shipping extra',url:'https://www.walmartphotocentre.ca/en/product-price'},{product:'75mm die-cut stickers',qty:100,us:79.95,company:'Sticker Mule',price:116,detail:'Reference includes standard delivery',url:'https://www.stickermule.com/ca/products/die-cut-stickers'}];
export const suppliers=[{name:'Printful',city:'POD network',tags:['Apparel','Gifts & merchandise'],note:'Individual fulfilment; exact size and destination need quotes.',url:'https://www.printful.com',status:'Research candidate'},{name:'SinaLite',city:'Canadian trade network',tags:['Paper & stationery','Signs & displays','Packaging'],note:'Trade account required for production pricing.',url:'https://sinalite.com',status:'Account needed'},{name:'Flyer Shop',city:'Calgary',tags:['Paper & stationery','Signs & displays'],note:'Local commercial printing; obtain matched specifications.',url:'https://www.flyershop.com',status:'Research candidate'},{name:'Newfoundland Canvas',city:'St. John’s',tags:['Photo & art','Paper & stationery'],note:'Fine art and canvas benchmark; confirm turnaround.',url:'https://newfoundlandcanvas.com',status:'Research candidate'},{name:'Sticker Mule',city:'Online fulfilment',tags:['Stickers & labels','Packaging'],note:'Compare delivered order prices and minimum quantities.',url:'https://www.stickermule.com/ca',status:'Research candidate'},{name:'Print Three',city:'St. John’s',tags:['Paper & stationery','Books & publishing'],note:'Request commercial print and finishing quotations.',url:'https://print3newfoundland.com',status:'Quote required'}];
