// Compara lo decodificado por CoreImage con lo esperado.
// Uso: node tools/verificar-qr/comparar.js /tmp/qr/esperado.json resultado.tsv
const fs = require("node:fs");
const path = require("node:path");
const esperado = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const lineas = fs.readFileSync(process.argv[3], "utf8").trim().split("\n");
let ok = 0;
const mal = [];
for (const l of lineas) {
  const [archivo, ...resto] = l.split("\t");
  const leido = resto.join("\t").replace(/\\r/g, "\r").replace(/\\n/g, "\n");
  const e = esperado[path.resolve(archivo)];
  if (e && leido === e.texto) ok++; else mal.push(`${archivo}: ${leido.slice(0, 40)}`);
}
console.log(`${ok} de ${Object.keys(esperado).length} decodificados correctamente`);
if (mal.length) { console.log(mal.join("\n")); process.exit(1); }
