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
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){
    els.forEach(function(e){ e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 120px 0px' });
  els.forEach(function(e){ io.observe(e); });
})();
