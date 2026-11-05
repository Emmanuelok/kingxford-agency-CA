// Keep this template's fixed sidebar below the selection tools while they are visible.
(() => {
  const bar=document.querySelector('.avalon-template-tools');
  if(!bar)return;
  let frame=0;
  function update(){frame=0;document.documentElement.style.setProperty('--avalon-template-offset',Math.max(0,bar.getBoundingClientRect().bottom)+'px');}
  function queue(){if(!frame)frame=requestAnimationFrame(update);}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(queue).observe(bar);
  update();
})();
