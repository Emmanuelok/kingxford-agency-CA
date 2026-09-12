import { z } from 'zod';
import { calculateQuote, money, products } from '../presswerk/catalog.ts';
import { artworkSvg, escapeXml, preflightArtwork, printFaces } from './artwork.ts';
import { validateLocalDesign } from './workspace-store.ts';
import type { QuoteDraft, QuoteLine } from './types.ts';

export const quoteIdentifier = (quote: QuoteDraft) => `AP-${quote.id.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}`;
export function packageSlug(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '').toLowerCase() || 'print-project';
}
export function estimateLine(line: QuoteLine) {
  try { return { value: calculateQuote({ ...line.design, shipping: 0 }), error: '' }; }
  catch (error) { return { value: null, error: error instanceof Error ? error.message : 'Review the product specifications.' }; }
}
export function quoteBudget(quote: QuoteDraft) {
  const calculated = quote.lines.map(estimateLine);
  const subtotal = +calculated.reduce((total, line) => total + (line.value?.subtotal || 0), 0).toFixed(2);
  const pending = calculated.filter(line => line.value?.quoteOnly).length;
  const allowance = quote.delivery.method === 'Delivery' && Number.isFinite(quote.delivery.allowance) ? quote.delivery.allowance : 0;
  return { calculated, subtotal, pending, allowance, total: +(subtotal + allowance).toFixed(2), invalid: calculated.some(line => !!line.error) || allowance < 0 || allowance > 100000 || !Number.isFinite(quote.delivery.allowance) };
}
export function quoteReadiness(quote: QuoteDraft) {
  const errors: string[] = [];
  if (!quote.name.trim()) errors.push('Give this estimate a name.');
  if (!quote.lines.length) errors.push('Add at least one print item.');
  if (quote.lines.length > 100) errors.push('Each estimate supports up to 100 print items.');
  const lines = quote.lines.map((line, index) => {
    const pricing = estimateLine(line);
    if (pricing.error) errors.push(`Item ${index + 1}: ${pricing.error}`);
    let issues: ReturnType<typeof preflightArtwork> = [];
    try { issues = preflightArtwork(line.design); }
    catch { issues = [{ id: 'unavailable', severity: 'error', title: 'Artwork cannot be checked', detail: 'Open this item in the studio and select a supported product.' }]; }
    const blockers = issues.filter(issue => issue.severity === 'error');
    errors.push(...blockers.map(issue => `${line.design.name || `Item ${index + 1}`}: ${issue.title}`));
    return { lineId: line.id, issues, errorCount: blockers.length, warningCount: issues.length - blockers.length };
  });
  if (!quote.customer.name.trim()) errors.push('Enter a contact name.');
  if (!z.string().email().safeParse(quote.customer.email.trim()).success) errors.push('Enter a valid contact email.');
  if (quote.delivery.method === 'Delivery' && !quote.delivery.city.trim()) errors.push('Enter the delivery city.');
  if (!Number.isFinite(quote.delivery.allowance) || quote.delivery.allowance < 0 || quote.delivery.allowance > 100000) errors.push('Enter a delivery allowance between $0 and $100,000.');
  return { errors, lines, ready: errors.length === 0, warningCount: lines.reduce((sum, line) => sum + line.warningCount, 0) };
}

