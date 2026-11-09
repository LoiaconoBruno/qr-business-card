// Página del enlace propio: lee los datos del fragmento (#…), dibuja la tarjeta y ofrece «Agregar contacto».
(() => {
  const $ = (id) => document.getElementById(id);
  const ETIQUETAS = { cargo: "Cargo", empresa: "Empresa", telefono: "Teléfono", email: "Email", web: "Web", direccion: "Dirección", nota: "Nota" };
  const esApple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function enlaceDe(k, v) {
    if (k === "telefono") return `tel:${v.replace(/[^\d+]/g, "")}`;
    if (k === "email") return `mailto:${v}`;
    if (k === "web" && /^https?:\/\//i.test(v)) return v;
    return "";
  }

  function mostrarError(texto) {
    $("cargando").hidden = true;
    $("error").hidden = false;
    $("error").textContent = texto;
  }

  async function abrir() {
    if (!location.hash || location.hash.length < 3) {
      mostrarError("Este enlace no trae ninguna tarjeta. Pedile a quien te lo pasó que lo vuelva a copiar completo.");
      return;
    }
    let datos, plantilla;
    try {
      ({ datos, plantilla } = await Enlace.decodificar(location.hash));
    } catch (e) {
      mostrarError(`No pude leer la tarjeta: ${e.message}. Puede que el enlace esté cortado.`);
      return;
    }
    let vcard;
    try {
      vcard = VCard.generar(datos);
    } catch {
      mostrarError("La tarjeta no tiene nombre.");
      return;
    }
    const nombre = [datos.nombre, datos.apellido].filter(Boolean).join(" ");
    document.title = `${nombre} · Tarjeta digital`;
    $("titulo").textContent = nombre;

    let qr = null;
    try { qr = QR.codificar(vcard); } catch { /* sin QR: se dibuja igual la tarjeta */ }
    Dibujo.dibujar($("tarjeta"), datos, qr, { plantilla });
    $("tarjeta").setAttribute("aria-label", `Tarjeta de ${nombre}`);

    $("datos").replaceChildren(...Object.entries(ETIQUETAS).filter(([k]) => datos[k]).map(([k, et]) => {
      const fila = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = et;
      const dd = document.createElement("dd");
      const href = enlaceDe(k, datos[k]);
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = datos[k];
        if (k === "web") a.rel = "noopener nofollow";
        dd.append(a);
      } else {
        dd.textContent = datos[k];
      }
      fila.append(dt, dd);
      return fila;
    }));

    const archivo = VCard.nombreArchivo(datos);
    $("agregar").addEventListener("click", () => {
      const blob = new Blob([vcard], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);
      if (esApple) {
        // Safari en iPhone y iPad abre un .vcf como ficha de contacto si se navega a él.
        location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = archivo + ".vcf";
        document.body.append(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
    $("imagen").addEventListener("click", () => {
      $("tarjeta").toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = archivo + "-tarjeta.png";
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, "image/png");
    });
    $("nota-ios").hidden = !esApple;
    $("cargando").hidden = true;
    $("tarjeta-contacto").hidden = false;
  }

  abrir();
  addEventListener("hashchange", () => location.reload());
})();
