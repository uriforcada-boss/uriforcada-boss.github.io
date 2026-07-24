# Hub web — uriforcada-boss.github.io

Hub personal + páginas de recurso `/r/` con email gate. Réplica del embudo Bertorello con la marca de Oriol (vertiente ② del mapa: Big Shoulders, un acento violeta, color plano, cero glow).

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

- **Ahora:** FormSubmit (gratis, sin cuenta). El primer envío real dispara un email de confirmación a oriol.fored@gmail.com — **hay que hacer clic en ese email una vez** y queda activo. FormSubmit responde con un alias aleatorio (`formsubmit.co/<hash>`): sustituirlo en el `action=` de la plantilla para no exponer el Gmail.
- Los leads llegan como emails a Gmail con asunto `Lead recurso: <slug>`.
- **Después (cuando haya volumen):** pegar el embed de MailerLite/Brevo (tier gratis) en el bloque `<form>` y borrar FormSubmit. Ahí ya hay lista de verdad y email de bienvenida automático.

## Reglas (no negociables)

- Un acento por pieza (violeta). Cero glow. Nada de degradados ni sci-fi.
- El gate pide UNA cosa: el email. Copy honesto, sin humo.
- Los recursos y CTAs **nunca** prometen tiempo abierto ni dan precio.
- `gracias.html` lleva `noindex` y no se enlaza desde ningún sitio público.
