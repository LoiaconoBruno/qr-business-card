// Dibuja la tarjeta (1050 × 600 px, 3,5 × 2 pulgadas a 300 ppp) en un canvas,
// con el QR del contacto a la derecha para que la imagen misma sirva para importarlo.
const Dibujo = (() => {
  const ANCHO = 1050, ALTO = 600;
  const TEMAS = {
    claro: { fondo: "#ffffff", texto: "#1d1c1a", suave: "#5f5b53", acento: "#2f5bd3" },
    oscuro: { fondo: "#17181c", texto: "#f3f2ee", suave: "#a3a09a", acento: "#7c9dff" },
    terracota: { fondo: "#fbf5ef", texto: "#2b1d16", suave: "#7a5d4e", acento: "#c2562b" },
  };

  // Dónde va el QR: lado derecho, con 4 módulos de margen blanco alrededor.
  function disposicion(tamanoQR) {
    const lado = 420;
    const modulo = Math.floor(lado / (tamanoQR + 8));
    const ladoReal = modulo * (tamanoQR + 8);
    const x = ANCHO - 60 - ladoReal, y = Math.round((ALTO - ladoReal) / 2);
    return { x, y, modulo, lado: ladoReal, qrX: x + 4 * modulo, qrY: y + 4 * modulo };
  }

  function recortar(ctx, texto, ancho) {
    if (ctx.measureText(texto).width <= ancho) return texto;
    let t = texto;
    while (t.length > 1 && ctx.measureText(t + "…").width > ancho) t = t.slice(0, -1);
    return t + "…";
  }

  function dibujar(canvas, datos, qr, tema = "claro") {
    const c = TEMAS[tema] || TEMAS.claro;
    canvas.width = ANCHO; canvas.height = ALTO;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = c.acento; ctx.fillRect(0, 0, 18, ALTO);

    const d = qr ? disposicion(qr.tamano) : null;
    const anchoTexto = (d ? d.x : ANCHO) - 60 - 70;
    const fuente = (peso, px) => `${peso} ${px}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    let y = 120;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = c.texto; ctx.font = fuente(700, 58);
    ctx.fillText(recortar(ctx, [datos.nombre, datos.apellido].filter(Boolean).join(" ") || "Tu nombre", anchoTexto), 70, y);
    if (datos.cargo) { y += 56; ctx.fillStyle = c.acento; ctx.font = fuente(600, 34); ctx.fillText(recortar(ctx, datos.cargo, anchoTexto), 70, y); }
    if (datos.empresa) { y += 46; ctx.fillStyle = c.suave; ctx.font = fuente(500, 30); ctx.fillText(recortar(ctx, datos.empresa, anchoTexto), 70, y); }
    const lineas = [datos.telefono, datos.email, datos.web, datos.direccion].filter((x) => x && x.trim());
    y = Math.max(y + 70, ALTO - 60 - 44 * (lineas.length - 1));
    ctx.fillStyle = c.texto; ctx.font = fuente(400, 28);
    for (const l of lineas) { ctx.fillText(recortar(ctx, l, anchoTexto), 70, y); y += 44; }

    if (d) {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(d.x, d.y, d.lado, d.lado);
      ctx.fillStyle = "#000000";
      for (let my = 0; my < qr.tamano; my++) for (let mx = 0; mx < qr.tamano; mx++) {
        if (qr.modulos[my][mx]) ctx.fillRect(d.qrX + mx * d.modulo, d.qrY + my * d.modulo, d.modulo, d.modulo);
      }
    }
    return d;
  }

  return { ANCHO, ALTO, TEMAS, disposicion, dibujar };
})();

if (typeof module !== "undefined") module.exports = Dibujo;
