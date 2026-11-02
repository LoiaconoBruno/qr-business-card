// Contacto en formato vCard 3.0 (RFC 2426), el que entienden los teléfonos.
const VCard = (() => {
  const CAMPOS = ["nombre", "apellido", "cargo", "empresa", "telefono", "email", "web", "direccion", "nota"];

  // Escapa los caracteres especiales de un valor.
  function escapar(v) {
    return String(v).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  // Corta las líneas de más de 75 bytes (RFC 2425): la continuación empieza con un espacio.
  function plegar(linea) {
    const enc = new TextEncoder();
    if (enc.encode(linea).length <= 75) return linea;
    const partes = [];
    let actual = "", bytes = 0, limite = 75;
    for (const ch of linea) {
      const b = enc.encode(ch).length;
      if (bytes + b > limite) { partes.push(actual); actual = ""; bytes = 0; limite = 74; }
      actual += ch; bytes += b;
    }
    partes.push(actual);
    return partes.join("\r\n ");
  }

  function generar(d) {
    const v = (k) => (d[k] || "").trim();
    if (!v("nombre") && !v("apellido")) throw new Error("Hace falta al menos el nombre o el apellido");
    const lineas = ["BEGIN:VCARD", "VERSION:3.0"];
    lineas.push(`N:${escapar(v("apellido"))};${escapar(v("nombre"))};;;`);
    lineas.push(`FN:${escapar([v("nombre"), v("apellido")].filter(Boolean).join(" "))}`);
    if (v("empresa")) lineas.push(`ORG:${escapar(v("empresa"))}`);
    if (v("cargo")) lineas.push(`TITLE:${escapar(v("cargo"))}`);
    if (v("telefono")) lineas.push(`TEL;TYPE=CELL:${escapar(v("telefono"))}`);
    if (v("email")) lineas.push(`EMAIL;TYPE=INTERNET:${escapar(v("email"))}`);
    if (v("web")) lineas.push(`URL:${escapar(v("web"))}`);
    if (v("direccion")) lineas.push(`ADR;TYPE=WORK:;;${escapar(v("direccion"))};;;;`);
    if (v("nota")) lineas.push(`NOTE:${escapar(v("nota"))}`);
    lineas.push("END:VCARD");
    return lineas.map(plegar).join("\r\n") + "\r\n";
  }

  // Lectura mínima, para comprobar que lo generado se puede volver a importar.
  function leer(texto) {
    const lineas = texto.replace(/\r\n[ \t]/g, "").split(/\r?\n/).filter(Boolean);
    const des = (s) => s.replace(/\\(.)/g, (_, c) => (c === "n" ? "\n" : c));
    const partir = (s) => s.split(/(?<!\\);/).map(des);
    const out = {};
    for (const l of lineas) {
      const i = l.indexOf(":");
      const clave = l.slice(0, i).split(";")[0].toUpperCase();
      const valor = l.slice(i + 1);
      if (clave === "N") { const [ap, no] = partir(valor); out.apellido = ap; out.nombre = no; }
      if (clave === "ORG") out.empresa = des(valor);
      if (clave === "TITLE") out.cargo = des(valor);
      if (clave === "TEL") out.telefono = des(valor);
      if (clave === "EMAIL") out.email = des(valor);
      if (clave === "URL") out.web = des(valor);
      if (clave === "ADR") out.direccion = partir(valor)[2];
      if (clave === "NOTE") out.nota = des(valor);
    }
    return out;
  }

  function nombreArchivo(d) {
    const base = [d.nombre, d.apellido].filter(Boolean).join("-").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
    return base || "contacto";
  }

  return { CAMPOS, escapar, plegar, generar, leer, nombreArchivo };
})();

if (typeof module !== "undefined") module.exports = VCard;
