/* Alta en MailerLite sin perder el diseño de la casa.
   ────────────────────────────────────────────────────
   El formulario embebido de MailerLite trae su propio CSS y rompería
   la marca, así que enviamos nosotros los datos a su endpoint y luego
   llevamos a la persona a la página del recurso.

   Flujo: deja el email → se manda a MailerLite → va a gracias.html
   (recurso al instante) → MailerLite le manda el correo de
   confirmación para entrar en la lista (double opt-in activado).

   OJO: el envío va con mode:'no-cors', así que el navegador no nos
   deja leer la respuesta. Si MailerLite fallara, el alta se perdería
   en silencio pero la persona sí vería su recurso. Es a propósito:
   antes dejar a alguien sin apuntar que dejarlo tirado en un error. */

(function () {
  var ENDPOINT = "https://assets.mailerlite.com/jsonp/2531213/forms/193883042373175211/subscribe";

  document.querySelectorAll("form.ml-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var input = form.querySelector('input[type="email"]');
      var button = form.querySelector("button");
      if (!input || !input.value) return;

      var textoOriginal = button.textContent;
      button.disabled = true;
      button.textContent = "Enviando…";

      var datos = new FormData();
      datos.append("fields[email]", input.value.trim());
      datos.append("fields[recurso]", form.dataset.recurso || "");
      datos.append("ml-submit", "1");
      datos.append("anticsrf", "true");

      var irAlRecurso = function () {
        window.location.href = form.dataset.next;
      };

      fetch(ENDPOINT, { method: "POST", body: datos, mode: "no-cors" })
        .then(irAlRecurso)
        .catch(function () {
          // aunque el alta falle, la persona se lleva lo que vino a buscar
          button.disabled = false;
          button.textContent = textoOriginal;
          irAlRecurso();
        });
    });
  });
})();
