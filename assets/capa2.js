/* ══════════ CAPA 2 · GSAP — 28-ago-2026, versión 2 ═══════════════════════
   ⚠️ POR QUÉ NO HAY ScrollTrigger, y esto es una cicatriz: la v1 lo usaba y
   el scroll suave (Lenis) no le dispara los triggers, así que `gsap.from`
   dejaba las parrillas EN OPACIDAD CERO para siempre: secciones enteras en
   blanco, visto por Oriol en pantalla. Dos lecciones aplicadas:
     1. El disparador es IntersectionObserver, el MISMO mecanismo que ya usa
        reveal.js en esta web. Cero dependencia del sistema de scroll.
     2. Nada de esconder contenido por defecto. Esta capa solo ANIMA lo que
        ya se ve; si JS muere a mitad, la página queda entera.
   El escalonado de parrillas se fue con la v1: reveal.js ya lo hace. */
(function () {
  if (!window.gsap) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function alVerse(el, fn) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  }

  /* 1 · Los números del instrumento cuentan hacia arriba. */
  document.querySelectorAll('.p-val').forEach(function (el) {
    var m = (el.textContent || '').match(/^([\d.]+)\s*(.*)$/);
    if (!m) return;
    var fin = parseFloat(m[1].replace('.', '')), sufijo = m[2] ? ' ' + m[2] : '';
    alVerse(el, function () {
      var obj = { v: 0 };
      gsap.to(obj, {
        v: fin, duration: 1.4, ease: 'power2.out',
        onUpdate: function () {
          el.textContent = Math.round(obj.v).toLocaleString('es-ES') + sufijo;
        }
      });
    });
  });

  /* 2 · El hilo E→D→O se dibuja al llegar. Se prepara AL VERSE, no al
     cargar: así, sin observer no hay estado escondido. */
  var hilo = document.querySelector('.edo-hilo path');
  if (hilo) alVerse(hilo, function () {
    var largo = hilo.getTotalLength();
    gsap.fromTo(hilo,
      { strokeDasharray: largo, strokeDashoffset: largo },
      { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut' });
  });

  /* 3 · El retrato llega con un respiro. fromTo al verse: nunca oculto. */
  var foto = document.querySelector('.retrato img');
  if (foto) alVerse(foto, function () {
    gsap.fromTo(foto, { opacity: 0, scale: .96 },
      { opacity: 1, scale: 1, duration: .8, ease: 'power2.out' });
  });
})();
