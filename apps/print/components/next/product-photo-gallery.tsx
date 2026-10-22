/* Standalone Vite print app: native images are intentionally used instead of Next Image. */
/* eslint-disable @next/next/no-img-element */
import { useId, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './product-photo-gallery.css';

export type ProductPhoto = { src: string; srcSet?: string; thumbnail?: string; alt: string; label: string; width: number; height: number };

/** Photographic product examples; independent of the editable artwork and quote. */
export default function ProductPhotoGallery({ name, photos }: { name: string; photos: readonly ProductPhoto[] }) {
  const [index, setIndex] = useState(0);
  const id = useId();
  const selected = photos[index] ?? photos[0];
  if (!selected) return null;
  const move = (offset: number) => setIndex(current => (current + offset + photos.length) % photos.length);
  return <div className="pp-gallery" role="region" aria-roledescription="carousel" aria-label={`${name} product photographs`} onKeyDown={event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'Home') { event.preventDefault(); setIndex(0); }
    if (event.key === 'End') { event.preventDefault(); setIndex(photos.length - 1); }
  }}>
    <figure className="pp-stage" id={`${id}-image`}>
      <img key={selected.src} src={selected.src} srcSet={selected.srcSet} sizes="(max-width: 850px) 100vw, 50vw" alt={selected.alt} width={selected.width} height={selected.height} decoding="async" />
      <figcaption><span>{selected.label}</span><span aria-live="polite" aria-atomic="true">{index + 1} / {photos.length}</span></figcaption>
      {photos.length > 1 && <div className="pp-arrows"><button type="button" aria-label={`Previous ${name} photograph`} aria-controls={`${id}-image`} onClick={() => move(-1)}><ChevronLeft size={20}/></button><button type="button" aria-label={`Next ${name} photograph`} aria-controls={`${id}-image`} onClick={() => move(1)}><ChevronRight size={20}/></button></div>}
    </figure>
    {photos.length > 1 && <div className="pp-thumbnails" role="group" aria-label={`Choose a ${name} photograph`}>{photos.map((photo, position) => <button key={photo.src} type="button" aria-label={`Show ${photo.label.toLowerCase()} of ${name}`} aria-pressed={position === index} aria-controls={`${id}-image`} onClick={() => setIndex(position)}><img src={photo.thumbnail ?? photo.src} alt="" width="120" height="80" loading="lazy" decoding="async"/><span>{photo.label}</span></button>)}</div>}
    <p className="pp-disclosure">Generated product mockups. Final colours, materials and specifications are confirmed with your quote.</p>
  </div>;
}
