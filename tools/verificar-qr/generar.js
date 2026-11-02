// Genera PNG de prueba con el codificador QR del proyecto, para decodificarlos con CoreImage.
// Uso (desde la raíz del proyecto): node tools/verificar-qr/generar.js src/qr.js /tmp/qr
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const QR = require(path.resolve(process.argv[2]));
const salida = process.argv[3];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(tipo, datos) {
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(modulos, escala = 8, margen = 4) {
  const n = modulos.length, lado = (n + 2 * margen) * escala;
  const filas = [];
  for (let y = 0; y < lado; y++) {
    const fila = Buffer.alloc(1 + lado);
    for (let x = 0; x < lado; x++) {
      const mx = Math.floor(x / escala) - margen, my = Math.floor(y / escala) - margen;
      const oscuro = mx >= 0 && my >= 0 && mx < n && my < n && modulos[my][mx];
      fila[1 + x] = oscuro ? 0 : 255;
    }
    filas.push(fila);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0); ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(filas))), chunk("IEND", Buffer.alloc(0))]);
}

const casos = [];
const texto = (largo) => Array.from({ length: largo }, (_, i) => "abcdefghijklmnopqrstuvwxyz0123456789"[i % 36]).join("");
// Un caso por versión y nivel, cerca del máximo de cada uno, y uno con cada máscara.
for (const nivel of ["M", "L"]) {
  for (let v = 1; v <= 13; v++) {
    const cap = QR.capacidadBytes(v, nivel);
    casos.push({ nombre: `v${v}${nivel}`, texto: texto(cap), nivel });
  }
}
for (let k = 0; k < 8; k++) casos.push({ nombre: `mascara${k}`, texto: "Hola, mundo. Máscara " + k, nivel: "M", mascara: k });
casos.push({ nombre: "utf8", texto: "BEGIN:VCARD\r\nVERSION:3.0\r\nN:Ibáñez;Mara;;;\r\nFN:Mara Ibáñez\r\nEND:VCARD", nivel: "M" });
const VCard = require(path.resolve(path.dirname(process.argv[2]), "vcard.js"));
casos.push({ nombre: "tarjeta-ejemplo", nivel: "M", texto: VCard.generar({
  nombre: "Ana", apellido: "Torres", cargo: "Odontóloga", empresa: "Consultorio Torres",
  telefono: "+54 9 11 5555-0000", email: "ana@ejemplo.com", web: "https://ejemplo.com",
  direccion: "Av. Siempreviva 742, CABA", nota: "Turnos: lunes a viernes, de 9 a 18" }) });

fs.mkdirSync(salida, { recursive: true });
const esperado = {};
for (const c of casos) {
  const q = QR.codificar(c.texto, { nivel: c.nivel, mascara: c.mascara });
  const f = path.join(salida, c.nombre + ".png");
  fs.writeFileSync(f, png(q.modulos));
  esperado[f] = { texto: c.texto, version: q.version, nivel: q.nivel };
}
fs.writeFileSync(path.join(salida, "esperado.json"), JSON.stringify(esperado));
console.log(`${casos.length} imágenes generadas`);
