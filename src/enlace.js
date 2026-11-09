// Enlace propio de la tarjeta: los datos viajan en el fragmento de la URL (#…), que el navegador
// nunca manda al servidor. No hace falta servidor ni base de datos.
//
// Formato del fragmento: un dígito de versión y los datos en base64url.
//   "1…": JSON sin comprimir · "2…": JSON comprimido con deflate-raw (CompressionStream).
// Se elige el más corto. El JSON es un arreglo con los campos de VCard.CAMPOS, en orden, y la plantilla.
// La foto no viaja en el enlace: no entraría en un tag NFC.
const Enlace = (() => {
  const CAMPOS = ["nombre", "apellido", "cargo", "empresa", "telefono", "email", "web", "direccion", "nota"];

  // Memoria de usuario de los tags NFC más comunes (NXP NTAG213/215/216).
  const TAGS = [
    { nombre: "NTAG213", bytes: 144 },
    { nombre: "NTAG215", bytes: 504 },
    { nombre: "NTAG216", bytes: 888 },
  ];

  // Prefijos abreviados de un registro URI (NFC Forum URI Record Type Definition, tabla 3).
  const PREFIJOS = [
    [0x02, "https://www."],
    [0x01, "http://www."],
    [0x04, "https://"],
    [0x03, "http://"],
  ];

  const utf8 = (texto) => new TextEncoder().encode(texto);

  function aBase64url(bytes) {
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function deBase64url(texto) {
    const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }

  async function transformar(bytes, flujo) {
    const salida = new Blob([bytes]).stream().pipeThrough(flujo);
    return new Uint8Array(await new Response(salida).arrayBuffer());
  }

  const puedeComprimir = () => typeof CompressionStream !== "undefined";

  function serializar(datos, plantilla) {
    const valores = CAMPOS.map((k) => (datos[k] || "").trim());
    while (valores.length && !valores[valores.length - 1]) valores.pop();
    return JSON.stringify([plantilla || "", ...valores]);
  }

  function deserializar(json) {
    const arreglo = JSON.parse(json);
    if (!Array.isArray(arreglo) || arreglo.some((x) => typeof x !== "string")) throw new Error("Datos con formato inválido");
    const [plantilla, ...valores] = arreglo;
    const datos = Object.fromEntries(CAMPOS.map((k, i) => [k, valores[i] || ""]));
    return { datos, plantilla };
  }

  // Devuelve { fragmento, comprimido } con la variante más corta.
  async function codificar(datos, plantilla) {
    const json = utf8(serializar(datos, plantilla));
    const plano = "1" + aBase64url(json);
    if (!puedeComprimir()) return { fragmento: plano, comprimido: false };
    const comprimido = "2" + aBase64url(await transformar(json, new CompressionStream("deflate-raw")));
    return comprimido.length < plano.length ? { fragmento: comprimido, comprimido: true } : { fragmento: plano, comprimido: false };
  }

  async function decodificar(fragmento) {
    const f = decodeURIComponent((fragmento || "").replace(/^#/, ""));
    const version = f[0], cuerpo = f.slice(1);
    if (!cuerpo) throw new Error("El enlace no tiene datos");
    let bytes = deBase64url(cuerpo);
    if (version === "2") {
      if (typeof DecompressionStream === "undefined") throw new Error("Este navegador no puede descomprimir el enlace");
      bytes = await transformar(bytes, new DecompressionStream("deflate-raw"));
    } else if (version !== "1") {
      throw new Error("Versión de enlace desconocida");
    }
    return deserializar(new TextDecoder().decode(bytes));
  }

  // Bytes que ocupa el enlace grabado en un tag NFC Forum Type 2 (los NTAG):
  // TLV de mensaje NDEF (tipo 0x03 + largo de 1 o 3 bytes) + un registro URI + TLV terminador (0xFE).
  // Registro URI: encabezado (1) + largo del tipo (1) + largo del contenido (1 si ≤ 255, si no 4)
  // + tipo "U" (1) + código de prefijo (1) + el resto de la URL.
  function bytesNdef(url) {
    const [, prefijo] = PREFIJOS.find(([, p]) => url.startsWith(p)) || [0x00, ""];
    const contenido = 1 + utf8(url.slice(prefijo.length)).length;
    const registro = 1 + 1 + (contenido <= 255 ? 1 : 4) + 1 + contenido;
    const tlv = 1 + (registro < 0xff ? 1 : 3) + registro;
    return tlv + 1;
  }

  function tags(url) {
    const n = bytesNdef(url);
    return TAGS.map((t) => ({ ...t, ocupa: n, entra: n <= t.bytes }));
  }

  return { CAMPOS, TAGS, codificar, decodificar, serializar, deserializar, bytesNdef, tags, aBase64url, deBase64url, puedeComprimir };
})();

if (typeof module !== "undefined") module.exports = Enlace;
