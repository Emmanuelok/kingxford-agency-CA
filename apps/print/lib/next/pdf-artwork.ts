import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import type { Design, Product } from '../presswerk/catalog.ts';
import { artworkProduct, export300DpiPng, preflightArtwork, printFaces, type PrintFace } from './artwork.ts';
import { validateLocalDesign } from './workspace-store.ts';

export const PDF_MAX_BYTES = 25 * 1024 * 1024;
export const PDF_MAX_PAGES = 100;
export const PDF_MAX_RENDER_PIXELS = 16_000_000;
export const PDF_MAX_RENDER_EDGE = 8192;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const PDF_ASSETS = '/print-app/pdfjs/';
const POINTS_PER_MM = 72 / 25.4;

export type PdfPageInfo = { pageNumber: number; widthMm: number; heightMm: number };
export type PdfPagePreview = PdfPageInfo & { src: string };
export type PdfPageSelection = { face: PrintFace; pageNumber: number };
export type PdfImportedImage = {
  face: PrintFace; src: string; naturalWidth: number; naturalHeight: number;
  sourcePage: number; sourceWidthMm: number; sourceHeightMm: number; actualDpi: number;
  placement: { x: number; y: number; width: number; height: number };
};
export type PdfImportResult = { filename: string; images: PdfImportedImage[]; warnings: string[] };
export type PdfImportSession = {
  pageCount: number;
  preview: (pageNumber: number, signal?: AbortSignal) => Promise<PdfPagePreview>;
  importPages: (selection: PdfPageSelection[], product: Pick<Product, 'width' | 'height'>, signal?: AbortSignal) => Promise<PdfImportResult>;
  destroy: () => Promise<void>;
};

function cancelled(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('PDF import cancelled.', 'AbortError');
}
function positiveDimensions(width: number, height: number) {
  if (![width, height].every(value => Number.isFinite(value) && value > 0 && value <= 1_000_000)) throw new Error('This PDF has invalid or unsupported page dimensions.');
}
export function validatePdfFile(file: Pick<File, 'size' | 'name' | 'type'>) {
  if (!(file.size > 0) || !Number.isFinite(file.size)) throw new Error('This PDF is empty. Choose another file.');
  if (file.size > PDF_MAX_BYTES) throw new Error('Choose a PDF no larger than 25 MB. Split or optimise this document first.');
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) throw new Error('Choose a PDF document.');
}
export function validatePdfSelection(selection: PdfPageSelection[], pageCount: number) {
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > PDF_MAX_PAGES) throw new Error('Choose a PDF with 1 to 100 pages. Split larger documents first.');
  if (!selection.length || selection.length > 2) throw new Error('Choose a page for at least one print face.');
  const faces = new Set<PrintFace>();
  for (const item of selection) {
    if (!['front', 'back'].includes(item.face) || faces.has(item.face)) throw new Error('Choose at most one page for each print face.');
    if (!Number.isInteger(item.pageNumber) || item.pageNumber < 1 || item.pageNumber > pageCount) throw new Error('A selected page is not in this PDF. Choose it again.');
    faces.add(item.face);
  }
}

/** Fit the whole page within trim; never stretch, crop or discard the margins. */
export function planPdfPlacement(page: Pick<PdfPageInfo, 'widthMm' | 'heightMm'>, product: Pick<Product, 'width' | 'height'>) {
  positiveDimensions(page.widthMm, page.heightMm); positiveDimensions(product.width, product.height);
  const scale = Math.min(product.width / page.widthMm, product.height / page.heightMm);
  const placedWidth = page.widthMm * scale, placedHeight = page.heightMm * scale;
  const desiredWidth = placedWidth / 25.4 * 300, desiredHeight = placedHeight / 25.4 * 300;
  const limit = Math.min(1, PDF_MAX_RENDER_EDGE / desiredWidth, PDF_MAX_RENDER_EDGE / desiredHeight, Math.sqrt(PDF_MAX_RENDER_PIXELS / (desiredWidth * desiredHeight)));
  const pixelWidth = Math.max(1, Math.floor(desiredWidth * limit)), pixelHeight = Math.max(1, Math.floor(desiredHeight * limit));
  const width = Math.min(100, placedWidth / product.width * 100), height = Math.min(100, placedHeight / product.height * 100);
  return {
    placement: { x: Math.max(0, (100 - width) / 2), y: Math.max(0, (100 - height) / 2), width, height },
    pixelWidth, pixelHeight, actualDpi: Math.min(pixelWidth / (placedWidth / 25.4), pixelHeight / (placedHeight / 25.4)),
    reduced: limit < .999, hasMargins: width < 99.5 || height < 99.5,
  };
}

