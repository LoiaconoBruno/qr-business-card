// Dibuja la tarjeta completa en cada plantilla con Chrome sin ventana y guarda un PNG por caso,
// para decodificarlos con CoreImage como si fueran una foto de la tarjeta.
// Uso (desde la raíz del proyecto): node tools/verificar-qr/tarjetas.js /tmp/qr-tarjetas
// Chrome: se toma de la variable CHROME o de la ruta habitual en macOS.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const VCard = require("../../src/vcard.js");
const Plantillas = require("../../src/plantillas.js");
const casos = require("./casos.js");

const salida = path.resolve(process.argv[2] || "/tmp/qr-tarjetas");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const pagina = pathToFileURL(path.join(__dirname, "tarjeta.html")).href;

fs.mkdirSync(salida, { recursive: true });
const esperado = {};
for (const p of Plantillas.LISTA) {
  casos.forEach((caso, i) => {
    const archivo = path.join(salida, `${p.id}-${caso.nombre}.png`);
    execFileSync(chrome, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
      "--allow-file-access-from-files", "--window-size=1050,600", `--screenshot=${archivo}`,
      `${pagina}?p=${p.id}&c=${i}`,
    ], { stdio: "ignore" });
    esperado[archivo] = { texto: VCard.generar(caso.datos), plantilla: p.id, caso: caso.nombre };
  });
}
fs.writeFileSync(path.join(salida, "esperado.json"), JSON.stringify(esperado));
console.log(`${Object.keys(esperado).length} tarjetas generadas en ${salida}`);
