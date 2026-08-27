/* ══════════ CAPA 2 · GSAP + ScrollTrigger — 28-ago-2026 ══════════════════
   Aprobada por Oriol el 26 («implementalo») y empujada por el aviso de fuera:
   «faltan animaciones… se siente como leer el manual de algo».

   Reglas de la capa:
   · GSAP vive EN LOCAL (assets/), nada de CDN: la web no depende de nadie.
   · Si no hay GSAP, no pasa nada: reveal.js (capa 1) sigue haciendo su
     trabajo y la página es la misma. Esto AÑADE, nunca sostiene.
   · prefers-reduced-motion apaga la capa entera.
   · Nada de scroll-jacking ni pin: el scroll es del lector. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  /* 1 · Los números del instrumento cuentan hacia arriba al entrar en
     pantalla. Un «382 h» que sube desde cero se mira; escrito, se lee. */
  document.querySelectorAll('.p-val').forEach(function (el) {
    var m = (el.textContent || '').match(/^([\d.]+)\s*(.*)$/);
    if (!m) return;
    var fin = parseFloat(m[1].replace('.', '')), sufijo = m[2] ? ' ' + m[2] : '';
    var obj = { v: 0 };
    gsap.to(obj, {
      v: fin, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: function () {
        el.textContent = Math.round(obj.v).toLocaleString('es-ES') + sufijo;
      }
    });
  });

  /* 2 · Las parrillas entran en cascada, no en bloque. */
  ['.grid3', '.limites', '.inst-grid', '.despues'].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (grid) {
      gsap.from(grid.children, {
        opacity: 0, y: 22, duration: .55, stagger: .12, ease: 'power2.out',
        scrollTrigger: { trigger: grid, start: 'top 82%', once: true }
      });
    });
  });

  /* 3 · El hilo E→D→O se dibuja al llegar a la sección del método. */
  var hilo = document.querySelector('.edo-hilo path');
  if (hilo) {
    var largo = hilo.getTotalLength();
    gsap.set(hilo, { strokeDasharray: largo, strokeDashoffset: largo });
    gsap.to(hilo, {
      strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut',
      scrollTrigger: { trigger: '#metodo', start: 'top 75%', once: true }
    });
  }

  /* 4 · El retrato de Sobre mí llega con un respiro. */
  var foto = document.querySelector('.retrato img');
  if (foto) {
    gsap.from(foto, {
      opacity: 0, scale: .96, duration: .8, ease: 'power2.out',
      scrollTrigger: { trigger: foto, start: 'top 88%', once: true }
    });
  }
})();
