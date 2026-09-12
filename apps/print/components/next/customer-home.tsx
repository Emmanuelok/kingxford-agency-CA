import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, FolderOpen, Search, X } from 'lucide-react';
import { money, products, type Design, type Product } from '../../lib/presswerk/catalog';
import type { StudioWorkspace } from '../../lib/next/types';
import { DesignPreview } from './artwork';
import ProductVisual from './product-visual';
import './customer-home.css';

type CustomerHomeProps = {
  workspace: StudioWorkspace;
  onProduct: (id: string) => void;
  onCatalogue: () => void;
  onResume: (design: Design) => void;
  onProjects: () => void;
  onQuotes: () => void;
  onCollection: () => void;
};

const occasions = [
  { id: 'business', label: 'Launch a business', title: 'First impressions, considered.', description: 'Introduce your business with a matching set of everyday essentials.', products: ['cards', 'brochure', 'stickers', 'box'] },
  { id: 'team', label: 'Bring a team together', title: 'An identity everyone can wear.', description: 'Start with apparel, then carry the same design into the everyday.', products: ['tee', 'hoodie', 'cap', 'mug'] },
  { id: 'event', label: 'Make an event', title: 'Set the scene. Spread the word.', description: 'Create invitations, promotional print and displays around one occasion.', products: ['invitation', 'poster', 'banner', 'flyer'] },
  { id: 'retail', label: 'Build a retail brand', title: 'Details beyond the product.', description: 'Make labels, packaging and take-home pieces feel like part of your brand.', products: ['stickers', 'box', 'roll', 'tote'] },
];
const productById = new Map(products.map(product => [product.id, product]));
const essentials = ['cards', 'tee', 'stickers', 'mug'].map(id => productById.get(id)!);

function ProductTile({ product, onProduct, compact = false }: { product: Product; onProduct: (id: string) => void; compact?: boolean }) {
  return <button className={`ac-product${compact ? ' ac-product-compact' : ''}`} onClick={() => onProduct(product.id)}>
    <div className="ac-product-image"><ProductVisual product={product}/><span className="ac-product-open" aria-hidden="true"><ArrowUpRight size={19}/></span></div>
    <div className="ac-product-copy">
      <span className="ac-product-category">{product.category}</span>
      <h3>{product.name}</h3>
      <div className="ac-product-price">{product.quoteOnly ? <><strong>Custom quote</strong><span>Choose your specifications</span></> : <><strong>{money(product.price)} <small>CAD</small></strong><span>Estimate / {product.quantity === 1 ? 'item' : `${product.quantity} pieces`}</span></>}</div>
    </div>
  </button>;
}

