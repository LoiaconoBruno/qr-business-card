const test = require("node:test");
const assert = require("node:assert/strict");
const QR = require("../src/qr.js");
const VCard = require("../src/vcard.js");

const EJEMPLO = {
  nombre: "Ana", apellido: "Torres", cargo: "Odontóloga", empresa: "Consultorio Torres",
  telefono: "+54 9 11 5555-0000", email: "ana@ejemplo.com", web: "https://ejemplo.com",
  direccion: "Av. Siempreviva 742, CABA", nota: "Turnos: lunes a viernes, de 9 a 18",
};

test("Reed-Solomon: el ejemplo clásico de HELLO WORLD 1-M", () => {
  const datos = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
  assert.deepEqual(QR.resto(datos, QR.divisor(10)), [196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
});

test("la tabla de bloques es consistente con el total de codewords", () => {
  for (const [v, [total]] of Object.entries(QR.TABLA)) {
    for (const nivel of ["L", "M"]) {
      const b = QR.bloques(Number(v), nivel);
      assert.equal(b.totalDatos + b.ec * b.datos.length, total, `v${v}${nivel}`);
    }
  }
});

test("elige la versión más chica en la que entra el texto", () => {
  assert.equal(QR.codificar("hola").version, 1);
  assert.equal(QR.codificar("x".repeat(QR.capacidadBytes(5, "M"))).version, 5);
  assert.equal(QR.codificar("x".repeat(QR.capacidadBytes(5, "M") + 1)).version, 6);
  const q = QR.codificar("x".repeat(QR.capacidadBytes(13, "M") + 10));
  assert.equal(q.nivel, "L", "si no entra en M, baja a L");
  assert.throws(() => QR.codificar("x".repeat(500)), /no entra/);
});

test("la matriz tiene los tres patrones de búsqueda", () => {
  const { modulos: m, tamano: n } = QR.codificar("Prueba");
  const finder = (x0, y0) => {
    for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) {
      const d = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      assert.equal(m[y0 + dy][x0 + dx], d !== 2, `(${x0 + dx}, ${y0 + dy})`);
    }
  };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  assert.equal(m[n - 8][8], true, "módulo oscuro");
});

test("vCard: campos, escapes y fin de línea CRLF", () => {
  const v = VCard.generar(EJEMPLO);
  assert.match(v, /^BEGIN:VCARD\r\nVERSION:3\.0\r\n/);
  assert.match(v, /\r\nN:Torres;Ana;;;\r\n/);
  assert.match(v, /\r\nFN:Ana Torres\r\n/);
  assert.match(v, /\r\nADR;TYPE=WORK:;;Av\. Siempreviva 742\\, CABA;;;;\r\n/);
  assert.match(v, /\r\nNOTE:Turnos: lunes a viernes\\, de 9 a 18\r\n/);
  assert.match(v, /END:VCARD\r\n$/);
  assert.doesNotMatch(VCard.generar({ nombre: "Solo" }), /ORG|TEL|EMAIL/);
  assert.throws(() => VCard.generar({}), /nombre/);
});

test("vCard: las líneas largas se pliegan a 75 bytes y se recuperan", () => {
  const largo = { ...EJEMPLO, nota: "Atención con turno previo. ".repeat(6) + "Señalización ñ á é" };
  const v = VCard.generar(largo);
  for (const l of v.split("\r\n")) assert.ok(new TextEncoder().encode(l).length <= 75, `línea de ${l.length}`);
  assert.equal(VCard.leer(v).nota, largo.nota);
});

test("vCard: lo generado se puede volver a leer igual", () => {
  const r = VCard.leer(VCard.generar(EJEMPLO));
  for (const k of VCard.CAMPOS) assert.equal(r[k], EJEMPLO[k], k);
});

test("la tarjeta de ejemplo entra en un QR", () => {
  const q = QR.codificar(VCard.generar(EJEMPLO));
  assert.ok(q.version <= 13);
  assert.equal(VCard.nombreArchivo(EJEMPLO), "ana-torres");
});
