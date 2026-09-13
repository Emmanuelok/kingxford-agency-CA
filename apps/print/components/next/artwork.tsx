import { useId } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Design, DesignLayer } from '../../lib/presswerk/catalog';
import { artworkProduct, imageCrop, safeColor, safeFont, safeImageSource, unrotatedLayerBounds } from '../../lib/next/artwork';

type ArtworkProps = { design: Design; selectedId?: string | null; onSelect?: (id: string | null) => void; onLayerPointerDown?: (event: ReactPointerEvent<SVGGElement>, layer: DesignLayer, resize?: boolean) => void; onPointerMove?: (event: ReactPointerEvent<SVGSVGElement>) => void; onPointerUp?: (event: ReactPointerEvent<SVGSVGElement>) => void; grid?: boolean; safeArea?: boolean; controlScale?: number; className?: string };
export function Artwork({ design, selectedId, onSelect, onLayerPointerDown, onPointerMove, onPointerUp, grid, safeArea, controlScale = 1, className }: ArtworkProps) {
  const id = useId().replace(/:/g, ''), p = artworkProduct(design), width = 1000, height = 1000 * p.height / p.width, scale = width / p.width;
  return <svg className={className} viewBox={`0 0 ${width} ${height}`} role={onSelect ? 'group' : 'img'} aria-label={`${design.name} — ${p.name}, ${p.width} by ${p.height} millimetres`} onPointerDown={event => { if (event.target === event.currentTarget) onSelect?.(null); }} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible', touchAction: onSelect ? 'none' : undefined }}>
    <defs><clipPath id={`${id}-clip`}><rect width={width} height={height}/></clipPath><pattern id={`${id}-grid`} width={50} height={50} patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#697268" strokeWidth=".8"/></pattern></defs>
    <g clipPath={`url(#${id}-clip)`}><rect width={width} height={height} fill={safeColor(design.background)} onPointerDown={() => onSelect?.(null)}/>
      {design.layers.map(layer => { const bounds = unrotatedLayerBounds(layer, p), w = bounds.width * scale, h = bounds.height * scale, src = safeImageSource(layer.src); return <g key={layer.id} transform={`translate(${layer.x * 10} ${layer.y / 100 * height}) rotate(${layer.rotation})`} opacity={layer.opacity} onPointerDown={onLayerPointerDown ? event => onLayerPointerDown(event, layer) : undefined} style={onSelect ? { cursor: 'move' } : undefined}>
        {layer.type === 'text' ? <text fill={safeColor(layer.color)} fontFamily={safeFont(layer.font)} fontWeight={layer.weight || 700} fontSize={layer.size * 10} dominantBaseline="text-before-edge" style={{ userSelect: 'none' }}>{layer.text.split('\n').map((line, i) => <tspan key={i} x={0} y={i * layer.size * 11}>{line}</tspan>)}</text> : layer.type === 'shape' ? <rect width={w} height={h} fill={safeColor(layer.color)}/> : src ? <ImageArtwork layer={layer} width={w} height={h} src={src}/> : <g><rect width={w} height={h} fill="#f0ddd6"/><text x={10} y={25} fontSize={16} fill="#7b3125">Image unavailable</text></g>}
        {onSelect && <rect width={Math.max(8, w)} height={Math.max(8, h)} fill="transparent"/>}
      </g>; })}
      {grid && <rect width={width} height={height} fill={`url(#${id}-grid)`} opacity={.5} pointerEvents="none"/>}
      {safeArea && <rect x={3 * scale} y={3 * scale} width={Math.max(0, width - 6 * scale)} height={Math.max(0, height - 6 * scale)} fill="none" stroke="#aa6a98" strokeDasharray="5 4" strokeWidth={1} vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 1px #ffffffcc)' }} pointerEvents="none"/>}
    </g>
    {selectedId && design.layers.filter(layer => layer.id === selectedId).map(layer => { const bounds = unrotatedLayerBounds(layer, p), w = bounds.width * scale, h = bounds.height * scale; return <g key={layer.id} transform={`translate(${layer.x * 10} ${layer.y / 100 * height}) rotate(${layer.rotation})`}><rect width={w} height={h} fill="none" stroke="#8060bf" strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none"/><g onPointerDown={onLayerPointerDown ? event => onLayerPointerDown(event, layer, true) : undefined} style={{ cursor: 'nwse-resize' }}><rect x={w - 16 * controlScale} y={h - 16 * controlScale} width={32 * controlScale} height={32 * controlScale} fill="transparent"/><rect x={w - 4 * controlScale} y={h - 4 * controlScale} width={8 * controlScale} height={8 * controlScale} rx={1.5 * controlScale} fill="white" stroke="#8060bf" strokeWidth={1.5} vectorEffect="non-scaling-stroke"/></g></g>; })}
  </svg>;
}
function ImageArtwork({ layer, width, height, src }: { layer: DesignLayer; width: number; height: number; src: string }) {
  if (!layer.crop) return <image width={width} height={height} href={src} preserveAspectRatio="none"/>;
  const crop = imageCrop(layer);
  return <svg width={width} height={height} viewBox={`${crop.x * 1000} ${crop.y * 1000} ${crop.width * 1000} ${crop.height * 1000}`} preserveAspectRatio="none" overflow="hidden"><image width={1000} height={1000} href={src} preserveAspectRatio="none"/></svg>;
}
export function DesignPreview({ design, className }: { design: Design; className?: string }) { return <Artwork design={design} className={className}/>; }
export default DesignPreview;
