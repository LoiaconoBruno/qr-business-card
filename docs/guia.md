# Una tarjeta con QR: paper de uso y guía de la idea

## Resumen

Este documento acompaña a **QR Business Card**, una página para armar una tarjeta de presentación y compartirla de cuatro maneras. La primera es un **contacto ordenado (.vcf)**. La segunda es una **imagen de la tarjeta con un código QR**, que la cámara de cualquier teléfono convierte en contacto. La tercera es un **enlace propio**, que abre la tarjeta con un botón «Agregar contacto». La cuarta es ese mismo enlace **grabado en un sticker NFC**, que se abre al acercar el teléfono. No hace falta instalar nada, ni para darla ni para recibirla, y no hay servidor: los datos viajan dentro del archivo, del QR o del enlace. Es el "prototipo sin app" de una idea sobre el intercambio digital de tarjetas: guardar el contacto ordenado y, además, una imagen para la galería, porque mucha gente recuerda **cómo se veía** una tarjeta, no el nombre de la persona.

La primera parte es un paper de uso. Recorre el flujo en tres pasos, las plantillas, las formas de compartir con sus límites y un ejemplo resuelto con los números de la herramienta. También explica cuánto ocupa el enlace en un tag NFC y cómo verificar los QR con un lector real. La segunda es una guía de la idea en tres frentes. El primero es matemático: cómo funciona un código QR por dentro, desde el código de barras de Woodland y Silver y el QR de Masahiro Hara en Denso Wave (1994) hasta los códigos correctores de errores de Shannon, Hamming, Reed y Solomon y la aritmética de los cuerpos finitos de Galois. El segundo es de estándares: vCard, MIME, UTF-8 y los registros NDEF de los tags NFC. El tercero es psicológico y económico: por qué recordamos caras y no nombres (Paivio, Standing, la paradoja Baker-baker de McWeeny y colaboradores) y por qué una app de tarjetas fracasa si el otro no la tiene (las externalidades de red de Katz y Shapiro). La herramienta implementa su propio codificador QR, sin dependencias, y esta guía explica cada pieza.

## Parte I. Paper de uso

### 1. Qué es la herramienta

