import assert from 'node:assert/strict';
import {products,calculateQuote,initialDesign} from '../lib/presswerk/catalog.ts';
const defaults={productId:'cards',quantity:500,tier:'Value',finish:'Standard',sides:1,city:'Calgary',shipping:0};
assert.equal(calculateQuote(defaults).subtotal,29.95);
assert.equal(calculateQuote({...defaults,quantity:100}).subtotal,18.95);
assert.equal(calculateQuote({...defaults,quantity:1000}).subtotal,49.95);
assert.equal(calculateQuote({...defaults,productId:'brochure',quantity:500}).subtotal,259);
assert.equal(calculateQuote({...defaults,productId:'tee',quantity:1}).subtotal,29.95);
assert.equal(calculateQuote({...defaults,shipping:12}).total,41.95);
assert.ok(calculateQuote({...defaults,tier:'Design Plus'}).total>29.95);
assert.ok(calculateQuote({...defaults,finish:'Foil accent'}).total>29.95);
assert.equal(calculateQuote({...defaults,productId:'box'}).quoteOnly,true);
assert.equal(calculateQuote({...defaults,productId:'box'}).subtotal,0);
for(const quantity of [0,-1,1.5,Infinity,100001])assert.throws(()=>calculateQuote({...defaults,quantity}));
assert.throws(()=>calculateQuote({...defaults,shipping:-3}));
assert.throws(()=>calculateQuote({...defaults,shipping:NaN}));
assert.throws(()=>calculateQuote({...defaults,productId:'missing'}));
assert.throws(()=>calculateQuote({...defaults,finish:'missing'}));
assert.throws(()=>calculateQuote({...defaults,sides:0}));
assert.equal(new Set(products.map(p=>p.id)).size,products.length);
for(const p of products){const d=initialDesign(p.id);const q=calculateQuote({...d,shipping:0});assert.ok(Number.isFinite(q.total));assert.ok(p.width>0&&p.height>0);assert.ok(p.phase>=1&&p.phase<=4);}
console.log(`PASS: quantity breaks, invalid inputs, delivery, service/finish pricing, quote-only products and all ${products.length} catalogue entries.`);

for(const productId of ["cards","brochure"]){let prev=0;for(let quantity=1;quantity<=3000;quantity++){const total=calculateQuote({...defaults,productId,quantity}).subtotal;assert.ok(total>=prev,`Non-monotonic ${productId} at ${quantity}`);prev=total;}}
console.log("PASS: every quantity from 1 to 3,000 has monotonic card and brochure pricing.");
