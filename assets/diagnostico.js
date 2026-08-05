/* Envío del diagnóstico — sin backend y sin coste.
   ────────────────────────────────────────────────
   Este formulario NO es el gate de los recursos: aquí no se capta un email
   para una lista, se recibe una solicitud que Oriol lee entera. Por eso no
   pasa por MailerLite (la página promete «no te apunto a ninguna lista», y
   eso tiene que ser verdad).

   Dos caminos, en este orden:

   1. ENDPOINT — si está puesto (Formspree, Basin, un webhook…), se manda ahí
      por fetch y la persona acaba en deberes.html sin salir del navegador.
      Es el camino bueno: no depende de que tenga cliente de correo.

   2. mailto — si ENDPOINT está vacío, se compone un correo con las respuestas
      y se abre su cliente. Funciona hoy, sin dar de alta nada y sin pagar
      nada, a cambio de perder a quien navegue sin correo configurado.

   Mientras el volumen sea de unas pocas solicitudes al mes, el 2 basta. En
   cuanto haya flujo real, se rellena ENDPOINT y deja de perderse gente. */

(function () {
  var ENDPOINT = "";                       // ← poner aquí el del formulario cuando exista
  var DESTINO  = "oriol.fored@gmail.com";  // fallback mailto
  var GRACIAS  = "deberes.html";

  var form = document.getElementById("dg");
  if (!form) return;

  var PREGUNTAS = {
    q1: "01 · Dentro de un año, qué habría pasado para que fuera buena decisión",
    q2: "02 · Por qué no lo tiene ya / qué se lo ha impedido",
    q3: "03 · Qué tiene ya y no está aprovechando",
    q4: "04 · Quiere que le ayude",
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var boton = form.querySelector('button[type="submit"]');
    var datos = new FormData(form);
    var texto = "";

    ["negocio", "rol", "tamano", "email"].forEach(function (k) {
      texto += k.toUpperCase() + ": " + (datos.get(k) || "") + "\n";
    });
    texto += "\n";
    Object.keys(PREGUNTAS).forEach(function (k) {
      texto += PREGUNTAS[k] + "\n" + (datos.get(k) || "") + "\n\n";
    });

    if (!ENDPOINT) {
      window.location.href =
        "mailto:" + DESTINO +
        "?subject=" + encodeURIComponent("Diagnóstico — " + (datos.get("negocio") || "")) +
        "&body=" + encodeURIComponent(texto);
      // Se le enseña la página de deberes igual: ya ha hecho su parte.
      setTimeout(function () { window.location.href = GRACIAS; }, 900);
      return;
    }

    var textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Enviando…";

    var aviso = form.querySelector(".form-msg");
    if (aviso) aviso.remove();

    fetch(ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: datos,
    })
      .then(function (r) {
        if (r.ok) window.location.href = GRACIAS;
        else throw new Error("respuesta " + r.status);
      })
      .catch(function () {
        boton.disabled = false;
        boton.textContent = textoOriginal;
        var p = document.createElement("p");
        p.className = "form-msg";
        p.innerHTML =
          "No he podido enviarlo. Prueba otra vez, o escríbeme directo a " +
          '<a href="mailto:' + DESTINO + '">' + DESTINO + "</a>.";
        form.querySelector(".dg-envio").appendChild(p);
      });
  });
})();
