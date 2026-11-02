// Interfaz: formulario → vCard → QR → tarjeta, y descargas.
(() => {
  const $ = (id) => document.getElementById(id);
  const CLAVE = "tarjeta-digital:datos";
  const EJEMPLO = {
    nombre: "Ana", apellido: "Torres", cargo: "Odontóloga", empresa: "Consultorio Torres",
    telefono: "+54 9 11 5555-0000", email: "ana@ejemplo.com", web: "https://ejemplo.com",
    direccion: "Av. Siempreviva 742, CABA", nota: "Turnos: lunes a viernes, de 9 a 18",
  };
  let vcard = null;

  const leer = () => Object.fromEntries(VCard.CAMPOS.map((k) => [k, $(k).value]));
  const escribir = (d) => VCard.CAMPOS.forEach((k) => { $(k).value = d[k] || ""; });

  function render() {
    const d = leer();
    try { localStorage.setItem(CLAVE, JSON.stringify({ ...d, tema: $("tema").value })); } catch { /* sin almacenamiento */ }
    vcard = null;
    let qr = null;
    try {
      vcard = VCard.generar(d);
      qr = QR.codificar(vcard);
      $("estado").textContent = `QR versión ${qr.version}, corrección ${qr.nivel} (${new TextEncoder().encode(vcard).length} bytes).`;
      $("estado").style.color = "";
    } catch (e) {
      $("estado").textContent = vcard ? e.message + " Acortá la nota o la dirección." : "Escribí al menos tu nombre.";
      $("estado").style.color = vcard ? "var(--bad)" : "";
      if (vcard && !qr) vcard = null;
    }
    Dibujo.dibujar($("tarjeta"), d, qr, $("tema").value);
    $("vcf").disabled = $("png").disabled = $("compartir").disabled = !vcard;
  }

  function bajar(blob, nombre) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const pngBlob = () => new Promise((res) => $("tarjeta").toBlob(res, "image/png"));

  $("form").addEventListener("input", render);
  $("tema").addEventListener("change", render);
  $("ejemplo").addEventListener("click", () => { escribir(EJEMPLO); render(); });
  $("limpiar").addEventListener("click", () => { escribir({}); render(); });
  $("vcf").addEventListener("click", () => bajar(new Blob([vcard], { type: "text/vcard" }), VCard.nombreArchivo(leer()) + ".vcf"));
  $("png").addEventListener("click", async () => bajar(await pngBlob(), VCard.nombreArchivo(leer()) + "-tarjeta.png"));

  // Compartir directo (en celulares que lo permiten): imagen y contacto juntos.
  if (navigator.canShare) {
    const prueba = new File([""], "x.png", { type: "image/png" });
    if (navigator.canShare({ files: [prueba] })) $("compartir").hidden = false;
  }
  $("compartir").addEventListener("click", async () => {
    const base = VCard.nombreArchivo(leer());
    const files = [new File([await pngBlob()], base + "-tarjeta.png", { type: "image/png" }), new File([vcard], base + ".vcf", { type: "text/vcard" })];
    try { await navigator.share({ files, title: "Tarjeta" }); } catch { /* cancelado */ }
  });

  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(CLAVE)); } catch { /* nada guardado */ }
  if (guardado) { escribir(guardado); if (guardado.tema) $("tema").value = guardado.tema; }
  render();
})();