QR Business Card es una página estática sin dependencias. Se abre desde la [demo en vivo](https://loiaconobruno.github.io/qr-business-card/) o con doble clic en `index.html`. Se usa en tres pasos, con la vista previa de la tarjeta siempre a la vista: arriba en el celular y a la derecha en pantallas anchas.

1. **Datos:** nombre, apellido, profesión o cargo, empresa o consultorio, teléfono, email, web, dirección y una nota, más una foto o un logo opcional. Tiene los botones "Cargar ejemplo" y "Limpiar".
2. **Diseño:** cinco plantillas, cada una con una miniatura de tu tarjeta.
3. **Compartir:** el botón «Compartir», que manda la imagen y el contacto juntos (en iPhone, iPad y Mac, la hoja de compartir incluye AirDrop). Además están las descargas, tu enlace y, en Chrome para Android, «Grabar en tag NFC».

Debajo de la vista previa, una línea informa la versión del QR, el nivel de corrección y el tamaño del contacto en bytes. Lo que escribís se guarda solo en tu navegador (en `localStorage`), para no perderlo al recargar.

La página `contacto.html` es la que abre el enlace. Lee los datos de la parte del enlace que va después del `#`, dibuja la tarjeta y ofrece «Agregar contacto» y «Guardar la tarjeta (PNG)».

La lógica está en archivos sin acceso al DOM:

- `src/vcard.js`: el contacto.
- `src/qr.js`: el codificador QR.
- `src/plantillas.js`: los fondos.
- `src/dibujo.js`: la imagen.
- `src/enlace.js`: el enlace y su tamaño en un tag NFC.
- `src/validar.js`: la validación.

Los 17 tests se corren con `npm test`. El CI usa Node 22.

### 2. Instalación

```bash
git clone https://github.com/LoiaconoBruno/qr-business-card.git
cd qr-business-card
npm test
```

Después se abre `index.html` con doble clic.

### 3. Los campos

| Campo | En el contacto (.vcf) | En la imagen | Validación |
|---|---|---|---|
| Nombre y apellido | Sí (N y FN) | Sí | Al menos uno de los dos; hasta 60 caracteres cada uno |
| Profesión o cargo | Sí (TITLE) | Sí | Hasta 80 caracteres |
| Empresa o consultorio | Sí (ORG) | Sí | Hasta 80 caracteres |
| Teléfono | Sí (TEL) | Sí | Números, espacios, guiones, puntos, paréntesis y un + solo al principio; de 6 a 15 dígitos |
| Email | Sí (EMAIL) | Sí | Con la forma nombre@dominio.com |
| Web | Sí (URL) | Sí | Un dominio, con `https://` o sin él; si falta, se agrega |
| Dirección | Sí (ADR) | Sí | Hasta 160 caracteres |
| Nota | Sí (NOTE) | No | Hasta 200 caracteres |
| Foto o logo | Sí (PHOTO), solo en el .vcf | Sí | PNG, JPG o WebP; se reduce a 320 px de lado |

Los errores aparecen debajo de cada campo cuando salís de él, no mientras escribís, y explican qué hacer. No se puede pasar al paso 2 con un error: la página lleva el foco al primer campo con problemas. El límite de 15 dígitos es el largo máximo de un número internacional.

El QR de la imagen contiene el contacto completo, nota incluida, pero sin la foto: una foto de 320 px ocupa miles de bytes, y el QR más grande que usa la herramienta admite 425. Así, la foto de la tarjeta guardada en la galería sirve para volver a importar el contacto. La imagen elegida se dibuja como círculo (foto) o como cuadrado redondeado (logo) arriba a la izquierda.

### 4. Las plantillas

| Plantilla | Fondo | Letra del nombre |
|---|---|---|
| Aurora | Mesh pastel: cuatro manchas de color difusas, con grano muy sutil | Sans, extra negrita |
| Grafito | Oscura, con un gradiente frío, grano y un brillo azulado | Sans |
| Papel | Crema, con grano cálido y fibras finas | Serif |
| Océano | Gradiente de azul profundo a verde agua, con ondas suaves | Sans |
| Mínima | Blanca, con una franja de color a la izquierda | Sans |

Los fondos se generan con código: gradientes radiales y lineales y un ruido con semilla fija (mulberry32), sin imágenes externas. Por eso la tarjeta se dibuja igual en cada equipo y en cada recarga. En cada plantilla, el texto, el texto secundario y el color de acento tienen un contraste de al menos 4,5:1 contra el color del fondo más desfavorable para el texto (el criterio AA de las WCAG 2.1). Un test lo verifica.

#### 4.1 El recuadro del QR

En todas las plantillas el QR se dibuja igual. Va negro sobre un recuadro blanco con esquinas redondeadas (radio de 20 px), borde gris visible (2 px) y una sombra suave. Tiene cuatro módulos de zona silenciosa y 10 px de holgura, y lleva debajo la etiqueta «Escaneame».

La holgura existe porque una esquina redondeada se mete hacia adentro (1 − 1/√2) veces el radio, unos 6 px: así la curva nunca toca la zona silenciosa. El módulo se calcula para que el código con su margen ocupe hasta 400 px: 13 px por módulo en la versión 1 y 5 px en la versión 13. Un test comprueba, para las versiones 1 a 13, que el margen mide exactamente cuatro módulos, que la etiqueta no lo pisa y que el recuadro entra en la tarjeta.

### 5. Ejemplo resuelto

1. **Cargar ejemplo.** Completa los datos de Ana Torres, odontóloga del Consultorio Torres, con teléfono, email, web, dirección y una nota de horarios. Los datos son inventados.
2. **Vista previa.** Muestra la tarjeta con el QR a la derecha y, debajo: "QR versión 13, corrección M (298 bytes)". El contacto ocupa 298 bytes; la versión 13 con corrección M admite hasta 331, así que entra. Una versión 13 tiene 69 × 69 módulos.
3. **Siguiente: diseño.** Aparecen las cinco plantillas con la tarjeta de Ana en miniatura. Con Papel, el nombre pasa a letra serif sobre fondo crema, y el QR queda igual.
4. **Siguiente: compartir.** El botón «Compartir» usa la Web Share API (W3C, 2023) y abre la hoja de compartir del sistema con la imagen y el contacto; en iPhone, iPad y Mac esa hoja incluye AirDrop. Antes de mostrar el botón, la página pregunta al navegador qué archivos acepta. Si acepta la imagen pero no el .vcf, comparte solo la imagen y avisa que el contacto se baja con su botón. Si no comparte archivos, el botón no aparece y quedan las descargas.
5. **Descargar contacto (.vcf).** Baja `ana-torres.vcf`, que se abre con la app de contactos de cualquier sistema. Su contenido es:

```
BEGIN:VCARD
VERSION:3.0
N:Torres;Ana;;;
FN:Ana Torres
ORG:Consultorio Torres
TITLE:Odontóloga
TEL;TYPE=CELL:+54 9 11 5555-0000
EMAIL;TYPE=INTERNET:ana@ejemplo.com
URL:https://ejemplo.com
ADR;TYPE=WORK:;;Av. Siempreviva 742\, CABA;;;;
NOTE:Turnos: lunes a viernes\, de 9 a 18
END:VCARD
```

Las comas dentro de la dirección y de la nota van escapadas con barra invertida, como pide el estándar. Si hubiera una foto, iría en una línea `PHOTO;ENCODING=b;TYPE=JPEG:` con la imagen en base64, plegada en líneas de 75 bytes.

6. **Descargar imagen (PNG).** Baja `ana-torres-tarjeta.png`, de 1050 × 600 píxeles: el tamaño de una tarjeta estándar de 3,5 × 2 pulgadas (88,9 × 50,8 mm) a 300 puntos por pulgada. Al escanear el QR con la cámara del teléfono aparece "Agregar contacto" con todos los datos.
7. **Tu enlace.** Debajo del enlace se lee: "263 caracteres, comprimido. Grabado en un tag NFC ocupa 268 bytes." Lo acompañan tres etiquetas: "✗ NTAG213 (144 B)", "✓ NTAG215 (504 B)" y "✓ NTAG216 (888 B)". Con "Abrir", el enlace muestra la tarjeta de Ana en `contacto.html`, con «Agregar contacto».
8. **Acercar el celular.** En Chrome para Android aparece «Grabar en tag NFC»: se toca, se acerca un sticker a la parte de atrás del teléfono y queda grabado el enlace. En los demás navegadores, la guía "Cómo grabar el enlace con NFC Tools" explica cómo hacerlo con una app.

Las cifras del enlace corresponden a la demo publicada, porque el enlace incluye la dirección de la página. Abierta desde una copia local, la dirección cambia y el número también.

### 6. Capacidad: cuánto entra

La herramienta usa versiones de QR de la 1 a la 13 y elige la más chica en la que entra el contacto, con corrección M; si no entra en M, prueba con L. Las capacidades en modo byte son:

| Versión | Módulos por lado | Capacidad M (bytes) | Capacidad L (bytes) |
|---|---|---|---|
| 1 | 21 | 14 | 17 |
| 2 | 25 | 26 | 32 |
| 5 | 37 | 84 | 106 |
| 10 | 57 | 213 | 271 |
| 13 | 69 | 331 | 425 |

Un contacto de más de 425 bytes no entra: la página avisa y pide acortar la nota o la dirección. Como el texto va en UTF-8, cada letra con tilde ocupa dos bytes.

#### 6.1 El enlace y su tamaño en un tag NFC

El enlace es la dirección de `contacto.html` seguida de `#` y un fragmento que lleva los datos. El fragmento empieza con un carácter de versión:

- `1`: los datos en JSON, pasados a base64url, la variante de base64 que solo usa letras, números, `-` y `_` y por eso no necesita escapes en una URL (RFC 4648).
- `2`: el mismo JSON comprimido con DEFLATE (RFC 1951) mediante la API `CompressionStream` del navegador (WHATWG, s. f.), y después pasado a base64url.

El JSON es una lista sin nombres de campo, `["papel","Ana","Torres",…]`, y los campos vacíos del final se omiten. La página prueba las dos versiones y se queda con la más corta.

La parte de una URL que va después del `#` la usa solo el navegador: no viaja al servidor cuando se pide la página (RFC 3986, sección 3.5). Por eso GitHub Pages, que sirve `contacto.html`, nunca recibe los datos. Pero el enlace no está cifrado: cualquiera que lo tenga puede leerlos, igual que con una tarjeta de papel.

Un tag NFC guarda el enlace como un mensaje NDEF con un registro de tipo URI. Los bytes que ocupa salen de sumar sus partes:

- **Contenido del registro:** un byte de prefijo más el resto de la URL en UTF-8. El prefijo abrevia el comienzo: `https://` se guarda como el código 0x04, y `https://www.` como 0x02.
- **Registro:** una cabecera de 1 byte, 1 byte para el largo del tipo, el largo del contenido (1 byte si el contenido mide hasta 255 bytes, si no 4), el tipo `U` (1 byte) y el contenido.
- **Envoltorio TLV:** 1 byte de etiqueta (0x03), el largo del registro (1 byte si mide menos de 255, si no 3), el registro y un byte final de cierre (0xFE).

Para el enlace del ejemplo, de 263 caracteres, el resto después de `https://` mide 255 bytes. El contenido mide entonces 256 bytes y pasa a necesitar 4 bytes de largo: el registro mide 1 + 1 + 4 + 1 + 256 = 263 bytes. El TLV mide 1 + 3 + 263 = 267, y con el byte de cierre quedan **268 bytes**.

Las memorias de usuario de los tags NTAG de NXP son de 144 bytes (NTAG213), 504 (NTAG215) y 888 (NTAG216). Los tests verifican la cuenta exacta para un enlace corto y uno largo, y que el enlace del ejemplo entra en un NTAG216.

| Caso | Contacto (.vcf) | Enlace | En el tag | NTAG213 | NTAG215 | NTAG216 |
|---|---|---|---|---|---|---|
| Solo nombre y teléfono | 88 bytes | 115 caracteres | 115 bytes | Entra | Entra | Entra |
| Con tildes y ñ, sin teléfono ni web | 238 bytes | 240 caracteres | 240 bytes | No | Entra | Entra |
| Ejemplo de Ana Torres | 298 bytes | 263 caracteres | 268 bytes | No | Entra | Entra |
| Todos los campos al largo máximo, con letras al azar | No entra en el QR | 938 a 944 caracteres | 943 a 949 bytes | No | No | No |

El último caso se midió con 20 conjuntos de letras al azar que pasan la validación. Aunque se comprima, un texto al azar casi no se achica, y el enlace no entra ni en un NTAG216. La página lo muestra con las etiquetas de cada tag; la solución es acortar la nota o la dirección. Los datos reales, con palabras y números repetidos, se comprimen mucho mejor.

### 7. Verificar los QR con un lector real

Los tests no pueden leer imágenes, así que el repositorio incluye una verificación aparte, para macOS. Genera PNG con el codificador y los decodifica con el detector de QR del sistema (CoreImage):

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

Prueba las versiones 1 a 13 en M y L al máximo de su capacidad, las 8 máscaras, texto con tildes y la tarjeta de ejemplo: **36 de 36** se decodifican correctamente. Es la prueba más fuerte de que el codificador cumple el estándar: un lector independiente, escrito por otra empresa, lee lo que el codificador escribe.

La segunda verificación usa la tarjeta entera, con fondo, recuadro y texto, y no solo el código. Dibuja tres contactos (el ejemplo, uno corto y uno con tildes y ñ) en las cinco plantillas con Chrome sin ventana y decodifica cada captura:

```bash
node tools/verificar-qr/tarjetas.js /tmp/qr-tarjetas
```

```bash
/tmp/decodificar-qr /tmp/qr-tarjetas/*.png > /tmp/qr-tarjetas/resultado.tsv
```

```bash
node tools/verificar-qr/comparar.js /tmp/qr-tarjetas/esperado.json /tmp/qr-tarjetas/resultado.tsv
```

Resultado: **15 de 15**. Esto comprueba que el recuadro y la zona silenciosa aíslan el código del fondo en todas las plantillas, incluso en las oscuras.

### 8. Cómo leer los resultados

- **Versión:** cuanto más alta, más módulos y más denso el QR. Una versión 13 impresa muy chica cuesta escanearla.
- **Corrección M:** el QR puede perder hasta un 15 % de sus datos (por una mancha, un pliegue, un logo encima) y seguir leyéndose. Con L, hasta un 7 %.
- **Bytes:** el tamaño del contacto codificado. Si está cerca del límite de la versión 13, conviene acortar la nota.
- **Etiquetas de los tags:** en qué stickers NFC entra tu enlace. Si no entra en ninguno, acortá la nota o la dirección.

#### 8.1 Preguntas frecuentes

**¿Por qué la nota no aparece en la imagen?** Para que la tarjeta visual sea limpia. La nota (horarios, aclaraciones) va solo en el contacto, y por lo tanto en el QR y en el enlace.

**¿Mis datos se mandan a algún servidor?** No. Todo se genera en el navegador, y la página no tiene servidor ni analítica. El enlace tampoco los manda: van después del `#`, y esa parte no viaja al servidor.

**¿Por qué la foto no va en el QR ni en el enlace?** Porque no entra. Una foto de 320 px ocupa miles de bytes, el QR más grande que usa la herramienta admite 425 y un NTAG216 guarda 888. La foto va en la imagen y en el .vcf.

**¿Puedo acercar mi iPhone al de otra persona, como con NameDrop?** No desde una página web: NameDrop es una función del sistema, y ni las páginas ni las apps de terceros pueden usarla. Lo más parecido que sí funciona es un sticker NFC con tu enlace: cualquier iPhone desde el XS y los Android con NFC lo leen al acercarlo, sin instalar nada (ver la sección 19).

**¿AirDrop manda también el contacto?** Si el navegador acepta los dos archivos, la hoja de compartir lleva la imagen y el .vcf juntos. Qué hace con ellos el equipo que los recibe depende de su sistema.

**¿A qué tamaño hay que imprimir el QR?** Una regla práctica de la industria es que el lado del QR sea al menos una décima parte de la distancia de lectura, y que cada módulo no sea menor que unos 0,3 mm. Un QR versión 13 (69 módulos más 8 de margen) necesita entonces unos 2,3 cm de lado como mínimo. En la tarjeta de 1050 × 600 píxeles a 300 ppp, el QR ocupa bastante más que eso.

**¿Funciona con iPhone y Android?** Sí. Las cámaras de iOS (desde la versión 11) y de la mayoría de los Android reconocen QR con vCard sin apps adicionales.

**¿Por qué el QR lleva el contacto y no el enlace, si ocupan casi lo mismo?** Porque así la tarjeta impresa funciona sin internet, sin servidor y para siempre, aunque la demo deje de existir. El enlace es para los canales donde un QR no sirve: un mensaje, un correo o un sticker NFC. El costo del QR con el contacto adentro es que, si cambian los datos, hay que hacer una tarjeta nueva. La sección 15.6 discute el equilibrio.

#### 8.2 Recorrido guiado

1. **Empezá vacío.** Apretá "Limpiar" y escribí solo tu nombre. Mirá la línea debajo de la vista previa: una versión chica, pocos bytes.
2. **Agregá campos de a uno.** Teléfono, email, web. Mirá cómo sube la versión del QR y cómo se vuelve más denso el dibujo.
3. **Escribí un teléfono con letras** y salí del campo. Leé el mensaje de error y probá pasar al paso 2: la página te devuelve al campo.
4. **Escribí una nota larga.** Mirá en qué momento la corrección pasa de M a L, y en qué momento la página avisa que no entra.
5. **Probá tildes.** Escribí la misma nota con y sin tildes y compará los bytes: cada letra con tilde suma uno.
6. **Recorré las plantillas.** Fijate que el QR sigue negro sobre blanco, con su recuadro y «Escaneame», en las cinco.
7. **Mirá el enlace en el paso 3.** Anotá cuántos bytes ocupa en un tag, volvé al paso 1, alargá la nota y fijate cuándo deja de entrar en un NTAG215.
8. **Descargá la imagen y escaneala desde otra pantalla.** Después, guardala en la galería del teléfono y probá si la galería reconoce el QR dentro de la foto.
9. **Abrí el .vcf** con un editor de texto y buscá las comas escapadas.

### 9. Limitaciones

- **NameDrop no.** Ninguna página web ni app de terceros puede usar el "acercar los teléfonos" de Apple.
- **Web NFC solo en Chrome para Android** (desde la versión 89). En iPhone, una página web no puede leer ni escribir NFC; el sticker se graba con una app como NFC Tools.
- **El enlace no está cifrado.** Quien lo tiene, ve los datos. Si cambiás tus datos, el enlace cambia y hay que volver a grabar el sticker.
- **Un enlace con muchos datos no entra en ningún tag**, aunque esté comprimido. La página muestra en qué tags entra.
- **La foto o el logo** van en la imagen y en el .vcf, pero no en el QR ni en el enlace.
- **Compartir archivos depende del navegador.** Cada navegador decide qué tipos de archivo deja compartir. Si no acepta el .vcf, la página comparte solo la imagen; si no comparte archivos, quedan las descargas.
- **Sin prueba en equipos de Apple ni con un tag real.** La hoja de compartir con AirDrop y «Agregar contacto» en iPhone no se probaron en Safari ni en un iPhone: el equipo de desarrollo no tenía el simulador de iOS. La grabación con Web NFC tampoco se probó con un sticker.
- **El QR llega hasta la versión 13:** un contacto de más de 425 bytes no entra.
- **Con todos los campos completos, el QR es denso** (versión 13): impreso muy chico, puede costar escanearlo.
- **No es un producto.** Apple ya resuelve parte de esto con NameDrop, y hay apps establecidas (Popl, Blinq, HiHello). El doble guardado es una función, no un producto.

## Parte II. Guía de la idea

### 10. La idea: dos formatos para un mismo contacto

La idea original era una app para intercambiar tarjetas de presentación digitales. Al pensarla, surgieron dos observaciones que la herramienta toma como centro:

1. **El problema que decide todo es que el otro no tenga la app.** Una app de tarjetas que solo funciona entre usuarios de la misma app sirve de poco en el primer encuentro con alguien.
2. **La gente recuerda cómo se veía una tarjeta, no el nombre.** Guardar solo el contacto ordenado pierde la pista visual que más ayuda a recordar.

La herramienta responde a las dos sin escribir una app: un QR con el contacto adentro funciona en cualquier teléfono, y la imagen de la tarjeta con ese QR va a la galería, donde además sirve para volver a importar el contacto. Esta guía explica cómo funciona cada pieza y por qué las dos observaciones tienen fundamento.

### 11. Las tarjetas de visita: una historia corta

Las tarjetas de visita aparecieron en la corte francesa del siglo XVII: los visitantes dejaban una tarjeta con su nombre para anunciarse. En el siglo XIX se volvieron un ritual de la burguesía europea, con reglas detalladas sobre cuándo dejarlas, doblarlas o devolverlas. En 1854, el fotógrafo André-Adolphe-Eugène Disdéri patentó en París la **carte de visite** fotográfica, un retrato pequeño montado en cartón, que desató una moda de coleccionar retratos de personas conocidas. La tarjeta se volvió, por primera vez, una imagen.

En el siglo XX, la tarjeta de presentación comercial se estandarizó en tamaño (en América, 3,5 × 2 pulgadas; en Europa, 85 × 55 mm) y se volvió una herramienta de negocios. En Japón, el **meishi** tiene una etiqueta propia: se entrega con las dos manos, se lee con atención y se guarda con cuidado, porque representa a la persona. En 1956, Arnold Neustadter lanzó el **Rolodex**, un fichero giratorio para guardar tarjetas que se convirtió en sinónimo de "red de contactos".

La idea de la herramienta conserva los dos componentes que la tarjeta tuvo desde Disdéri: el dato y la imagen.

### 12. Por qué recordamos caras y no nombres

#### 12.1 La superioridad de las imágenes

En 1967, Roger Shepard mostró a personas cientos de palabras, oraciones o imágenes, y después les pidió reconocer cuáles habían visto (*Journal of Verbal Learning and Verbal Behavior*, 6, 156–163). El reconocimiento de imágenes fue casi perfecto, muy superior al de palabras. En 1973, Lionel Standing llevó la prueba al extremo: mostró **10 000** imágenes, cada una durante unos segundos, y los participantes reconocieron después la gran mayoría (*Quarterly Journal of Experimental Psychology*, 25, 207–222). La memoria para imágenes tiene una capacidad enorme.

Allan Paivio propuso una explicación en *Imagery and Verbal Processes* (1971): la **teoría de la codificación dual**. La información se guarda en dos sistemas, uno verbal y otro de imágenes, y lo que se codifica en los dos se recuerda mejor que lo que se codifica en uno solo. Una tarjeta guardada como contacto (verbal) y como imagen (visual) tiene dos vías de recuperación.

#### 12.2 La paradoja Baker-baker

¿Por qué los nombres se olvidan tanto? En 1987, Kathryn McWeeny, Andrew Young, Dennis Hay y Andrew Ellis hicieron un experimento elegante (*British Journal of Psychology*, 78, 143–149). Mostraron caras con una etiqueta: a unos participantes les decían que la persona se llamaba Baker (un apellido inglés común), y a otros que era *baker* (panadero). Después, ante la misma cara, los participantes recordaban mucho mejor la profesión que el apellido, aunque la palabra era idéntica. La razón es que "panadero" activa una red de asociaciones (pan, harina, delantal, horno), mientras que el apellido Baker es una etiqueta arbitraria sin conexiones. Es la **paradoja Baker-baker**.

Las tarjetas de presentación tienen exactamente ese problema: el nombre es lo más importante y lo más fácil de olvidar. La profesión ("odontóloga"), el diseño de la tarjeta y el lugar donde se conoció a la persona son más memorables. Guardar la imagen de la tarjeta conserva esas pistas.

#### 12.3 Recordar por contexto

Endel Tulving y Donald Thomson formularon en 1973 el **principio de especificidad de la codificación** (*Psychological Review*, 80, 352–373): un recuerdo se recupera mejor cuando las pistas presentes al recordar coinciden con las que estaban presentes al aprender. Buscar "la odontóloga de la tarjeta terracota del congreso" en la galería de fotos (que además guarda fecha y lugar) puede funcionar cuando buscar por nombre en los contactos falla. La galería del teléfono es, sin proponérselo, un sistema de recuperación por contexto.

### 13. El problema de que el otro no tenga la app

#### 13.1 Externalidades de red

Michael Katz y Carl Shapiro formalizaron en 1985 la idea de **externalidad de red** (*American Economic Review*, 75, 424–440): el valor de ciertos productos para un usuario depende de cuántos otros lo usan. Un teléfono sirve si otros tienen teléfono; una app de mensajería, si tus contactos la usan. Este tipo de productos enfrenta el problema del **huevo y la gallina**: nadie lo adopta porque nadie lo usa.

Las apps de tarjetas digitales tienen una externalidad de red extrema: la tarjeta digital solo sirve si quien la recibe puede abrirla. Por eso muchas de esas apps terminan generando, como respaldo, un enlace web o un QR que se abre sin la app. La herramienta empieza directamente por el respaldo.

#### 13.2 Estándares abiertos

La solución clásica al problema del huevo y la gallina es usar un **estándar abierto** que ya esté instalado en todos lados. El QR (un estándar ISO) y la vCard (un estándar de internet) están en todos los teléfonos modernos sin que nadie tenga que instalar nada. Las cámaras de iOS leen QR desde 2017 y la mayoría de los Android, desde antes, con apps preinstaladas. Usar estándares en vez de un formato propio convierte un problema de red en un problema resuelto.

### 14. De los códigos de barras al QR

#### 14.1 Woodland, Silver y el código de barras

En 1948, Bernard Silver, estudiante del Instituto Drexel de Filadelfia, escuchó a un ejecutivo de supermercados pedir una manera de leer automáticamente los productos en la caja. Con su compañero Norman Joseph Woodland diseñó un código de círculos concéntricos (inspirado, según contó Woodland, en el código Morse estirado en la arena de una playa) y lo patentaron en 1952 (patente estadounidense 2 612 994). La tecnología para leerlo no existía todavía. Recién en 1973, George Laurer, en IBM, diseñó el **UPC**, el código de barras rectangular que se leyó por primera vez en una caja de supermercado en Ohio en 1974, sobre un paquete de chicles.

Un código de barras guarda pocos datos (12 dígitos en el UPC) en una sola dimensión.

#### 14.2 Hara y Denso Wave, 1994

En los años noventa, la industria automotriz japonesa necesitaba etiquetar piezas con mucha más información que la que cabe en un código de barras. Masahiro Hara, ingeniero de Denso Wave (una filial del grupo Toyota), lideró el desarrollo de un código **bidimensional** que se presentó en 1994: el **QR**, por *Quick Response*, respuesta rápida. Hara contó que la idea de los patrones de búsqueda (los tres cuadrados de las esquinas) se le ocurrió jugando al go, y que eligió la proporción 1:1:3:1:1 de esos cuadrados después de analizar miles de impresos para encontrar la que menos aparecía en textos e imágenes, de modo que el lector no la confundiera con otra cosa.

Denso Wave patentó el QR pero decidió no ejercer la patente, lo que permitió su adopción masiva. El código se estandarizó como ISO/IEC 18004 en 2000, con revisiones en 2006, 2015 y 2024. Hoy está en todas partes: pagos, menús, entradas, vacunas.

### 15. La anatomía de un QR

#### 15.1 Los patrones fijos

Un QR versión v tiene 17 + 4v módulos por lado: 21 para la versión 1, 69 para la 13. Algunos módulos son fijos y sirven para que el lector encuentre y oriente el código:

- **Patrones de búsqueda:** los tres cuadrados de 7 × 7 en las esquinas, con la proporción 1:1:3:1:1 en cualquier dirección. Uno de los tests de la herramienta verifica que la matriz los tiene.
- **Separadores:** una franja blanca alrededor de cada patrón de búsqueda.
- **Patrones de sincronización:** una fila y una columna de módulos alternados negro-blanco entre los patrones de búsqueda, que le dicen al lector dónde está cada columna y cada fila.
- **Patrones de alineación:** cuadrados de 5 × 5 repartidos por el código (desde la versión 2), que corrigen la distorsión cuando el QR se fotografía inclinado o sobre una superficie curva.
- **Módulo oscuro:** un módulo siempre negro junto al patrón de búsqueda inferior.
- **Información de formato:** 15 bits, repetidos dos veces, que dicen el nivel de corrección y la máscara usada.
- **Información de versión:** 18 bits, repetidos dos veces, desde la versión 7.

#### 15.2 Los datos

El texto se codifica en **modo byte**: cada carácter UTF-8 ocupa 8 bits. Antes de los datos van 4 bits que indican el modo (0100 para byte) y un contador de longitud (8 bits en versiones 1 a 9, 16 bits en 10 a 40). Después van un terminador de ceros y bytes de relleno alternados (11101100 y 00010001) hasta completar la capacidad. Esa secuencia de bytes son las **palabras de datos** (*codewords*).

#### 15.3 La corrección de errores

A las palabras de datos se agregan **palabras de corrección** calculadas con un código de **Reed-Solomon** (sección 16). Hay cuatro niveles:

| Nivel | Recuperación aproximada |
|---|---|
| L | 7 % |
| M | 15 % |
| Q | 25 % |
| H | 30 % |

La herramienta usa M y, si no entra, L. Con M, una tarjeta con una mancha, un doblez o un reflejo de luz sobre parte del QR sigue leyéndose.

#### 15.4 Bloques y entrelazado

En las versiones grandes, los datos se dividen en varios **bloques**, cada uno con su propia corrección, y después se **entrelazan**: el primer byte del bloque 1, el primero del bloque 2, el primero del bloque 3, y así. El objetivo es que un daño localizado (una mancha que tapa una zona) se reparta entre varios bloques en vez de destruir uno entero. Es la misma idea que se usa en los discos compactos. La herramienta tiene la tabla de bloques de todas las versiones de la 1 a la 13, y un test verifica que es consistente con el total de palabras.

#### 15.5 Las máscaras

Si los datos producen por casualidad patrones que confunden al lector (grandes áreas de un solo color, o algo parecido a un patrón de búsqueda en medio del código), la lectura falla. Para evitarlo, el estándar define **ocho máscaras**: patrones regulares que se combinan con los datos con un "o exclusivo". El codificador prueba las ocho, calcula para cada una una **penalización** según cuatro reglas (filas o columnas de cinco o más módulos del mismo color, bloques de 2 × 2 del mismo color, secuencias parecidas a la proporción 1:1:3:1:1 y desequilibrio entre negro y blanco) y elige la de menor penalización. En el ejemplo de Ana Torres, la elegida es la máscara 2.

#### 15.6 Lo que un QR puede y no puede contener

Un QR no es un enlace ni un contacto: es una secuencia de bytes. Lo que el teléfono hace al leerlo depende de cómo empiezan esos bytes. Si empiezan con `http://` o `https://`, ofrece abrir un sitio; si con `BEGIN:VCARD`, agregar un contacto; si con `WIFI:`, conectarse a una red; si con `mailto:` o `tel:`, escribir un correo o llamar. La herramienta pone el contacto completo adentro del QR, en vez de un enlace a una página con el contacto. Esa decisión tiene ventajas y costos:

- **Ventaja: funciona sin internet y para siempre.** No depende de que un servidor siga funcionando dentro de diez años. Una tarjeta impresa hoy se va a seguir leyendo mientras existan lectores de QR.
- **Ventaja: no hay intermediarios.** Nadie registra quién escaneó la tarjeta, a diferencia de los QR que apuntan a un servicio con estadísticas.
- **Costo: no se puede actualizar.** Si cambia el teléfono, hay que hacer una tarjeta nueva. Un QR con un enlace podría apuntar a una página que se actualiza.
- **Costo: el tamaño.** Un enlace corto entra en un QR versión 2 o 3, mucho más fácil de leer impreso chico que una versión 13.

La herramienta suma un enlace propio (sección 6.1), pero no lo pone en el QR. Ese enlace lleva los datos adentro, así que no es corto: el del ejemplo tiene 263 caracteres, casi lo mismo que la vCard. Tampoco se puede actualizar, porque si cambian los datos cambia el enlace. Ponerlo en el QR solo agregaría la dependencia de un servidor. Su lugar está en otros canales: un mensaje, un correo o un sticker NFC.

El mismo mecanismo explica un riesgo que creció con la popularidad de los QR: el **quishing**, o *phishing* por QR. Un QR pegado encima del original en un parquímetro o un menú puede llevar a un sitio falso que pide datos de pago. Como el contenido de un QR no se puede leer a simple vista, los organismos de ciberseguridad recomiendan mirar siempre la dirección que el teléfono muestra antes de abrirla. Un QR que contiene directamente una vCard tiene un riesgo mucho menor, porque no abre ningún sitio: solo propone agregar un contacto, que el usuario puede revisar antes de guardar.

### 16. Corregir errores: Shannon, Hamming, Reed y Solomon

#### 16.1 Shannon, 1948

En 1948, Claude Shannon publicó *A mathematical theory of communication* (*Bell System Technical Journal*, 27, 379–423 y 623–656), el artículo fundacional de la teoría de la información. Uno de sus resultados más sorprendentes es el **teorema de codificación para canales con ruido**: en cualquier canal con ruido existe una capacidad máxima, y por debajo de esa capacidad es posible transmitir información con una probabilidad de error tan chica como se quiera, agregando redundancia de la manera adecuada. Shannon demostró que esos códigos existen, pero no dijo cómo construirlos.

#### 16.2 Hamming, 1950

Richard Hamming, en los Laboratorios Bell, estaba cansado de que las computadoras de relés se detuvieran por errores en las tarjetas perforadas durante los fines de semana. En 1950 publicó *Error detecting and error correcting codes* (*Bell System Technical Journal*, 29, 147–160), con el primer código práctico que **corrige** errores, no solo los detecta: el código de Hamming (7, 4), que agrega tres bits de paridad a cada cuatro bits de datos y puede corregir cualquier error de un bit.

#### 16.3 Reed y Solomon, 1960

Irving Reed y Gustave Solomon, en el Laboratorio Lincoln del MIT, publicaron en 1960 un artículo de cinco páginas titulado *Polynomial codes over certain finite fields* (*Journal of the Society for Industrial and Applied Mathematics*, 8, 300–304). Su idea: tratar los datos como los coeficientes de un polinomio y transmitir el polinomio evaluado en más puntos de los necesarios. Como un polinomio de grado k − 1 queda determinado por k puntos, si se mandan n > k puntos y algunos se pierden o se corrompen, se puede reconstruir el polinomio con los que quedan. Un código Reed-Solomon con n − k símbolos de redundancia corrige hasta (n − k)/2 símbolos erróneos.

Los códigos Reed-Solomon tienen una ventaja que los hace ideales para el QR: corrigen **símbolos** completos (bytes), no bits sueltos. Una mancha que destruye ocho bits seguidos daña un solo byte, que cuenta como un solo error. Por eso se usan en los CD (desde 1982), los DVD, las comunicaciones de las sondas Voyager, la televisión digital y los QR. Elwyn Berlekamp desarrolló en 1968 un algoritmo eficiente de decodificación, en *Algebraic Coding Theory*, que hizo práctico su uso.

#### 16.4 La cuenta, en la herramienta

El QR no usa los números reales sino un **cuerpo finito** de 256 elementos, GF(2⁸): los bytes de 0 a 255, con una suma y una multiplicación especiales en las que todo resultado vuelve a ser un byte. Estos cuerpos se llaman **cuerpos de Galois** en honor a Évariste Galois, el matemático francés que, antes de morir en un duelo en 1832 a los veinte años, sentó las bases de la teoría de grupos y de los cuerpos finitos.

En GF(2⁸):

- La **suma** es el "o exclusivo" bit a bit: 1 + 1 = 0, así que sumar y restar es lo mismo.
- La **multiplicación** se hace como polinomios con coeficientes 0 o 1, reduciendo módulo el polinomio x⁸ + x⁴ + x³ + x² + 1 (285 en decimal), que el estándar QR fija.

Las palabras de corrección son el **resto** de dividir el polinomio de datos (multiplicado por x elevado al número de palabras de corrección) por un **polinomio generador**:

$$ g(x) = (x − α⁰)(x − α¹)(x − α²) … (x − α^(n−k−1)) $$

donde α es un elemento generador del cuerpo (el 2). Las funciones `mult`, `divisor` y `resto` de `src/qr.js` implementan exactamente esto. Uno de los tests verifica el resultado con el ejemplo clásico de la documentación del QR, "HELLO WORLD" en versión 1-M, cuyas palabras de corrección son conocidas.

#### 16.5 Un QR a mano: "Hola" en versión 1-M

Para ver todas las piezas juntas, sigamos lo que hace el codificador con el texto "Hola" (4 bytes) en la versión más chica, 1-M. Esa versión tiene 26 palabras en total: 16 de datos y 10 de corrección, en un solo bloque.

**Paso 1: los bits de datos.**

- Modo byte: `0100`.
- Longitud, 4, en 8 bits: `00000100`.
- Los cuatro bytes de "Hola" en UTF-8: H = 0x48, o = 0x6F, l = 0x6C, a = 0x61.
- Terminador: `0000`.

Concatenados y agrupados de a 8 bits, dan las primeras seis palabras: `40 44 86 F6 C6 10` en hexadecimal. (Los bits del modo y la longitud quedan desfasados medio byte respecto de los datos, por eso las letras no se ven tal cual.)

**Paso 2: el relleno.** Faltan 10 palabras para llegar a 16. Se completan alternando `EC` y `11`: `EC 11 EC 11 EC 11 EC 11 EC 11`.

**Paso 3: la corrección.** Las 16 palabras de datos se tratan como los coeficientes de un polinomio sobre GF(256), se multiplican por x¹⁰ y se dividen por el polinomio generador de grado 10. El resto, calculado por la función `resto` del código, son las 10 palabras de corrección: `37 68 56 2D E9 DC 9D 02 80 51`.

**Paso 4: la matriz.** Las 26 palabras (208 bits) se colocan en la matriz de 21 × 21 en zigzag, de abajo hacia arriba y de derecha a izquierda, de a dos columnas, esquivando los patrones fijos. Después se prueban las ocho máscaras, se elige la de menor penalización y se escriben la información de formato y el módulo oscuro.

Si se tapara una zona del QR que destruyera hasta 5 de esas 26 palabras, el decodificador podría reconstruirlas a partir de las demás: 10 palabras de corrección corrigen hasta 10/2 = 5 palabras erróneas. Eso es, en bytes, lo que significa "corrección M".

#### 16.6 Formato y versión: otros dos códigos

La información de formato (nivel y máscara, 5 bits) se protege con un código BCH (15, 5), que agrega 10 bits de redundancia y corrige hasta 3 errores, y después se combina con una máscara fija para que nunca sea todo ceros. La información de versión (6 bits) usa un código BCH (18, 6). Los códigos BCH, por Raj Chandra Bose, Dwijendra Kumar Ray-Chaudhuri y Alexis Hocquenghem (1959–1960), son primos de los Reed-Solomon. Un QR tiene, así, tres capas de corrección de errores distintas.

### 17. El contacto: vCard

#### 17.1 Historia del estándar

La **vCard** nació en 1995 en el consorcio Versit, formado por Apple, AT&T, IBM y Siemens, como un formato común para intercambiar tarjetas de presentación electrónicas. En 1998, la IETF la publicó como estándar de internet en la versión 3.0: Frank Dawson y Tim Howes escribieron la RFC 2426 (el perfil vCard) sobre la RFC 2425 de Howes, Mark Smith y Dawson (el formato de directorio MIME). En 2011, Simon Perreault publicó la versión 4.0 en la RFC 6350. La herramienta usa la 3.0, que es la más compatible: la leen todos los sistemas de contactos actuales.

#### 17.2 Las reglas que respeta la herramienta

- **Fin de línea CRLF:** cada línea termina con retorno de carro y salto de línea (los caracteres 13 y 10), como en los protocolos de internet.
- **Escapes:** las comas, los punto y coma y las barras invertidas dentro de un valor se escapan con una barra invertida, y los saltos de línea como `\n`. Por eso la dirección queda `Av. Siempreviva 742\, CABA`: sin el escape, la coma se interpretaría como separador de componentes.
- **Plegado de líneas:** ninguna línea puede tener más de 75 bytes. Las más largas se pliegan: se cortan y la continuación empieza con un espacio. Al leer, el espacio inicial indica que hay que unir. La herramienta pliega por bytes, sin partir un carácter UTF-8 a la mitad.
- **Campos estructurados:** N (nombre) tiene cinco componentes separados por punto y coma (apellido, nombre, otros nombres, prefijo, sufijo); ADR (dirección), siete.

Uno de los tests verifica que lo generado se puede volver a leer igual (la función `leer` invierte a `generar`), y otro que las líneas largas se pliegan a 75 bytes y se recuperan.

#### 17.3 UTF-8

Los caracteres con tilde, la ñ y cualquier otro carácter fuera del inglés básico se codifican en **UTF-8**, la codificación que Ken Thompson y Rob Pike diseñaron en una servilleta de un restaurante de Nueva Jersey en septiembre de 1992, para el sistema operativo Plan 9. UTF-8 representa cada carácter Unicode con uno a cuatro bytes, y tiene la propiedad de que todo texto ASCII es también UTF-8 válido. François Yergeau la formalizó en la RFC 3629 (2003). Hoy la usa más del 98 % de las páginas web. En el ejemplo, "Odontóloga" ocupa 11 bytes en vez de 10, por la ó.

#### 17.4 Por qué no vCard 4.0

La versión 4.0 de vCard (RFC 6350, 2011) es más moderna: exige UTF-8, agrega campos como el género y el aniversario, admite varias representaciones del mismo dato con preferencias y define mejor los tipos de teléfono. ¿Por qué la herramienta usa la 3.0?

Por compatibilidad. La 3.0 la leen todos los sistemas de contactos en uso: iOS, Android, macOS, Windows, Outlook, Gmail. El soporte de la 4.0 es más irregular, sobre todo en lectores de QR y en versiones viejas de los sistemas. Para una tarjeta que tiene que funcionar en cualquier teléfono, la regla de los estándares es la misma que la de las redes: conviene el formato que **ya está** en todos lados, aunque haya uno mejor. Es una decisión que se puede revisar cuando la 4.0 esté igual de difundida, y el cambio sería chico: la estructura de las líneas, los escapes y el plegado son casi iguales en las dos versiones.

### 18. La imagen

La función de dibujo (`src/dibujo.js`) arma la tarjeta en un `<canvas>` de 1050 × 600 píxeles: el tamaño de una tarjeta de 3,5 × 2 pulgadas a 300 píxeles por pulgada, la resolución estándar de impresión. Arriba a la izquierda va la foto o el logo, si hay uno; después, el nombre, la profesión, la empresa y los datos de contacto. Los textos largos achican la letra para entrar (el nombre baja de 58 a 38 píxeles) y, si aun así no entran, se cortan con puntos suspensivos. A la derecha va el QR en su recuadro blanco, con cuatro módulos de zona silenciosa y la etiqueta «Escaneame» (sección 4.1).

La zona silenciosa es obligatoria según el estándar: sin ella, el lector no distingue dónde termina el código y empieza el fondo. Por eso, aunque la plantilla sea oscura, como Grafito u Océano, el QR siempre se dibuja negro sobre blanco. Los lectores modernos pueden leer QR invertidos (blanco sobre negro), pero no todos, y la herramienta prioriza que funcione en cualquier teléfono.

### 19. NFC y NameDrop: lo que se puede hacer desde una página web

Una alternativa al QR es el **NFC** (comunicación de campo cercano), la tecnología de los pagos sin contacto: dos dispositivos a pocos centímetros intercambian datos por inducción magnética, según las normas ISO/IEC 14443 y 18092. Una tarjeta con un tag NFC puede guardar un enlace o una vCard que el teléfono lee al acercarlo.

En iPhone, Apple lanzó en 2023 **NameDrop**, que intercambia contactos acercando dos iPhone, pero no ofrece una interfaz para que una página o una app de terceros lo use. Las apps nativas pueden leer y escribir tags con Core NFC; una página web abierta en Safari no tiene acceso al NFC. Lo que sí hace cualquier iPhone desde el XS es la **lectura en segundo plano**: al acercarlo a un tag que guarda un enlace, muestra un aviso para abrirlo, sin ninguna app abierta (Apple, s. f.). En Android, con la pantalla desbloqueada, el sistema lee el tag y abre el enlace con la app que lo maneja (Android Developers, s. f.).

En Android, Chrome implementa desde la versión 89 **Web NFC**, que deja a una página leer y escribir mensajes NDEF en un tag (Beaufort, s. f.; W3C Web NFC Community Group, s. f.). La especificación todavía es un borrador de un grupo comunitario del W3C, y ningún otro navegador la implementa.

Con esas piezas, la herramienta hace lo que sí funciona:

1. **Un enlace propio** con los datos en el fragmento, que abre `contacto.html` con la tarjeta y «Agregar contacto» (sección 6.1). No necesita servidor ni base de datos.
2. **«Grabar en tag NFC»**, visible solo donde existe `NDEFReader`, es decir en Chrome para Android. Escribe un registro de tipo URL con el enlace:

```js
await new NDEFReader().write({ records: [{ recordType: "url", data: enlace }] });
```

3. **Una guía corta para grabar el enlace con NFC Tools**, una app gratuita de wakdev para iPhone y Android: Escribir → Agregar un registro → URL/URI, pegar el enlace, Escribir y acercar el sticker.

Los stickers y tarjetas NFC más comunes usan los chips NTAG213, NTAG215 y NTAG216 de NXP, del tipo 2 del NFC Forum, con 144, 504 y 888 bytes de memoria de usuario (NXP Semiconductors, s. f.). La página calcula cuántos bytes ocupa el enlace grabado y muestra en cuáles entra. El enlace del ejemplo ocupa 268 bytes, así que necesita un NTAG215 o un NTAG216.

### 20. Privacidad: qué poner en una tarjeta

Una tarjeta de presentación es un pequeño paquete de datos personales que se entrega a desconocidos. Con el QR, ese paquete se vuelve además legible por máquinas: cualquiera que fotografíe la tarjeta (incluso de lejos, incluso en una foto publicada en redes) puede importar el contacto completo, nota incluida.

Algunas recomendaciones prácticas:

- **La nota viaja en el QR.** Aunque no se vea en la imagen, la nota está en el contacto y por lo tanto en el código. No conviene poner ahí nada que no se le daría a cualquier persona que reciba la tarjeta.
- **Dirección de trabajo, no personal.** La herramienta marca la dirección como `TYPE=WORK`. Para profesionales independientes que atienden en su casa, conviene pensar si la dirección completa es necesaria o alcanza con el barrio.
- **Teléfono: uno de trabajo, si existe.** Un teléfono en un QR se puede copiar sin errores de tipeo, lo que es una ventaja y un riesgo.
- **Fotos de la tarjeta en redes.** Una imagen de la tarjeta publicada en internet expone el QR. Si se quiere mostrar la tarjeta, conviene usar una versión con datos inventados, como la del ejemplo.

En la Argentina, la Ley 25.326 de Protección de los Datos Personales (2000) regula el tratamiento de datos personales por terceros, y en la Unión Europea lo hace el Reglamento General de Protección de Datos (2016). Para una persona que entrega su propia tarjeta, la cuestión no es legal sino de criterio: los datos se dan voluntariamente, pero una vez dados no se pueden recuperar.

Un punto a favor de la herramienta, desde la privacidad, es que no tiene servidor: los datos no salen del navegador de quien arma la tarjeta. Muchas apps de tarjetas digitales, en cambio, guardan los contactos en sus servidores y pueden usarlos para otros fines, según sus términos de servicio.

### 21. Diseño y accesibilidad de la tarjeta

La imagen de la tarjeta tiene que cumplir dos funciones: ser legible por personas y por máquinas. Para las máquinas, la regla es simple (QR negro sobre blanco con zona silenciosa). Para las personas, hay algunas pautas que vienen del diseño gráfico y de la accesibilidad.

**Contraste.** Las Pautas de Accesibilidad para el Contenido Web (WCAG 2.1, del W3C, 2018) recomiendan una relación de contraste de al menos 4,5:1 entre el texto y el fondo para texto de tamaño normal. Cada una de las cinco plantillas declara el color de su fondo más desfavorable para el texto, y un test verifica contra él el contraste del texto, del texto secundario y del color de acento. Una plantilla nueva que no llegue a 4,5:1 hace fallar los tests.

**Jerarquía.** Robert Bringhurst, en *The Elements of Typographic Style* (1992), insiste en que la tipografía debe hacer visible la estructura del contenido. En una tarjeta, eso quiere decir que el nombre es lo más grande, la profesión lo segundo, y los datos de contacto lo más chico. Es también lo que sugiere la paradoja Baker-baker: la profesión, que es lo que se recuerda, merece un lugar destacado al lado del nombre.

**Tamaño mínimo.** A 300 ppp, un texto de 8 puntos tiene unos 33 píxeles de alto. Por debajo de unos 7 puntos, la lectura en papel se vuelve difícil para muchas personas, sobre todo mayores de 45 años, cuando la presbicia es común.

**Imagen en pantalla.** La imagen va a verse sobre todo en la galería del teléfono, en miniatura. Una tarjeta con mucho texto chico se vuelve ilegible en miniatura; una con el nombre grande y un color distintivo se reconoce de un vistazo. Eso refuerza la función de memoria visual que la idea busca.

### 22. El mercado y el nicho

El README reconoce que el problema ya está parcialmente resuelto: NameDrop para usuarios de iPhone, y apps establecidas como Popl, Blinq o HiHello, que combinan tarjetas digitales, QR, NFC y gestión de contactos. El aporte de la herramienta, el doble guardado (contacto más imagen con QR), es una **función**, no un producto.

Esa honestidad es útil para decidir el próximo paso. La teoría de la difusión de innovaciones de Everett Rogers (*Diffusion of Innovations*, 1962; quinta edición, 2003) identifica cinco atributos que favorecen la adopción: ventaja relativa, compatibilidad, baja complejidad, posibilidad de prueba y visibilidad. La herramienta es fuerte en compatibilidad (estándares abiertos), complejidad (no hay que instalar nada) y prueba (se usa en un minuto). Su ventaja relativa frente a NameDrop o Popl depende del nicho. El proyecto propone explorar profesionales de la salud o congresos, donde la tarjeta impresa todavía es común y el contacto se da a personas con teléfonos de todo tipo.

### 23. Probar con personas

El próximo paso es probarla con diez personas reales y anotar dónde se traban. Jakob Nielsen y Thomas Landauer mostraron en 1993 que los primeros usuarios de una prueba encuentran la mayoría de los problemas de usabilidad: con cinco, cerca del 85 %. Diez personas alcanzan con holgura para un prototipo. Lo que conviene observar:

- **Quien arma la tarjeta:** ¿entiende que la nota no va en la imagen? ¿Encuentra cómo descargar? ¿Le preocupa la privacidad?
- **Quien recibe la imagen:** ¿sabe que puede escanear el QR desde la foto? (La mayoría de las galerías permiten reconocer QR en una imagen guardada, pero no todo el mundo lo sabe.)
- **Quien recibe el .vcf:** ¿se abre directamente en contactos, o queda en descargas?
- **Una semana después:** ¿quien recibió la tarjeta la encuentra? ¿Por nombre, en contactos, o por imagen, en la galería? Esta es la prueba de la segunda observación de la idea.

### 24. Del otro lado: cómo lee un teléfono un QR

La herramienta escribe códigos QR; la verificación de la sección 7 usa un lector ajeno para leerlos. Entender cómo funciona ese lector ayuda a entender por qué el QR tiene la forma que tiene.

#### 24.1 Separar el negro del blanco

Una foto de un QR no tiene módulos negros y blancos sino miles de tonos de gris, con sombras, reflejos y una iluminación despareja. El primer paso del lector es **binarizar**: decidir, para cada píxel, si es oscuro o claro. Un umbral fijo falla con iluminación despareja, así que se usan umbrales que se adaptan. El método clásico es el de Nobuyuki Otsu (*IEEE Transactions on Systems, Man, and Cybernetics*, 9(1), 62–66, 1979): elegir el umbral que mejor separa el histograma de grises en dos grupos, minimizando la variación dentro de cada uno. Los lectores modernos lo aplican por regiones, con un umbral distinto para cada zona de la imagen.

#### 24.2 Encontrar las esquinas

Con la imagen binarizada, el lector recorre las filas buscando la secuencia negro-blanco-negro-blanco-negro en proporción 1:1:3:1:1, la firma de los patrones de búsqueda (sección 15.1). Cuando la encuentra en una fila, verifica que aparezca también en la columna que pasa por el centro y en las diagonales. Como la proporción se mantiene aunque el código esté rotado o visto en diagonal, el lector encuentra las tres esquinas en cualquier orientación. Esa es la razón de la elección de Masahiro Hara: una proporción que casi no aparece por casualidad en textos e imágenes, y que se reconoce desde cualquier ángulo.

#### 24.3 Enderezar la imagen

Con las tres esquinas (y, desde la versión 2, el patrón de alineación de la cuarta), el lector calcula una **transformación proyectiva**: la que lleva el cuadrilátero deformado de la foto a un cuadrado perfecto. Es la misma matemática de la perspectiva de los pintores del Renacimiento, formalizada en la geometría proyectiva. Con esa transformación, el lector calcula dónde cae, en la foto, el centro de cada módulo, y lee su color. Los patrones de sincronización le permiten corregir pequeños errores acumulados en la grilla, y los de alineación, la curvatura de una superficie no plana.

#### 24.4 Corregir los errores

Con los módulos leídos, el lector quita la máscara (que encuentra en la información de formato), reordena las palabras en el orden de los bloques y aplica la decodificación de Reed-Solomon. El paso central es el algoritmo de Berlekamp, que James Massey reformuló en 1969 como un problema de síntesis de registros de desplazamiento (*IEEE Transactions on Information Theory*, 15(1), 122–127): a partir de los **síndromes** (los restos que deberían ser cero si no hubiera errores), encuentra el polinomio que localiza las posiciones erróneas, y después calcula cuánto corregir en cada una. Si hay más errores de los que el código puede corregir, el lector lo detecta y vuelve a intentar con otra foto.

Todo esto ocurre decenas de veces por segundo mientras la cámara del teléfono apunta al código. La experiencia de "apuntar y listo" esconde una cadena de procesamiento de imágenes, geometría proyectiva y álgebra de cuerpos finitos.

#### 24.5 Qué significa para el diseño de la tarjeta

Saber cómo lee el teléfono da criterios concretos para el diseño:

- **Contraste alto y sin degradados detrás del QR.** La binarización por regiones tolera iluminación despareja, pero no un fondo que cambia de tono dentro del código. Por eso el recuadro blanco.
- **La zona silenciosa es para encontrar las esquinas.** Sin margen claro, la secuencia 1:1:3:1:1 se confunde con el entorno y el lector no encuentra los patrones de búsqueda.
- **Las esquinas no se tapan.** La corrección de errores protege los datos, no los patrones de búsqueda. Un logo encima del centro puede funcionar; uno encima de una esquina, no.
- **Imprimir sobre papel mate.** Un brillo sobre el código produce una zona blanca que el lector interpreta como módulos claros: errores que la corrección M puede absorber hasta cierto punto.

### 25. Del modelo al código

| Concepto | Función | Archivo |
|---|---|---|
| Campos del contacto | `CAMPOS` | `src/vcard.js` |
| Escapes de vCard | `escapar` | `src/vcard.js` |
| Plegado a 75 bytes | `plegar` | `src/vcard.js` |
| Generar y leer vCard | `generar`, `leer` | `src/vcard.js` |
| Nombre del archivo | `nombreArchivo` | `src/vcard.js` |
| Tabla de versiones y bloques | `TABLA`, `bloques` | `src/qr.js` |
| Capacidad en bytes | `capacidadBytes` | `src/qr.js` |
| Aritmética de GF(256) | `mult` | `src/qr.js` |
| Polinomio generador y resto | `divisor`, `resto` | `src/qr.js` |
| Palabras con corrección y entrelazado | `codewords` | `src/qr.js` |
| Codificador completo (versión, máscara, matriz) | `codificar` | `src/qr.js` |
| Foto en la vCard | `generar(datos, { foto })` | `src/vcard.js` |
| Plantillas, grano y manchas de color | `LISTA`, `porId`, `grano`, `mancha` | `src/plantillas.js` |
| Recuadro del QR y zona silenciosa | `disposicion` | `src/dibujo.js` |
| Dibujo de la tarjeta | `dibujar` | `src/dibujo.js` |
| Enlace: serializar, comprimir y leer | `serializar`, `codificar`, `decodificar` | `src/enlace.js` |
| Bytes NDEF y tags en los que entra | `bytesNdef`, `tags` | `src/enlace.js` |
| Validación de los campos | `validar`, `normalizarWeb` | `src/validar.js` |
| Página que abre el enlace | — | `src/contacto.js` |
| Compartir, descargas y Web NFC | — | `src/app.js` |

Los tests verifican: el ejemplo clásico de Reed-Solomon "HELLO WORLD" 1-M; que la tabla de bloques es consistente con el total de palabras; que se elige la versión más chica en la que entra el texto; que la matriz tiene los tres patrones de búsqueda; los campos, escapes y fin de línea de la vCard; el plegado a 75 bytes y su recuperación; que lo generado se puede volver a leer igual, y que la tarjeta de ejemplo entra en un QR.

Los tests de las funciones nuevas verifican:

- que hay al menos cuatro plantillas y que todas pasan el contraste AA;
- que el recuadro deja cuatro módulos de silencio en las versiones 1 a 13, con módulos de al menos 5 px;
- que el enlace va y vuelve igual, con y sin compresión, usa solo caracteres seguros y rechaza datos rotos;
- la cuenta exacta de bytes NDEF, y que el enlace del ejemplo entra en un NTAG216;
- la validación de cada campo;
- que la foto va en el .vcf, plegada a 75 bytes, y no en el QR.

```js
const QR = require("./src/qr.js");
const r = QR.codificar("HELLO WORLD");
r.version;              // 1
r.tamano;               // 21
QR.capacidadBytes(13, "M");   // 331

const Enlace = require("./src/enlace.js");
Enlace.bytesNdef("https://a.b/c");   // 13
```

### 26. Ejercicios

1. ¿Cuántos módulos por lado tiene un QR versión 40, la más grande del estándar? (17 + 4v.)
2. El contacto del ejemplo ocupa 298 bytes. ¿Cuántos caracteres de nota se podrían agregar antes de pasar de corrección M a L? ¿Y antes de no entrar en la versión 13?
3. En GF(2⁸) con el polinomio 285, calculá 2 · 128. (Pista: 2 · 128 = 256, que se pasa de 8 bits; restá 285 con "o exclusivo".)
4. Escribí a mano la línea ADR de la vCard para una dirección con punto y coma. ¿Qué hay que escapar?
5. Imprimí la tarjeta de ejemplo en tamaño real y probá a qué distancia la lee tu teléfono. Después tapá con un papel distintas partes del QR: ¿cuánto se puede tapar antes de que deje de leerse?
6. Pedile a alguien que guarde tu tarjeta y, una semana después, que la busque. Anotá si la buscó por nombre o por imagen.
7. Con la cuenta de la sección 6.1, calculá cuántos bytes ocupa en un tag un enlace de 250 caracteres que empieza con `https://`, y uno de 263. ¿Por qué 13 caracteres más suman 18 bytes? (Respuestas: 250 y 268.)
8. Diseñá en papel cómo sería la tarjeta para un nicho concreto (por ejemplo, profesionales de la salud): ¿qué campos agregarías y cuáles sacarías?

### 27. Glosario

- **QR:** código bidimensional estandarizado como ISO/IEC 18004.
- **Módulo:** cada cuadradito de un QR.
- **Versión:** tamaño del QR, de 1 (21 × 21) a 40 (177 × 177).
- **Nivel de corrección:** L, M, Q o H, según cuánto daño tolera.
- **Zona silenciosa:** margen claro de cuatro módulos alrededor del QR.
- **Patrón de búsqueda:** cada uno de los tres cuadrados de las esquinas.
- **Máscara:** patrón que se combina con los datos para evitar configuraciones difíciles de leer.
- **Reed-Solomon:** familia de códigos correctores de errores basados en polinomios sobre cuerpos finitos.
- **Cuerpo de Galois GF(2⁸):** conjunto de 256 elementos con suma y multiplicación cerradas.
- **vCard:** formato estándar para intercambiar datos de contacto.
- **CRLF:** fin de línea con retorno de carro y salto de línea.
- **UTF-8:** codificación de caracteres Unicode de longitud variable.
- **Externalidad de red:** que el valor de un producto dependa de cuántos lo usan.
- **NFC:** comunicación de campo cercano; intercambio de datos por inducción a pocos centímetros.
- **NDEF:** formato de mensajes del NFC Forum; un enlace se guarda como un registro de tipo URI.
- **NTAG213, NTAG215, NTAG216:** chips NFC de NXP con 144, 504 y 888 bytes de memoria de usuario.
- **Fragmento:** la parte de una URL después del `#`; la usa el navegador y no viaja al servidor.
- **base64url:** variante de base64 que solo usa caracteres seguros en una URL.
- **Web Share API:** interfaz del navegador que abre la hoja de compartir del sistema.
- **Web NFC:** interfaz del navegador para leer y escribir tags NFC; solo existe en Chrome para Android.
- **Codificación dual:** teoría según la cual lo que se guarda como palabra y como imagen se recuerda mejor.

### 28. Conclusión

Una tarjeta de presentación con QR parece un objeto trivial, pero reúne tres historias. La primera es matemática: el QR de Masahiro Hara depende de los códigos de Reed y Solomon, que a su vez dependen del teorema de Shannon y de los cuerpos finitos de Galois, y la herramienta implementa todo eso desde cero, verificado con un lector independiente. La segunda es de estándares: vCard, UTF-8 e ISO 18004 hacen que un contacto viaje entre teléfonos de cualquier marca sin instalar nada, que es la única manera de esquivar el problema de la red que hunde a las apps de tarjetas. La tercera es psicológica: como mostraron Shepard, Standing, Paivio y la paradoja Baker-baker, recordamos imágenes y contextos mucho mejor que nombres, y una tarjeta guardada también como imagen conserva esas pistas.

La herramienta no compite con NameDrop ni con las apps comerciales; prueba una función, el doble guardado, y la acompaña con lo que una página web sí puede hacer para "acercar el celular": un enlace sin servidor que entra en un sticker NFC. Los próximos pasos son grabarlo en tags reales, probarla con diez personas en teléfonos de las dos marcas y elegir un nicho donde esa función marque la diferencia.

## Referencias

- Android Developers. (s. f.). *NFC basics*. https://developer.android.com/develop/connectivity/nfc/nfc
- Apple. (s. f.). *Adding support for background tag reading*. Core NFC, Apple Developer Documentation. https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading
- Beaufort, F. (s. f.). *Interact with NFC devices on Chrome for Android*. Chrome for Developers. https://developer.chrome.com/docs/capabilities/nfc
- Berlekamp, E. R. (1968). *Algebraic Coding Theory*. McGraw-Hill. https://archive.org/details/algebraiccodingt0000berl
- Berners-Lee, T., Fielding, R., & Masinter, L. (2005). *Uniform Resource Identifier (URI): Generic Syntax* (RFC 3986). Internet Engineering Task Force. https://doi.org/10.17487/RFC3986
- Bose, R. C., & Ray-Chaudhuri, D. K. (1960). On a class of error correcting binary group codes. *Information and Control*, 3(1), 68–79. https://doi.org/10.1016/S0019-9958(60)90287-4
- Bringhurst, R. (1992). *The Elements of Typographic Style*. Hartley & Marks. https://archive.org/details/elementsoftypogr0000brin_z4a6
- Dawson, F., & Howes, T. (1998). *vCard MIME Directory Profile* (RFC 2426). Internet Engineering Task Force. https://doi.org/10.17487/RFC2426
- Deutsch, P. (1996). *DEFLATE Compressed Data Format Specification version 1.3* (RFC 1951). Internet Engineering Task Force. https://doi.org/10.17487/RFC1951
- Hamming, R. W. (1950). Error detecting and error correcting codes. *Bell System Technical Journal*, 29(2), 147–160. https://doi.org/10.1002/j.1538-7305.1950.tb00463.x
- Howes, T., Smith, M., & Dawson, F. (1998). *A MIME Content-Type for Directory Information* (RFC 2425). Internet Engineering Task Force. https://doi.org/10.17487/RFC2425
- ISO/IEC. (2015). *ISO/IEC 18004:2015. Information technology — Automatic identification and data capture techniques — QR Code bar code symbology specification*. International Organization for Standardization. https://www.iso.org/standard/62021.html
- Josefsson, S. (2006). *The Base16, Base32, and Base64 Data Encodings* (RFC 4648). Internet Engineering Task Force. https://doi.org/10.17487/RFC4648
- Katz, M. L., & Shapiro, C. (1985). Network externalities, competition, and compatibility. *American Economic Review*, 75(3), 424–440. https://www.jstor.org/stable/1814809
- Ley 25.326 de Protección de los Datos Personales. (2000). *Boletín Oficial de la República Argentina*, 2 de noviembre de 2000. https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/norma.htm
- Massey, J. L. (1969). Shift-register synthesis and BCH decoding. *IEEE Transactions on Information Theory*, 15(1), 122–127. https://doi.org/10.1109/TIT.1969.1054260
- McWeeny, K. H., Young, A. W., Hay, D. C., & Ellis, A. W. (1987). Putting names to faces. *British Journal of Psychology*, 78(2), 143–149. https://doi.org/10.1111/j.2044-8295.1987.tb02235.x
- Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. En *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166
- NXP Semiconductors. (s. f.). *NTAG213/215/216: NFC Forum Type 2 Tag compliant IC with 144/504/888 bytes user memory* (hoja de datos). https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf
- Otsu, N. (1979). A threshold selection method from gray-level histograms. *IEEE Transactions on Systems, Man, and Cybernetics*, 9(1), 62–66. https://doi.org/10.1109/TSMC.1979.4310076
- Paivio, A. (1971). *Imagery and Verbal Processes*. Holt, Rinehart and Winston. https://archive.org/details/imageryverbalpro0000paiv
- Perreault, S. (2011). *vCard Format Specification* (RFC 6350). Internet Engineering Task Force. https://doi.org/10.17487/RFC6350
- Reed, I. S., & Solomon, G. (1960). Polynomial codes over certain finite fields. *Journal of the Society for Industrial and Applied Mathematics*, 8(2), 300–304. https://doi.org/10.1137/0108018
- Rogers, E. M. (2003). *Diffusion of Innovations* (5.ª ed.; 1.ª ed., 1962). Free Press. https://archive.org/details/diffusionofinnov00roge
- Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379–423; 27(4), 623–656. https://doi.org/10.1002/j.1538-7305.1948.tb01338.x
- Shepard, R. N. (1967). Recognition memory for words, sentences, and pictures. *Journal of Verbal Learning and Verbal Behavior*, 6(1), 156–163. https://doi.org/10.1016/S0022-5371(67)80067-7
- Standing, L. (1973). Learning 10,000 pictures. *Quarterly Journal of Experimental Psychology*, 25(2), 207–222. https://doi.org/10.1080/14640747308400340
- Tulving, E., & Thomson, D. M. (1973). Encoding specificity and retrieval processes in episodic memory. *Psychological Review*, 80(5), 352–373. https://doi.org/10.1037/h0020071
- W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. World Wide Web Consortium. https://www.w3.org/TR/WCAG21/
- W3C. (2023). *Web Share API* (W3C Recommendation). World Wide Web Consortium. https://www.w3.org/TR/web-share/
- W3C Web NFC Community Group. (s. f.). *Web NFC* (borrador de informe del grupo comunitario). https://w3c-cg.github.io/web-nfc/
- WHATWG. (s. f.). *Compression Standard* (estándar vivo). https://compression.spec.whatwg.org/
- Woodland, N. J., & Silver, B. (1952). *Classifying apparatus and method* (Patente de EE. UU. 2 612 994). https://patents.google.com/patent/US2612994A/en
- Yergeau, F. (2003). *UTF-8, a transformation format of ISO 10646* (RFC 3629). Internet Engineering Task Force. https://doi.org/10.17487/RFC3629
