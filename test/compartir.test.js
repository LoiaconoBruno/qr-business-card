// Tests de las funciones nuevas: plantillas, recuadro del QR, enlace propio, tamaño NDEF, validación y foto.
const test = require("node:test");
const assert = require("node:assert/strict");
const QR = require("../src/qr.js");
const VCard = require("../src/vcard.js");
const Plantillas = require("../src/plantillas.js");
const Dibujo = require("../src/dibujo.js");
const Enlace = require("../src/enlace.js");
const Validar = require("../src/validar.js");

const EJEMPLO = {
  nombre: "Ana", apellido: "Torres", cargo: "Odontóloga", empresa: "Consultorio Torres",
  telefono: "+54 9 11 5555-0000", email: "ana@ejemplo.com", web: "https://ejemplo.com",
  direccion: "Av. Siempreviva 742, CABA", nota: "Turnos: lunes a viernes, de 9 a 18",
};
const BASE = "https://loiaconobruno.github.io/qr-business-card/contacto.html#";

// Contraste WCAG 2.1 entre dos colores #rrggbb.
function contraste(a, b) {
  const lum = (h) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

test("hay al menos 4 plantillas, con id único", () => {
  assert.ok(Plantillas.LISTA.length >= 4);
  assert.equal(new Set(Plantillas.LISTA.map((p) => p.id)).size, Plantillas.LISTA.length);
  assert.equal(Plantillas.porId("no-existe").id, Plantillas.LISTA[0].id);
});

test("en cada plantilla el texto pasa AA (4,5:1) sobre su fondo más desfavorable", () => {
  for (const p of Plantillas.LISTA) {
    assert.ok(contraste(p.texto, p.fondoRef) >= 4.5, `${p.id}: texto ${contraste(p.texto, p.fondoRef).toFixed(2)}`);
    assert.ok(contraste(p.suave, p.fondoRef) >= 4.5, `${p.id}: texto suave ${contraste(p.suave, p.fondoRef).toFixed(2)}`);
    assert.ok(contraste(p.acento, p.fondoRef) >= 4.5, `${p.id}: acento ${contraste(p.acento, p.fondoRef).toFixed(2)}`);
  }
});

test("el recuadro del QR deja 4 módulos de silencio y la esquina redondeada no los toca", () => {
  assert.ok(0.2929 * Dibujo.RADIO < Dibujo.HOLGURA, "la curva de la esquina queda en la holgura");
  for (let version = 1; version <= 13; version++) {
    const tamano = 17 + 4 * version;
    const d = Dibujo.disposicion(tamano);
    assert.equal(d.qrX - d.x - Dibujo.HOLGURA, Dibujo.SILENCIO * d.modulo, `v${version}: silencio horizontal`);
    assert.equal(d.qrY - d.y - Dibujo.HOLGURA, Dibujo.SILENCIO * d.modulo, `v${version}: silencio vertical`);
    assert.ok(d.modulo >= 5, `v${version}: módulo de ${d.modulo} px`);
    assert.ok(d.y >= 0 && d.y + d.alto <= Dibujo.ALTO && d.x > Dibujo.ANCHO / 2, `v${version}: el recuadro entra en la tarjeta`);
    assert.ok(d.qrY + tamano * d.modulo + Dibujo.SILENCIO * d.modulo <= d.etiquetaY - Dibujo.ETIQUETA / 2 + 1, `v${version}: la etiqueta no pisa el silencio`);
  }
});

test("el enlace va y vuelve igual, sin comprimir y comprimido", async () => {
  const plano = "1" + Enlace.aBase64url(new TextEncoder().encode(Enlace.serializar(EJEMPLO, "papel")));
  const r1 = await Enlace.decodificar("#" + plano);
  assert.deepEqual(r1, { datos: EJEMPLO, plantilla: "papel" });
  const { fragmento, comprimido } = await Enlace.codificar(EJEMPLO, "grafito");
  assert.ok(comprimido, "con estos datos, comprimir conviene");
  assert.ok(fragmento.length < plano.length);
  const r2 = await Enlace.decodificar(fragmento);
  assert.deepEqual(r2, { datos: EJEMPLO, plantilla: "grafito" });
});

test("el enlace usa solo caracteres seguros en una URL y rechaza datos rotos", async () => {
  const { fragmento } = await Enlace.codificar({ ...EJEMPLO, nota: "Señal ñ á é + / = ?" }, "aurora");
  assert.match(fragmento, /^[12][A-Za-z0-9_-]+$/);
  await assert.rejects(Enlace.decodificar(""), /no tiene datos/);
  await assert.rejects(Enlace.decodificar("#9abc"), /Versión/);
  await assert.rejects(Enlace.decodificar("#1" + Enlace.aBase64url(new TextEncoder().encode('{"a":1}'))), /formato/);
});

test("bytes NDEF: cuenta exacta para un URI corto y para uno largo", () => {
  // https:// se abrevia (código 0x04). Contenido = 1 + 5 = 6. Registro = 1 + 1 + 1 + 1 + 6 = 10.
  // TLV = 1 + 1 + 10 = 12, más el terminador = 13.
  assert.equal(Enlace.bytesNdef("https://a.b/c"), 13);
  // Contenido de 300 bytes: el largo del registro ocupa 4 bytes y el de la TLV, 3.
  const largo = "https://" + "x".repeat(299);
  assert.equal(Enlace.bytesNdef(largo), 1 + 3 + (1 + 1 + 4 + 1 + 300) + 1);
  assert.deepEqual(Enlace.tags("https://a.b/c").map((t) => t.entra), [true, true, true]);
});

test("el enlace de la tarjeta de ejemplo entra en un NTAG216 (888 bytes)", async () => {
  const { fragmento } = await Enlace.codificar(EJEMPLO, "aurora");
  const bytes = Enlace.bytesNdef(BASE + fragmento);
  assert.ok(bytes <= 888, `${bytes} bytes`);
  const ntag216 = Enlace.tags(BASE + fragmento).find((t) => t.nombre === "NTAG216");
  assert.equal(ntag216.entra, true);
});

test("validación: obligatorio, teléfono, email, web y largo", () => {
  assert.ok(Validar.validar({}).nombre);
  assert.deepEqual(Validar.validar(EJEMPLO), {});
  assert.ok(Validar.validar({ nombre: "A", telefono: "11-abc" }).telefono);
  assert.ok(Validar.validar({ nombre: "A", telefono: "12 34" }).telefono, "muy corto");
  assert.ok(Validar.validar({ nombre: "A", telefono: "54+11 5555 0000" }).telefono, "+ en el medio");
  assert.equal(Validar.validar({ nombre: "A", telefono: "(011) 4555-0000" }).telefono, undefined);
  assert.ok(Validar.validar({ nombre: "A", email: "ana@" }).email);
  assert.equal(Validar.validar({ nombre: "A", email: "ana.torres@consultorio.com.ar" }).email, undefined);
  assert.equal(Validar.validar({ nombre: "A", web: "ejemplo.com" }).web, undefined);
  assert.ok(Validar.validar({ nombre: "A", web: "no es una web" }).web);
  assert.equal(Validar.normalizarWeb("ejemplo.com"), "https://ejemplo.com");
  assert.ok(Validar.validar({ nombre: "x".repeat(61) }).nombre);
});

test("la foto va en el .vcf, plegada a 75 bytes, y no en el QR", () => {
  const base64 = Buffer.from(Uint8Array.from({ length: 900 }, (_, i) => i % 256)).toString("base64");
  const v = VCard.generar(EJEMPLO, { foto: { tipo: "JPEG", base64 } });
  assert.match(v, /\r\nPHOTO;ENCODING=b;TYPE=JPEG:/);
  for (const l of v.split("\r\n")) assert.ok(new TextEncoder().encode(l).length <= 75);
  assert.equal(v.replace(/\r\n /g, "").includes(base64), true, "la foto se recupera al desplegar");
  const sinFoto = VCard.generar(EJEMPLO);
  assert.doesNotMatch(sinFoto, /PHOTO/);
  assert.ok(QR.codificar(sinFoto).version <= 13);
});
