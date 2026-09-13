import type { Design } from '../presswerk/catalog.ts';
import { renderArtworkCanvas } from './artwork.ts';

export type Point = readonly [number, number];
export type PhotoQuad = readonly [Point, Point, Point, Point];
export type PhotoScene = {
  id: string;
  productId: string;
  name: string;
  source: string;
  width: number;
  height: number;
  /** Clockwise corners in the inspected source image: top left first. */
  area: PhotoQuad;
  fit: 'fill' | 'contain';
  note: string;
};

/** Original blank photographs; customer artwork is never baked into these assets. */
export const PHOTO_SCENES: readonly PhotoScene[] = [
  {
    id: 'cards-limestone', productId: 'cards', name: 'Limestone studio',
    source: '/print-app/images/mockups/cards-limestone.webp', width: 1536, height: 1024,
    area: [[393, 209], [1211, 258], [1172, 691], [315, 622]], fit: 'fill',
    note: 'Your artwork on a card face. Paper, colour and finish are illustrative.',
  },
  {
    id: 'tee-cotton', productId: 'tee', name: 'Cotton flatlay',
    source: '/print-app/images/mockups/tee-cotton.webp', width: 1536, height: 1024,
    area: [[573, 244], [963, 244], [963, 712], [573, 712]], fit: 'contain',
    note: 'Your print area on a white tee. Garment fit and print placement require a production proof.',
  },
  {
    id: 'poster-gallery', productId: 'poster', name: 'Gallery wall',
    source: '/print-app/images/mockups/poster-gallery.webp', width: 1536, height: 1024,
    area: [[478, 102], [1039, 102], [1039, 886], [478, 886]], fit: 'contain',
    note: 'Artwork proportions are preserved. Frame and room are for presentation only.',
  },
];

export function photoSceneFor(productId: string) {
  return PHOTO_SCENES.find(scene => scene.productId === productId);
}

export function supportsPhotoPreview(productId: string) {
  return !!photoSceneFor(productId);
}

/** Unit-square perspective transform. Keeping this mathematical avoids WebGL requirements. */
export function quadTransform(quad: PhotoQuad) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const denominator = dx1 * dy2 - dx2 * dy1;
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-8) throw new Error('The photo print area is invalid.');
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1] as const;
}

export function transformPoint(matrix: readonly number[], x: number, y: number): Point {
  const denominator = matrix[6] * x + matrix[7] * y + matrix[8];
  return [(matrix[0] * x + matrix[1] * y + matrix[2]) / denominator, (matrix[3] * x + matrix[4] * y + matrix[5]) / denominator];
}

export function inverseTransform(m: readonly number[]) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-8) throw new Error('The photo print area cannot be projected.');
  return [e * i - f * h, c * h - b * i, b * f - c * e, f * g - d * i, a * i - c * g, c * d - a * f, d * h - e * g, b * g - a * h, a * e - b * d].map(value => value / determinant);
}

/** Contain fits keep product proportions intact; the remaining photograph stays visible. */
export function fittedPhotoArea(scene: PhotoScene, aspect: number): PhotoQuad {
  if (scene.fit === 'fill') return scene.area;
  if (!Number.isFinite(aspect) || aspect <= 0) throw new Error('The artwork proportions are invalid.');
  const [tl, tr, , bl] = scene.area;
  const width = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const height = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
  const targetAspect = width / height;
  const unitWidth = Math.min(1, aspect / targetAspect), unitHeight = Math.min(1, targetAspect / aspect);
  const left = (1 - unitWidth) / 2, top = (1 - unitHeight) / 2;
  const matrix = quadTransform(scene.area);
  return [transformPoint(matrix, left, top), transformPoint(matrix, left + unitWidth, top), transformPoint(matrix, left + unitWidth, top + unitHeight), transformPoint(matrix, left, top + unitHeight)];
}

const sceneImages = new Map<string, Promise<HTMLImageElement>>();
function loadScene(scene: PhotoScene) {
  let pending = sceneImages.get(scene.source);
  if (!pending) {
    pending = (async () => {
      const image = new Image();
      image.src = scene.source;
      await image.decode();
      if (image.naturalWidth !== scene.width || image.naturalHeight !== scene.height) throw new Error('The photo scene dimensions have changed. Choose another preview.');
      return image;
    })().catch(() => { sceneImages.delete(scene.source); throw new Error('The photograph could not load. Try again or use the flat proof.'); });
    sceneImages.set(scene.source, pending);
  }
  return pending;
}

/** One compositor serves both the visible preview and the downloadable scene. */
export async function renderPhotoScene(design: Design, scene: PhotoScene): Promise<HTMLCanvasElement> {
  if (design.productId !== scene.productId) throw new Error('This photograph belongs to a different product.');
  const base = await loadScene(scene);
  const artwork = await renderArtworkCanvas(design, 1800);
  const canvas = document.createElement('canvas');
  const overlay = document.createElement('canvas');
  canvas.width = overlay.width = scene.width;
  canvas.height = overlay.height = scene.height;
  try {
    const ctx = canvas.getContext('2d'), source = artwork.getContext('2d'), target = overlay.getContext('2d');
    if (!ctx || !source || !target) throw new Error('Your browser could not create this photo preview.');
    ctx.drawImage(base, 0, 0);
    const pixels = source.getImageData(0, 0, artwork.width, artwork.height).data;
    const area = fittedPhotoArea(scene, artwork.width / artwork.height);
    const inverse = inverseTransform(quadTransform(area));
    const left = Math.max(0, Math.floor(Math.min(...area.map(p => p[0]))));
    const top = Math.max(0, Math.floor(Math.min(...area.map(p => p[1]))));
    const right = Math.min(scene.width, Math.ceil(Math.max(...area.map(p => p[0]))));
    const bottom = Math.min(scene.height, Math.ceil(Math.max(...area.map(p => p[1]))));
    const output = target.createImageData(right - left, bottom - top);
    const out = output.data, width = artwork.width, height = artwork.height;
    // Inverse mapping avoids triangle seams and keeps every scene/export pixel in agreement.
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      const divisor = inverse[6] * (x + .5) + inverse[7] * (y + .5) + inverse[8];
      const u = (inverse[0] * (x + .5) + inverse[1] * (y + .5) + inverse[2]) / divisor;
      const v = (inverse[3] * (x + .5) + inverse[4] * (y + .5) + inverse[5]) / divisor;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const sx = u * (width - 1), sy = v * (height - 1), x0 = Math.floor(sx), y0 = Math.floor(sy);
      const x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1), fx = sx - x0, fy = sy - y0;
      const at = ((y - top) * output.width + x - left) * 4;
      for (let channel = 0; channel < 4; channel++) {
        const upper = pixels[(y0 * width + x0) * 4 + channel] * (1 - fx) + pixels[(y0 * width + x1) * 4 + channel] * fx;
        const lower = pixels[(y1 * width + x0) * 4 + channel] * (1 - fx) + pixels[(y1 * width + x1) * 4 + channel] * fx;
        out[at + channel] = upper * (1 - fy) + lower * fy;
      }
    }
    target.putImageData(output, left, top);
    // Multiply retains the photographed paper/cotton texture beneath the ink.
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(overlay, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    return canvas;
  } catch (error) {
    canvas.width = canvas.height = 0;
    throw error;
  } finally {
    artwork.width = artwork.height = overlay.width = overlay.height = 0;
  }
}
