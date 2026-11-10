/* uriforcada.com · Aurora · 9-nov-2026. El menú en móvil, el aparecer suave
   de las secciones y el viaje de Historia. Sin giros ni rebotes. */
(function(){
  var nav=document.getElementById('nav'),btn=document.querySelector('.nav-toggle');
  if(nav&&btn){btn.addEventListener('click',function(){var o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o?'true':'false');btn.textContent=o?'Cerrar':'Menú'});}
  var els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px'});
  els.forEach(function(e){io.observe(e)});
})();

/* El viaje: el mapa fijo sigue al paso que tienes delante, la ruta se dibuja
   al avanzar, las paradas visitadas quedan marcadas y todo es clicable. */
(function(){
  var viaje=document.querySelector('.viaje'); if(!viaje) return;
  var mapa=viaje.querySelector('.mapa'),inner=mapa.querySelector('.mapa-in'),cap=mapa.querySelector('.mapa-cap'),
      pasos=Array.prototype.slice.call(viaje.querySelectorAll('.paso-v')),
      pins=Array.prototype.slice.call(mapa.querySelectorAll('.pin')),
      lines=Array.prototype.slice.call(mapa.querySelectorAll('.ruta .line')),
      chips=Array.prototype.slice.call(document.querySelectorAll('.paradas button'));
  /* primera vez que aparece cada parada, para saber cuáles ya se han visitado */
  var first={}; pasos.forEach(function(p,i){var id=p.dataset.pin; if(id&&!(id in first)) first[id]=i;});
  function go(i){
    var p=pasos[i]; if(!p) return;
    var pin=null;
    pins.forEach(function(x){var f=first[x.dataset.id]; x.classList.toggle('done',f!==undefined&&f<=i); var on=x.dataset.id===p.dataset.pin; x.classList.toggle('on',on); if(on) pin=x;});
    pasos.forEach(function(x){x.classList.toggle('on',x===p)});
    var pa=document.getElementById('parada-actual');
    if(pa){var h3=p.querySelector('h3'),q=p.querySelector('.que');
      pa.querySelector('b').textContent=h3?h3.firstChild.textContent.trim():(p.dataset.lugar||'');
      pa.querySelector('span').textContent=(p.dataset.lugar?p.dataset.lugar+', ':'')+(p.dataset.fecha||'');
      pa.querySelector('.tags').innerHTML=q?q.innerHTML:'';}
    var n=parseInt(p.dataset.seg||'0',10); lines.forEach(function(l,k){l.classList.toggle('on',k<n)});
    chips.forEach(function(c){var f=first[c.dataset.pin]; c.classList.toggle('done',f!==undefined&&f<=i); c.classList.toggle('on',c.dataset.pin===p.dataset.pin)});
    var s=parseFloat(p.dataset.zoom||'1'),W=mapa.clientWidth,H=mapa.clientHeight;
    if(!pin||s<=1){inner.style.transform='none';inner.style.setProperty('--inv',1);}
    else{var px=parseFloat(pin.style.left)/100*W,py=parseFloat(pin.style.top)/100*H,
      tx=Math.min(0,Math.max(W-W*s, W*.5-s*px)),ty=Math.min(0,Math.max(H-H*s, H*.5-s*py));
      inner.style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';inner.style.setProperty('--inv',(1/s).toFixed(3));}
    if(cap){cap.innerHTML=(p.dataset.lugar?'<b>'+p.dataset.lugar+'</b>, ':'')+(p.dataset.fecha||'');}
  }
  function irA(id){var t=null; pasos.some(function(p){if(p.dataset.pin===id){t=p;return true}}); if(t) t.scrollIntoView({behavior:'smooth',block:'center'});}
  pins.forEach(function(x){x.addEventListener('click',function(){irA(x.dataset.id)})});
  chips.forEach(function(c){c.addEventListener('click',function(){irA(c.dataset.pin)})});
  if(!('IntersectionObserver' in window)){go(0);return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting) go(pasos.indexOf(e.target))})},{rootMargin:'-45% 0px -45% 0px',threshold:0});
  pasos.forEach(function(p){io.observe(p)});
  go(0);
  if(location.hash){var h=document.getElementById(location.hash.slice(1)); if(h&&h.classList.contains('paso-v')) setTimeout(function(){h.scrollIntoView({behavior:'smooth',block:'center'})},300);}
})();

