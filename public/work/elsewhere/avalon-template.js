// Align this template's positioned masthead with its normal-flow selection toolbar.
(() => {
  const bar=document.querySelector('.avalon-template-tools');
  if(!bar)return;
  function update(){document.documentElement.style.setProperty('--avalon-template-height',bar.getBoundingClientRect().height+'px');}
  addEventListener('resize',update,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(update).observe(bar);
  update();
})();
