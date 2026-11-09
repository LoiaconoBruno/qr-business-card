// Plantillas de la tarjeta: colores, tipografía y un fondo dibujado en el canvas.
// Cada fondo es determinista (mismo resultado en cada dibujo) y no usa imágenes externas.
// "fondoRef" es el color de fondo más desfavorable para el texto: los tests chequean contra él
// que el texto y el texto suave pasen AA (4,5:1).
const Plantillas = (() => {
  const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif';

  // Generador pseudoaleatorio con semilla (mulberry32), para texturas repetibles.
  function azar(semilla) {
    let a = semilla >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Grano: una baldosa de ruido que se repite. "tinte" es [r, g, b] y "alfa" la intensidad máxima.
  function grano(ctx, w, h, { semilla = 7, tinte = [0, 0, 0], alfa = 0.06, lado = 160 } = {}) {
    if (typeof ctx.createImageData !== "function") return;
    const baldosa = ctx.createImageData(lado, lado);
    const r = azar(semilla);
    for (let i = 0; i < baldosa.data.length; i += 4) {
      baldosa.data[i] = tinte[0];
      baldosa.data[i + 1] = tinte[1];
      baldosa.data[i + 2] = tinte[2];
      baldosa.data[i + 3] = Math.round(r() * alfa * 255);
    }
    const lienzo = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(lado, lado) : Object.assign(document.createElement("canvas"), { width: lado, height: lado });
    lienzo.getContext("2d").putImageData(baldosa, 0, 0);
    ctx.save();
    ctx.fillStyle = ctx.createPattern(lienzo, "repeat");
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Mancha de color difusa: un gradiente radial que se desvanece.
  function mancha(ctx, x, y, radio, color, alfa) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radio);
    g.addColorStop(0, `rgba(${color}, ${alfa})`);
    g.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  const LISTA = [
    {
      id: "aurora",
      nombre: "Aurora",
      descripcion: "Mesh pastel, luminosa",
      texto: "#191726", suave: "#463f5e", acento: "#5232c8", fondoRef: "#d6ccff",
      titulo: SANS, cuerpo: SANS, pesoTitulo: 800,
      fondo(ctx, w, h) {
        ctx.fillStyle = "#fbfaff";
        ctx.fillRect(0, 0, w, h);
        mancha(ctx, 160, 90, 560, "196, 178, 255", 0.85);
        mancha(ctx, 960, 40, 520, "255, 207, 186", 0.8);
        mancha(ctx, 700, 640, 560, "176, 236, 219", 0.75);
        mancha(ctx, 40, 620, 420, "255, 232, 163", 0.6);
        grano(ctx, w, h, { semilla: 11, alfa: 0.035 });
      },
    },
    {
      id: "grafito",
      nombre: "Grafito",
      descripcion: "Oscura, con grano y un brillo frío",
      texto: "#f3f4f7", suave: "#b9bfcb", acento: "#9db8ff", fondoRef: "#30343d",
      titulo: SANS, cuerpo: SANS, pesoTitulo: 750,
      fondo(ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#16181d");
        g.addColorStop(1, "#272a32");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        mancha(ctx, 120, 60, 520, "110, 132, 255", 0.22);
        mancha(ctx, w, h, 420, "80, 200, 220", 0.12);
        grano(ctx, w, h, { semilla: 23, tinte: [255, 255, 255], alfa: 0.07 });
      },
    },
    {
      id: "papel",
      nombre: "Papel",
      descripcion: "Crema, textura de papel y letra serif",
      texto: "#2a211a", suave: "#5f4c3d", acento: "#9a3f22", fondoRef: "#e9dfcd",
      titulo: SERIF, cuerpo: SANS, pesoTitulo: 600,
      fondo(ctx, w, h) {
        ctx.fillStyle = "#f6efe3";
        ctx.fillRect(0, 0, w, h);
        mancha(ctx, w * 0.5, h * 0.45, 700, "255, 252, 245", 0.7);
        mancha(ctx, 0, h, 500, "222, 205, 178", 0.45);
        grano(ctx, w, h, { semilla: 5, tinte: [92, 64, 40], alfa: 0.08, lado: 120 });
        // Fibras finas, muy suaves.
        const r = azar(42);
        ctx.save();
        ctx.strokeStyle = "rgba(120, 90, 60, 0.07)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 70; i++) {
          const x = r() * w, y = r() * h, l = 20 + r() * 60, a = r() * Math.PI;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 6, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
          ctx.stroke();
        }
        ctx.restore();
      },
    },
    {
      id: "oceano",
      nombre: "Océano",
      descripcion: "Gradiente profundo de azul a verde agua",
      texto: "#ffffff", suave: "#e1f1f7", acento: "#8ef0e2", fondoRef: "#0f6370",
      titulo: SANS, cuerpo: SANS, pesoTitulo: 800,
      fondo(ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#0a2f57");
        g.addColorStop(0.6, "#0c4a6b");
        g.addColorStop(1, "#0f6370");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        mancha(ctx, w * 0.85, -40, 520, "120, 210, 255", 0.28);
        mancha(ctx, 60, h + 40, 420, "40, 160, 170", 0.3);
        // Ondas suaves.
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 2;
        for (let k = 0; k < 7; k++) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 10) {
            const y = h * 0.62 + k * 24 + Math.sin(x / 140 + k * 0.7) * 14;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
        grano(ctx, w, h, { semilla: 31, tinte: [255, 255, 255], alfa: 0.035 });
      },
    },
    {
      id: "minima",
      nombre: "Mínima",
      descripcion: "Blanca, con una línea de color",
      texto: "#151820", suave: "#4d5563", acento: "#3a4bd6", fondoRef: "#ffffff",
      titulo: SANS, cuerpo: SANS, pesoTitulo: 700,
      fondo(ctx, w, h) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#3a4bd6";
        ctx.fillRect(0, 0, 14, h);
        ctx.fillStyle = "#eceefd";
        ctx.fillRect(14, 0, 6, h);
      },
    },
  ];

  const porId = (id) => LISTA.find((p) => p.id === id) || LISTA[0];

  return { LISTA, porId, azar, SANS, SERIF };
})();

if (typeof module !== "undefined") module.exports = Plantillas;
