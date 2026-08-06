# Hub web — uriforcada-boss.github.io

Hub personal + páginas de recurso `/r/` con email gate. Réplica del embudo Bertorello con la marca de Oriol: **«tinta y ácido»** (papel `#f4f3ee`, tinta `#0f0f0f`, ácido `#d4ff00` solo dentro de bloques negros; bordes de 3px y sombra dura desplazada).

**Doc de sistema:** vault → `3_Areas/Marca personal/Sistema — Embudo Bertorello (contenido → email).md`
**Dueño de la identidad visual:** vault → `3_Areas/Marca personal/Identidad visual — Mapa de marca.md`

## Estructura

```
index.html              ← hub (recursos + redes + trabaja conmigo)
assets/style.css        ← todo el sistema visual, compartido
r/_plantilla/
  index.html            ← página del recurso con email gate ({{PLACEHOLDERS}})
  gracias.html          ← recurso completo, URL no listada (esqueleto Bertorello)
```

## Estrenar un recurso nuevo

1. `cp -r r/_plantilla r/<slug>` — el slug ES la palabra clave del post, en minúsculas.
2. Sustituir todos los `{{PLACEHOLDER}}` en `index.html` y `gracias.html` del nuevo directorio.
3. Descomentar/copiar la tarjeta en el `index.html` del hub y apuntarla a `r/<slug>/`.
4. Commit + push. La URL queda en `https://uriforcada-boss.github.io/r/<slug>/`.
5. En el post: CTA "comenta <PALABRA>" + esa URL en el primer comentario.

La vara del recurso (medida en el recurso real de Bertorello): **~350 palabras, 3 pasos, un bloque copiable exacto, CTA suave al servicio al final.** Se lee en 2 minutos y se aplica hoy. No es un ebook.

## El formulario (email gate)

Los emails van a **MailerLite** (cuenta `uriforcada`, plan gratis). FormSubmit
quedó retirado el 24-jul: reenviaba a Gmail pero no era una lista — sin export,
sin baja, y la política de privacidad sí promete baja.

- El formulario embebido de MailerLite trae su propio CSS y rompería la marca,
  así que el markup es nuestro y `assets/subscribe.js` postea al endpoint.
- Cada `<form>` necesita tres cosas: `class="gate-form ml-form"`,
  `data-recurso="<slug>"` y `data-next="<URL absoluta de gracias.html>"`.
- Dónde cae: grupo **Recursos**, con el campo personalizado `recurso` = el slug.
  Así se sabe qué recurso trajo a cada persona sin montar un formulario por recurso.
- **Doble opt-in APAGADO** (decisión de Oriol, 24-jul): el email de confirmación
  de MailerLite no se puede editar en plan gratis y salía en inglés hablando de
  "newsletter". En su lugar, la automatización **«Bienvenida — Recursos»** manda
  un email propio (asunto «Ya estás dentro — tus 3 recursos, en un sitio») con
  los enlaces directos a los 3 `gracias.html` al entrar en el grupo Recursos.
  El consentimiento queda probado con la IP y hora que registra MailerLite,
  y todos los correos llevan baja en el pie.
- El endpoint responde `access-control-allow-origin: *`, así que el script lee
  `{"success":true}` y solo redirige si el alta entró de verdad. Si falla, sale
  un aviso con enlace al recurso — nadie se queda atrapado y no se pierde ningún
  alta en silencio.

Cambiar de cuenta o de formulario = tocar `ENDPOINT` en `assets/subscribe.js`, nada más.

## El diagnóstico (`/diagnostico/`) — ⬜ le falta UNA cosa

La puerta del embudo B. **No pasa por MailerLite a propósito**: sus campos de
texto truncan, y aquí lo valioso son justo las respuestas largas.

**Lo único pendiente, y lo tiene que hacer Oriol (1 minuto, 0 €, sin registro):**

1. Entrar en `web3forms.com` y escribir `contacto@uriforcada.com`.
2. La clave llega a ese correo.
3. Pegarla en `assets/diagnostico.js`, línea 41 → `var ACCESS_KEY = "…";`
4. Commit y push. Nada más: el resto del camino ya está montado y probado.

Con la clave, la solicitud llega entera por correo sin depender del cliente del
visitante. **Plan gratuito: 250 envíos/mes.**

**Mientras no esté la clave** (estado de hoy, 6-ago) el formulario NO se pierde
solicitudes, pero tampoco te llegan solas: al enviar, la página guarda una copia
en el navegador del visitante y le enseña un panel con el texto entero, un botón
para abrir su correo y otro para copiarlo. **Solo ve la página de deberes cuando
confirma que lo ha mandado.** Antes se le mandaba allí a los 900 ms sin
comprobar nada — el que no tuviera cliente de correo configurado se iba
convencido de haberlo enviado y aquí no quedaba rastro.

## Reglas (no negociables)

- Un acento por pieza (el ácido, y solo sobre negro). Cero glow ni degradados.
- El gate pide UNA cosa: el email. Copy honesto, sin humo.
- Los recursos y CTAs **nunca** prometen tiempo abierto ni dan precio.
- `gracias.html` lleva `noindex` y no se enlaza desde ningún sitio público.