/* Portada: el mapa recorre las paradas solo, y las cifras cuentan al aparecer. */
(function(){
  var m=document.getElementById('mapa-portada'); if(!m) return;
  var pins=Array.prototype.slice.call(m.querySelectorAll('.pin[data-lugar]')),cap=m.querySelector('.mapa-cap'),i=0,t;
  function show(k){pins.forEach(function(p,j){p.classList.toggle('on',j===k)});var p=pins[k];cap.innerHTML='<b>'+p.dataset.lugar+'</b><small>'+p.dataset.que+'</small>';}
  function next(){i=(i+1)%pins.length;show(i);}
  show(0); t=setInterval(next,3200);
  pins.forEach(function(p,j){p.addEventListener('mouseenter',function(){clearInterval(t);i=j;show(j);});p.addEventListener('mouseleave',function(){t=setInterval(next,3200);});});
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) clearInterval(t);
})();
(function(){
  var nums=document.querySelectorAll('.cifras-g b[data-n]'); if(!nums.length||!('IntersectionObserver' in window)) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function fmt(n){return n.toLocaleString('es-ES');}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting) return; io.unobserve(e.target);
    var el=e.target,end=parseInt(el.dataset.n,10),pre=el.dataset.pre||'',suf=el.dataset.suf||'',t0=null;
    function step(ts){if(!t0) t0=ts;var p=Math.min(1,(ts-t0)/1400),v=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=pre+fmt(v)+suf;if(p<1) requestAnimationFrame(step);}
    requestAnimationFrame(step);});},{threshold:.4});
  nums.forEach(function(n){io.observe(n)});
})();



/* Blog: índice de la entrada a la derecha, a partir de sus h2, con la sección activa marcada. */
(function(){
  var art=document.getElementById('articulo'),toc=document.getElementById('toc'); if(!art||!toc) return;
  var hs=Array.prototype.slice.call(art.querySelectorAll('h2')); if(hs.length<2) return;
  var ol=toc.querySelector('ol'),links=[];
  hs.forEach(function(h,i){ if(!h.id) h.id='s'+(i+1); var li=document.createElement('li'),a=document.createElement('a'); a.href='#'+h.id; a.textContent=h.textContent; li.appendChild(a); ol.appendChild(li); links.push(a); });
  toc.hidden=false;
  if(!('IntersectionObserver' in window)) return;
  var io=new IntersectionObserver(function(es){es.forEach(function(x){ if(x.isIntersecting){ links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+x.target.id)}); } })},{rootMargin:'-20% 0px -65% 0px'});
  hs.forEach(function(h){io.observe(h)});
})();

/* El fondo vivo (10-nov). Él eligió la «Malla» entre seis: una retícula fina
   que se curva alrededor del ratón como una lente, con los cruces cercanos
   encendidos en azul→verde y una luz de aurora que lo sigue y deriva sola
   cuando nadie mueve el ratón (y en móvil). Con «reducir movimiento», todo
   quieto. Se para cuando la pestaña no se ve.                               */
