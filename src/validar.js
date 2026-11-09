// Validación de los campos de la tarjeta. Devuelve un objeto { campo: mensaje } solo con los errores.
// Los mensajes explican qué hacer, no solo qué está mal.
const Validar = (() => {
  const LARGO_MAXIMO = { nombre: 60, apellido: 60, cargo: 80, empresa: 80, telefono: 30, email: 120, web: 200, direccion: 160, nota: 200 };

  function telefono(t) {
    if (!/^[+\d\s().\-]+$/.test(t)) return "Usá solo números, espacios, guiones, paréntesis y un + al principio.";
    if (t.indexOf("+") > 0) return "El + va solo al principio, para el código de país.";
    const digitos = t.replace(/\D/g, "").length;
    if (digitos < 6) return "Parece incompleto: tiene menos de 6 números.";
    if (digitos > 15) return "Tiene más de 15 números, el máximo de un número internacional.";
    return "";
  }

  function email(e) {
    // Una dirección razonable: algo@dominio.tld, sin espacios.
    return /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(e) ? "" : "Revisá el email: tiene que ser como nombre@dominio.com.";
  }

  function web(w) {
    const conEsquema = /^https?:\/\//i.test(w) ? w : "https://" + w;
    try {
      const u = new URL(conEsquema);
      if (!/^[^.\s]+(\.[^.\s]+)+$/.test(u.hostname)) return "Revisá la web: tiene que ser como ejemplo.com.";
      return "";
    } catch {
      return "Revisá la web: tiene que ser como ejemplo.com.";
    }
  }

  // Agrega https:// si falta, para que el link funcione en el contacto.
  function normalizarWeb(w) {
    const t = (w || "").trim();
    if (!t) return "";
    return /^https?:\/\//i.test(t) ? t : "https://" + t;
  }

  function validar(d) {
    const errores = {};
    const v = (k) => (d[k] || "").trim();
    if (!v("nombre") && !v("apellido")) errores.nombre = "Escribí al menos tu nombre o tu apellido.";
    for (const [k, max] of Object.entries(LARGO_MAXIMO)) {
      if (v(k).length > max) errores[k] = `Es muy largo: hasta ${max} caracteres.`;
    }
    if (v("telefono") && !errores.telefono) { const m = telefono(v("telefono")); if (m) errores.telefono = m; }
    if (v("email") && !errores.email) { const m = email(v("email")); if (m) errores.email = m; }
    if (v("web") && !errores.web) { const m = web(v("web")); if (m) errores.web = m; }
    return errores;
  }

  return { validar, normalizarWeb, LARGO_MAXIMO };
})();

if (typeof module !== "undefined") module.exports = Validar;
