<div align="center">

# QR Business Card

**Tarjeta digital.** Tu tarjeta como contacto (.vcf) y como imagen con un QR que cualquier cámara convierte en contacto. Con un codificador QR propio, sin dependencias.

[**▶ Probala en vivo**](https://loiaconobruno.github.io/qr-business-card/) · [Cómo funciona](#cómo-funciona) · [Limitaciones](#limitaciones)

[![Tests](https://github.com/LoiaconoBruno/qr-business-card/actions/workflows/tests.yml/badge.svg)](https://github.com/LoiaconoBruno/qr-business-card/actions/workflows/tests.yml)
![Dependencias: 0](https://img.shields.io/badge/dependencias-0-brightgreen)
![HTML, CSS y JavaScript](https://img.shields.io/badge/HTML%20%C2%B7%20CSS%20%C2%B7%20JS-sin%20build-f7df1e)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue)](LICENSE)

<img src="docs/captura.png" alt="Captura de QR Business Card" width="800">

</div>

Página para armar tu tarjeta de presentación en **dos formatos**: un **contacto ordenado (.vcf)** y una **imagen de la tarjeta con un código QR** que, escaneado con la cámara de cualquier teléfono, agrega el contacto. No hace falta instalar nada, ni para darla ni para recibirla.

Es el "prototipo sin app" de la idea "intercambio digital de tarjetas de presentación": guardar el contacto ordenado y, además, una imagen para la galería. Mucha gente recuerda **cómo se veía** una tarjeta, no el nombre de la persona.

## Por qué

El problema que decide todo en estas apps es que el otro no tenga la app. El QR con el contacto adentro funciona en cualquier teléfono. Y como la imagen lleva el QR, **la foto misma sirve para volver a importar el contacto** (la mejora que proponía la idea).

## Instalación

No hace falta instalar nada: **[abrila en el navegador](https://loiaconobruno.github.io/qr-business-card/)**.

Para usarla sin conexión o modificarla:

```bash
git clone https://github.com/LoiaconoBruno/qr-business-card.git
```

Después abrí `index.html` con doble clic. No hay dependencias ni paso de build. Para correr los tests hace falta Node 18 o más nuevo:

```bash
npm test
```

## Uso

Abrí la [demo en vivo](https://loiaconobruno.github.io/qr-business-card/) o `index.html` con doble clic.

Ejemplo:

1. Apretá **Cargar ejemplo**: Ana Torres, odontóloga, con teléfono, email, web, dirección y una nota de horarios (datos inventados).
2. La vista previa muestra la tarjeta con el QR a la derecha y debajo: "QR versión 13, corrección M (298 bytes)".
3. **Descargar contacto (.vcf)** baja `ana-torres.vcf`, que se abre con la app de contactos.
4. **Descargar imagen (PNG)** baja `ana-torres-tarjeta.png` (1050 × 600 px, el tamaño de una tarjeta a 300 ppp). Escaneá el QR con la cámara del teléfono: aparece "Agregar contacto" con todos los datos.
5. Cambiá el **estilo** a Oscuro o Terracota. En celulares que lo permiten aparece **Compartir**, que manda la imagen y el contacto juntos.

## Cómo funciona

- **vCard 3.0:** nombre, cargo, empresa, teléfono, email, web, dirección y nota, con los caracteres especiales escapados, fin de línea CRLF y líneas largas plegadas a 75 bytes, como pide el estándar.
- **QR propio, sin dependencias:** modo byte (UTF-8), corrección M (o L si no entra), versiones 1 a 13. Incluye Reed-Solomon, entrelazado de bloques, las 8 máscaras con su penalización y la información de formato y de versión.
- **Imagen:** se dibuja en un canvas, con el QR en un recuadro blanco con 4 módulos de margen, para que se lea en cualquier estilo.

La lógica está en `src/qr.js`, `src/vcard.js` y `src/dibujo.js`, y se testea con:

```bash
npm test
```

### Verificación de los QR con un lector real (macOS)

Los tests no pueden leer imágenes, así que hay una verificación aparte que genera PNG con el codificador y los decodifica con el detector de QR de macOS (CoreImage):

```bash
node tools/verificar-qr/generar.js src/qr.js /tmp/qr
```

```bash
swiftc -O tools/verificar-qr/decodificar.swift -o /tmp/decodificar-qr
```

```bash
/tmp/decodificar-qr /tmp/qr/*.png > /tmp/qr/resultado.tsv
```

```bash
node tools/verificar-qr/comparar.js /tmp/qr/esperado.json /tmp/qr/resultado.tsv
```

Prueba las versiones 1 a 13 en M y L al máximo de su capacidad, las 8 máscaras, texto con tildes y la tarjeta de ejemplo: 36 de 36 se decodifican correctamente.

## Limitaciones

- **No escribe tags NFC.** Web NFC solo existe en Chrome para Android; en iPhone, las apps de terceros no pueden usar el "acercar los teléfonos" de NameDrop.
- El QR llega hasta la versión 13: un contacto de más de unos 425 bytes no entra (la página avisa y pide acortar la nota o la dirección).
- Con todos los campos completos, el QR es denso (versión 13): impreso muy chico puede costar escanearlo.
- No hay foto ni logo en la tarjeta.
- Apple ya resuelve parte de esto con NameDrop, y hay apps establecidas (Popl, Blinq, HiHello). El doble guardado es una función, no un producto.

## Próximos pasos

- Publicarla (por ejemplo en GitHub Pages) y grabar un tag NFC con el enlace a la tarjeta.
- Probarla con 10 personas reales y anotar dónde se traban.
- Elegir un nicho (profesionales de la salud, congresos) y ver qué les falta a NameDrop, Popl y Blinq.

## Licencia

MIT
