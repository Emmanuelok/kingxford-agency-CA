import { lazy, Suspense, useId, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Download, Image as ImageIcon, Layers, Ruler, SlidersHorizontal } from 'lucide-react';
import { calculateQuote, finishesFor, money, products, supportsReverse, type Product, type Tier } from '../../lib/presswerk/catalog';
import ProductVisual from './product-visual';
import { photoSceneFor } from '../../lib/next/photo-scenes';
import { makeTemplate } from '../../lib/next/templates';
import './product-configurator.css';

const PhotoPreview = lazy(() => import('./photo-preview'));

export type ProductConfiguration = {
  productId: string;
  quantity: number;
  tier: Tier;
  finish: string;
  sides: number;
};

type Props = {
  product: Product;
  onBack: () => void;
  onStart: (specification: ProductConfiguration) => void;
  onProduct?: (id: string) => void;
};

const serviceOptions: { value: Tier; name: string; description: string }[] = [
  { value: 'Value', name: 'Artwork ready', description: 'Prepare and review your own artwork.' },
  { value: 'Design Plus', name: 'Design assistance', description: 'Include an allowance for design support.' },
  { value: 'Priority', name: 'Priority service', description: 'Include a priority allowance; timing needs confirmation.' },
];
const finishDescriptions: Record<string, string> = {
  Standard: 'The base finish for this format.',
  'Soft touch': 'A soft, low-sheen surface.',
  'Gloss laminate': 'A glossy laminated surface.',
  'Foil accent': 'Metallic detail; placement requires production review.',
};
const formatUnit = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(value);

function quantityOptions(product: Product) {
  const options = product.quantity === 1 ? [1, 5, 10, 25, 50, 100] : [50, 100, 250, 500, 1000];
  return [...new Set([product.quantity, ...options])].sort((a, b) => a - b).slice(0, 6);
}

