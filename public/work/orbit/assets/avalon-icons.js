/* Avalon decorative interface arrows. No font glyphs, dependencies or application-state writes. */
(() => {
  'use strict';
  if (window.__avalonIconsReady) return;
  window.__avalonIconsReady = true;
  const NS = 'http://www.w3.org/2000/svg';
  const arrows = /[↗↘↙↖→←↑↓↔]/;
  const parts = /([↗↘↙↖→←↑↓↔])/;
  const excluded = 'script,style,svg,math,canvas,textarea,select,option,optgroup,input,pre,code,kbd,samp,title,noscript,template,[contenteditable]:not([contenteditable="false"]),[data-avalon-no-icons]';
  const ui = 'a,button,summary,[role="button"],[role="link"],[aria-hidden="true"]';
  const turns = {'→':0,'↗':-45,'↑':-90,'↖':-135,'←':180,'↙':135,'↓':90,'↘':45};
  const names = {'→':'Continue','↗':'Open link','↑':'Move up','↖':'Go back','←':'Go back','↙':'Go back','↓':'Download','↘':'Continue','↔':'Compare'};
  function icon(glyph) {
    const svg = document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','1em'); svg.setAttribute('height','1em');
    svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false');
    svg.setAttribute('data-avalon-arrow',''); svg.setAttribute('class','avalon-arrow-icon');
    svg.style.cssText = 'display:inline-block!important;width:1em!important;height:1em!important;vertical-align:-.13em;flex-shrink:0;pointer-events:none;overflow:visible;';
    const path=document.createElementNS(NS,'path');
    path.setAttribute('d',glyph==='↔'?'M4 12h16M9 7l-5 5 5 5M15 7l5 5-5 5':'M4 12h16M14 6l6 6-6 6');
    path.setAttribute('fill','none'); path.setAttribute('stroke','currentColor');
    path.setAttribute('stroke-width','1.7'); path.setAttribute('stroke-linecap','round');
    path.setAttribute('stroke-linejoin','round');
    if(glyph!=='↔' && turns[glyph]) path.setAttribute('transform',`rotate(${turns[glyph]} 12 12)`);
    svg.append(path); return svg;
  }
  function replaceText(node) {
    const parent=node.parentElement;
    if(!parent || !arrows.test(node.data) || parent.closest(excluded)) return;
    const isUI=!!parent.closest(ui);
    const tokens=node.data.split(parts);
    if(!tokens.some(t=>t==='↗'||(isUI&&arrows.test(t)))) return;
    const control=parent.closest('a,button,summary,[role="button"],[role="link"]');
    if(control && !control.hasAttribute('aria-label') && !control.hasAttribute('aria-labelledby') && !control.textContent.replace(/[↗↘↙↖→←↑↓↔\s]/g,'')) {
      const glyph=tokens.find(t=>arrows.test(t));
      control.setAttribute('aria-label',control.getAttribute('title') || names[glyph] || 'Continue');
    }
    const fragment=document.createDocumentFragment();
    for(const t of tokens) fragment.append(t==='↗'||(isUI&&arrows.test(t))?icon(t):document.createTextNode(t));
    node.replaceWith(fragment);
  }
  function scan(root) {
    if(root.nodeType===Node.TEXT_NODE){replaceText(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE || root.closest(excluded)) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const text=[];while(walker.nextNode()) text.push(walker.currentNode);
    text.forEach(replaceText);
    // Selvage's existing generated hover label needs real DOM for a font-free icon.
    const products=root.matches('.product-image')?[root]:[...root.querySelectorAll('.product-image')];
    for(const product of products){
      if(product.hasAttribute('data-avalon-product-icon') || !getComputedStyle(product,'::after').content.includes('↗')) continue;
      if(!document.getElementById('avalon-arrow-overlay-style')){
        const style=document.createElement('style');style.id='avalon-arrow-overlay-style';
        style.textContent='[data-avalon-product-icon]::after{content:none!important}.avalon-explore-overlay{position:absolute;bottom:20px;left:20px;right:20px;background:#f3f0e8e8;padding:13px;font-size:16px;opacity:0;transform:translateY(8px);transition:.25s;pointer-events:none}.product-image:hover>.avalon-explore-overlay,.product-image:focus-visible>.avalon-explore-overlay{opacity:1;transform:none}@media(max-width:700px){.avalon-explore-overlay{display:none}}';
        document.head.append(style);
      }
      const overlay=document.createElement('span');overlay.className='avalon-explore-overlay';overlay.setAttribute('aria-hidden','true');
      overlay.append(document.createTextNode('Explore piece '),icon('↗'));
      product.setAttribute('data-avalon-product-icon','');product.append(overlay);
    }
  }
  function start(){
    scan(document.body);
    const observer=new MutationObserver(records=>{
      const roots=new Set();
      for(const record of records){
        if(record.type==='characterData') roots.add(record.target);
        else record.addedNodes.forEach(n=>roots.add(n));
      }
      roots.forEach(node=>{if(node.isConnected)scan(node);});
    });
    observer.observe(document.body,{childList:true,characterData:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
