/* La cascada de entrada, compartida — 18-ago-2026.
   Nació en línea en la home; las demás páginas llevan CSP con
   `script-src 'self'` y un script en línea ahí está bloqueado, así que
   para darles la misma entrada el guion vive en fichero. Es el MISMO
   código que el de index.html (con el escalonado por índice del 17-ago):
   si se toca uno, se toca el otro.
   Si no hay JS, no hay cascada y no falta nada: el contenido no depende
   de esto (regla escrita en style.css). */
(function(){
  var els = document.querySelectorAll('.reveal');
  els.forEach(function(e){
    var hermanos = e.parentNode.querySelectorAll(':scope > .reveal');
    e.style.setProperty('--i', Array.prototype.indexOf.call(hermanos, e));
  });
  /* Sin observador, o con menos movimiento pedido: no hay entrada que ver.
     20-ago: antes esto ponía `.in` y dejaba `.reveal` puesto para siempre.
     No se veía —el CSS de movimiento reducido ya deja el elemento quieto y
     visible—, pero la clase seguía ahí pisando la transición propia de todo
     lo que además tiene hover. Se quitan las dos y el elemento se queda
     exactamente donde tiene que estar, que es lo mismo que hace el soltado
     de más abajo cuando la entrada sí ocurre. */
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){
    els.forEach(function(e){ e.classList.remove('reveal', 'in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){
        en.target.classList.add('in');
        io.unobserve(en.target);
        soltar(en.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 120px 0px' });

  /* ── SOLTAR EL ELEMENTO CUANDO YA HA ENTRADO — 20-ago-2026 ──────────
     La entrada es de UNA vez, pero `.reveal` se quedaba puesto para
     siempre, y con él su `transition: transform .7s`. Eso pisaba la
     transición propia de todo lo que además tiene hover: la tarjeta de
     recurso lleva `.card.reveal`, así que su subida de 2px al pasar el
     ratón tardaba 700 ms en vez de los 180 que tiene escritos. Un hover
     de 700 ms se siente roto, no elegante.

     Al terminar la entrada se quitan las dos clases. El elemento se queda
     donde tiene que estar (sin `.reveal` no hay ni opacidad ni
     desplazamiento declarados) y su transición vuelve a ser la suya.

     Si `transitionend` no llegara a dispararse, no pasa nada: se queda
     como estaba hasta hoy. Es la degradación, no un fallo. */
  /* La duración de la entrada está escrita en el CSS (`.reveal`), y el
     retardo sale del índice dentro del grupo (`.reveal.in`, 70 ms por
     puesto). Aquí se repiten como número porque el plazo del respaldo hay
     que calcularlo antes de que la transición empiece. Si algún día cambian
     en el CSS, cambian aquí. */
  var ENTRADA = 700, ESCALON = 70, MARGEN = 250;

  function soltar(el){
    var hecho = false;
    var plazo = null;

    function fin(){
      if (hecho) return;
      hecho = true;
      clearTimeout(plazo);
      el.removeEventListener('transitionend', porEvento);
      el.removeEventListener('transitioncancel', porEvento);
      el.classList.remove('reveal', 'in');
    }

    function porEvento(ev){
      /* solo el del propio elemento, y solo el de `transform`: `opacity`
         termina a la vez y dispararía dos veces */
      if (ev.target !== el || ev.propertyName !== 'transform') return;
      fin();
    }

    el.addEventListener('transitionend', porEvento);
    /* `transitioncancel` cubre que algo interrumpa la entrada a media
       altura: el navegador no manda `transitionend` en ese caso. */
    el.addEventListener('transitioncancel', porEvento);

    /* ── EL RESPALDO POR PLAZO ────────────────────────────────────────
       `transitionend` NO llega siempre: si el elemento está en una pestaña
       de fondo, dentro de algo con `display:none`, o si el navegador nunca
       llega a arrancar la transición, el evento no existe y la clase se
       quedaba puesta para siempre. Con el respaldo, pasado el tiempo que
       la entrada debería haber tardado, se suelta igual.

       ⚠️ El plazo NO suelta a ciegas: antes comprueba que el elemento ha
       llegado de verdad a su sitio (opacidad 1). Si no ha llegado —porque
       la pestaña sigue de fondo y la transición ni ha empezado—, no toca
       nada y se queda como estaba hasta hoy. Soltar a media entrada dejaría
       el elemento apareciendo de golpe, que es peor que no soltarlo. */
    var retardo = (parseInt(el.style.getPropertyValue('--i'), 10) || 0) * ESCALON;
    plazo = setTimeout(function(){
      if (hecho) return;
      if (getComputedStyle(el).opacity !== '1') return;   // aún no ha entrado
      fin();
    }, retardo + ENTRADA + MARGEN);
  }
  els.forEach(function(e){ io.observe(e); });
})();
