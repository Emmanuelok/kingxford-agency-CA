'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Download, Maximize2, RefreshCw, ZoomIn } from 'lucide-react';
import type { Design } from '../../lib/presswerk/catalog';
import { artworkFingerprint, downloadArtwork } from '../../lib/next/artwork';
import { renderPhotoScene, type PhotoScene } from '../../lib/next/photo-scenes';
import './photo-preview.css';

export default function PhotoPreview({ design, scene, faceLabel, compact = false }: { design: Design; scene: PhotoScene; faceLabel?: string; compact?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const fingerprint = useMemo(() => `${scene.id}:${artworkFingerprint(design)}`, [scene.id, design]);
  const ready = fingerprint === rendered && !error;

  useEffect(() => {
    let cancelled = false;
    const paint = async () => {
      try {
        const result = await renderPhotoScene(design, scene);
        if (!cancelled && canvas.current) {
          const visible = canvas.current;
          visible.width = result.width;
          visible.height = result.height;
          const ctx = visible.getContext('2d');
          if (!ctx) throw new Error('Your browser could not display the photo preview.');
          ctx.drawImage(result, 0, 0);
          setRendered(fingerprint);
          setError('');
          setNotice('');
        }
        result.width = result.height = 0;
      } catch (failure) {
        if (!cancelled) { setRendered(''); setError(failure instanceof Error ? failure.message : 'The photo preview could not be created.'); }
      }
    };
    void paint();
    return () => { cancelled = true; };
  }, [design, scene, fingerprint, attempt]);

  const download = async () => {
    const visible = canvas.current;
    if (!visible || !ready || exporting) return;
    setExporting(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => visible.toBlob(value => value ? resolve(value) : reject(new Error('The scene could not be exported. Try again.')), 'image/png'));
      const name = design.name.trim().replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'my-design';
      downloadArtwork(blob, `${name}-${(faceLabel || 'front').toLowerCase()}-${scene.id}-preview.png`);
      setNotice('Your scene is ready to save.');
    } catch (failure) {
      setNotice(failure instanceof Error ? failure.message : 'The scene could not be exported.');
    } finally { setExporting(false); }
  };

  return <section className={`photo-preview${compact ? ' photo-preview-compact' : ''}`} aria-label={`${faceLabel ? `${faceLabel} artwork in a ` : ''}photographic product scene`}>
    {!compact && <header className="photo-preview-heading"><div><Camera size={15}/><span>{scene.name}</span>{faceLabel && <span className="photo-face-label">{faceLabel}</span>}</div><span>{scene.width} × {scene.height}</span></header>}
    <div className={`photo-preview-viewport${zoomed ? ' photo-preview-zoomed' : ''}`} aria-busy={!ready && !error}>
      <canvas ref={canvas} role="img" aria-label={`${design.name}${faceLabel ? `, ${faceLabel.toLowerCase()} artwork` : ''}, on ${scene.name.toLowerCase()}`} style={{ visibility: rendered ? 'visible' : 'hidden' }} />
      {!ready && !error && <div className="photo-render-status" role="status"><RefreshCw size={18}/> Placing your artwork…</div>}
      {error && <div className="photo-render-error" role="alert"><p>{error}</p><button className="photo-button" onClick={() => { setError(''); setAttempt(value => value + 1); }}><RefreshCw size={14}/>Try again</button></div>}
    </div>
    {!compact && <footer className="photo-preview-footer"><div className="photo-preview-actions"><button className="photo-button" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)} disabled={!ready}>{zoomed ? <Maximize2 size={15}/> : <ZoomIn size={15}/>} {zoomed ? 'Fit scene' : 'View detail'}</button><button className="photo-download" onClick={() => void download()} disabled={!ready || exporting}><Download size={15}/>{exporting ? 'Preparing…' : 'Download scene'}</button></div><p>{scene.note}</p><span className="photo-save-notice" role="status">{notice}</span></footer>}
  </section>;
}
