// Interfaz: tres pasos (Datos → Diseño → Compartir) con vista previa en vivo.
(() => {
  const $ = (id) => document.getElementById(id);
  const CLAVE = "tarjeta-digital:v2";
  const EJEMPLO = {
    nombre: "Ana", apellido: "Torres", cargo: "Odontóloga", empresa: "Consultorio Torres",
    telefono: "+54 9 11 5555-0000", email: "ana@ejemplo.com", web: "https://ejemplo.com",
    direccion: "Av. Siempreviva 742, CABA", nota: "Turnos: lunes a viernes, de 9 a 18",
  };
  const CAMPOS = VCard.CAMPOS;
  const LADO_IMAGEN = 320;

  const estado = { paso: 1, plantilla: Plantillas.LISTA[0].id, forma: "foto", imagen: null, imagenDato: "", tocados: new Set() };
  let vcard = null, qr = null, enlace = "";

  /* Datos */

  const leer = () => Object.fromEntries(CAMPOS.map((k) => [k, $(k).value]));
  const escribir = (d) => CAMPOS.forEach((k) => { $(k).value = d[k] || ""; });
  const paraContacto = (d) => ({ ...d, web: Validar.normalizarWeb(d.web) });

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ ...leer(), plantilla: estado.plantilla, forma: estado.forma, imagen: estado.imagenDato }));
    } catch {
      // Sin almacenamiento o sin espacio: la página sigue funcionando.
    }
  }

  function fotoParaVcard() {
    const m = /^data:image\/(png|jpeg);base64,(.+)$/.exec(estado.imagenDato || "");
    return m ? { tipo: m[1] === "png" ? "PNG" : "JPEG", base64: m[2] } : undefined;
  }

  /* Validación */

  function mostrarErrores(errores, todos) {
    for (const k of CAMPOS) {
      const visible = errores[k] && (todos || estado.tocados.has(k)) ? errores[k] : "";
      const salida = $(`${k}-error`);
      if (salida.textContent !== visible) salida.textContent = visible;
      if (visible) $(k).setAttribute("aria-invalid", "true"); else $(k).removeAttribute("aria-invalid");
    }
  }

  /* Dibujo */

  let pendiente = 0;
  function render() {
    cancelAnimationFrame(pendiente);
    pendiente = requestAnimationFrame(dibujar);
  }

  function dibujar() {
    const datos = leer();
    const errores = Validar.validar(datos);
    mostrarErrores(errores, false);
    guardar();
    vcard = null;
    qr = null;
    const salida = $("estado");
    salida.classList.remove("es-error");
    if (errores.nombre) {
      salida.textContent = "Escribí tu nombre para ver el QR.";
    } else {
      try {
        vcard = VCard.generar(paraContacto(datos));
        qr = QR.codificar(vcard);
        salida.textContent = `✓ QR listo para escanear: guarda tu contacto completo (${new TextEncoder().encode(vcard).length} bytes; QR versión ${qr.version}, corrección ${qr.nivel}).`;
      } catch (e) {
        vcard = null;
        salida.textContent = "No entra en el QR: acortá la nota o la dirección.";
        salida.classList.add("es-error");
      }
    }
    Dibujo.dibujar($("tarjeta"), datos, qr, { plantilla: estado.plantilla, imagen: estado.imagen, forma: estado.forma });
    const nombre = [datos.nombre, datos.apellido].filter(Boolean).join(" ");
    $("tarjeta").setAttribute("aria-label", nombre ? `Vista previa de la tarjeta de ${nombre}, plantilla ${Plantillas.porId(estado.plantilla).nombre}` : "Vista previa de la tarjeta");
    for (const id of ["png", "vcf", "compartir", "copiar", "nfc"]) $(id).disabled = !vcard;
    $("abrir").setAttribute("aria-disabled", String(!vcard));
    if (estado.paso === 2) dibujarMiniaturas();
    actualizarEnlace(datos);
  }

  /* Paso 2: plantillas con miniaturas */

  function armarPlantillas() {
    $("plantillas").replaceChildren(...Plantillas.LISTA.map((p) => {
      const caja = document.createElement("div");
      caja.className = "plantilla";
      caja.innerHTML = `<input type="radio" name="plantilla" id="pl-${p.id}" value="${p.id}">
        <label for="pl-${p.id}"><canvas width="315" height="180" aria-hidden="true"></canvas>
        <span class="plantilla__nombre">${p.nombre}</span><span class="plantilla__desc">${p.descripcion}</span></label>`;
      caja.querySelector("input").checked = p.id === estado.plantilla;
      return caja;
    }));
    $("plantillas").addEventListener("change", (e) => {
      if (e.target.name !== "plantilla") return;
      estado.plantilla = e.target.value;
      render();
    });
  }

  const lienzo = document.createElement("canvas");
  function dibujarMiniaturas() {
    const datos = leer();
    for (const p of Plantillas.LISTA) {
      Dibujo.dibujar(lienzo, datos, qr, { plantilla: p.id, imagen: estado.imagen, forma: estado.forma });
      const mini = document.querySelector(`#pl-${p.id} + label canvas`);
      mini.getContext("2d").drawImage(lienzo, 0, 0, mini.width, mini.height);
    }
  }

  /* Pasos */

  function irA(n) {
    if (n > 1) {
      const errores = Validar.validar(leer());
      if (Object.keys(errores).length) {
        CAMPOS.forEach((k) => estado.tocados.add(k));
        mostrarErrores(errores, true);
        n = 1;
        mostrarPaso(1);
        const primero = CAMPOS.find((k) => errores[k]);
        $(primero).focus();
        return;
      }
      if (!vcard) {
        mostrarPaso(1);
        $("estado").focus?.();
        return;
      }
    }
    mostrarPaso(n);
    $(`paso-${n}-titulo`).focus();
  }

  function mostrarPaso(n) {
    estado.paso = n;
    for (let i = 1; i <= 3; i++) {
      $(`paso-${i}`).hidden = i !== n;
      const b = document.querySelector(`.pasos [data-ir="${i}"]`);
      if (i === n) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    }
    if (n === 2) dibujarMiniaturas();
    const url = new URL(location.href);
    if (n > 1) url.searchParams.set("paso", n); else url.searchParams.delete("paso");
    history.replaceState(null, "", url);
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ir]");
    if (b) irA(Number(b.dataset.ir));
  });

  /* Imagen */

  function cargarImagen(dato) {
    return new Promise((resolver, rechazar) => {
      const img = new Image();
      img.onload = () => resolver(img);
      img.onerror = rechazar;
      img.src = dato;
    });
  }

  async function elegirImagen(archivo) {
    const aviso = $("imagen-estado");
    if (!archivo) return;
    if (!/^image\/(png|jpeg|webp)$/.test(archivo.type)) { aviso.textContent = "Elegí una imagen PNG, JPG o WebP."; return; }
    try {
      const original = await cargarImagen(URL.createObjectURL(archivo));
      const escala = Math.min(1, LADO_IMAGEN / Math.min(original.naturalWidth, original.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(original.naturalWidth * escala);
      c.height = Math.round(original.naturalHeight * escala);
      c.getContext("2d").drawImage(original, 0, 0, c.width, c.height);
      URL.revokeObjectURL(original.src);
      // PNG para logos con transparencia; JPEG para fotos, que pesan menos.
      estado.imagenDato = archivo.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.85);
      estado.imagen = await cargarImagen(estado.imagenDato);
      $("quitar-imagen").hidden = false;
      aviso.textContent = `Imagen lista (${Math.round(estado.imagenDato.length * 0.75 / 1024)} KB). Va en la imagen y en el .vcf, no en el QR ni en el enlace.`;
      render();
    } catch {
      aviso.textContent = "No pude leer esa imagen. Probá con otra.";
    }
  }

  $("archivo").addEventListener("change", (e) => { elegirImagen(e.target.files[0]); e.target.value = ""; });
  $("quitar-imagen").addEventListener("click", () => {
    estado.imagen = null;
    estado.imagenDato = "";
    $("quitar-imagen").hidden = true;
    $("imagen-estado").textContent = "Imagen quitada.";
    render();
  });
  document.querySelectorAll('input[name="forma"]').forEach((r) => r.addEventListener("change", () => { estado.forma = r.value; render(); }));

  /* Archivos */

  const base = () => VCard.nombreArchivo(leer());
  const pngBlob = () => new Promise((res) => $("tarjeta").toBlob(res, "image/png"));
  const vcfArchivo = () => new File([VCard.generar(paraContacto(leer()), { foto: fotoParaVcard() })], base() + ".vcf", { type: "text/vcard" });

  function bajar(blob, nombre) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  $("png").addEventListener("click", async () => bajar(await pngBlob(), base() + "-tarjeta.png"));
  $("vcf").addEventListener("click", () => bajar(vcfArchivo(), base() + ".vcf"));

  /* Compartir (Web Share API): imagen y contacto juntos. En iPhone, iPad y Mac abre la hoja con AirDrop. */

  const prueba = (nombre, tipo) => new File(["x"], nombre, { type: tipo });
  const puede = (files) => { try { return Boolean(navigator.canShare && navigator.canShare({ files })); } catch { return false; } };
  const compartirAmbos = puede([prueba("t.png", "image/png"), prueba("t.vcf", "text/vcard")]);
  const compartirImagen = !compartirAmbos && puede([prueba("t.png", "image/png")]);

  if (compartirAmbos || compartirImagen) {
    $("compartir").hidden = false;
    $("compartir-nota").textContent = compartirAmbos
      ? "Manda la imagen y el contacto juntos. En iPhone, iPad y Mac aparece AirDrop en la hoja de compartir."
      : "Este navegador comparte la imagen pero no el .vcf: el contacto bajalo con el botón de abajo.";
  } else {
    $("compartir-nota").textContent = "Este navegador no puede compartir archivos: bajá la imagen y el contacto con los botones.";
  }

  $("compartir").addEventListener("click", async () => {
    const files = [new File([await pngBlob()], base() + "-tarjeta.png", { type: "image/png" })];
    if (compartirAmbos) files.push(vcfArchivo());
    try {
      await navigator.share({ files, title: "Mi tarjeta", text: enlace ? `Mi tarjeta: ${enlace}` : undefined });
    } catch (e) {
      if (e.name !== "AbortError") $("compartir-nota").textContent = "No se pudo compartir. Probá con las descargas.";
    }
  });

  /* Enlace propio */

  let turnoEnlace = 0;
  async function actualizarEnlace(datos) {
    const turno = ++turnoEnlace;
    if (!vcard) {
      enlace = "";
      $("enlace").value = "";
      $("abrir").href = "#";
      $("enlace-info").textContent = "Completá tus datos para generar el enlace.";
      return;
    }
    const { fragmento, comprimido } = await Enlace.codificar(paraContacto(datos), estado.plantilla);
    if (turno !== turnoEnlace) return;
    enlace = new URL("contacto.html", location.href).href.replace(/[?#].*$/, "") + "#" + fragmento;
    $("enlace").value = enlace;
    $("abrir").href = enlace;
    const tags = Enlace.tags(enlace);
    const bytes = tags[0].ocupa;
    const info = $("enlace-info");
    info.replaceChildren(
      `${enlace.length} caracteres${comprimido ? ", comprimido" : ""}. Grabado en un tag NFC ocupa ${bytes} bytes.`,
      Object.assign(document.createElement("ul"), { className: "etiquetas-nfc", ariaLabel: "En qué tags entra" }));
    info.querySelector("ul").replaceChildren(...tags.map((t) => Object.assign(document.createElement("li"), {
      className: `chip ${t.entra ? "chip--acento" : "chip--no"}`,
      textContent: `${t.entra ? "✓" : "✗"} ${t.nombre} (${t.bytes} B)`,
    })));
  }

  $("copiar").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      $("copiar").textContent = "Copiado";
    } catch {
      $("enlace").select();
      document.execCommand?.("copy");
      $("copiar").textContent = "Copiado";
    }
    setTimeout(() => { $("copiar").textContent = "Copiar"; }, 2000);
  });

  $("abrir").addEventListener("click", (e) => { if (!vcard) e.preventDefault(); });

  /* Web NFC: solo existe en Chrome para Android. */

  if ("NDEFReader" in window) {
    $("nfc").hidden = false;
    $("nfc").addEventListener("click", async () => {
      const salida = $("nfc-estado");
      salida.textContent = "Acercá el tag a la parte de atrás del teléfono…";
      try {
        const lector = new NDEFReader();
        await lector.write({ records: [{ recordType: "url", data: enlace }] });
        salida.textContent = "Listo: el tag quedó grabado con tu enlace.";
      } catch (e) {
        salida.textContent = e.name === "NotAllowedError"
          ? "Sin permiso para usar NFC. Revisá los permisos del sitio."
          : e.name === "NotSupportedError"
            ? "El teléfono no puede escribir NFC o el NFC está apagado."
            : "No se pudo grabar. Puede que el tag sea muy chico o esté bloqueado.";
      }
    });
  }

  /* Formulario */

  $("form").addEventListener("input", render);
  $("form").addEventListener("focusout", (e) => {
    if (CAMPOS.includes(e.target.id)) { estado.tocados.add(e.target.id); render(); }
  });
  $("form").addEventListener("submit", (e) => e.preventDefault());
  $("ejemplo").addEventListener("click", () => { escribir(EJEMPLO); estado.tocados.clear(); render(); });
  $("portada-empezar").addEventListener("click", () => {
    irA(1);
    $("nombre").scrollIntoView({ behavior: "smooth", block: "center" });
    $("nombre").focus({ preventScroll: true });
  });
  $("portada-ejemplo").addEventListener("click", () => {
    escribir(EJEMPLO);
    estado.tocados.clear();
    render();
    document.querySelector(".editor").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("limpiar").addEventListener("click", () => { escribir({}); estado.tocados.clear(); render(); $("nombre").focus(); });

  /* Arranque */

  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(CLAVE)); } catch { /* nada guardado */ }
  const params = new URLSearchParams(location.search);
  if (params.has("ejemplo")) guardado = { ...EJEMPLO, plantilla: params.get("plantilla") || "aurora" };
  if (guardado) {
    escribir(guardado);
    if (guardado.plantilla) estado.plantilla = Plantillas.porId(guardado.plantilla).id;
    if (guardado.forma === "logo") { estado.forma = "logo"; document.querySelector('input[name="forma"][value="logo"]').checked = true; }
    if (guardado.imagen) {
      estado.imagenDato = guardado.imagen;
      cargarImagen(guardado.imagen).then((img) => { estado.imagen = img; $("quitar-imagen").hidden = false; render(); }).catch(() => {});
    }
  }
  armarPlantillas();
  dibujar();
  const pasoInicial = Number(params.get("paso"));
  if (pasoInicial === 2 || pasoInicial === 3) {
    if (vcard) mostrarPaso(pasoInicial); else mostrarPaso(1);
  }
})();
