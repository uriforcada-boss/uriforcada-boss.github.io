#!/usr/bin/env python3
"""
El blog de uriforcada.com, construido desde Markdown.

    python3 blog/build.py

Lee blog/_posts/*.md (cada uno con su cabecera), genera blog/<slug>/index.html
con la plantilla blog/_plantilla.html, rehace blog/index.html con la plantilla
blog/_indice.html, escribe blog/feed.xml y saca por pantalla las líneas para
sitemap.xml. Los cuatro artículos de agosto de 2026, escritos a mano en HTML,
entran en el índice desde blog/_legacy.json y no se tocan.

Cabecera de un post (entre dos líneas de ---):
    title: Título tal cual se lee
    date: 2026-11-09
    description: Una frase para el índice, el feed y Google.
    tipo: articulo | nota | ahora          (por defecto, articulo)
    estado: semilla | creciendo | maduro   (por defecto, semilla)
    etiquetas: sistemas, ia                (separadas por comas)
    slug: por-que-esta-web                 (si falta, sale del nombre del fichero)
    updated: 2026-11-20                    (si se retoca más tarde)
    borrador: sí                           (no se publica mientras esté)

Necesita la librería `markdown` (python3 -m pip install --user markdown).
"""
import datetime
import html
import json
import pathlib
import re
import site
import sys

sys.path.insert(0, site.getusersitepackages())
try:
    import markdown
except ImportError:  # pragma: no cover
    sys.exit("Falta la librería markdown: python3 -m pip install --user markdown")

ROOT = pathlib.Path(__file__).resolve().parent          # .../blog
SITE = "https://uriforcada.com"
POSTS = ROOT / "_posts"
TPL_POST = (ROOT / "_plantilla.html").read_text(encoding="utf-8")
TPL_INDEX = (ROOT / "_indice.html").read_text(encoding="utf-8")
LEGACY_FILE = ROOT / "_legacy.json"
LEGACY = json.loads(LEGACY_FILE.read_text(encoding="utf-8")) if LEGACY_FILE.exists() else []

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
TIPOS = {"articulo": "Artículo", "nota": "Nota", "ahora": "Ahora"}
ESTADOS = {"semilla": "Semilla", "creciendo": "Creciendo", "maduro": "Maduro"}
ESTADO_AYUDA = {
    "semilla": "Una idea recién plantada: puede cambiar entera.",
    "creciendo": "Ya tiene forma, pero sigo añadiendo y corrigiendo.",
    "maduro": "Lo doy por hecho. Si cambia, lo digo arriba.",
}


def fecha_txt(iso: str) -> str:
    d = datetime.date.fromisoformat(iso)
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


def fecha_rfc(iso: str) -> str:
    d = datetime.datetime.fromisoformat(iso).replace(tzinfo=datetime.timezone.utc)
    return d.strftime("%a, %d %b %Y %H:%M:%S +0000")


def cabecera(texto: str):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", texto, re.S)
    if not m:
        return None, texto
    meta = {}
    for linea in m.group(1).splitlines():
        if ":" in linea:
            k, v = linea.split(":", 1)
            meta[k.strip().lower()] = v.strip().strip('"').strip("'")
    return meta, m.group(2)


def render(tpl: str, datos: dict) -> str:
    out = tpl
    for k, v in datos.items():
        out = out.replace("{{" + k + "}}", v)
    return out


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def leer_posts():
    posts = []
    for f in sorted(POSTS.glob("*.md")):
        if f.name.lower().startswith(("leeme", "readme", "_")):
            continue
        meta, cuerpo = cabecera(f.read_text(encoding="utf-8"))
        if meta is None:
            print(f"· {f.name}: sin cabecera, lo salto")
            continue
        if meta.get("borrador", "").lower() in ("si", "sí", "true", "1"):
            print(f"· {f.name}: borrador, no se publica")
            continue
        for obligatorio in ("title", "date"):
            if obligatorio not in meta:
                sys.exit(f"{f.name}: falta `{obligatorio}` en la cabecera")
        slug = meta.get("slug") or re.sub(r"^\d{4}-\d{2}-\d{2}-", "", f.stem)
        tipo = meta.get("tipo", "articulo").lower()
        estado = meta.get("estado", "semilla").lower()
        if tipo not in TIPOS:
            sys.exit(f"{f.name}: tipo `{tipo}` no existe; vale {', '.join(TIPOS)}")
        if estado not in ESTADOS:
            sys.exit(f"{f.name}: estado `{estado}` no existe; vale {', '.join(ESTADOS)}")
        cuerpo_html = markdown.markdown(
            cuerpo, extensions=["extra", "sane_lists", "smarty"], output_format="html5")
        posts.append({
            "slug": slug,
            "title": meta["title"],
            "description": meta.get("description", ""),
            "date": meta["date"],
            "updated": meta.get("updated", meta["date"]),
            "tipo": tipo,
            "estado": estado,
            "etiquetas": [e.strip() for e in meta.get("etiquetas", "").split(",") if e.strip()],
            "content": cuerpo_html,
            "source": "md",
        })
    for l in LEGACY:
        posts.append({**l, "updated": l.get("updated", l["date"]), "tipo": "articulo",
                      "estado": "maduro", "etiquetas": ["automatizar"], "content": "", "source": "legacy"})
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts


