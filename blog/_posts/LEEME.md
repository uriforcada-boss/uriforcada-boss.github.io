# Cómo publicar en el blog

1. Crea un fichero aquí, en `blog/_posts/`, con el nombre `AAAA-MM-DD-lo-que-sea.md`.
   Lo que va después de la fecha es la URL: `/blog/lo-que-sea/`.
2. Arriba del todo, la cabecera entre dos líneas de `---`:

   ```
   ---
   title: El título tal cual se lee
   date: 2026-11-09
   description: Una frase para el índice, el feed y Google.
   tipo: nota
   estado: semilla
   etiquetas: sistemas, ia
   ---
   ```

   - `tipo`: `articulo` (largo, para que lo encuentren), `nota` (corto, una idea) o `ahora` (una actualización de la página Ahora).
   - `estado`: `semilla` (recién plantado, puede cambiar entero), `creciendo` (tiene forma, sigo añadiendo) o `maduro` (lo doy por hecho).
   - Si no quieres que salga todavía, añade `borrador: sí`.
   - Si lo retocas más tarde, añade `updated: 2026-12-01`.

3. Debajo, el texto en Markdown normal: `## Títulos`, párrafos, listas, enlaces, **negritas**.
4. Desde la carpeta de la web:

   ```
   python3 blog/build.py
   ```

   Genera la página de la entrada, rehace el índice y el feed, y te saca las líneas para `sitemap.xml`.
5. Añade esas líneas al `sitemap.xml`, commit y push. Ya está.

Lo que no hay que tocar nunca: `_plantilla.html` y `_indice.html` son las plantillas; `_legacy.json` son los cuatro artículos de agosto de 2026 que están escritos a mano.
