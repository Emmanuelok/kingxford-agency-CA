/* Original architectural doorway compositor. New room imagery is revealed by the actual photographed jambs. No video or real-time 3D claim. */
window.DuneThresholds=function(root,{rooms,paused}){
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),load=root.querySelector('.threshold-loading'),labels=root.querySelector('.threshold-door-labels'),back=root.querySelector('#threshold-return');
 const geometry={studio:[.260,.164,.358,.675],suite:[.494,.164,.588,.675],house:[.730,.164,.817,.675]};
 const order=['studio','suite','house'],images={};let selected='suite',progress=0,frame=0,disposed=false,ready=false,inside=false,w=1,h=1,anim=null;
 const reduced=()=>paused()||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 function cover(img,scale=1,center=.5){const s=Math.max(w/img.width,h/img.height)*scale,dw=img.width*s,dh=img.height*s;ctx.drawImage(img,(w-dw)*center,(h-dh)*.5,dw,dh);}
 function draw(){if(!ready||disposed)return;const p=progress,g=geometry[selected],cx=(g[0]+g[2])/2,cy=(g[1]+g[3])/2;
  ctx.clearRect(0,0,w,h);cover(images[selected],1.04-.04*p,.5);
  if(p<1){const base=Math.max(w/1672,h/941),bw=1672*base,bh=941*base;const zoom=1+Math.pow(p,1.15)*Math.max(12,w/(bw*(g[2]-g[0]))+2);
   const originX=bw*cx,originY=bh*cy;const startX=(w-bw)/2,startY=(h-bh)/2;
   const align=Math.min(1,p*3);const x=(1-align)*startX+align*(w/2-originX)+(1-zoom)*originX,y=(1-align)*startY+align*(h/2-originY)+(1-zoom)*originY;
   const ix=x+g[0]*bw*zoom,iy=y+g[1]*bh*zoom,iw=(g[2]-g[0])*bw*zoom,ih=(g[3]-g[1])*bh*zoom;
   ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.rect(ix,iy,iw,ih);ctx.clip('evenodd');ctx.drawImage(images.arrival,x,y,bw*zoom,bh*zoom);ctx.restore();
   // The room begins behind the original doorway, then the actual limestone wall leaves the frame.
   if(p<.06){ctx.save();ctx.globalAlpha=1-p/.06;ctx.drawImage(images.arrival,x,y,bw*zoom,bh*zoom);ctx.restore();}
  }
 }
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);draw();}
 function update(){const r=rooms[selected];root.dataset.room=inside?selected:'courtyard';root.querySelectorAll('[data-threshold]').forEach(b=>b.setAttribute('aria-pressed',inside&&b.dataset.threshold===selected?'true':'false'));back.hidden=!inside;labels.hidden=inside;root.querySelector('#threshold-location').textContent=inside?r.name.toUpperCase():'THE COURTYARD';root.querySelector('#threshold-count').textContent=inside?'0'+(order.indexOf(selected)+1)+' — 03':'00 — 03';root.querySelector('#threshold-kicker').textContent=inside?r.area+' m² / up to '+r.max+' guests':'At the threshold';root.querySelector('#threshold-room-title').textContent=inside?r.name:'The day can wait.';root.querySelector('#threshold-description').textContent=inside?r.story:'Stone warmed by the sun. Three doors left open. Step inside a room to explore its space.';root.querySelector('#threshold-detail').href=inside?'#/stay/'+selected:'#/stays';root.querySelector('#threshold-detail').textContent=inside?'Room details':'Compare the rooms';root.querySelector('#threshold-compose').dataset.selectRoom=selected;root.querySelector('#threshold-compose').textContent=inside?'Compose this stay':'Compose a stay';canvas.setAttribute('aria-label',inside?'Original sample '+r.name+' interior.':'The three doorways of an original sample coastal house.');}
 function travel(to,done){cancelAnimationFrame(frame);if(reduced()){progress=to;draw();done?.();return;}const from=progress,start=performance.now(),duration=to?1650:1100;anim={to,done};root.dataset.moving='true';function tick(t){const q=Math.min(1,(t-start)/duration);progress=from+(to-from)*ease(q);draw();if(q<1)frame=requestAnimationFrame(tick);else{anim=null;root.dataset.moving='false';done?.();}}frame=requestAnimationFrame(tick);}
 function enter(id){if(!ready||!rooms[id])return;if(inside&&id===selected)return;const next=()=>{selected=id;inside=true;update();travel(1)};if(progress>.01)travel(0,next);else next();}
 function click(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.threshold)enter(b.dataset.threshold);if(b===back){inside=false;update();travel(0);}}
 root.addEventListener('click',click);const observer=new ResizeObserver(resize);observer.observe(canvas);
 Promise.all(['arrival',...order].map(id=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[id]=img;resolve()};img.onerror=reject;img.src='/work/dune/assets/thresholds/'+id+'.jpg'}))).then(()=>{if(disposed)return;ready=true;load.hidden=true;root.classList.add('threshold-ready');resize();update()}).catch(()=>{load.textContent='The architectural tour could not load. Room details and the stay planner are available below.';root.classList.add('threshold-error');});
 return{destroy(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();root.removeEventListener('click',click)},settle(){if(anim&&reduced()){const a=anim;cancelAnimationFrame(frame);anim=null;progress=a.to;root.dataset.moving='false';draw();a.done?.();}},enter};
};