(function(){
  if(!document.body||document.getElementById('fondo')) return;
  var c=document.createElement('canvas');c.id='fondo';c.setAttribute('aria-hidden','true');document.body.prepend(c);
  var ctx=c.getContext('2d',{alpha:true}),W=0,H=0,dpr=1,quiet=window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      mx=-1e4,my=-1e4,px=-1e4,py=-1e4,lastMove=0,t=0,raf=0,CELL=44,R=260,S=14;
  function mix(m){return [Math.round(46+(23-46)*m),Math.round(156+(179-156)*m),Math.round(255+(122-255)*m)];}
  function size(){
    dpr=Math.min(2,window.devicePixelRatio||1);W=window.innerWidth;H=window.innerHeight;
    c.width=W*dpr;c.height=H*dpr;c.style.width=W+'px';c.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  function warp(x,y){ if(px<-1e3) return [x,y]; var dx=x-px,dy=y-py,d=Math.sqrt(dx*dx+dy*dy); if(d>R||d<.01) return [x,y]; var e=1-d/R;e=e*e*(3-2*e); var k=1+.35*e; return [px+dx*k,py+dy*k]; }
  function seg(ax,ay,bx,by){
    var cx=(ax+bx)/2-px,cy=(ay+by)/2-py,d=Math.sqrt(cx*cx+cy*cy),al=.075,col=[15,20,24];
    if(px>-1e3&&d<R){var e=1-d/R;al=.075+.5*e*e;col=mix(d/R);}
    ctx.strokeStyle='rgba('+col[0]+','+col[1]+','+col[2]+','+al.toFixed(3)+')';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    var lit=px>-1e3,ox=(W%CELL)/2,oy=(H%CELL)/2;
    if(lit){var g=ctx.createRadialGradient(px,py,0,px,py,300);
      g.addColorStop(0,'rgba(46,156,255,.16)');g.addColorStop(.45,'rgba(30,56,222,.08)');g.addColorStop(.8,'rgba(23,179,122,.04)');g.addColorStop(1,'rgba(23,179,122,0)');
      ctx.fillStyle=g;ctx.fillRect(px-300,py-300,600,600);}
    ctx.lineWidth=1;
    for(var x=ox;x<=W;x+=CELL){var prev=warp(x,0);for(var y=S;y<=H+S;y+=S){var p=warp(x,Math.min(y,H));seg(prev[0],prev[1],p[0],p[1]);prev=p;}}
    for(var y=oy;y<=H;y+=CELL){var prev=warp(0,y);for(var x=S;x<=W+S;x+=S){var p=warp(Math.min(x,W),y);seg(prev[0],prev[1],p[0],p[1]);prev=p;}}
    if(lit){for(var x=ox;x<=W;x+=CELL)for(var y=oy;y<=H;y+=CELL){var dx=x-px,dy=y-py,d=Math.sqrt(dx*dx+dy*dy);if(d<R){var e=1-d/R,p=warp(x,y),col=mix(d/R);
      ctx.fillStyle='rgba('+col[0]+','+col[1]+','+col[2]+','+(.15+.6*e*e).toFixed(3)+')';ctx.beginPath();ctx.arc(p[0],p[1],1+2.2*e,0,6.2832);ctx.fill();}}}
  }
  function loop(){
    raf=0;t+=1;var tx=mx,ty=my,idle=performance.now()-lastMove>2200;
    if(idle||mx<-1e3){tx=W*(.5+.38*Math.sin(t*.0035));ty=H*(.42+.3*Math.cos(t*.0027));}
    if(px<-1e3){px=tx;py=ty;}
    px+=(tx-px)*.06;py+=(ty-py)*.06;
    draw();if(!document.hidden)raf=requestAnimationFrame(loop);
  }
  window.addEventListener('resize',size);
  if(!quiet){
    window.addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;lastMove=performance.now();},{passive:true});
    window.addEventListener('pointerleave',function(){mx=-1e4;my=-1e4;});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&!raf)raf=requestAnimationFrame(loop);});
  }
  size();if(!quiet)raf=requestAnimationFrame(loop);
  try{localStorage.removeItem('fondo')}catch(e){}
})();

/* Qué sé hacer: dentro de cada bloque solo hay un desplegable abierto a la vez. */
(function(){
  document.querySelectorAll('.bloque').forEach(function(b){
    b.addEventListener('toggle',function(e){
      var d=e.target; if(!(d instanceof HTMLDetailsElement)||!d.open) return;
      b.querySelectorAll('details[open]').forEach(function(o){ if(o!==d) o.open=false; });
    },true);
  });
})();
