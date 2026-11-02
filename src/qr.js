// Codificador de códigos QR (ISO/IEC 18004), sin dependencias.
// Modo byte (UTF-8), niveles de corrección L y M, versiones 1 a 13
// (hasta 331 bytes en M y 425 en L: alcanza para una tarjeta de contacto).
const QR = (() => {
  // Por versión: [total de codewords, nivel L: [ec por bloque, [bloques, datos]...], nivel M: ...]
  const TABLA = {
    1: [26, [7, [1, 19]], [10, [1, 16]]],
    2: [44, [10, [1, 34]], [16, [1, 28]]],
    3: [70, [15, [1, 55]], [26, [1, 44]]],
    4: [100, [20, [1, 80]], [18, [2, 32]]],
    5: [134, [26, [1, 108]], [24, [2, 43]]],
    6: [172, [18, [2, 68]], [16, [4, 27]]],
    7: [196, [20, [2, 78]], [18, [4, 31]]],
    8: [242, [24, [2, 97]], [22, [2, 38], [2, 39]]],
    9: [292, [30, [2, 116]], [22, [3, 36], [2, 37]]],
    10: [346, [18, [2, 68], [2, 69]], [26, [4, 43], [1, 44]]],
    11: [404, [20, [4, 81]], [30, [1, 50], [4, 51]]],
    12: [466, [24, [2, 92], [2, 93]], [22, [6, 36], [2, 37]]],
    13: [532, [26, [4, 107]], [22, [8, 37], [1, 38]]],
  };
  const ALINEACION = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50], 11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62] };
  const NIVELES = { L: { idx: 1, bits: 1 }, M: { idx: 2, bits: 0 } };

  function bloques(version, nivel) {
    const fila = TABLA[version][NIVELES[nivel].idx];
    const [ec, ...grupos] = fila;
    const lista = [];
    for (const [n, datos] of grupos) for (let i = 0; i < n; i++) lista.push(datos);
    return { ec, datos: lista, totalDatos: lista.reduce((a, b) => a + b, 0) };
  }

  function capacidadBytes(version, nivel) {
    const bitsCuenta = version <= 9 ? 8 : 16;
    return Math.floor((bloques(version, nivel).totalDatos * 8 - 4 - bitsCuenta) / 8);
  }

  // --- Reed-Solomon sobre GF(256) con polinomio 0x11D ---
  function mult(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function divisor(grado) {
    const r = new Array(grado).fill(0);
    r[grado - 1] = 1;
    let raiz = 1;
    for (let i = 0; i < grado; i++) {
      for (let j = 0; j < r.length; j++) {
        r[j] = mult(r[j], raiz);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      raiz = mult(raiz, 0x02);
    }
    return r;
  }
  function resto(datos, div) {
    const r = div.map(() => 0);
    for (const b of datos) {
      const f = b ^ r.shift();
      r.push(0);
      div.forEach((c, i) => { r[i] ^= mult(c, f); });
    }
    return r;
  }

  function codewords(bytes, version, nivel) {
    const b = bloques(version, nivel);
    const bits = [];
    const poner = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    poner(0b0100, 4);
    poner(bytes.length, version <= 9 ? 8 : 16);
    for (const x of bytes) poner(x, 8);
    const cap = b.totalDatos * 8;
    poner(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    const datos = [];
    for (let i = 0; i < bits.length; i += 8) datos.push(bits.slice(i, i + 8).reduce((a, c) => (a << 1) | c, 0));
    for (let p = 0; datos.length < b.totalDatos; p++) datos.push(p % 2 ? 0x11 : 0xec);
    // Dividir en bloques, calcular la corrección y entrelazar.
    const div = divisor(b.ec);
    const bl = [];
    let k = 0;
    for (const n of b.datos) { const d = datos.slice(k, k + n); k += n; bl.push({ d, e: resto(d, div) }); }
    const out = [];
    const maxD = Math.max(...b.datos);
    for (let i = 0; i < maxD; i++) for (const x of bl) if (i < x.d.length) out.push(x.d[i]);
    for (let i = 0; i < b.ec; i++) for (const x of bl) out.push(x.e[i]);
    return out;
  }

  function matriz(version, nivel, cws, mascaraElegida) {
    const n = version * 4 + 17;
    const m = Array.from({ length: n }, () => new Array(n).fill(false));
    const fun = Array.from({ length: n }, () => new Array(n).fill(false));
    const set = (x, y, v) => { m[y][x] = v; fun[y][x] = true; };

    // Patrones de búsqueda (con su separador)
    for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, d !== 2 && d !== 4);
      }
    }
    // Sincronización
    for (let i = 0; i < n; i++) {
      if (!fun[6][i]) set(i, 6, i % 2 === 0);
      if (!fun[i][6]) set(6, i, i % 2 === 0);
    }
    // Alineación
    const pos = ALINEACION[version];
    for (const ay of pos) for (const ax of pos) {
      if ((ax === 6 && ay === 6) || (ax === 6 && ay === pos[pos.length - 1]) || (ax === pos[pos.length - 1] && ay === 6)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    // Reservar formato (se escribe al final) y módulo oscuro
    const formato = (mask) => {
      const dato = (NIVELES[nivel].bits << 3) | mask;
      let r = dato;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const bits = ((dato << 10) | r) ^ 0x5412;
      const b = (i) => ((bits >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, b(i));
      set(8, 7, b(6)); set(8, 8, b(7)); set(7, 8, b(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, b(i));
      for (let i = 0; i < 8; i++) set(n - 1 - i, 8, b(i));
      for (let i = 8; i < 15; i++) set(8, n - 15 + i, b(i));
      set(8, n - 8, true);
    };
    formato(0);
    // Información de versión (7 o más)
    if (version >= 7) {
      let r = version;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const bits = (version << 12) | r;
      for (let i = 0; i < 18; i++) {
        const v = ((bits >>> i) & 1) === 1;
        const a = n - 11 + (i % 3), b = Math.floor(i / 3);
        set(a, b, v); set(b, a, v);
      }
    }
    // Datos en zigzag
    let i = 0;
    for (let der = n - 1; der >= 1; der -= 2) {
      if (der === 6) der = 5;
      for (let v = 0; v < n; v++) for (let j = 0; j < 2; j++) {
        const x = der - j;
        const arriba = ((der + 1) & 2) === 0;
        const y = arriba ? n - 1 - v : v;
        if (!fun[y][x] && i < cws.length * 8) { m[y][x] = ((cws[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
      }
    }
    // Máscara: la elegida o la de menor penalización
    const aplicar = (mask) => {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (fun[y][x]) continue;
        let inv;
        switch (mask) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: inv = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: inv = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (inv) m[y][x] = !m[y][x];
      }
    };
    let mejor = mascaraElegida;
    if (mejor === undefined) {
      let menor = Infinity;
      for (let k = 0; k < 8; k++) {
        aplicar(k); formato(k);
        const p = penalizacion(m);
        if (p < menor) { menor = p; mejor = k; }
        aplicar(k); // deshacer (XOR)
      }
    }
    aplicar(mejor); formato(mejor);
    return { modulos: m, mascara: mejor };
  }

  function penalizacion(m) {
    const n = m.length;
    let p = 0;
    const filas = (get) => {
      for (let a = 0; a < n; a++) {
        let corrida = 1;
        for (let b = 1; b <= n; b++) {
          if (b < n && get(a, b) === get(a, b - 1)) corrida++;
          else { if (corrida >= 5) p += corrida - 2; corrida = 1; }
        }
        for (let b = 0; b + 10 < n + 1; b++) {
          const s = Array.from({ length: Math.min(11, n - b) }, (_, k) => (get(a, b + k) ? 1 : 0)).join("");
          if (s === "10111010000" || s === "00001011101") p += 40;
        }
      }
    };
    filas((a, b) => m[a][b]);
    filas((a, b) => m[b][a]);
    for (let y = 0; y + 1 < n; y++) for (let x = 0; x + 1 < n; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
    }
    let oscuros = 0;
    for (const f of m) for (const c of f) if (c) oscuros++;
    p += Math.floor(Math.abs((oscuros * 20) / (n * n) - 10)) * 10;
    return p;
  }

  // Devuelve { version, nivel, tamano, modulos (matriz de booleanos, true = oscuro), mascara }.
  function codificar(texto, { nivel = "M", mascara } = {}) {
    const bytes = Array.from(new TextEncoder().encode(texto));
    const niveles = nivel === "M" ? ["M", "L"] : ["L"];
    for (const nv of niveles) {
      for (let v = 1; v <= 13; v++) {
        if (bytes.length <= capacidadBytes(v, nv)) {
          const { modulos, mascara: mk } = matriz(v, nv, codewords(bytes, v, nv), mascara);
          return { version: v, nivel: nv, tamano: modulos.length, modulos, mascara: mk };
        }
      }
    }
    throw new Error(`El texto ocupa ${bytes.length} bytes: no entra en un QR de versión 13 (máximo ${capacidadBytes(13, "L")}).`);
  }

  return { codificar, capacidadBytes, bloques, codewords, divisor, resto, mult, TABLA };
})();

if (typeof module !== "undefined") module.exports = QR;