def html_post(p, anterior, siguiente):
    url = f"{SITE}/blog/{p['slug']}/"
    etiquetas = ", ".join(p["etiquetas"]) if p["etiquetas"] else ""
    actualizado = ""
    if p["updated"] != p["date"]:
        actualizado = f'<span>Actualizado el <time datetime="{p["updated"]}">{fecha_txt(p["updated"])}</time></span>'
    nav_prev = f'<a class="prev" href="/blog/{anterior["slug"]}/"><small>La anterior</small><b>{esc(anterior["title"])}</b></a>' if anterior else "<span></span>"
    nav_next = f'<a class="next" href="/blog/{siguiente["slug"]}/"><small>La siguiente</small><b>{esc(siguiente["title"])}</b></a>' if siguiente else "<span></span>"
    ld = {
        "@context": "https://schema.org", "@type": "BlogPosting", "@id": url + "#post",
        "headline": p["title"], "description": p["description"], "url": url,
        "datePublished": p["date"], "dateModified": p["updated"], "inLanguage": "es-ES",
        "author": {"@id": f"{SITE}/#oriol"}, "publisher": {"@id": f"{SITE}/#oriol"},
        "isPartOf": {"@id": f"{SITE}/#web"}, "keywords": ", ".join(p["etiquetas"]),
    }
    return render(TPL_POST, {
        "TITLE": esc(p["title"]), "DESCRIPTION": esc(p["description"]), "URL": url,
        "DATE_ISO": p["date"], "DATE_TXT": fecha_txt(p["date"]), "ACTUALIZADO": actualizado,
        "TIPO": TIPOS[p["tipo"]], "ESTADO": ESTADOS[p["estado"]], "ESTADO_KEY": p["estado"],
        "ESTADO_AYUDA": ESTADO_AYUDA[p["estado"]], "ETIQUETAS": esc(etiquetas),
        "CONTENT": p["content"], "PREV": nav_prev, "NEXT": nav_next, "MIN": str(minutos(p)),
        "LD": json.dumps(ld, ensure_ascii=False, indent=2),
    })


def minutos(p):
    palabras = len(re.sub(r"<[^>]+>", " ", p.get("content", "")).split())
    return max(1, -(-palabras // 180)) if palabras else 0


def item_indice(p, destacado=False):
    extra = ' destacado' if destacado else ''
    aurora = '<div class="aurora"></div>' if destacado else ''
    mins = minutos(p)
    lectura = f", {mins} min" if mins else ""
    return (f'<a class="post{extra}" href="/blog/{p["slug"]}/" data-tipo="{p["tipo"]}" data-estado="{p["estado"]}">{aurora}'
            f'<div class="post-meta"><time datetime="{p["date"]}">{fecha_txt(p["date"])}</time><small>{TIPOS[p["tipo"]]}, {ESTADOS[p["estado"]].lower()}{lectura}</small></div>'
            f'<h2>{esc(p["title"])}</h2><p>{esc(p["description"])}</p><span class="arrow">Leer</span></a>')


def feed(posts):
    items = []
    for p in posts[:30]:
        url = f"{SITE}/blog/{p['slug']}/"
        items.append(
            "<item>"
            f"<title>{esc(p['title'])}</title><link>{url}</link><guid isPermaLink=\"true\">{url}</guid>"
            f"<pubDate>{fecha_rfc(p['date'])}</pubDate><description>{esc(p['description'])}</description>"
            "</item>")
    ultimo = fecha_rfc(posts[0]["date"]) if posts else fecha_rfc(datetime.date.today().isoformat())
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>'
            f'<title>Oriol Forcada · Blog</title><link>{SITE}/blog/</link>'
            '<description>Sistemas que trabajan solos, y lo que aprendo montándolos.</description>'
            f'<language>es-ES</language><lastBuildDate>{ultimo}</lastBuildDate>'
            f'<atom:link href="{SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>'
            + "".join(items) + "</channel></rss>\n")


def main():
    posts = leer_posts()
    nuevos = 0
    for i, p in enumerate(posts):
        if p["source"] != "md":
            continue
        siguiente = posts[i - 1] if i > 0 else None          # más reciente
        anterior = posts[i + 1] if i + 1 < len(posts) else None  # más antiguo
        destino = ROOT / p["slug"] / "index.html"
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(html_post(p, anterior, siguiente), encoding="utf-8")
        nuevos += 1
        print(f"✓ /blog/{p['slug']}/  ({TIPOS[p['tipo']]} · {ESTADOS[p['estado']]})")
    md = [p for p in posts if p["source"] == "md"]
    lista = "\n    ".join(item_indice(p, destacado=(i == 0)) for i, p in enumerate(md)) or '<p style="color:var(--dim);padding:20px 0">Todavía no hay entradas nuevas. La primera está a punto.</p>'
    archivo = "\n    ".join(item_indice(p) for p in posts if p["source"] == "legacy")
    ultima = fecha_txt(posts[0]["date"]) if posts else ""
    (ROOT / "index.html").write_text(render(TPL_INDEX, {
        "LISTA": lista, "ARCHIVO": archivo, "N": str(len(posts)), "ULTIMA": ultima,
        "ULTIMA_ISO": posts[0]["date"] if posts else "",
    }), encoding="utf-8")
    (ROOT / "feed.xml").write_text(feed(posts), encoding="utf-8")
    print(f"✓ /blog/ con {len(posts)} entradas ({nuevos} desde Markdown) y feed.xml")
    print("\nLíneas para sitemap.xml (las entradas nuevas):")
    for p in posts:
        if p["source"] == "md":
            print(f"  <url><loc>{SITE}/blog/{p['slug']}/</loc><lastmod>{p['updated']}</lastmod></url>")


if __name__ == "__main__":
    main()