export function pdfExportDimensions(product: Pick<Product, 'width' | 'height'>) {
  positiveDimensions(product.width, product.height);
  const width = Math.round(product.width / 25.4 * 300), height = Math.round(product.height / 25.4 * 300);
  if (width * height > PDF_MAX_RENDER_PIXELS || Math.max(width, height) > PDF_MAX_RENDER_EDGE) throw new Error('This format exceeds the 16-megapixel PDF export limit at 300 DPI. Export SVG for this large format; the PDF will not be silently reduced.');
  return { width, height, widthPoints: product.width * POINTS_PER_MM, heightPoints: product.height * POINTS_PER_MM };
}

function pageInfo(page: PDFPageProxy): PdfPageInfo {
  // The viewport accounts for the PDF page rotation and UserUnit.
  const viewport = page.getViewport({ scale: 1 });
  const widthMm = viewport.width / POINTS_PER_MM, heightMm = viewport.height / POINTS_PER_MM;
  positiveDimensions(widthMm, heightMm);
  return { pageNumber: page.pageNumber, widthMm, heightMm };
}
function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('This page could not be converted. Try a smaller PDF.')), 'image/png'));
}
function dataUrl(blob: Blob, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    cancelled(signal);
    const reader = new FileReader();
    const abort = () => { reader.abort(); reject(new DOMException('PDF import cancelled.', 'AbortError')); };
    const cleanup = () => signal?.removeEventListener('abort', abort);
    reader.onload = () => { cleanup(); resolve(String(reader.result)); };
    reader.onerror = () => { cleanup(); reject(new Error('The converted artwork could not be read.')); };
    reader.onabort = () => { cleanup(); reject(new DOMException('PDF import cancelled.', 'AbortError')); };
    signal?.addEventListener('abort', abort, { once: true });
    reader.readAsDataURL(blob);
  });
}

async function renderPage(page: PDFPageProxy, width: number, height: number, signal?: AbortSignal) {
  cancelled(signal);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const viewport = page.getViewport({ scale: 1 });
  let render: RenderTask | undefined;
  let timedOut = false;
  const abort = () => render?.cancel();
  const timer = setTimeout(() => { timedOut = true; render?.cancel(); }, 30_000);
  signal?.addEventListener('abort', abort, { once: true });
  try {
    render = page.render({ canvas, viewport, transform: [width / viewport.width, 0, 0, height / viewport.height, 0, 0], intent: 'print', background: 'rgb(255,255,255)' });
    await render.promise;
    cancelled(signal);
    return await canvasBlob(canvas);
  } catch (error) {
    cancelled(signal);
    if (timedOut) throw new Error('This page took too long to render. Simplify the PDF or upload a PNG of the page.');
    throw error;
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', abort);
    canvas.width = 0; canvas.height = 0;
    page.cleanup();
  }
}