export type PackageFile = { name: string; content: string };
const encoder = new TextEncoder();
const MAX_PACKAGE_BYTES = 200 * 1024 * 1024;
const crcTable = new Uint32Array(256).map((_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  return crc >>> 0;
});
export function packageCrc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}
/** A standard, uncompressed ZIP: no executable code, compression runtime or server upload. */
export function storedZip(files: PackageFile[]): Uint8Array<ArrayBuffer> {
  if (!files.length || files.length > 65535) throw new Error('The package has too many files. Split the estimate into smaller requests.');
  const names = new Set<string>();
  let size = 22;
  const entries = files.map(file => {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(file.name) || file.name.split('/').some(part => !part || part === '.' || part === '..') || names.has(file.name.toLowerCase())) throw new Error('The package contains an invalid or duplicate filename.');
    names.add(file.name.toLowerCase());
    const name = encoder.encode(file.name), data = encoder.encode(file.content);
    size += 30 + name.length + data.length + 46 + name.length;
    if (name.length > 65535 || size > MAX_PACKAGE_BYTES) throw new Error('This package exceeds 200 MB. Split the estimate or reduce image sizes.');
    return { name, data, crc: packageCrc32(data), offset: 0 };
  });
  const bytes = new Uint8Array(size), view = new DataView(bytes.buffer);
  let position = 0;
  const u16 = (offset: number, value: number) => view.setUint16(position + offset, value, true);
  const u32 = (offset: number, value: number) => view.setUint32(position + offset, value, true);
  for (const entry of entries) {
    entry.offset = position;
    u32(0, 0x04034b50); u16(4, 20); u16(6, 0x0800); u16(8, 0); u16(12, 33);
    u32(14, entry.crc); u32(18, entry.data.length); u32(22, entry.data.length); u16(26, entry.name.length);
    bytes.set(entry.name, position + 30); bytes.set(entry.data, position + 30 + entry.name.length);
    position += 30 + entry.name.length + entry.data.length;
  }
  const centralOffset = position;
  for (const entry of entries) {
    u32(0, 0x02014b50); u16(4, 20); u16(6, 20); u16(8, 0x0800); u16(10, 0); u16(14, 33);
    u32(16, entry.crc); u32(20, entry.data.length); u32(24, entry.data.length); u16(28, entry.name.length); u32(42, entry.offset);
    bytes.set(entry.name, position + 46); position += 46 + entry.name.length;
  }
  const centralSize = position - centralOffset;
  u32(0, 0x06054b50); u16(8, entries.length); u16(10, entries.length); u32(12, centralSize); u32(16, centralOffset);
  return bytes;
}

