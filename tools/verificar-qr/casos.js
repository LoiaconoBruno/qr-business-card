// Datos de prueba para dibujar tarjetas completas en cada plantilla (se usan en el navegador y en Node).
const CasosTarjeta = [
  {
    nombre: "ejemplo",
    datos: {
      nombre: "Ana", apellido: "Torres", cargo: "Odontóloga", empresa: "Consultorio Torres",
      telefono: "+54 9 11 5555-0000", email: "ana@ejemplo.com", web: "https://ejemplo.com",
      direccion: "Av. Siempreviva 742, CABA", nota: "Turnos: lunes a viernes, de 9 a 18",
    },
  },
  { nombre: "corto", datos: { nombre: "Leo", telefono: "+54 11 4000-0000" } },
  {
    nombre: "tildes",
    datos: {
      nombre: "Mara", apellido: "Ibáñez", cargo: "Ingeniería en señales", empresa: "Ñandú Óptica",
      email: "mara@nandu.example", direccion: "Güemes 1234, Córdoba", nota: "Atención con turno",
    },
  },
];

if (typeof module !== "undefined") module.exports = CasosTarjeta;
