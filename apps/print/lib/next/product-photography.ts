import type { Product } from '../presswerk/catalog';

export const photoViews = [
  { id: 'hero', label: 'Studio view' },
  { id: 'angle', label: 'Alternate view' },
  { id: 'detail', label: 'Material detail' },
] as const;
export type PhotoView = typeof photoViews[number]['id'];
export const photographyRoot = '/print-app/images/products-v4';
export function photoSource(productId: string, view: PhotoView, width = 1536) {
  return `${photographyRoot}/${productId}-${view}-${width}.webp`;
}
export function photoSources(productId: string, view: PhotoView) {
  return [480, 960, 1536].map(width => `${photoSource(productId, view, width)} ${width}w`).join(', ');
}
export function productPhotos(product: Product) {
  return photoViews.map(view => ({
    src: photoSource(product.id, view.id),
    srcSet: photoSources(product.id, view.id),
    thumbnail: photoSource(product.id, view.id, 480),
    alt: `${product.name}: ${view.label.toLowerCase()} of a generated ${product.material} product mockup`,
    label: view.label,
    width: 1536,
    height: 1024,
  }));
}
