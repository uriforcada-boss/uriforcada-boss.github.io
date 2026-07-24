/* Alta en MailerLite sin perder el diseño de la casa.
   ────────────────────────────────────────────────────
   El formulario embebido de MailerLite trae su propio CSS y rompería
   la marca, así que enviamos nosotros los datos a su endpoint y luego
   llevamos a la persona a la página del recurso.

   Flujo: deja el email → se manda a MailerLite → va a gracias.html
   (recurso al instante) → MailerLite le manda el correo de
   confirmación para entrar en la lista (double opt-in activado).

   Su endpoint responde con `access-control-allow-origin: *`, así que
   SÍ podemos leer la respuesta ({"success":true}). Nada de enviar a
   ciegas: si el alta no entra, la persona se entera y puede reintentar
   en vez de perderse en silencio — que el email es todo el negocio. */

(function () {
  var ENDPOINT = "https://assets.mailerlite.com/jsonp/2531213/forms/193883042373175211/subscribe";

  document.querySelectorAll("form.ml-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var input = form.querySelector('input[type="email"]');
      var button = form.querySelector("button");
      if (!input || !input.value) return;

      var destino = form.dataset.next;
      var textoOriginal = button.textContent;
      button.disabled = true;
      button.textContent = "Enviando…";

      // si ya había un aviso de un intento anterior, fuera
      var aviso = form.parentNode.querySelector(".form-msg");
      if (aviso) aviso.remove();

      var datos = new FormData();
      datos.append("fields[email]", input.value.trim());
      datos.append("fields[recurso]", form.dataset.recurso || "");
      datos.append("ml-submit", "1");
      datos.append("anticsrf", "true");

      var fallo = function () {
        button.disabled = false;
        button.textContent = textoOriginal;
        var p = document.createElement("p");
        p.className = "form-msg";
        p.innerHTML =
          "No he podido guardar tu email. Prueba otra vez en un momento — " +
          'o <a href="' + destino + '">pasa directo al recurso</a>.';
        form.parentNode.insertBefore(p, form.nextSibling);
      };

      fetch(ENDPOINT, { method: "POST", body: datos })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (r && r.success) window.location.href = destino;
          else fallo();
        })
        .catch(fallo);
    });
  });
})();