export function buildProductionPackage(quote: QuoteDraft) {
  const readiness = quoteReadiness(quote), budget = quoteBudget(quote);
  if (!readiness.ready) throw new Error(`Complete the review before creating the package. ${readiness.errors[0]}`);
  const files: PackageFile[] = [];
  const e = escapeXml;
  const artwork = quote.lines.map((line, index) => {
    // Validate numeric attributes and local raster sources before SVG serialization.
    const design = validateLocalDesign(line.design), product = products.find(item => item.id === design.productId)!;
    const faces = printFaces(design).map(({ face, label, design: faceDesign }) => {
      const name = `artwork/${String(index + 1).padStart(3, '0')}-${packageSlug(design.name)}-${face}.svg`;
      const svg = artworkSvg(faceDesign);
      files.push({ name, content: svg });
      return { face, label, file: name, svg };
    });
    const price = budget.calculated[index].value!;
    return { lineId: line.id, name: design.name, productId: product.id, product: product.name, material: product.material, method: product.method, widthMm: product.width, heightMm: product.height, quantity: design.quantity, sides: design.sides, finish: design.finish, serviceTier: design.tier, artworkVersion: design.version, pricing: price.quoteOnly ? { status: 'custom-pricing-pending', subtotalCAD: null } : { status: 'planning-estimate', subtotalCAD: price.subtotal, baseCAD: price.base, finishCAD: price.finish, secondSideCAD: price.sides, serviceCAD: price.service }, checks: readiness.lines[index].issues, faces };
  });
  const manifest = {
    format: 'avalon-print-review', version: 1, reference: quoteIdentifier(quote), createdAt: new Date().toISOString(),
    quote: { id: quote.id, name: quote.name, status: quote.status, updatedAt: quote.updatedAt, customer: quote.customer, delivery: quote.delivery, notes: quote.notes },
    currency: 'CAD', budget: { knownItemsCAD: budget.subtotal, deliveryAllowanceCAD: budget.allowance, knownAmountCAD: budget.total, customItemsAwaitingPrice: budget.pending, completeEstimate: budget.pending === 0, taxes: 'Not included' },
    review: { status: 'Prepared for quotation review; not production approval', warnings: readiness.warningCount, printPreparation: 'SVG uses RGB colours and live text. No bleed, dieline, font outlining or supplier-specific separation has been added. Production must confirm these requirements.' },
    lines: artwork.map(({ faces, ...line }) => ({ ...line, faces: faces.map(face => ({ face: face.face, label: face.label, file: face.file })) })),
  };
  const budgetLabel = budget.pending ? 'Known amount, excluding custom-price items' : 'Estimated total before tax';
  const brief = [
    'AVALON PRINT / QUOTATION REVIEW PACKAGE', `${quoteIdentifier(quote)} · ${quote.name}`, '',
    `Contact: ${quote.customer.name}`, `Company: ${quote.customer.company || '—'}`, `Email: ${quote.customer.email}`,
    `Fulfilment preference: ${quote.delivery.method} · ${quote.delivery.city || 'Confirm location'}`, `Instructions: ${quote.delivery.notes || '—'}`, '',
    ...artwork.flatMap((line, index) => [
      `${index + 1}. ${line.name} — ${line.product}`, `${line.quantity} items · ${line.widthMm} × ${line.heightMm} mm · ${line.sides} side(s)`,
      `${line.material} · ${line.method} · ${line.finish} · ${line.serviceTier}`,
      `Pricing: ${line.pricing.subtotalCAD === null ? 'Custom pricing pending' : money(line.pricing.subtotalCAD)}`,
      ...line.faces.map(face => `${face.label}: ${face.file}`),
      ...(line.checks.length ? line.checks.map(issue => `${issue.severity.toUpperCase()}: ${issue.title} — ${issue.detail}`) : ['Artwork checks: no automated issues found.']), '',
    ]),
    `Known item subtotal: ${money(budget.subtotal)}`, `Delivery allowance: ${money(budget.allowance)}`, `${budgetLabel}: ${money(budget.total)}`,
    `${budget.pending} custom-price item(s) await pricing. Taxes are not included.`, '', `Project notes: ${quote.notes || '—'}`, '',
    'NEXT STEP', 'Email avalon@veridanth.com with this ZIP attached to request a quotation. Sending is performed by you from your email app.',
    'Open review.html for the visual brief. quote.json contains the specifications and checks. The artwork folder contains each individual print face.',
    manifest.review.printPreparation, 'This package is for quotation review. It does not place an order, reserve production or collect payment.',
  ].join('\n');
  const illustrations = artwork.map((line, index) => `<article><div class="item-title"><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${e(line.name)}</h2><p>${e(line.product)} · ${e(line.quantity)} items · ${e(line.widthMm)} × ${e(line.heightMm)} mm</p></div><strong>${line.pricing.subtotalCAD === null ? 'Custom pricing pending' : e(money(line.pricing.subtotalCAD))}</strong></div><div class="faces">${line.faces.map(face => `<figure><div class="art"><img src="data:image/svg+xml;charset=utf-8,${e(encodeURIComponent(face.svg))}" alt="${e(face.label)} artwork for ${e(line.name)}"></div><figcaption>${e(face.label)} · Artwork v${e(line.artworkVersion)}</figcaption></figure>`).join('')}</div><p>${e(line.material)} · ${e(line.method)} · ${e(line.finish)} · ${e(line.serviceTier)}</p>${line.checks.length ? `<ul class="checks">${line.checks.map(issue => `<li><strong>${e(issue.title)}</strong> — ${e(issue.detail)}</li>`).join('')}</ul>` : '<p class="passed">Automated artwork checks passed.</p>'}</article>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${e(quote.name)} — Avalon Print review</title><style>*{box-sizing:border-box}body{margin:0;background:#f2f3f6;color:#1a2030;font:14px/1.6 Arial,sans-serif}main{max-width:1000px;margin:auto;padding:48px 40px}header{border-bottom:1px solid #d9dce5;padding-bottom:25px}.brand{font-size:12px;font-weight:700;letter-spacing:2px;color:#2449f8}h1{font-size:38px;line-height:1.15;letter-spacing:-1.3px;margin:22px 0 12px;overflow-wrap:anywhere}h2{font-size:19px;margin:0}p{margin:6px 0;color:#586071;overflow-wrap:anywhere}.customer{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin:25px 0}article{padding:26px;background:white;border:1px solid #dde1e9;border-radius:12px;margin:20px 0;break-inside:avoid}.item-title{display:flex;align-items:center;gap:15px}.item-title>span{color:#6a7387}.item-title>div{flex:1;min-width:0}.item-title>strong{text-align:right}.faces{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px;margin:25px 0}figure{margin:0;min-width:0}.art{height:250px;background:#f1f2f5;display:flex;align-items:center;justify-content:center;padding:25px;border-radius:6px}.art img{max-width:100%;max-height:100%;box-shadow:0 7px 18px #1522361a}figcaption{font-size:12px;color:#667084;margin-top:9px}.checks{padding:12px 12px 12px 28px;font-size:12px;background:#fff8e9;border-radius:6px}.passed{font-size:12px;color:#316348}.budget{margin:25px 0 25px auto;background:#192238;color:white;border-radius:12px;padding:25px;max-width:420px}.budget p{color:#dde3ed;display:flex;justify-content:space-between;gap:20px}.budget strong{color:white}.grand{border-top:1px solid #ffffff30;padding-top:14px;margin-top:14px!important}.notes{white-space:pre-wrap}.next{border-top:1px solid #d9dce5;padding-top:24px;margin-top:32px;font-size:12px}@media print{body{background:white}main{padding:0}article{border-radius:0}.art{height:200px}.next{break-inside:avoid}}@media(max-width:600px){main{padding:25px 18px}h1{font-size:29px}article{padding:18px}.item-title{flex-wrap:wrap}.item-title>strong{width:100%;text-align:left}.customer{grid-template-columns:1fr}.art{height:190px}}</style></head><body><main><header><span class="brand">AVALON / PRINT</span><h1>${e(quote.name)}</h1><p>${e(quoteIdentifier(quote))} · Prepared for quotation review · CAD</p></header><section class="customer"><div><strong>${e(quote.customer.name)}</strong><p>${e(quote.customer.company)}</p><p>${e(quote.customer.email)}</p></div><div><strong>${e(quote.delivery.method)} · ${e(quote.delivery.city || 'Location to confirm')}</strong><p>${e(quote.delivery.notes)}</p></div></section>${illustrations}<section class="budget"><p><span>Known item subtotal</span><strong>${e(money(budget.subtotal))}</strong></p><p><span>Delivery allowance</span><strong>${e(money(budget.allowance))}</strong></p><p class="grand"><span>${e(budgetLabel)}</span><strong>${e(money(budget.total))}</strong></p><p>${budget.pending ? `${e(budget.pending)} custom-price item(s) excluded. ` : ''}Taxes not included.</p></section>${quote.notes ? `<h2>Project notes</h2><p class="notes">${e(quote.notes)}</p>` : ''}<section class="next"><h2>Request your quotation</h2><p>Email avalon@veridanth.com and attach this ZIP. Production will confirm pricing, materials, delivery and print preparation.</p><p>${e(manifest.review.printPreparation)}</p><p>This package does not place an order, reserve production or collect payment.</p><p>Avalon Creative Group · +1 (587) 837-4472 · avaloncreative.group/print</p></section></main></body></html>`;
  files.unshift({ name: 'README.txt', content: brief }, { name: 'review.html', content: html }, { name: 'quote.json', content: JSON.stringify(manifest, null, 2) });
  return { filename: `${packageSlug(quote.name)}-${quoteIdentifier(quote).toLowerCase()}.zip`, files, bytes: storedZip(files), manifest };
}

export function quotationEmailHref(quote: QuoteDraft): string {
  const budget = quoteBudget(quote);
  const count = quote.lines.length;
  const lines = quote.lines.slice(0, 8).map(line => `${line.design.quantity} × ${(products.find(product => product.id === line.design.productId)?.name || 'Print item')}: ${line.design.name.replace(/[\r\n]+/g, ' ').slice(0, 80)} (${line.design.sides} side${line.design.sides === 1 ? '' : 's'})`);
  const body = [`Hello Avalon Print,`, '', `Please prepare a quotation for ${quoteIdentifier(quote)} — ${quote.name.replace(/[\r\n]+/g, ' ')}.`, '', ...lines, ...(count > 8 ? [`Plus ${count - 8} more items; see the attached package.`] : []), '', `${budget.pending ? 'Known amount (custom items excluded)' : 'Planning estimate before tax'}: ${money(budget.total)} CAD`, `Fulfilment: ${quote.delivery.method} · ${quote.delivery.city || 'Please confirm location'}`, '', `Contact: ${quote.customer.name}`, quote.customer.company, quote.customer.email, '', 'I will attach the downloaded review package with artwork and print specifications.', 'Please confirm final pricing, timing and print preparation.'].filter(value => value !== undefined).join('\r\n');
  return `mailto:avalon@veridanth.com?subject=${encodeURIComponent(`Quotation request · ${quoteIdentifier(quote)}`)}&body=${encodeURIComponent(body)}`;
}
