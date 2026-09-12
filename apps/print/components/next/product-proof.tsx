'use client';

import { useId } from 'react';
import type { Product } from '@/lib/presswerk/catalog';

/** A deliberately illustrative, aspect-correct alternative for devices without WebGL. */
export default function ProductProof({ product, artwork, dark = false }: { product: Product; artwork: string; dark?: boolean }) {
  const id = useId().replace(/:/g, '');
  const paint = (x: number, y: number, width: number, height: number, clip?: string) => (
    <image href={artwork} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid meet" clipPath={clip ? `url(#${id}-${clip})` : undefined} />
  );
  const scale = Math.min(390 / product.width, 330 / product.height);
  const width = product.width * scale;
  const height = product.height * scale;
  const x = 300 - width / 2;
  const y = 245 - height / 2;
  const ceramic = `url(#${id}-ceramic)`;
  const fabric = `url(#${id}-fabric)`;
  const frames: Record<string, string> = { mug: '108 111 393 310', bottle: '166 53 268 384', tee: '104 77 392 364', hoodie: '101 39 398 404', tote: '146 43 308 404', cap: '128 82 369 349' };
  const frame = frames[product.id] || `${x - 38} ${y - 33} ${width + 88} ${height + 102}`;
  return <svg viewBox={frame} role="img" aria-label={`${product.name} product illustration with your artwork`} style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
    <defs>
      <linearGradient id={`${id}-ceramic`} x1="0" x2="1"><stop stopColor="#bfc4c6" /><stop offset=".13" stopColor="#edf0f0" /><stop offset=".35" stopColor="#fff" /><stop offset=".73" stopColor="#f4f5f4" /><stop offset="1" stopColor="#b6bec1" /></linearGradient>
      <linearGradient id={`${id}-fabric`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9f7f0" /><stop offset=".36" stopColor="#eae5d8" /><stop offset=".72" stopColor="#dfd8c7" /><stop offset="1" stopColor="#c0b8a5" /></linearGradient>
      <linearGradient id={`${id}-shine`}><stop stopColor="#0e1c25" stopOpacity=".24" /><stop offset=".16" stopColor="#fff" stopOpacity=".19" /><stop offset=".43" stopColor="#fff" stopOpacity=".05" /><stop offset=".76" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#0e1c25" stopOpacity=".26" /></linearGradient>
      <radialGradient id={`${id}-shadow`}><stop stopColor="#0b1015" stopOpacity={dark ? .65 : .3} /><stop offset=".42" stopColor="#0b1015" stopOpacity={dark ? .28 : .14} /><stop offset="1" stopColor="#0b1015" stopOpacity="0" /></radialGradient>
      <linearGradient id={`${id}-interior`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#929da3" /><stop offset="1" stopColor="#dfe4e5" /></linearGradient>
      <filter id={`${id}-contact`} x="-40%" y="-200%" width="180%" height="500%"><feGaussianBlur stdDeviation="4" /></filter>
      <clipPath id={`${id}-mug`}><path d="M161 174 Q275 192 389 174 L380 350 Q277 387 170 350Z" /></clipPath>
      <clipPath id={`${id}-bottle`}><rect x="242" y="194" width="116" height="174" rx="3" /></clipPath>
    </defs>
    <ellipse cx={product.id === 'mug' ? 294 : 304} cy={product.id === 'mug' ? 393 : product.id === 'cap' ? 396 : ['bottle', 'tee', 'hoodie', 'tote'].includes(product.id) ? 419 : y + height + 35} rx={product.id === 'bottle' ? 96 : width / 2 + 27} ry={product.id === 'mug' ? 23 : 18} fill={`url(#${id}-shadow)`} />
    {product.id === 'mug' && <ellipse cx="279" cy="380" rx="97" ry="9" fill="#0b1015" opacity={dark ? '.35' : '.17'} filter={`url(#${id}-contact)`} />}
    {product.id === 'mug' ? <g>
      <path d="M385 188 C501 160 501 346 382 329" fill="none" stroke="#d5d6cb" strokeWidth="27" />
      <path d="M388 186 C481 170 485 329 386 326" fill="none" stroke="#f9f8ef" strokeWidth="15" />
      <path d="M160 158 Q275 128 390 158 L380 357 Q277 403 170 357Z" fill={ceramic} stroke="#d1d2c5" strokeWidth="2" />
      {/* A centred section of the wrap is visible; the exact flat proof retains the complete artwork. */}
      {paint(275 - (product.width / product.height * 183) / 2, 174, product.width / product.height * 183, 183, 'mug')}
      <path d="M160 158 Q275 185 390 158 L380 357 Q277 390 170 357Z" fill={`url(#${id}-shine)`} />
      <ellipse cx="275" cy="158" rx="115" ry="27" fill="#fcfdfc" stroke="#c6cdd0" strokeWidth="2" />
      <ellipse cx="275" cy="158" rx="101" ry="18" fill={`url(#${id}-interior)`} />
      <path d="M177 159 Q275 181 373 159 Q275 193 177 159" fill="#edf0f0" />
      <path d="M183 357 Q274 383 366 357" fill="none" stroke="#fffdf2" strokeWidth="4" opacity=".7" />
    </g> : product.id === 'bottle' ? <g>
      <path d="M231 385 L231 175 Q231 149 268 127 L268 107 H332 V127 Q369 149 369 175 V385 Q369 409 300 409 Q231 409 231 385Z" fill={ceramic} stroke="#c7cec2" strokeWidth="2" />
      <rect x="266" y="82" width="68" height="48" rx="9" fill="#25473a" />
      <path d="M275 94 H325 M275 102 H325 M275 110 H325" stroke="#668070" strokeWidth="2" opacity=".6" />
      {paint(242, 194, 116, 174, 'bottle')}
      <rect x="231" y="185" width="138" height="201" rx="13" fill={`url(#${id}-shine)`} />
      <path d="M247 166 Q243 196 244 373" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="5" />
    </g> : product.id === 'tee' || product.id === 'hoodie' ? <g>
      {product.id === 'hoodie' && <path d="M246 136 Q220 51 301 62 Q380 54 354 136" fill={fabric} stroke="#c6bdab" strokeWidth="2" />}
      <path d={product.id === 'hoodie' ? 'M243 112 L182 136 L125 369 L181 381 L214 244 L211 411 H389 L386 244 L419 381 L475 369 L418 136 L357 112 Q300 165 243 112Z' : 'M243 112 L182 136 L127 223 L186 257 L213 217 L211 411 H389 L387 217 L414 257 L473 223 L418 136 L357 112 Q300 165 243 112Z'} fill={fabric} stroke="#c9c1af" strokeWidth="2" />
      <path d="M243 113 Q300 176 357 113 M222 399 H378" fill="none" stroke="#bdb59f" strokeWidth="2" />
      {paint(235, product.id === 'hoodie' ? 177 : 172, 130, product.id === 'hoodie' ? 146 : 186)}
      {product.id === 'hoodie' && <><path d="M263 342 H337 L350 375 V389 H250 V375Z" fill="#d4cbb5" stroke="#bfb59e" /><path d="M275 143 V190 M325 143 V190" stroke="#b1a88f" strokeWidth="3" /></>}
    </g> : product.id === 'tote' ? <g>
      <path d="M239 182 V122 C239 43 361 43 361 122 V182" fill="none" stroke="#b5aa91" strokeWidth="16" />
      <path d="M239 182 V122 C239 43 361 43 361 122 V182" fill="none" stroke="#e5ddc8" strokeWidth="10" />
      <path d="M177 163 H423 L413 404 Q300 431 187 404Z" fill={fabric} stroke="#c2b69b" strokeWidth="2" />
      <path d="M183 179 H417 M200 188 L207 396 M401 188 L393 396" stroke="#c4b99f" strokeWidth="2" fill="none" />
      {paint(212, 203, 176, 178)}
      <path d="M237 174 V145 M363 174 V145" stroke="#d7ccb3" strokeWidth="13" />
    </g> : product.id === 'cap' ? <g>
      <path d="M169 308 Q159 114 300 112 Q445 116 431 308Z" fill={fabric} stroke="#c4baa4" strokeWidth="2" />
      <path d="M175 299 Q300 261 427 299 Q490 365 415 392 Q311 422 169 353Z" fill="#d6ccb6" stroke="#b6ab94" strokeWidth="2" />
      <path d="M300 115 V285 M290 122 Q206 186 205 295 M310 122 Q394 186 395 295" fill="none" stroke="#c6bca5" strokeWidth="2" />
      {paint(229, 192, 142, 79)}
      <ellipse cx="300" cy="112" rx="12" ry="7" fill="#c1b59d" />
    </g> : product.id === 'box' ? <g>
      <path d={`M${x} ${y} H${x + width} L${x + width + 30} ${y + 25} V${y + height + 51} H${x + 30} L${x} ${y + height}Z`} fill="#b99b6a" stroke="#ac9064" strokeWidth="2" />
      <path d={`M${x} ${y + height} H${x + width} L${x + width + 30} ${y + height + 51} H${x + 30}Z`} fill="#ccb081" />
      <rect x={x} y={y} width={width} height={height} fill="#e1c99f" />
      {paint(x, y, width, height)}
      <path d={`M${x + 2} ${y + height - 5} H${x + width - 2}`} stroke="#967a52" strokeWidth="2" />
    </g> : product.category === 'Books & publishing' ? <g>
      <rect x={x + 12} y={y + 12} width={width} height={height} rx="3" fill="#a8ad9a" />
      <rect x={x + 7} y={y + 5} width={width} height={height} fill="#f5f0dd" stroke="#c7c3b4" />
      {[1, 2, 3].map(line => <path key={line} d={`M${x + width + 3} ${y + 9 + line} V${y + height + 5} H${x + 12}`} stroke="#d1caba" fill="none" />)}
      <rect x={x - 4} y={y - 2} width={width + 7} height={height + 3} rx="2" fill="#244336" />
      {paint(x, y, width, height)}
      <path d={`M${x + 6} ${y} V${y + height}`} stroke="#12271c" strokeOpacity=".25" strokeWidth="2" />
    </g> : <g>
      {product.id === 'cards' && [12, 8, 4].map(offset => <rect key={offset} x={x + offset} y={y + offset} width={width} height={height} rx="3" fill="#faf8ec" stroke="#d2d1c2" />)}
      {product.id === 'yard' && <path d={`M${x + width * .22} ${y + height} V414 M${x + width * .78} ${y + height} V414`} stroke="#8b9587" strokeWidth="5" />}
      <rect x={x - 2} y={y - 2} width={width + 4} height={height + 4} rx={product.id === 'cards' ? 3 : 0} fill="#faf8f0" stroke="#cbd0c2" strokeWidth="2" />
      {paint(x, y, width, height)}
      {product.id === 'banner' && <><rect x={x - 10} y={y + height + 2} width={width + 20} height="15" rx="3" fill="#aab2a6" /><rect x={x - 3} y={y - 4} width={width + 6} height="5" rx="2" fill="#b8c0b5" /></>}
    </g>}
  </svg>;
}
