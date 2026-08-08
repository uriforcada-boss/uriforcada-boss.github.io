/* ══════════════════════════════════════════════════════════════════════
   CAPA 1 · SCROLL SUAVE (Lenis) — 8-ago-2026
   ══════════════════════════════════════════════════════════════════════
   Lenis envuelve el scroll nativo, no lo secuestra: los anclajes, el
   teclado y `position: sticky` siguen funcionando igual. Pesa ~4 kb.

   Se sirve desde /assets/ y NO desde un CDN a propósito: las páginas del
   sitio llevan una política de seguridad con `script-src 'self'`, y un
   script externo la rompería. Por lo mismo, este fichero existe en vez de
   ir el código suelto dentro del HTML.

   Sistema completo y sus porqués: la nota «Scroll horizontal con GSAP +
   Lenis (verificado)» del vault. La capa 2 (GSAP, ~70 kb) NO está puesta:
   hoy no hay nada en la web que la justifique.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  if (typeof Lenis === 'undefined') return;           // si no cargó, la web sigue igual

  // Lenis ya respeta `prefers-reduced-motion` por su cuenta, pero aquí ni
  // se arranca: menos trabajo y ni un frame de animación de más.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lenis = new Lenis({
    duration: 0.9,          // más alto es más "flotante". 0.9 se nota sin marear
    smoothWheel: true,
    // El móvil se queda con su scroll nativo: el de iOS y Android ya va
    // bien, y suavizarlo por encima es lo que hace que una web se sienta
    // pegajosa en el dedo. Es justo el fallo del que el tutorial no habla.
    smoothTouch: false
  });

  function raf(t) {
    lenis.raf(t);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Los anclajes internos (#recursos) los mueve Lenis, para que la inercia
  // sea la misma que la de la rueda y no dos movimientos distintos.
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      lenis.scrollTo(destino, { offset: -88 });       // 88 = alto de la barra
    });
  });
})();