function downloadTemplate(product: Product) {
  const contents = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${product.width}mm" height="${product.height}mm" viewBox="0 0 ${product.width} ${product.height}">\n<title>Blank artwork area: ${product.width} by ${product.height} millimetres</title>\n<desc>Artwork area only. Confirm any bleed, folds, wrapping, finishing and manufacturing requirements with the print provider.</desc>\n<rect width="${product.width}" height="${product.height}" fill="#ffffff"/>\n</svg>`;
  const url = URL.createObjectURL(new Blob([contents], { type: 'image/svg+xml;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `avalon-${product.id}-blank-${product.width}x${product.height}mm.svg`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export default function ProductConfigurator(props: Props) {
  return <ConfiguredProduct key={props.product.id} {...props} />;
}

function ConfiguredProduct({ product, onBack, onStart, onProduct }: Props) {
  const [quantityInput, setQuantityInput] = useState(String(product.quantity));
  const [finish, setFinish] = useState('Standard');
  const [tier, setTier] = useState<Tier>('Value');
  const [sides, setSides] = useState(1);
  const [gallery, setGallery] = useState<'product' | 'area'>('product');
  const [notice, setNotice] = useState('');
  const id = useId();
  const quantity = Number(quantityInput);
  const validQuantity = quantityInput.trim() !== '' && Number.isInteger(quantity) && quantity >= 1 && quantity <= 100000;
  const canPrintReverse = supportsReverse(product);
  const specification = { productId: product.id, quantity, tier, finish, sides: canPrintReverse ? sides : 1 };
  const estimate = validQuantity ? calculateQuote({ ...specification, city: 'Calgary', shipping: 0 }) : null;
  const minimumPixels = { width: Math.ceil(product.width / 25.4 * 300), height: Math.ceil(product.height / 25.4 * 300) };
  const related = products.filter(item => item.id !== product.id && item.category === product.category).slice(0, 3);
  const areaRatio = product.width / product.height;
  const photoScene = photoSceneFor(product.id);
  const exampleDesign = useMemo(() => makeTemplate(product.id === 'tee' ? 'mono' : product.id === 'poster' ? 'gallery' : 'atelier', product.id), [product.id]);

  return <section className="pc-product" aria-labelledby={`${id}-title`}>
    <div className="pc-navigation">
      <button className="pc-back" onClick={onBack}><ArrowLeft size={17} /> All products</button>
      <ol className="pc-progress" aria-label="Create your print project">
        <li aria-current="step"><span>1</span> Product</li><li><ChevronRight size={13} /><span>2</span> Design</li><li><ChevronRight size={13} /><span>3</span> Review</li>
      </ol>
    </div>

    <div className="pc-product-layout">
      <div className="pc-gallery-column">
        <div className={`pc-gallery ${gallery === 'area' ? 'is-area' : photoScene ? 'has-photo' : ''}`}>
          <div className="pc-gallery-heading"><span>{product.category}</span><span>{gallery === 'product' ? photoScene ? 'Design example' : 'Product illustration' : 'Artwork dimensions'}</span></div>
          {gallery === 'product' ? <div className={`pc-product-stage ${photoScene ? 'pc-photo-stage' : ''}`}>{photoScene ? <Suspense fallback={<ProductVisual product={product}/>}><PhotoPreview design={exampleDesign} scene={photoScene} compact/></Suspense> : <ProductVisual product={product} />}</div> : <div className="pc-area-stage">
            <div className="pc-artboard" style={{ aspectRatio: areaRatio, width: areaRatio >= 1 ? 'min(76%, 440px)' : `min(${Math.max(18, 64 * areaRatio)}%, 320px)` }}>
              <span className="pc-area-width">{product.width} mm</span><span className="pc-area-height">{product.height} mm</span>
              <div><Layers size={30} /><strong>Your artwork</strong><small>{canPrintReverse && sides === 2 ? 'One canvas for each side' : 'One printable canvas'}</small></div>
            </div>
          </div>}
          <div className="pc-gallery-caption"><span>{product.material}</span><span>{product.method}</span></div>
        </div>
        <div className="pc-gallery-controls" role="group" aria-label="Product views">
          <button className={gallery === 'product' ? 'is-active' : ''} aria-pressed={gallery === 'product'} onClick={() => setGallery('product')}><ImageIcon size={17} /> Product</button>
          <button className={gallery === 'area' ? 'is-active' : ''} aria-pressed={gallery === 'area'} onClick={() => setGallery('area')}><Ruler size={17} /> Print area</button>
          <span>Personalise it in the next step.</span>
        </div>
        <div className="pc-creative-note"><span className="pc-note-mark">a.</span><div><h2>A format. A possibility. Your design.</h2><p>Upload your artwork, start with a template or build from a blank canvas. Your chosen specifications travel with your project.</p></div></div>
      </div>

      <div className="pc-configuration">
        <div className="pc-product-heading"><span className="pc-eyebrow">MAKE IT YOURS</span><h1 id={`${id}-title`}>{product.name}</h1><p>{product.description}</p></div>
        <div className="pc-spec-strip"><span><Ruler size={16} />{product.width} × {product.height} mm print area</span><span><Layers size={16} />{product.material}</span></div>

        <fieldset className="pc-option-group"><legend><span>01</span> Choose your quantity</legend>
          <div className="pc-quantity-presets">{quantityOptions(product).map(value => {
            const priced = product.quoteOnly ? null : calculateQuote({ ...specification, quantity: value, city: 'Calgary', shipping: 0 });
            return <button key={value} type="button" aria-pressed={quantity === value && validQuantity} className={quantity === value && validQuantity ? 'is-selected' : ''} onClick={() => setQuantityInput(String(value))}><strong>{value.toLocaleString('en-CA')}</strong><span>{priced ? `${formatUnit(priced.unit)} each` : 'pieces'}</span></button>;
          })}</div>
          <label className="pc-custom-quantity" htmlFor={`${id}-quantity`}><span>Or enter a quantity</span><input id={`${id}-quantity`} aria-describedby={!validQuantity ? `${id}-quantity-error` : undefined} aria-invalid={!validQuantity} inputMode="numeric" type="number" min={1} max={100000} step={1} value={quantityInput} onChange={event => setQuantityInput(event.target.value)} /></label>
          {!validQuantity && <p className="pc-field-error" id={`${id}-quantity-error`}>Enter a whole number from 1 to 100,000.</p>}
        </fieldset>

        <fieldset className="pc-option-group"><legend><span>02</span> Set the print specification</legend>
          <div className="pc-print-options"><label>Finish<select value={finish} onChange={event => setFinish(event.target.value)}>{finishesFor(product).map(value => <option key={value}>{value}</option>)}</select></label>
            {canPrintReverse ? <label>Printed sides<select value={sides} onChange={event => setSides(Number(event.target.value))}><option value={1}>Front only</option><option value={2}>Front and back</option></select></label> : <div className="pc-fixed-option"><span>Print area</span><strong>One artwork area</strong></div>}
          </div><p className="pc-option-help">{finishDescriptions[finish]}{canPrintReverse && sides === 2 ? ' Add separate front and back artwork in the studio.' : ''}</p>
        </fieldset>

        <fieldset className="pc-option-group pc-service-group"><legend><span>03</span> Choose your service</legend><div className="pc-services">{serviceOptions.map(option => <label key={option.value} className={tier === option.value ? 'is-selected' : ''}><input type="radio" name={`${id}-service`} value={option.value} checked={tier === option.value} onChange={() => setTier(option.value)} /><span><strong>{option.name}</strong><small>{option.description}</small></span>{tier === option.value && <Check size={16} />}</label>)}</div></fieldset>

        <div className="pc-price-card">
          <div className="pc-price-summary" aria-live="polite" aria-atomic="true"><div><span>{product.quoteOnly ? 'CUSTOM SPECIFICATION' : 'YOUR PRINT ESTIMATE'}</span><strong>{product.quoteOnly ? 'Request pricing' : estimate ? money(estimate.subtotal) : 'Choose a quantity'}</strong></div>{!product.quoteOnly && estimate && <div><b>{formatUnit(estimate.unit)} each</b><small>{quantity.toLocaleString('en-CA')} {quantity === 1 ? 'piece' : 'pieces'} · CAD</small></div>}</div>
          {!product.quoteOnly && estimate && <details className="pc-price-breakdown"><summary><SlidersHorizontal size={14} /> What makes up this price?</summary><dl><div><dt>Base print</dt><dd>{money(estimate.base)}</dd></div><div><dt>{finish === 'Standard' ? 'Standard finish' : finish}</dt><dd>{money(estimate.finish)}</dd></div>{sides === 2 && <div><dt>Second side</dt><dd>{money(estimate.sides)}</dd></div>}<div><dt>Service allowance</dt><dd>{money(estimate.service)}</dd></div></dl><p>A $5 minimum and rounding may apply.</p></details>}
          <button className="pc-start" disabled={!validQuantity} onClick={() => onStart(specification)}><span>{product.quoteOnly ? 'Prepare artwork & pricing brief' : 'Continue to design'}</span><ArrowRight size={19} /></button>
          <p className="pc-price-note">{product.quoteOnly ? 'Save your artwork and requirements for a supplier quotation.' : 'Planning estimate before delivery and tax. Final pricing follows artwork and production review.'}</p>
        </div>
      </div>
    </div>

    <div className="pc-information">
      <section className="pc-details"><span className="pc-eyebrow">THE DETAILS</span><h2>Know your format.</h2><dl><div><dt>Material</dt><dd>{product.material}</dd></div><div><dt>Print method</dt><dd>{product.method}</dd></div><div><dt>Artwork area</dt><dd>{product.width} × {product.height} mm</dd></div><div><dt>Available finishes</dt><dd>{finishesFor(product).join(' · ')}</dd></div><div><dt>Artwork sides</dt><dd>{canPrintReverse ? 'Separate front and back supported' : 'Single artwork area'}</dd></div></dl></section>
      <section className="pc-file-guide"><div className="pc-file-heading"><div><span className="pc-eyebrow">BRING YOUR OWN ARTWORK</span><h2>Start with the right file.</h2></div><Download size={25} /></div><p>Upload a finished PDF, PNG, JPG or WebP, or create editable text and shapes directly on your canvas. Choose PDF pages for each print face in the studio.</p><div className="pc-resolution"><span>At 300 DPI</span><strong>{minimumPixels.width.toLocaleString('en-CA')} × {minimumPixels.height.toLocaleString('en-CA')} px</strong><small>Minimum image dimensions to cover this artwork area at 300 DPI.</small></div><button className="pc-template-download" onClick={() => { try { downloadTemplate(product); setNotice('Blank SVG template downloaded. Open it in your preferred vector design application.'); } catch { setNotice('The template could not be downloaded. Please try again.'); } }}><Download size={16} /> Download blank SVG template <ArrowRight size={16} /></button><p className="pc-template-note">Artwork area only. Confirm bleed, folds, wrapping and finishing requirements with your print provider. PDF pages import as image artwork; text and shapes created in the studio remain editable.</p>{notice && <p className="pc-download-status" role="status">{notice}</p>}</section>
    </div>

    {onProduct && related.length > 0 && <section className="pc-related"><div className="pc-related-heading"><div><span className="pc-eyebrow">EXPLORE THE COLLECTION</span><h2>Find the right fit.</h2></div><button onClick={onBack}>All products <ArrowRight size={17} /></button></div><div className="pc-related-grid">{related.map(item => <button key={item.id} onClick={() => onProduct(item.id)}><ProductVisual product={item} small /><div><span>{item.material}</span><h3>{item.name}<ArrowRight size={17} /></h3><p>{item.quoteOnly ? 'Custom quotation' : `${money(item.price)} / ${item.quantity === 1 ? 'item' : `${item.quantity} pieces`}`}</p></div></button>)}</div></section>}
  </section>;
}