export default function CustomerHome({ workspace, onProduct, onCatalogue, onResume, onProjects, onQuotes, onCollection }: CustomerHomeProps) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(0);
  const [occasionIndex, setOccasionIndex] = useState(0);
  const searchId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => normalizedQuery ? products.filter(product => `${product.name} ${product.category} ${product.material} ${product.method}`.toLowerCase().includes(normalizedQuery)).slice(0, 6) : [], [normalizedQuery]);
  const visibleResults = searchOpen && Boolean(normalizedQuery);
  const occasion = occasions[occasionIndex];
  const liveProjects = workspace.projects.filter(project => !project.archived);
  const recent = [...liveProjects].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3);
  const draftCount = workspace.quotes.filter(quote => quote.status !== 'Archived').length;

  const chooseProduct = (id: string) => { setSearchOpen(false); onProduct(id); };
  const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { setSearchOpen(false); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setSearchOpen(true);
      if (results.length) setSelectedResult(current => (current + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    }
  };

  return <div className="ac-home">
    <section className="ac-hero" aria-labelledby="ac-home-title">
      <div className="ac-hero-copy">
        <span className="ac-kicker"><span/> PRINT, WITH YOUR POINT OF VIEW</span>
        <h1 id="ac-home-title">Your ideas.<br/><em>Made tangible.</em></h1>
        <p>Put your brand on the things people hold, wear and remember. Choose a product. Make it yours. See every detail before you print.</p>
        <div className="ac-hero-actions"><button className="ac-button ac-button-dark" onClick={onCatalogue}>Find your product <ArrowUpRight size={19}/></button><button className="ac-link" onClick={onCollection}>Build a collection <ArrowRight size={17}/></button></div>
        <div className="ac-hero-benefits"><span><Check size={15}/> Live artwork preview</span><span><Check size={15}/> Your files, your design</span></div>
      </div>
      <div className="ac-hero-scene">
        <img src="/print-app/images/atelier.jpg" alt="Avalon stationery, printed cotton apparel and a presentation box arranged in natural light" fetchPriority="high" width="1536" height="1024"/>
        <div className="ac-scene-top"><span>THE EVERYDAY, MADE YOURS</span><span aria-hidden="true">01 / AVALON PRINT</span></div>
        <button className="ac-scene-product ac-scene-apparel" onClick={() => onProduct('tee')}><span className="ac-scene-dot"/><span>Custom apparel <ArrowUpRight size={14}/></span></button>
        <button className="ac-scene-product ac-scene-cards" onClick={() => onProduct('cards')}><span className="ac-scene-dot"/><span>Business cards <ArrowUpRight size={14}/></span></button>
        <div className="ac-scene-bottom"><span>One identity.<br/><b>Every touchpoint.</b></span><button aria-label="Explore all print products" onClick={onCatalogue}><ArrowDown size={22}/></button></div>
      </div>
    </section>

    <section className="ac-find" aria-label="Find a print product">
      <div className="ac-find-heading"><span className="ac-kicker">START WITH A PRODUCT</span><h2>What are you making?</h2></div>
      <div className="ac-find-main">
        <form className="ac-search" role="search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }} onSubmit={event => { event.preventDefault(); if (results.length) chooseProduct(results[selectedResult]?.id ?? results[0].id); else if (!normalizedQuery) onCatalogue(); }}>
          <div className="ac-search-input"><Search size={21}/><input ref={searchInput} value={query} onChange={event => { setQuery(event.target.value); setSelectedResult(0); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={handleSearchKey} role="combobox" aria-label="Search print products" aria-expanded={visibleResults} aria-controls={`${searchId}-results`} aria-autocomplete="list" aria-activedescendant={visibleResults && results.length ? `${searchId}-${selectedResult}` : undefined} placeholder="Business cards, T-shirts, packaging…" autoComplete="off"/>{query && <button className="ac-search-clear" type="button" aria-label="Clear product search" onClick={() => { setQuery(''); setSelectedResult(0); searchInput.current?.focus(); }}><X size={17}/></button>}<button className="ac-search-submit" type="submit" aria-label="Find product"><ArrowRight size={21}/></button></div>
          {visibleResults && <div className="ac-search-results"><div className="ac-search-caption">{results.length ? 'CHOOSE A PRODUCT' : 'NO MATCHING PRODUCTS'}</div><div role="listbox" id={`${searchId}-results`} aria-label="Product search results">{results.map((product, index) => <button type="button" className="ac-search-result" role="option" id={`${searchId}-${index}`} aria-selected={selectedResult === index} key={product.id} onMouseEnter={() => setSelectedResult(index)} onClick={() => chooseProduct(product.id)}><span><b>{product.name}</b><small>{product.category} · {product.material}</small></span><ArrowUpRight size={17}/></button>)}</div>{!results.length && <div className="ac-search-empty"><p>Try a product, material or printing method.</p><button type="button" className="ac-link" onClick={onCatalogue}>Browse the full catalogue <ArrowRight size={16}/></button></div>}</div>}
        </form>
        <div className="ac-search-suggestions"><span>Popular searches</span>{['cards', 'tee', 'stickers'].map(id => <button className="ac-suggestion" key={id} onClick={() => onProduct(id)}>{productById.get(id)!.name}<ChevronRight size={13}/></button>)}</div>
      </div>
    </section>

    <section className="ac-section" aria-labelledby="ac-essentials-title">
      <div className="ac-section-heading"><div><span className="ac-kicker">GOOD PLACES TO START</span><h2 id="ac-essentials-title">Everyday essentials.<br className="ac-mobile-break"/> Entirely your own.</h2></div><button className="ac-link" onClick={onCatalogue}>Shop all {products.length} formats <ArrowUpRight size={18}/></button></div>
      <div className="ac-products">{essentials.map(product => <ProductTile key={product.id} product={product} onProduct={onProduct}/>)}</div>
      <p className="ac-price-note">Planning estimates in CAD for the quantities shown. Finishing, delivery and taxes are confirmed in your quote.</p>
    </section>

    <section className="ac-occasion" aria-labelledby="ac-occasion-title">
      <div className="ac-occasion-heading"><span className="ac-kicker">PRINT WITH A PURPOSE</span><h2 id="ac-occasion-title">What’s the occasion?</h2><p>A few considered starting points for whatever comes next.</p></div>
      <div className="ac-occasion-options" role="group" aria-label="Choose a printing occasion">{occasions.map((item, index) => <button key={item.id} className={occasionIndex === index ? 'ac-occasion-option is-active' : 'ac-occasion-option'} aria-pressed={occasionIndex === index} onClick={() => setOccasionIndex(index)}><span className="ac-occasion-number">0{index + 1}</span>{item.label}<ArrowUpRight size={17}/></button>)}</div>
      <div className="ac-occasion-detail" aria-live="polite"><div><h3>{occasion.title}</h3><p>{occasion.description}</p></div><button className="ac-link" onClick={onCollection}>Plan matching products <ArrowRight size={17}/></button></div>
      <div className="ac-products ac-occasion-products">{occasion.products.map(id => <ProductTile key={id} product={productById.get(id)!} onProduct={onProduct} compact/>)}</div>
    </section>

    <section className="ac-how" aria-labelledby="ac-how-title"><div className="ac-how-intro"><span className="ac-kicker">FROM FIRST IDEA TO FINAL PROOF</span><h2 id="ac-how-title">Make it yours.<br/>Make it right.</h2><button className="ac-link" onClick={onCatalogue}>Start with your product <ArrowUpRight size={18}/></button></div><ol className="ac-steps"><li><span>01</span><div><h3>Find the right canvas.</h3><p>Compare products, print areas and materials. Choose the format and quantity that fit your project.</p></div></li><li><span>02</span><div><h3>Put your design on it.</h3><p>Upload artwork or start with a template. Edit text, arrange layers and preview your design on the product.</p></div></li><li><span>03</span><div><h3>Review every detail.</h3><p>Check your artwork, collect matching products and prepare a quote with your exact specifications.</p></div></li></ol></section>

    {recent.length > 0 ? <section className="ac-section ac-resume" aria-labelledby="ac-resume-title"><div className="ac-section-heading"><div><span className="ac-kicker">YOUR NEXT STEP IS ALREADY HERE</span><h2 id="ac-resume-title">Back to your ideas.</h2></div><button className="ac-link" onClick={onProjects}>All {liveProjects.length} projects <ArrowUpRight size={18}/></button></div><div className="ac-recent-projects">{recent.map(project => { const design = workspace.activeDesign.id === project.id ? workspace.activeDesign : project.design; const product = productById.get(design.productId); return <button className="ac-recent-project" key={project.id} onClick={() => onResume(design)}><div className="ac-project-art"><DesignPreview design={design}/></div><div className="ac-project-caption"><span><b>{design.name || 'Untitled project'}</b><small>{product?.name ?? 'Print project'} · {design.quantity} {design.quantity === 1 ? 'item' : 'pieces'}</small></span><ArrowUpRight size={19}/></div></button>; })}</div></section> : <section className="ac-project-invitation"><FolderOpen size={26}/><div><h2>A home for everything you create.</h2><p>Keep your designs together, return to an earlier version and pick up where you left off.</p></div><button className="ac-link" onClick={onProjects}>Your project library <ArrowRight size={18}/></button></section>}

    <section className="ac-collection"><div><span className="ac-kicker">ONE BRIEF. A COMPLETE COLLECTION.</span><h2>Your brand belongs<br/>on more than one thing.</h2><p>Bring cards, apparel and packaging into the same project brief. Keep the artwork, quantities and quote details together.</p><button className="ac-button ac-button-lime" onClick={onCollection}>Build your collection <ArrowUpRight size={19}/></button></div><div className="ac-collection-index"><span>BUILT AROUND YOUR IDEAS</span><button onClick={() => onProduct('cards')}>Paper & stationery <ArrowUpRight size={19}/></button><button onClick={() => onProduct('tee')}>Apparel & merchandise <ArrowUpRight size={19}/></button><button onClick={() => onProduct('box')}>Packaging & labels <ArrowUpRight size={19}/></button><button className="ac-collection-quotes" onClick={onQuotes}>Review your quote drafts {draftCount > 0 && <span>{draftCount}</span>}<ArrowRight size={17}/></button></div></section>
  </div>;
}
