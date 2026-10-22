/* Standalone Vite print app: native responsive images are intentional. */
/* eslint-disable @next/next/no-img-element */
import type { Product } from '../../lib/presswerk/catalog';
import { photoSource, photoSources } from '../../lib/next/product-photography';
import './product-photography.css';

export default function ProductVisual({ product, small = false }: { product: Product; small?: boolean }) {
  return <div className={'av-product-visual av-product-photo' + (small ? ' small' : '')} data-product={product.id}>
    <img src={photoSource(product.id, 'hero', 960)} srcSet={photoSources(product.id, 'hero')} sizes={small ? '(max-width: 650px) 45vw, 240px' : '(max-width: 650px) 48vw, (max-width: 1100px) 32vw, 340px'} alt={`${product.name}: generated product mockup in ${product.material}`} width="1536" height="1024" loading="lazy" decoding="async" />
  </div>;
}
