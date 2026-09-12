import { useMemo, useState } from 'react';
import { ArrowRight, Check, FilePlus2, Layers, Ruler } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { initialDesign, products, type Design } from '../../lib/presswerk/catalog';
import { designTemplates, makeTemplate } from '../../lib/next/templates';
import { DesignPreview } from './artwork';
import ProductVisual from './product-visual';
import type { ProductConfiguration } from './product-configurator';
import './new-project.css';

export default function NewProject({ productId, configuration, onClose, onCreate }: {
  productId: string; configuration?: ProductConfiguration; onClose: () => void; onCreate: (design: Design) => void;
}) {
  const [product, setProduct] = useState(productId);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('blank');
  const selected = products.find(item => item.id === product) || products[0];
  const preview = useMemo(() => template === 'blank'
    ? { ...initialDesign(product), background: '#ffffff', layers: [] }
    : makeTemplate(template, product), [product, template]);
  const templatePreviews = useMemo(() => designTemplates.map(item => ({ ...item, design: makeTemplate(item.id, product) })), [product]);
  const create = () => {
    const specification = configuration?.productId === product ? configuration : undefined;
    onCreate({ ...preview, ...specification, ...(specification?.sides === 2 ? { back: { background: '#ffffff', layers: [] } } : {}), id: crypto.randomUUID(), name: name.trim() || `Untitled ${selected.name.toLowerCase()}`, version: 1, updatedAt: new Date().toISOString() });
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
          <fieldset>
            <legend>Starting point</legend>
            <button type="button" className={'np-blank ' + (template === 'blank' ? 'selected' : '')} aria-pressed={template === 'blank'} onClick={() => setTemplate('blank')}><FilePlus2 size={22}/><span><strong>Blank canvas</strong><small>Your artwork. Your direction.</small></span>{template === 'blank' && <Check size={17}/>}</button>
            <div className="np-template-label"><Layers size={14}/><span>Or choose an editable layout</span></div>
            <div className="np-template-grid">{templatePreviews.map(item => <button type="button" key={item.id} className={template === item.id ? 'selected' : ''} aria-label={`Start with ${item.name}`} aria-pressed={template === item.id} onClick={() => setTemplate(item.id)}><DesignPreview design={item.design}/><span>{item.name}</span>{template === item.id && <Check size={14}/>}</button>)}</div>
          </fieldset>
          <button className="np-create" type="submit">Open design studio <ArrowRight size={17}/></button>
          <p className="np-save-note">Your project stays on this device. Export a backup to keep another copy.</p>
        </form>
      </div>
    </DialogContent>
  </Dialog>;
}