export async function openPdfImport(file: File, signal?: AbortSignal): Promise<PdfImportSession> {
  validatePdfFile(file); cancelled(signal);
  const bytes = new Uint8Array(await file.arrayBuffer());
  cancelled(signal);
  if (!new TextDecoder('latin1').decode(bytes.subarray(0, 1024)).includes('%PDF-')) throw new Error('The selected file does not contain a valid PDF header.');
  const pdfjs = await import('pdfjs-dist');
  cancelled(signal);
  pdfjs.GlobalWorkerOptions.workerSrc = `${PDF_ASSETS}pdf.worker.min.mjs?v=${pdfjs.version}`;
  // Only binary file data is passed. No viewer, link layer, form scripting,
  // XFA or external PDF URL is created. The worker fetches only local decoders.
  const task = pdfjs.getDocument({
    data: bytes, cMapUrl: `${PDF_ASSETS}cmaps/`, cMapPacked: true,
    standardFontDataUrl: `${PDF_ASSETS}standard_fonts/`, wasmUrl: `${PDF_ASSETS}wasm/`, iccUrl: `${PDF_ASSETS}iccs/`,
    enableXfa: false, stopAtErrors: true, maxImageSize: 60_000_000,
    canvasMaxAreaInBytes: PDF_MAX_RENDER_PIXELS * 4, useWorkerFetch: true,
    disableAutoFetch: true, disableStream: true, disableRange: true,
  });
  let destroyed = false;
  const destroy = async () => { if (!destroyed) { destroyed = true; signal?.removeEventListener('abort', abort); await task.destroy(); } };
  const abort = () => { void destroy().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  let expired = false;
  const timeout = setTimeout(() => { expired = true; abort(); }, 30_000);
  let pdf: PDFDocumentProxy;
  try {
    pdf = await task.promise; cancelled(signal);
    if (expired) throw new Error('This PDF took too long to open. Simplify or split the document.');
    validatePdfSelection([{ face: 'front', pageNumber: 1 }], pdf.numPages);
    if (pdf.isPureXfa) throw new Error('This PDF uses dynamic forms. Save a flattened PDF and try again.');
  } catch (error) {
    await destroy().catch(() => {}); cancelled(signal);
    if (expired) throw new Error('This PDF took too long to open. Simplify or split the document.');
    if (error instanceof Error && error.name === 'PasswordException') throw new Error('This PDF needs a password. Save an unlocked copy and upload it.');
    throw error instanceof Error ? error : new Error('The PDF could not be opened.');
  } finally { clearTimeout(timeout); }
  const getPage = async (number: number, requestSignal?: AbortSignal) => {
    if (destroyed) throw new DOMException('PDF import cancelled.', 'AbortError');
    cancelled(requestSignal); validatePdfSelection([{ face: 'front', pageNumber: number }], pdf.numPages);
    const page = await pdf.getPage(number); cancelled(requestSignal); return page;
  };
  return {
    pageCount: pdf.numPages,
    destroy,
    async preview(pageNumber, requestSignal) {
      const page = await getPage(pageNumber, requestSignal), info = pageInfo(page);
      const scale = 360 / Math.max(info.widthMm, info.heightMm);
      const blob = await renderPage(page, Math.max(1, Math.round(info.widthMm * scale)), Math.max(1, Math.round(info.heightMm * scale)), requestSignal);
      return { ...info, src: await dataUrl(blob, requestSignal) };
    },
    async importPages(selection, product, requestSignal) {
      validatePdfSelection(selection, pdf.numPages);
      const images: PdfImportedImage[] = [], warnings: string[] = [];
      // Deliberately sequential: hold no more than one full-size canvas.
      for (const item of selection) {
        const page = await getPage(item.pageNumber, requestSignal), info = pageInfo(page), plan = planPdfPlacement(info, product);
        const blob = await renderPage(page, plan.pixelWidth, plan.pixelHeight, requestSignal);
        if (blob.size > MAX_IMAGE_BYTES) throw new Error(`Page ${item.pageNumber} produces more than 12 MB of artwork. Optimise that page and try again.`);
        const src = await dataUrl(blob, requestSignal); cancelled(requestSignal);
        if (src.length > 17_000_000) throw new Error(`Page ${item.pageNumber} exceeds the saved-artwork limit. Optimise the PDF and try again.`);
        const label = item.face === 'front' ? 'Front' : 'Back';
        if (plan.reduced) warnings.push(`${label}: rendered at ${Math.floor(plan.actualDpi)} PPI at the placed print size because of the browser image limit. Review fine details.`);
        if (plan.hasMargins) warnings.push(`${label}: the PDF proportions differ from the product. The whole page is fitted with margins, without cropping or stretching.`);
        images.push({ face: item.face, src, naturalWidth: plan.pixelWidth, naturalHeight: plan.pixelHeight, sourcePage: item.pageNumber, sourceWidthMm: info.widthMm, sourceHeightMm: info.heightMm, actualDpi: plan.actualDpi, placement: plan.placement });
      }
      cancelled(requestSignal);
      return { filename: file.name, images, warnings };
    },
  };
}

export type PdfRasterPage = { face: PrintFace; png: Uint8Array; widthMm: number; heightMm: number };
/** Separate byte assembly from canvas rendering so PDF page geometry is testable. */
export async function createRasterPdf(pages: PdfRasterPage[], title: string): Promise<Blob> {
  if (!pages.length || pages.length > 2 || new Set(pages.map(page => page.face)).size !== pages.length) throw new Error('The PDF needs one or two distinct print faces.');
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(title.slice(0, 80)); pdf.setCreator('Avalon Print');
  pdf.setSubject('Raster artwork · 300 DPI · RGB · trim size · no bleed or colour separation');
  for (const item of pages) {
    if (!['front', 'back'].includes(item.face)) throw new Error('The PDF contains an invalid print face.');
    const dimensions = pdfExportDimensions({ width: item.widthMm, height: item.heightMm });
    const image = await pdf.embedPng(item.png);
    if (image.width !== dimensions.width || image.height !== dimensions.height) throw new Error('The artwork raster does not match the required 300 DPI page dimensions.');
    const page = pdf.addPage([dimensions.widthPoints, dimensions.heightPoints]);
    page.setTrimBox(0, 0, dimensions.widthPoints, dimensions.heightPoints);
    page.drawImage(image, { x: 0, y: 0, width: dimensions.widthPoints, height: dimensions.heightPoints });
  }
  return new Blob([new Uint8Array(await pdf.save())], { type: 'application/pdf' });
}

export async function exportArtworkPdf(design: Design): Promise<Blob> {
  const snapshot = validateLocalDesign(design), product = artworkProduct(snapshot);
  pdfExportDimensions(product);
  const blockers = preflightArtwork(snapshot).filter(issue => issue.severity === 'error');
  if (blockers.length) throw new Error(`Review the artwork before exporting PDF. ${blockers[0].title}.`);
  const pages: PdfRasterPage[] = [];
  for (const { face, design: artwork } of printFaces(snapshot)) {
    const png = await export300DpiPng(artwork);
    pages.push({ face, png: new Uint8Array(await png.arrayBuffer()), widthMm: product.width, heightMm: product.height });
  }
  return createRasterPdf(pages, snapshot.name);
}
