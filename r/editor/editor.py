"""Editor de vídeo por lotes — quita silencios y quema subtítulos.

## La idea que ordena el programa entero

**No edita la pieza elegida: edita TODO el lote**, para que elijas sobre
material terminado. Un vídeo en bruto lleno de silencios no se puede juzgar;
uno cortado y subtitulado sí. La decisión de qué se sube llega DESPUÉS, con el
INFORME.md delante.

Consecuencias de diseño:
  · Entra una carpeta, no un fichero.
  · Nada se descarta solo. Si un vídeo sale raro, se marca y se entrega igual.
  · El original NUNCA se toca. Se escribe en `editados/`.
  · Al final deja un informe para elegir de un vistazo.

## Coste

**0 €.** Todo local:
  · ffmpeg → binario estático de `imageio-ffmpeg` (no hace falta brew ni sudo)
  · subtítulos → `whisper-ctranslate2`, el mismo del radar de referentes

## El orden importa, y es el fallo fácil

Se corta PRIMERO y se transcribe DESPUÉS. Si se transcribe el original y luego se
corta, los tiempos del SRT dejan de cuadrar con el vídeo y los subtítulos salen
desplazados. Por eso whisper corre sobre el vídeo ya cortado.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).parent
ENTRADA = BASE / "brutos"
SALIDA = BASE / "editados"
INFORME = BASE / "editados" / "INFORME.md"

VIDEOS = {".mp4", ".mov", ".m4v", ".avi", ".mkv"}

# Silencio: por debajo de este volumen y durante más de este tiempo, se corta.
# -30 dB es conservador a propósito: mejor dejar una pausa de más que comerse el
# principio de una palabra.
UMBRAL_DB = -30
MIN_SILENCIO = 0.6
MARGEN = 0.15          # se conserva alrededor del habla, para no cortar en seco

MODELO = "base"
# La regla propia (sale del catálogo de estructuras, no de una preferencia):
# **menos de 7 palabras en pantalla, una tipografía, con fondo**. Se limita por
# PALABRAS y no por caracteres — con `--max_line_width` salían bloques de 4
# líneas y 11 palabras, que en vertical tapan medio encuadre.
MAX_PALABRAS = 5

T_FF = 1800
T_WHISPER = 900

# Estilo de subtítulo. Grande, una sola tipografía y CON FONDO — es la regla que
# salió del análisis de referentes, no una preferencia estética.
ESTILO = (
    "FontName=Helvetica,Fontsize=15,Bold=1,PrimaryColour=&H00FFFFFF,"
    "BorderStyle=3,Outline=1,Shadow=0,BackColour=&H99000000,"
    "Alignment=2,MarginV=60"
)


def _ffmpeg():
    """Ruta al binario estático. Se resuelve una vez y se cachea en disco para no
    pagar el arranque de uvx en cada vídeo del lote."""
    cache = BASE / ".ffmpeg_path"
    if cache.exists():
        p = Path(cache.read_text().strip())
        if p.exists():
            return str(p)
    r = subprocess.run(
        ["uvx", "--from", "imageio-ffmpeg", "python", "-c",
         "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"],
        capture_output=True, text=True, timeout=300,
    )
    if r.returncode != 0:
        raise RuntimeError(f"No se pudo obtener ffmpeg: {r.stderr[-300:]}")
    ruta = r.stdout.strip().splitlines()[-1]
    cache.write_text(ruta)
    return ruta


def _correr(cmd, timeout):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, (r.stdout or "") + (r.stderr or "")
    except subprocess.TimeoutExpired:
        return False, f"timeout tras {timeout}s"
    except FileNotFoundError as e:
        return False, str(e)


def duracion(ff, video):
    ok, log = _correr([ff, "-i", str(video)], 120)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", log)
    if not m:
        return None
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def tramos_con_voz(ff, video, total):
    """Devuelve los tramos a CONSERVAR, no los silencios.

    Se calcula por complemento: ffmpeg dice dónde hay silencio, y lo que queda
    es habla. Si no detecta ningún silencio, se devuelve el vídeo entero — no se
    inventa un corte."""
    ok, log = _correr(
        [ff, "-i", str(video), "-af",
         f"silencedetect=noise={UMBRAL_DB}dB:d={MIN_SILENCIO}", "-f", "null", "-"],
        T_FF,
    )
    if not ok:
        return None

    silencios, inicio = [], None
    for m in re.finditer(r"silence_(start|end): (-?[\d.]+)", log):
        tipo, val = m.group(1), float(m.group(2))
        if tipo == "start":
            inicio = val
        elif inicio is not None:
            silencios.append((inicio, val))
            inicio = None
    if inicio is not None:                    # silencio abierto hasta el final
        silencios.append((inicio, total))

    if not silencios:
        return [(0.0, total)]

    tramos, cursor = [], 0.0
    for s_ini, s_fin in silencios:
        fin = min(s_ini + MARGEN, total)
        if fin - cursor > 0.25:               # tramos ridículos se descartan
            tramos.append((cursor, fin))
        cursor = max(0.0, s_fin - MARGEN)
    if total - cursor > 0.25:
        tramos.append((cursor, total))
    return tramos


def cortar(ff, video, tramos, destino):
    """Un solo paso de ffmpeg con select/aselect: más rápido y sin ficheros
    intermedios que luego haya que limpiar."""
    cond = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in tramos)
    filtro = (
        f"[0:v]select='{cond}',setpts=N/FRAME_RATE/TB[v];"
        f"[0:a]aselect='{cond}',asetpts=N/SR/TB[a]"
    )
    ok, log = _correr(
        [ff, "-y", "-i", str(video), "-filter_complex", filtro,
         "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast",
         "-crf", "20", "-c:a", "aac", str(destino)],
        T_FF,
    )
    return ok, log


def subtitular(ff, video, srt, destino):
    ok, log = _correr(
        [ff, "-y", "-i", str(video), "-vf",
         f"subtitles={srt.name}:force_style='{ESTILO}'",
         "-c:a", "copy", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         str(destino)],
        T_FF,
    )
    return ok, log


def transcribir_srt(video, carpeta):
    """SRT sobre el vídeo YA CORTADO. Sin --language: lo detecta solo."""
    # --word_timestamps True es OBLIGATORIO para partir líneas: sin él,
    # --max_line_count revienta. Y sin partir líneas salen subtítulos de 15
    # palabras, que en vertical tapan media pantalla.
    ok, log = _correr(
        ["uvx", "--from", "whisper-ctranslate2", "whisper-ctranslate2",
         "--model", MODELO, "--output_format", "srt", "--output_dir", str(carpeta),
         "--word_timestamps", "True",
         "--max_words_per_line", str(MAX_PALABRAS),
         str(video)],
        T_WHISPER,
    )
    srt = next(carpeta.glob("*.srt"), None)
    return (srt, None) if srt else (None, log.strip().splitlines()[-1] if log.strip() else "sin salida")


def cadena_video(lut, srt=None):
    """Filtros de vídeo, EN ORDEN. El LUT va primero y los subtítulos después:
    al revés, el color se aplicaría también al texto y el blanco dejaría de ser
    blanco."""
    partes = []
    if lut:
        partes.append(f"lut3d=file='{lut}'")
    if srt:
        partes.append(f"subtitles={srt}:force_style='{ESTILO}'")
    return ",".join(partes)


def procesar(ff, video, lut=None):
    tmp = SALIDA / f".tmp_{video.stem}"
    tmp.mkdir(parents=True, exist_ok=True)
    r = {"nombre": video.name, "ok": False, "aviso": None}

    total = duracion(ff, video)
    if not total:
        r["error"] = "no se pudo leer la duración (¿es un vídeo?)"
        return r
    r["seg_original"] = round(total, 1)

    tramos = tramos_con_voz(ff, video, total)
    if not tramos:
        r["error"] = "falló la detección de silencios"
        return r

    util = sum(b - a for a, b in tramos)
    r["seg_editado"] = round(util, 1)
    r["recorte_pct"] = round(100 * (1 - util / total)) if total else 0
    r["cortes"] = len(tramos)

    # Un recorte enorme casi siempre es audio bajo, no un vídeo lleno de pausas.
    # Se avisa y se entrega igual: descartarlo solo sería decidir por él.
    if r["recorte_pct"] > 60:
        r["aviso"] = f"recorta el {r['recorte_pct']}% — revisa el audio antes de fiarte"

    cortado = tmp / "cortado.mp4"
    ok, log = cortar(ff, video, tramos, cortado)
    if not ok:
        r["error"] = f"corte falló: {log[-200:]}"
        return r

    srt, err = transcribir_srt(cortado, tmp)

    vf = cadena_video(lut, srt)
    if not vf:
        # Ni LUT ni subtítulos: el corte por sí solo ya sirve.
        final = SALIDA / f"{video.stem} — cortado.mp4"
        cortado.replace(final)
        r.update(ok=True, salida=final.name, aviso=f"sin subtítulos ({err})")
        return r

    sufijo = "editado" if srt else "cortado+color"
    final = SALIDA / f"{video.stem} — {sufijo}.mp4"
    ok, log = _correr(
        [ff, "-y", "-i", str(cortado), "-vf", vf,
         "-c:a", "copy", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         str(final)],
        T_FF,
    )
    if not ok:
        cortado.replace(SALIDA / f"{video.stem} — cortado.mp4")
        r.update(ok=True, salida=f"{video.stem} — cortado.mp4",
                 aviso=f"filtros fallaron: {log[-160:]}")
        return r
    if not srt:
        r["aviso"] = f"sin subtítulos ({err})"

    r.update(ok=True, salida=final.name,
             texto=srt.read_text(encoding="utf-8", errors="replace"))
    return r


def informe(res):
    L = ["# Informe del lote — elige aquí", "",
         "> Todos los vídeos vienen **cortados y subtitulados**. Nada se ha",
         "> descartado solo: eso lo decides tú. Los originales están intactos en `brutos/`.", ""]
    buenos = [r for r in res if r.get("ok")]
    malos = [r for r in res if not r.get("ok")]
    L.append(f"**{len(buenos)} listos** · {len(malos)} fallaron")
    L.append("")
    L.append("| ✔ | Vídeo | Original | Editado | Recorte | Aviso |")
    L.append("|---|---|---|---|---|---|")
    for r in sorted(buenos, key=lambda x: x.get("recorte_pct", 0)):
        L.append(f"| ⬜ | {r['salida']} | {r.get('seg_original','?')}s | "
                 f"{r.get('seg_editado','?')}s | {r.get('recorte_pct','?')}% | {r.get('aviso') or '—'} |")
    if malos:
        L += ["", "## No salieron", ""]
        for r in malos:
            L.append(f"- **{r['nombre']}** → {r.get('error','?')}")
    L += ["", "---", "", "## Lo que dice cada uno", ""]
    for r in buenos:
        if r.get("texto"):
            limpio = re.sub(r"^\d+$|^[\d:,\s>-]+$", "", r["texto"], flags=re.M)
            limpio = " ".join(limpio.split())
            L += [f"### {r['salida']}", "", f"> {limpio[:600]}{'…' if len(limpio) > 600 else ''}", ""]
    return "\n".join(L)


def main(argv):
    # --lut: fichero .cube de gradación de color. Se lo puedes pedir a Claude en
    # una frase («genera un .cube pastel suave, cinematográfico, para vídeo de
    # estudio») y aquí se aplica con el filtro lut3d de ffmpeg — el mismo look de
    # CapCut sin abrir CapCut.
    lut = next((a.split("=", 1)[1] for a in argv if a.startswith("--lut=")), None)
    if lut:
        lut = str(Path(lut).expanduser().resolve())
        if not Path(lut).exists():
            print(f"❌ No existe el LUT {lut}", file=sys.stderr)
            return 1

    entrada = Path(argv[0]).expanduser() if argv and not argv[0].startswith("-") else ENTRADA
    if not entrada.is_dir():
        print(f"❌ No existe la carpeta {entrada}\n"
              f"   Crea `brutos/` y suelta ahí los vídeos, o pásame otra carpeta:\n"
              f"   python3 editor.py ~/ruta/a/mis/videos", file=sys.stderr)
        return 1

    videos = sorted(p for p in entrada.iterdir() if p.suffix.lower() in VIDEOS)
    if not videos:
        print(f"❌ No hay vídeos en {entrada}", file=sys.stderr)
        return 1

    try:
        ff = _ffmpeg()
    except RuntimeError as e:
        print(f"❌ {e}", file=sys.stderr)
        return 1

    SALIDA.mkdir(exist_ok=True)
    print(f"{len(videos)} vídeos en {entrada.name}/\n")
    res = []
    for i, v in enumerate(videos, 1):
        print(f"  [{i}/{len(videos)}] {v.name} …", flush=True)
        r = procesar(ff, v, lut)
        res.append(r)
        if r.get("ok"):
            aviso = f"  ⚠️ {r['aviso']}" if r.get("aviso") else ""
            print(f"        → {r['seg_original']}s → {r['seg_editado']}s "
                  f"(-{r['recorte_pct']}%){aviso}")
        else:
            print(f"        ⚠️ {r.get('error')}", file=sys.stderr)

    for t in SALIDA.glob(".tmp_*"):
        for f in t.iterdir():
            f.unlink()
        t.rmdir()

    buenos = [r for r in res if r.get("ok")]
    if not buenos:
        print("\n❌ No salió ninguno. No se escribe informe.", file=sys.stderr)
        return 1

    INFORME.write_text(informe(res), encoding="utf-8")
    print(f"\n{len(buenos)}/{len(videos)} listos → {SALIDA.name}/")
    print(f"Elige en → {INFORME.relative_to(BASE)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
