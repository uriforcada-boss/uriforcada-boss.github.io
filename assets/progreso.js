/* Barra de progreso de lectura — 10-ago-2026.
   ───────────────────────────────────────────
   Es de adorno hasta que deja de serlo: en una página larga dice cuánto queda,
   y eso es lo que evita el abandono a media altura. No toca el contenido: si
   esto no se ejecuta, la página se lee exactamente igual.

   ⚠️ POR QUÉ ESTÁ EN UN FICHERO Y NO EN LÍNEA, que era lo cómodo:
   nació dentro de un <script> en la home y al copiarlo a `/ca/` la consola
   soltó «Executing inline script violates the following Content Security
   Policy directive 'script-src 'self''». Y es correcto: las páginas sin JS en
   línea llevan CSP a propósito (está escrito en la cabecera de `index.html`),
   así que meterles un script en línea las rompe en silencio — la barra no se
   pintaba y encima se registraba una violación de política en cada visita.
   Desde aquí funciona en las dos y ninguna página tiene que renunciar a su
   CSP para tener barra. */

(function () {
  var barra = document.getElementById("progreso");
  if (!barra) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var pendiente = false;

  function pintar() {
    var alto = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = "scaleX(" + (alto > 0 ? Math.min(1, scrollY / alto) : 0) + ")";
    pendiente = false;
  }

  addEventListener("scroll", function () {
    /* Un solo repintado por frame. Sin esto, un scroll largo llama a `pintar`
       cientos de veces por segundo para mover dos píxeles. */
    if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); }
  }, { passive: true });

  pintar();
})();
