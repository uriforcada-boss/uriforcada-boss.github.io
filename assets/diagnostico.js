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
      respuestas y se abre su cliente. Es solo la red de seguridad.

   ⚠️ 6-ago: la red de seguridad PERDÍA GENTE EN SILENCIO. Abría el `mailto` y
   900 ms después mandaba al visitante a la página de deberes — o sea, le decía
   «ya está» aunque el correo no se hubiera abierto nunca (móvil sin cliente
   configurado, webmail, permisos). El que se iba tan contento no había enviado
   nada, y aquí no quedaba rastro. Es el peor fallo posible en la puerta de un
   embudo: no se ve.

   Cómo queda mientras no haya clave, y por qué:
     · La copia se guarda en el navegador ANTES de intentar nada, así que
       ninguna respuesta se pierde por un clic que no funcionó.
     · No se redirige solo: se enseña un panel con el texto entero, un botón
       para abrir el correo y otro para copiarlo. **Nadie ve «gracias» sin
       haber confirmado que lo mandó.**
     · Si vuelve a la página, se le devuelve lo que escribió.

   Cómo conseguir la clave (1 minuto, gratis, sin registro):
     web3forms.com → escribir contacto@uriforcada.com → llega por correo.
     250 envíos/mes en el plan gratuito. Se pega abajo y ya está.
     Con la clave puesta, todo lo de arriba deja de usarse: el camino bueno es
     el `fetch`, y su lógica no se ha tocado. */

