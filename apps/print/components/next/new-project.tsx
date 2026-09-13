import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, FilePlus2, Layers, Ruler, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { initialDesign, products, type Design } from '../../lib/presswerk/catalog';
import { designTemplates, makeTemplate } from '../../lib/next/templates';
import { DesignPreview } from './artwork';
import ProductVisual from './product-visual';
import type { ProductConfiguration } from './product-configurator';
import './new-project.css';

export default function NewProject({ productId, configuration, onClose, onCreate }: {
  productId: string; configuration?: ProductConfiguration; onClose: () => void; onCreate: (design: Design, file?: File) => void;
}) {
  const [product, setProduct] = useState(productId);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('blank');
  const uploadInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const selected = products.find(item => item.id === product) || products[0];
  const preview = useMemo(() => template === 'blank'
    ? { ...initialDesign(product), background: '#ffffff', layers: [] }
    : makeTemplate(template, product), [product, template]);
  const templatePreviews = useMemo(() => designTemplates.map(item => ({ ...item, design: makeTemplate(item.id, product) })), [product]);
  const create = (file?: File) => {
    const specification = configuration?.productId === product ? configuration : undefined;
    const artwork = file ? { ...initialDesign(product), background: '#ffffff', layers: [], back: undefined } : preview;
    onCreate({ ...artwork, ...specification, ...(specification?.sides === 2 ? { back: artwork.back || { background: '#ffffff', layers: [] } } : {}), id: crypto.randomUUID(), name: (name.trim() || (file ? file.name.replace(/\.[^.]+$/, '') : `Untitled ${selected.name.toLowerCase()}`)).slice(0, 80), version: 1, updatedAt: new Date().toISOString() }, file);
  };

  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent className="av-new-project">
      <DialogHeader>
        <DialogTitle>Make something of your own.</DialogTitle>
            <DialogDescription>Your product is configured. Choose how to start the artwork.</DialogDescription>
      </DialogHeader>
      <div className="np-layout">
        <div className="np-preview">
          <div className="np-preview-label"><span>YOUR NEXT PROJECT</span><Ruler size={16}/></div>
          <div className="np-artwork">{template === 'blank' ? <ProductVisual product={selected}/> : <DesignPreview design={preview}/>}</div>
          <div className="np-preview-caption"><strong>{selected.name}</strong><span>{selected.width} × {selected.height} mm print area</span></div>
        </div>
        <form className="np-form" onSubmit={event => { event.preventDefault(); create(); }}>
          <label>Project name<input autoFocus value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder={`e.g. ${selected.id === 'cards' ? 'My new business cards' : 'Summer collection'}`}/></label>
          {configuration ? <div className="np-configured"><strong>{selected.name}</strong><span>{configuration.quantity.toLocaleString()} {configuration.quantity === 1 ? 'item' : 'items'} · {configuration.finish} · {configuration.sides === 2 ? 'Front & back' : 'One print area'}</span><small>{configuration.tier} service</small></div> : <label>Print format<select value={product} onChange={event => setProduct(event.target.value)}>{products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          <div className="np-format-details"><span>{selected.material}</span><span>{selected.method}</span></div>
          <button className="np-upload-artwork" type="button" onClick={() => uploadInput.current?.click()}><Upload size={23}/><span><strong>Upload finished artwork</strong><small>PDF pages, a photograph or your logo</small></span><ArrowRight size={18}/></button>
          <input ref={uploadInput} type="file" hidden aria-label="Upload finished artwork file" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp" onChange={event => {
            const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
            const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
            if (!pdf && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setFileError('Choose a PDF, PNG, JPEG or WebP file.'); return; }
            if (file.size > (pdf ? 25 : 12) * 1024 * 1024) { setFileError(`Choose a ${pdf ? 'PDF below 25' : 'picture below 12'} MB.`); return; }
            create(file);
          }}/>
          {fileError && <p className="np-file-error" role="alert">{fileError}</p>}
          <fieldset>
            <legend>Starting point</legend>
            <button type="button" className={'np-blank ' + (template === 'blank' ? 'selected' : '')} aria-pressed={template === 'blank'} onClick={() => setTemplate('blank')}><FilePlus2 size={22}/><span><strong>Blank canvas</strong><small>Your artwork. Your direction.</small></span>{template === 'blank' && <Check size={17}/>}</button>
            <div className="np-template-label"><Layers size={14}/><span>Or choose an editable layout</span></div>
            <input className="np-template-search" aria-label="Find a design layout" value={templateSearch} onChange={event => setTemplateSearch(event.target.value)} placeholder="Find cards, menus, events…"/>
            <div className="np-template-grid">{templatePreviews.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(templateSearch.toLowerCase())).map(item => <button type="button" key={item.id} className={template === item.id ? 'selected' : ''} aria-label={`Start with ${item.name}`} aria-pressed={template === item.id} onClick={() => setTemplate(item.id)}><DesignPreview design={item.design}/><span>{item.name}</span>{template === item.id && <Check size={14}/>}</button>)}</div>
          </fieldset>
          <button className="np-create" type="submit">Open design studio <ArrowRight size={17}/></button>
          <p className="np-save-note">Your project stays on this device. Export a backup to keep another copy.</p>
        </form>
      </div>
    </DialogContent>
  </Dialog>;
}
