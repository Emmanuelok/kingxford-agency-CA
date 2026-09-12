import { products } from '../presswerk/catalog.ts';
import type { Design, DesignLayer, Product } from '../presswerk/catalog.ts';

export type Bounds = { x: number; y: number; width: number; height: number };
export type ArtworkIssue = { id: string; severity: 'warning' | 'error'; title: string; detail: string; layerId?: string };
export const ARTWORK_FONTS = ['Arial', 'Georgia', 'Verdana', 'Courier New'];
export const copyDesign = (design: Design): Design => JSON.parse(JSON.stringify(design));
export function artworkProduct(design: Design): Product {
  const product = products.find(p => p.id === design.productId);
  if (!product) throw new Error('This product is unavailable. Choose a product from the catalogue.');
  return product;
}
export function safeColor(value: string) { return /^#[0-9a-f]{6}$/i.test(value) ? value : '#171b18'; }
export function safeFont(font?: string) { return ARTWORK_FONTS.includes(font || '') ? font! : 'Arial'; }
const imageSourceChecks = new Map<string, boolean>();
export function safeImageSource(src?: string): string | undefined {
  if (!src || src.length > 17 * 1024 * 1024) return undefined;
  let allowed = imageSourceChecks.get(src);
  if (allowed === undefined) { allowed = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(src); if (imageSourceChecks.size >= 8) imageSourceChecks.delete(imageSourceChecks.keys().next().value!); imageSourceChecks.set(src, allowed); }
  return allowed ? src : undefined;
}
export function artworkFingerprint(design: Design) {
  // This is a local review identity, not a cryptographic approval or an order authorization.
  return JSON.stringify({ productId: design.productId, background: design.background, sides: design.sides, finish: design.finish, layers: design.layers.map(layer => { const copy = { ...layer }; delete copy.assetPath; return copy; }) });
}
let measuringContext: CanvasRenderingContext2D | null = null;
function textWidth(text: string, font: string, size: number, weight: number) {
  if (typeof document !== 'undefined') {
    measuringContext ||= document.createElement('canvas').getContext('2d');
    if (measuringContext) { measuringContext.font = `${weight} ${size}px "${font}"`; return measuringContext.measureText(text).width; }
  }
  // Tests / server previews use a conservative estimate; browser checks use real font metrics.
  return text.length * size * (font === 'Courier New' ? .6 : .64);
}
export function unrotatedLayerBounds(layer: DesignLayer, product: Pick<Product, 'width' | 'height'>): Bounds {
  const x = layer.x / 100 * product.width, y = layer.y / 100 * product.height;
  if (layer.type !== 'text') return { x, y, width: (layer.width || 30) / 100 * product.width, height: (layer.height || 25) / 100 * product.height };
  const size = layer.size / 100 * product.width;
  const lines = layer.text.split('\n');
  return { x, y, width: Math.max(size * .3, ...lines.map(line => textWidth(line, safeFont(layer.font), size, layer.weight || 700))), height: lines.length * size * 1.1 };
}
export function rotatedBounds(bounds: Bounds, degrees: number): Bounds {
  const radians = degrees * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
  const corners = [[0, 0], [bounds.width, 0], [0, bounds.height], [bounds.width, bounds.height]].map(([x, y]) => [bounds.x + x * cos - y * sin, bounds.y + x * sin + y * cos]);
  const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
export function layerBounds(layer: DesignLayer, product: Pick<Product, 'width' | 'height'>): Bounds { return rotatedBounds(unrotatedLayerBounds(layer, product), layer.rotation); }
export function imagePpi(layer: DesignLayer, product: Pick<Product, 'width' | 'height'>) {
  if (layer.type !== 'image' || !layer.naturalWidth || !layer.naturalHeight) return null;
  const width = (layer.width || 30) / 100 * product.width, height = (layer.height || 25) / 100 * product.height;
  return { horizontal: layer.naturalWidth / (width / 25.4), vertical: layer.naturalHeight / (height / 25.4), minimum: Math.min(layer.naturalWidth / (width / 25.4), layer.naturalHeight / (height / 25.4)) };
}
export function imagePercentSize(naturalWidth: number, naturalHeight: number, product: Pick<Product, 'width' | 'height'>, maximum = 72) {
  if (!(naturalWidth > 0) || !(naturalHeight > 0)) throw new Error('The image dimensions could not be read.');
  const scale = Math.min(product.width * maximum / 100 / naturalWidth, product.height * maximum / 100 / naturalHeight);
  return { width: naturalWidth * scale / product.width * 100, height: naturalHeight * scale / product.height * 100 };
}
export function alignLayer(layer: DesignLayer, product: Pick<Product, 'width' | 'height'>, direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): DesignLayer {
  const b = layerBounds(layer, product); let dx = 0, dy = 0;
  if (direction === 'left') dx = -b.x;
  if (direction === 'center') dx = (product.width - b.width) / 2 - b.x;
  if (direction === 'right') dx = product.width - b.x - b.width;
  if (direction === 'top') dy = -b.y;
  if (direction === 'middle') dy = (product.height - b.height) / 2 - b.y;
  if (direction === 'bottom') dy = product.height - b.y - b.height;
  return { ...layer, x: Math.min(100, Math.max(0, layer.x + dx / product.width * 100)), y: Math.min(100, Math.max(0, layer.y + dy / product.height * 100)) };
}
export function preflightArtwork(design: Design): ArtworkIssue[] {
  const p = artworkProduct(design), issues: ArtworkIssue[] = [];
  if (!design.layers.some(l => l.opacity > 0 && (l.type !== 'text' || l.text.trim()))) issues.push({ id: 'empty', severity: 'error', title: 'There is no visible artwork', detail: 'Add text, a shape or an image before requesting print.' });
  if (design.sides !== 1) issues.push({ id: 'single-face', severity: 'error', title: 'A reverse side still needs artwork', detail: 'This studio edits one print face. Quote the reverse side separately or set this project to one side.' });
  for (const layer of design.layers) {
    if (layer.opacity === 0 || (layer.type === 'text' && !layer.text.trim())) continue;
    const name = layer.type === 'text' ? layer.text.slice(0, 35).replace(/\n/g, ' ') : layer.text || (layer.type === 'image' ? 'Image' : 'Shape');
    const b = layerBounds(layer, p), tolerance = .03;
    if (b.x < -tolerance || b.y < -tolerance || b.x + b.width > p.width + tolerance || b.y + b.height > p.height + tolerance) issues.push({ id: `${layer.id}-bounds`, severity: 'warning', title: `${name} extends past the edge`, detail: 'The part outside the artwork area is clipped. Check that this is intentional.', layerId: layer.id });
    else if (layer.type === 'text' && (b.x < 3 || b.y < 3 || p.width - b.x - b.width < 3 || p.height - b.y - b.height < 3)) issues.push({ id: `${layer.id}-safe`, severity: 'warning', title: `${name} is near the trim`, detail: 'Move essential text at least 3 mm inside the artwork edge. Final supplier margins may differ.', layerId: layer.id });
    if (layer.type === 'text' && layer.size / 100 * p.width * 72 / 25.4 < 6) issues.push({ id: `${layer.id}-small`, severity: 'warning', title: 'Small text may be difficult to read', detail: `${name} is below 6 pt at the selected print size.`, layerId: layer.id });
    if (layer.type === 'image') {
      if (!safeImageSource(layer.src)) issues.push({ id: `${layer.id}-missing`, severity: 'error', title: 'An image is unavailable', detail: `Upload ${name} again before exporting or requesting print.`, layerId: layer.id });
      const resolution = imagePpi(layer, p);
      if (!resolution) issues.push({ id: `${layer.id}-resolution`, severity: 'warning', title: 'Image resolution is unknown', detail: `Upload ${name} again so its original pixel dimensions can be checked.`, layerId: layer.id });
      else if (resolution.minimum < 300) issues.push({ id: `${layer.id}-resolution`, severity: 'warning', title: `${name}: ${Math.round(resolution.minimum)} PPI`, detail: `${Math.round(resolution.horizontal)} × ${Math.round(resolution.vertical)} PPI at this size. 300 PPI is a useful target for close-view print; confirm large-format requirements with production.`, layerId: layer.id });
    }
  }
  return issues;
}
export function rasterDimensions(product: Pick<Product, 'width' | 'height'>, dpi = 300) {
  const width = Math.round(product.width / 25.4 * dpi), height = Math.round(product.height / 25.4 * dpi);
  if (width * height > 100_000_000 || Math.max(width, height) > 32_767) throw new Error(`A ${dpi} DPI export at this physical size exceeds the browser limit of 100 megapixels or 32,767 pixels per edge. Export SVG and have production prepare the final raster file.`);
  return { width, height };
}
export const escapeXml = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
export function artworkSvg(design: Design): string {
  const p = artworkProduct(design), width = 1000, height = width * p.height / p.width;
  const layers = design.layers.map(layer => {
    const transform = `translate(${layer.x / 100 * width} ${layer.y / 100 * height}) rotate(${layer.rotation})`;
    let content = '';
    if (layer.type === 'text') content = `<text fill="${safeColor(layer.color)}" font-family="${safeFont(layer.font)}" font-weight="${layer.weight || 700}" font-size="${layer.size / 100 * width}" dominant-baseline="text-before-edge">${layer.text.split('\n').map((line, i) => `<tspan x="0" y="${i * layer.size / 100 * width * 1.1}">${escapeXml(line)}</tspan>`).join('')}</text>`;
    else if (layer.type === 'shape') content = `<rect width="${(layer.width || 30) / 100 * width}" height="${(layer.height || 25) / 100 * height}" fill="${safeColor(layer.color)}"/>`;
    else { const src = safeImageSource(layer.src); if (src) content = `<image width="${(layer.width || 30) / 100 * width}" height="${(layer.height || 25) / 100 * height}" href="${escapeXml(src)}" preserveAspectRatio="none"/>`; }
    return `<g opacity="${layer.opacity}" transform="${transform}">${content}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${p.width}mm" height="${p.height}mm" viewBox="0 0 ${width} ${height}"><title>${escapeXml(design.name)}</title><defs><clipPath id="trim"><rect width="${width}" height="${height}"/></clipPath></defs><g clip-path="url(#trim)"><rect width="${width}" height="${height}" fill="${safeColor(design.background)}"/>${layers}</g></svg>`;
}
async function drawArtwork(design: Design, width: number, height: number) {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Your browser could not create an artwork canvas. Try a smaller image or another browser.');
  ctx.fillStyle = safeColor(design.background); ctx.fillRect(0, 0, width, height);
  try { for (const layer of design.layers) {
    ctx.save(); ctx.translate(layer.x / 100 * width, layer.y / 100 * height); ctx.rotate(layer.rotation * Math.PI / 180); ctx.globalAlpha = layer.opacity; ctx.fillStyle = safeColor(layer.color);
    if (layer.type === 'text') { const size = layer.size / 100 * width; ctx.font = `${layer.weight || 700} ${size}px "${safeFont(layer.font)}"`; ctx.textBaseline = 'top'; layer.text.split('\n').forEach((line, i) => ctx.fillText(line, 0, i * size * 1.1)); }
    else if (layer.type === 'shape') ctx.fillRect(0, 0, (layer.width || 30) / 100 * width, (layer.height || 25) / 100 * height);
    else { const src = safeImageSource(layer.src); if (!src) throw new Error('An image is missing. Upload it again before exporting.'); const image = new Image(); image.src = src; try { await image.decode(); } catch { throw new Error('An image could not be opened. Replace it with a PNG, JPEG or WebP file.'); } if (image.naturalWidth * image.naturalHeight > 60_000_000) throw new Error('An image exceeds 60 megapixels. Resize it before exporting.'); ctx.drawImage(image, 0, 0, (layer.width || 30) / 100 * width, (layer.height || 25) / 100 * height); }
    ctx.restore();
  } } catch (error) { canvas.width = 0; canvas.height = 0; throw error; }
  return canvas;
}
export async function renderArtworkCanvas(design: Design, maxDimension = 1600) { const p = artworkProduct(design), scale = maxDimension / Math.max(p.width, p.height); return drawArtwork(design, Math.round(p.width * scale), Math.round(p.height * scale)); }
// Canvas PNGs default to 96 DPI metadata. Add the physical pixel density explicitly.
export function pngDensity(bytes: Uint8Array, dpi = 300) {
  const ppm = Math.round(dpi / .0254), chunk = new Uint8Array(21), view = new DataView(chunk.buffer);
  view.setUint32(0, 9); chunk.set([112, 72, 89, 115], 4); view.setUint32(8, ppm); view.setUint32(12, ppm); chunk[16] = 1;
  let crc = 0xffffffff; for (const byte of chunk.subarray(4, 17)) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } view.setUint32(17, (crc ^ 0xffffffff) >>> 0);
  const parts: Uint8Array[] = [bytes.subarray(0, 8)]; let position = 8, inserted = false;
  while (position + 12 <= bytes.length) { const length = new DataView(bytes.buffer, bytes.byteOffset + position, 4).getUint32(0), end = position + length + 12; if (end > bytes.length) throw new Error('The browser returned an invalid PNG file.'); const type = String.fromCharCode(...bytes.subarray(position + 4, position + 8)); if (type !== 'pHYs') parts.push(bytes.subarray(position, end)); if (type === 'IHDR' && !inserted) { parts.push(chunk); inserted = true; } position = end; }
  const result = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0)); let offset = 0; for (const part of parts) { result.set(part, offset); offset += part.length; } return result;
}
export async function export300DpiPng(design: Design): Promise<Blob> {
  const { width, height } = rasterDimensions(artworkProduct(design)), canvas = await drawArtwork(design, width, height);
  try { const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('The export is too large for this browser. Use SVG instead.')), 'image/png')); const bytes = pngDensity(new Uint8Array(await blob.arrayBuffer())); return new Blob([bytes], { type: 'image/png' }); }
  finally { canvas.width = 0; canvas.height = 0; }
}
export function downloadArtwork(blob: Blob, filename: string) { const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