(function () {
  var ACCESS_KEY = "6610f07f-d62c-4f0e-b93e-34487a4730d2";                     // ← pegar aquí la clave de Web3Forms
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

  /* ── La red de seguridad ────────────────────────────────────────────────
     Todo lo de aquí abajo solo corre cuando NO hay clave. */

  var CLAVE_COPIA = "dg-borrador";

  function guardarCopia(datos, texto) {
    try {
      var obj = { fecha: new Date().toISOString(), texto: texto, campos: {} };
      ["negocio", "rol", "tamano", "email", "q1", "q2", "q3", "q4"]
        .forEach(function (k) { obj.campos[k] = datos.get(k) || ""; });
      localStorage.setItem(CLAVE_COPIA, JSON.stringify(obj));
    } catch (e) { /* navegador sin almacenamiento: el panel sigue funcionando */ }
  }

  /* ── 10-ago-2026 · EL GUARDADO ERA CÓDIGO MUERTO ──────────────────────
     `restaurar()` (justo aquí abajo) llevaba desde el 6-ago devolviendo lo
     escrito al que volvía… menos que nunca había nada que devolver:
     `guardarCopia()` SOLO se llamaba en el camino sin clave, y la clave está
     puesta desde entonces. O sea, con el formulario tal y como está hoy en
     producción, el que escribe tres respuestas largas y cierra la pestaña
     por lo que sea lo pierde todo. En el paso donde se compra.

     Se arregla guardando MIENTRAS escribe, no al enviar. 400 ms de espera
     para no tocar el disco en cada tecla, y el mismo formato que ya lee
     `restaurar()`, así que aquella función pasa a servir para algo.

     Se guarda todo menos el correo… no: el correo también, es lo que más
     cuesta volver a escribir en móvil. Nada de esto sale del navegador: es
     `localStorage`, no viaja a ningún sitio. Y se borra en cuanto el envío
     sale bien. */
  var CAMPOS = ["negocio", "rol", "tamano", "email", "q1", "q2", "q3", "q4"];

  function guardarBorrador() {
    try {
      var obj = { fecha: new Date().toISOString(), texto: "", campos: {} };
      CAMPOS.forEach(function (k) {
        var campo = form.elements[k];
        obj.campos[k] = campo ? campo.value : "";
      });
      localStorage.setItem(CLAVE_COPIA, JSON.stringify(obj));
      avisarGuardado();
    } catch (e) { /* sin almacenamiento: el formulario funciona igual */ }
  }

  var avisoGuardado = document.getElementById("dg-guardado");
  var relojAviso = null;
  function avisarGuardado() {
    if (!avisoGuardado) return;
    avisoGuardado.classList.add("on");
    clearTimeout(relojAviso);
    relojAviso = setTimeout(function () {
      avisoGuardado.classList.remove("on");
    }, 2000);
  }

  /* El contador de las cuatro. Cuenta respuesta CONTESTADA, no campo tocado:
     el listón son 20 caracteres, porque «sí» en la 4 vale y «asdf» en la 1 no
     debería encender nada. La 4 es la excepción y se cuenta con que haya algo,
     que ahí «sí» es una respuesta entera. */
  function pintarAvance() {
    var hechas = 0;
    ["q1", "q2", "q3"].forEach(function (k) {
      var campo = form.elements[k];
      if (campo && campo.value.trim().length >= 20) hechas++;
    });
    if (form.elements.q4 && form.elements.q4.value.trim().length > 0) hechas++;

    var n = document.getElementById("dg-hechas");
    var b = document.getElementById("dg-barra");
    if (n) n.textContent = hechas;
    if (b) b.style.transform = "scaleX(" + hechas / 4 + ")";
  }

  var relojGuardado = null;
  form.addEventListener("input", function () {
    pintarAvance();
    clearTimeout(relojGuardado);
    relojGuardado = setTimeout(guardarBorrador, 400);
  });

  /* Si vuelve a la página, se le devuelve lo que escribió. Escribir cuatro
     respuestas largas dos veces no lo hace nadie: se abandona. */
  (function restaurar() {
    try {
      var crudo = localStorage.getItem(CLAVE_COPIA);
      if (!crudo) return;
      var obj = JSON.parse(crudo);
      Object.keys(obj.campos || {}).forEach(function (k) {
        var campo = form.elements[k];
        if (campo && !campo.value) campo.value = obj.campos[k];
      });
      pintarAvance();   // si vuelve con tres contestadas, el contador lo dice
    } catch (e) { /* copia ilegible: se ignora, no se rompe la página */ }
  })();

  function panelDeReserva(texto, negocio) {
    var enlace = "mailto:" + DESTINO +
      "?subject=" + encodeURIComponent("Diagnóstico — " + negocio) +
      "&body=" + encodeURIComponent(texto);

    var previo = document.getElementById("dg-reserva");
    if (previo) previo.remove();

    var caja = document.createElement("div");
    caja.id = "dg-reserva";
    caja.className = "dg-reserva";
    caja.innerHTML =
      '<h3>Ya está listo. Falta mandarlo.</h3>' +
      '<p class="fine">Esta página no envía sola todavía: lo manda tu correo. ' +
      'Tus respuestas están guardadas en este navegador, así que no se pierden ' +
      'aunque cierres.</p>' +
      '<div class="dg-reserva-btns">' +
        '<a class="btn solid" id="dg-abrir" href="' + enlace + '">Abrir mi correo</a>' +
        '<button class="btn" type="button" id="dg-copiar">Copiar el texto</button>' +
      '</div>' +
      '<p class="fine">Si no se abre nada, copia el texto y mándalo a ' +
      '<strong>' + DESTINO + '</strong>.</p>' +
      '<textarea id="dg-texto" rows="8" readonly></textarea>' +
      '<button class="btn" type="button" id="dg-hecho">Ya lo he enviado</button>';

    form.parentNode.insertBefore(caja, form.nextSibling);
    caja.querySelector("#dg-texto").value = texto;
    caja.scrollIntoView({ behavior: "smooth", block: "center" });

    caja.querySelector("#dg-copiar").addEventListener("click", function () {
      var boton = this;
      var area = caja.querySelector("#dg-texto");
      var listo = function () { boton.textContent = "Copiado ✓"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(listo, function () {
          area.select(); document.execCommand("copy"); listo();
        });
      } else { area.select(); document.execCommand("copy"); listo(); }
    });

    /* El «gracias» solo llega cuando él dice que lo ha mandado. Antes se daba
       por hecho a los 900 ms, y esa suposición es la que perdía solicitudes. */
    caja.querySelector("#dg-hecho").addEventListener("click", function () {
      try { localStorage.removeItem(CLAVE_COPIA); } catch (e) {}
      window.location.href = GRACIAS;
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var boton = form.querySelector('button[type="submit"]');
    var datos = new FormData(form);
    var texto = componerTexto(datos);
    var negocio = datos.get("negocio") || "";

    if (!ACCESS_KEY) {
      guardarCopia(datos, texto);
      panelDeReserva(texto, negocio);
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
        if (r && r.success) {
          /* Enviado de verdad: se tira el borrador. Si no, al volver a la
             página se le devolvería lo que YA ha mandado y parecería que no
             llegó. */
          try { localStorage.removeItem(CLAVE_COPIA); } catch (e) {}
          window.location.href = GRACIAS;
        }
        else throw new Error("respuesta no ok");
      })
      .catch(function () { fallar(boton, textoOriginal); });
  });
})();
