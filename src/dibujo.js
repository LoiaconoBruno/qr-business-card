// Dibuja la tarjeta (1050 × 600 px, 3,5 × 2 pulgadas a 300 ppp) en un canvas, con la plantilla elegida,
// la foto o el logo opcional y el QR del contacto a la derecha, para que la imagen misma sirva para importarlo.
//
// El QR va siempre en un recuadro blanco con esquinas redondeadas y borde visible: adentro, 4 módulos
// de zona de silencio alrededor del código y la etiqueta «Escaneame». Así se lee en cualquier plantilla,
// también en las oscuras.
const Dibujo = (() => {
  const ANCHO = 1050, ALTO = 600;
  const AREA_QR = 400;      // lado máximo del código con su zona de silencio
  const SILENCIO = 4;       // módulos de margen blanco alrededor del código (ISO/IEC 18004)
  const HOLGURA = 10;       // blanco extra, para que la curva de la esquina no toque la zona de silencio
  const RADIO = 20;         // radio de las esquinas del recuadro (la curva entra 0,29 · RADIO < HOLGURA)
  const ETIQUETA = 46;      // alto de la franja de «Escaneame»
  const BORDE = "#c9cfd9";
  const MARGEN = 64;        // margen izquierdo del texto
  const MARGEN_DER = 56;    // margen derecho del recuadro

  const Pl = typeof Plantillas !== "undefined" ? Plantillas : require("./plantillas.js");

  // Dónde va el recuadro del QR para un código de "tamano" módulos de lado.
  function disposicion(tamano) {
    const modulo = Math.floor(AREA_QR / (tamano + 2 * SILENCIO));
    const ladoQR = modulo * (tamano + 2 * SILENCIO);   // código + zona de silencio
    const ancho = ladoQR + 2 * HOLGURA;
    const alto = ancho + ETIQUETA;
    const x = ANCHO - MARGEN_DER - ancho;
    const y = Math.round((ALTO - alto) / 2);
    return {
      x, y, ancho, alto, modulo, ladoQR,
      radio: RADIO,
      qrX: x + HOLGURA + SILENCIO * modulo,
      qrY: y + HOLGURA + SILENCIO * modulo,
      etiquetaY: y + HOLGURA + ladoQR + ETIQUETA / 2,
    };
  }

  function rectRedondeado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function recortar(ctx, texto, ancho) {
    if (ctx.measureText(texto).width <= ancho) return texto;
    let t = texto;
    while (t.length > 1 && ctx.measureText(t + "…").width > ancho) t = t.slice(0, -1);
    return t + "…";
  }

  // Achica la letra hasta que el texto entra (sin bajar de "minimo"); si igual no entra, lo recorta.
  function ajustar(ctx, texto, ancho, fuente, px, minimo) {
    let tam = px;
    ctx.font = fuente(tam);
    while (tam > minimo && ctx.measureText(texto).width > ancho) {
      tam -= 2;
      ctx.font = fuente(tam);
    }
    return recortar(ctx, texto, ancho);
  }

  // La imagen cubre el cuadrado sin deformarse (como object-fit: cover).
  function dibujarImagen(ctx, img, x, y, lado, forma, borde) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const escala = Math.max(lado / iw, lado / ih);
    const sw = lado / escala, sh = lado / escala;
    ctx.save();
    if (forma === "logo") rectRedondeado(ctx, x, y, lado, lado, 22);
    else { ctx.beginPath(); ctx.arc(x + lado / 2, y + lado / 2, lado / 2, 0, Math.PI * 2); }
    ctx.clip();
    if (forma === "logo") { ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, lado, lado); }
    ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, lado, lado);
    ctx.restore();
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = borde;
    if (forma === "logo") rectRedondeado(ctx, x, y, lado, lado, 22);
    else { ctx.beginPath(); ctx.arc(x + lado / 2, y + lado / 2, lado / 2, 0, Math.PI * 2); }
    ctx.stroke();
    ctx.restore();
  }

  function dibujarQR(ctx, qr, d) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    rectRedondeado(ctx, d.x, d.y, d.ancho, d.alto, d.radio);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
    ctx.save();
    rectRedondeado(ctx, d.x + 1, d.y + 1, d.ancho - 2, d.alto - 2, d.radio - 1);
    ctx.lineWidth = 2;
    ctx.strokeStyle = BORDE;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#000000";
    for (let my = 0; my < qr.tamano; my++) {
      for (let mx = 0; mx < qr.tamano; mx++) {
        if (qr.modulos[my][mx]) ctx.fillRect(d.qrX + mx * d.modulo, d.qrY + my * d.modulo, d.modulo, d.modulo);
      }
    }
    ctx.fillStyle = "#151820";
    ctx.font = `700 24px ${Pl.SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Escaneame", d.x + d.ancho / 2, d.etiquetaY);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // opciones: { plantilla: id, imagen: HTMLImageElement | ImageBitmap | null, forma: "foto" | "logo" }
  function dibujar(canvas, datos, qr, opciones = {}) {
    const p = Pl.porId(opciones.plantilla);
    canvas.width = ANCHO;
    canvas.height = ALTO;
    const ctx = canvas.getContext("2d");
    p.fondo(ctx, ANCHO, ALTO);

    const d = qr ? disposicion(qr.tamano) : null;
    const limite = d ? d.x - 48 : ANCHO - MARGEN;
    const ancho = limite - MARGEN;
    const fuente = (familia, peso) => (px) => `${peso} ${px}px ${familia}`;

    let y = 132;
    if (opciones.imagen) {
      const lado = 112;
      dibujarImagen(ctx, opciones.imagen, MARGEN, 60, lado, opciones.forma, p.acento);
      y = 60 + lado + 66;
    }

    const nombre = [datos.nombre, datos.apellido].filter((x) => x && x.trim()).join(" ") || "Tu nombre";
    ctx.fillStyle = p.texto;
    ctx.fillText(ajustar(ctx, nombre, ancho, fuente(p.titulo, p.pesoTitulo), 58, 38), MARGEN, y);
    if (datos.cargo && datos.cargo.trim()) {
      y += 52;
      ctx.fillStyle = p.acento;
      ctx.fillText(ajustar(ctx, datos.cargo.trim(), ancho, fuente(p.cuerpo, 650), 32, 24), MARGEN, y);
    }
    if (datos.empresa && datos.empresa.trim()) {
      y += 44;
      ctx.fillStyle = p.suave;
      ctx.fillText(ajustar(ctx, datos.empresa.trim(), ancho, fuente(p.cuerpo, 500), 28, 22), MARGEN, y);
    }

    const lineas = [datos.telefono, datos.email, datos.web, datos.direccion].map((x) => (x || "").trim()).filter(Boolean);
    if (lineas.length) {
      let yl = Math.max(y + 64, ALTO - 58 - 42 * (lineas.length - 1));
      ctx.font = `450 27px ${p.cuerpo}`;
      for (const l of lineas) {
        ctx.fillStyle = p.acento;
        ctx.fillRect(MARGEN, yl - 10, 6, 6);
        ctx.fillStyle = p.texto;
        ctx.fillText(recortar(ctx, l, ancho - 22), MARGEN + 22, yl);
        yl += 42;
      }
    }

    if (d) dibujarQR(ctx, qr, d);
    return d;
  }

  return { ANCHO, ALTO, SILENCIO, HOLGURA, RADIO, ETIQUETA, disposicion, dibujar };
})();

if (typeof module !== "undefined") module.exports = Dibujo;
