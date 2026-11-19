/* Panel de la home (beta, 10-nov-2026): roadmap en barras, matriz y flujo EDO. Sin dependencias. */
(function(){
  var ruta=document.getElementById('ruta'); if(!ruta) return;
  var cap=document.getElementById('ruta-cap');
  var items=[].slice.call(ruta.querySelectorAll('button.barra,button.punto'));
  items.forEach(function(b){
    function act(){items.forEach(function(x){x.classList.remove('act')}); b.classList.add('act');
      cap.innerHTML='<b>'+b.getAttribute('data-n')+'</b><span>'+b.getAttribute('data-que')+'<small>'+b.getAttribute('data-f')+'</small></span>';}
    b.addEventListener('mouseenter',act); b.addEventListener('focus',act); b.addEventListener('click',act);
    b.setAttribute('aria-label',b.getAttribute('data-n')+', '+b.getAttribute('data-f'));
  });
  /* Matriz: al pasar por una columna, el resto se atenúa */
  var m=document.querySelector('.matriz');
  if(m){var celdas=[].slice.call(m.querySelectorAll('td,th'));
    celdas.forEach(function(c){c.addEventListener('mouseenter',function(){var i=c.cellIndex; if(i===0){return;} m.classList.add('col-on'); celdas.forEach(function(x){x.classList.toggle('col-act',x.cellIndex===i)});});});
    m.addEventListener('mouseleave',function(){m.classList.remove('col-on'); celdas.forEach(function(x){x.classList.remove('col-act')});});}
  /* Aparece al entrar en pantalla */
  var rs=document.getElementById('ruta-scroll'); if(rs&&rs.scrollWidth>rs.clientWidth){rs.scrollLeft=rs.scrollWidth;}
  var objs=[ruta,document.querySelector('.flujo'),document.querySelector('.niveles')].filter(Boolean);
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on'); io.unobserve(e.target);}})},{threshold:.05});
  objs.forEach(function(el){io.observe(el)});
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){objs.forEach(function(el){el.classList.add('on')});}
})();

/* Historia: el panel fijo cuenta la parada, el capítulo y el dato; el raíl se llena. */
(function(){
  var viaje=document.querySelector('.viaje'); if(!viaje) return;
  var pasos=[].slice.call(viaje.querySelectorAll('.paso-v')),tramos=viaje.querySelector('.tramos'),
      n=document.getElementById('pa-n'),cap=document.getElementById('pa-cap'),dato=document.getElementById('pa-dato'),prog=document.getElementById('pa-prog');
  function cap_de(p){var e=p.previousElementSibling; while(e&&!e.classList.contains('grupo')) e=e.previousElementSibling; return e?e.textContent:'';}
  function pinta(){var i=-1; pasos.forEach(function(p,k){if(p.classList.contains('on')) i=k;}); if(i<0) return;
    var p=pasos[i]; if(n) n.textContent=(i+1<10?'0':'')+(i+1); if(cap) cap.textContent=cap_de(p);
    var pa=document.getElementById('parada-actual'),h2=p.querySelector('h2'); if(pa&&h2){var t=pa.querySelector(':scope > b'); if(t) t.textContent=h2.firstChild.textContent.trim();}
    if(dato) dato.innerHTML=p.dataset.dato?'<b>'+p.dataset.dato+'</b><span>'+p.dataset.datoL+'</span>':'';
    if(prog) prog.style.setProperty('--p',((i+1)/pasos.length*100)+'%');
    if(tramos){var r=tramos.getBoundingClientRect(),q=p.getBoundingClientRect(); tramos.style.setProperty('--prog',Math.max(0,Math.min(100,(q.top+38-r.top)/r.height*100))+'%');}}
  var mo=new MutationObserver(pinta); pasos.forEach(function(p){mo.observe(p,{attributes:true,attributeFilter:['class']})}); pinta();
})();
