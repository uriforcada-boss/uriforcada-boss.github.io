/* Envío del diagnóstico — sin backend y sin coste.
   ────────────────────────────────────────────────
   Este formulario NO es el gate de los recursos: aquí no se capta un email
   para una lista, se recibe una solicitud que Oriol lee entera. Por eso no
   pasa por MailerLite — y no solo por la promesa de la página, sino por una
   razón técnica: los campos de texto de MailerLite truncan, y lo valioso de
   este formulario son justo las respuestas largas.

   Dos caminos, en este orden:

   1. ACCESS_KEY — con la clave de Web3Forms puesta, el envío va por fetch y
      el correo completo llega a contacto@uriforcada.com. Es el camino bueno:
      no depende de que el visitante tenga cliente de correo, que es como se
      pierden solicitudes en móvil sin enterarte.

   2. mailto — si ACCESS_KEY está vacía, se compone un correo con las
      respuestas y se abre su cliente. Funciona, pero pierde a quien navegue
      sin correo configurado. Es solo la red de seguridad.

   Cómo conseguir la clave (1 minuto, gratis, sin registro):
     web3forms.com → escribir contacto@uriforcada.com → llega por correo.
     250 envíos/mes en el plan gratuito. Se pega abajo y ya está. */

(function () {
  var ACCESS_KEY = "";                     // ← pegar aquí la clave de Web3Forms
  var DESTINO    = "contacto@uriforcada.com";
  var GRACIAS    = "deberes.html";
  var ENDPOINT   = "https://api.web3forms.com/submit";

  var form = document.getElementById("dg");
  if (!form) return;

  var PREGUNTAS = {
    q1: "01 · Dentro de un año, qué habría pasado para que fuera buena decisión",
    q2: "02 · Por qué no lo tiene ya / qué se lo ha impedido",
    q3: "03 · Qué tiene ya y no está aprovechando",
    q4: "04 · Quiere que le ayude",
  };

  function componerTexto(datos) {
    var t = "";
    ["negocio", "rol", "tamano", "email"].forEach(function (k) {
      t += k.toUpperCase() + ": " + (datos.get(k) || "") + "\n";
    });
    t += "\n";
    Object.keys(PREGUNTAS).forEach(function (k) {
      t += PREGUNTAS[k] + "\n" + (datos.get(k) || "") + "\n\n";
    });
    return t;
  }

  function fallar(boton, textoOriginal) {
    boton.disabled = false;
    boton.textContent = textoOriginal;
    var previo = form.querySelector(".form-msg");
    if (previo) previo.remove();
    var p = document.createElement("p");
    p.className = "form-msg";
    p.innerHTML =
      "No he podido enviarlo. Prueba otra vez, o escríbeme directo a " +
      '<a href="mailto:' + DESTINO + '">' + DESTINO + "</a>.";
    form.querySelector(".dg-envio").appendChild(p);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var boton = form.querySelector('button[type="submit"]');
    var datos = new FormData(form);
    var texto = componerTexto(datos);
    var negocio = datos.get("negocio") || "";

    if (!ACCESS_KEY) {
      window.location.href =
        "mailto:" + DESTINO +
        "?subject=" + encodeURIComponent("Diagnóstico — " + negocio) +
        "&body=" + encodeURIComponent(texto);
      setTimeout(function () { window.location.href = GRACIAS; }, 900);
      return;
    }

    var textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Enviando…";

    var previo = form.querySelector(".form-msg");
    if (previo) previo.remove();

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: ACCESS_KEY,
        subject: "Diagnóstico — " + negocio,
        from_name: "Diagnóstico · uriforcada.com",
        replyto: datos.get("email") || "",
        negocio: negocio,
        rol: datos.get("rol") || "",
        tamano: datos.get("tamano") || "",
        email: datos.get("email") || "",
        respuestas: texto,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r && r.success) window.location.href = GRACIAS;
        else throw new Error("respuesta no ok");
      })
      .catch(function () { fallar(boton, textoOriginal); });
  });
})();
