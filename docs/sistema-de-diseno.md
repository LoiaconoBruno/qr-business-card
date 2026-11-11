# Sistema de diseño del portafolio · v1.1

Un sistema chico, en un solo archivo CSS y sin dependencias, para que los proyectos con interfaz nueva se vean como un mismo portafolio. loiaAcademy queda afuera: tiene identidad propia.

- **Archivo:** [`css/sistema.css`](../css/sistema.css). Este repositorio tiene la copia de referencia: los otros proyectos copian el archivo y no lo modifican. Si hace falta un cambio, se hace acá, se sube la versión del encabezado y se vuelve a copiar.
- **Uso:** se enlaza antes de los estilos propios del proyecto, que solo agregan su layout.

```html
<link rel="stylesheet" href="css/sistema.css">
<link rel="stylesheet" href="styles.css">
```

## Principios

1. **Mobile-first.** Los estilos base son para 375 px; los anchos mayores se agregan con `min-width`.
2. **Contraste AA medido**, no estimado, en claro y en oscuro (ver la tabla).
3. **Foco visible** en todo lo que se puede tocar: contorno de 3 px del color de acento, separado 2 px del elemento.
4. **Navegable con teclado**: un enlace "Saltar al contenido", orden lógico y nada que dependa solo del mouse.
5. **Sin descargas**: la tipografía es la del sistema y no hay frameworks.
6. **Movimiento opcional**: las transiciones solo se aplican con `prefers-reduced-motion: no-preference`.

## Tokens

### Tipografía

| Token | Valor | Uso |
|---|---|---|
| `--fuente` | `ui-sans-serif, system-ui, …` | Texto e interfaz |
| `--fuente-serif` | `"Iowan Old Style", Palatino, Georgia, …` | Títulos editoriales |
| `--fuente-mono` | `ui-monospace, "SF Mono", Menlo, …` | Código y datos |
| `--t-1` | 13 px | Notas |
| `--t-2` | 14 px | Ayudas y chips |
| `--t-3` | 16 px | Texto |
| `--t-4` | 18 px | Destacados |
| `--t-5` | 22 px | Subtítulos |
| `--t-6` | 28 px | Títulos de sección |
| `--t-7` | 32 a 44 px, con `clamp()` | Título principal |

### Espaciado y radios

Espaciado en una escala de 4 px: `--e-1` 4, `--e-2` 8, `--e-3` 12, `--e-4` 16, `--e-5` 24, `--e-6` 32, `--e-7` 48 y `--e-8` 64 px. El margen lateral es de 16 px en el celular y de 24 px desde 768 px.

Radios: `--r-1` 8, `--r-2` 12 (botones y campos), `--r-3` 16 (paneles), `--r-4` 24 px y `--r-pildora` para chips.

### Color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--fondo` | `#f3f4fb` | `#0e1015` | Fondo de la página (v1.2: apenas azulado) |
| `--superficie` | `#ffffff` | `#171a21` | Paneles y campos |
| `--superficie-2` | `#eceff3` | `#20242d` | Zonas secundarias |
| `--texto` | `#151820` | `#e8ebf0` | Texto principal |
| `--texto-suave` | `#4d5563` | `#a6aebb` | Texto secundario |
| `--borde` | `#d7dce4` | `#2d333e` | Separadores (decorativos) |
| `--borde-control` | `#7c8595` | `#6b7484` | Borde de botones y campos |
| `--acento` | `#3a4bd6` | `#93a0ff` | Acciones, enlaces y foco |
| `--acento-texto` | `#ffffff` | `#0e1015` | Texto sobre el acento |
| `--acento-suave` | `#eceefd` | `#242a4a` | Fondo de chips y pasos activos |
| `--ok` | `#14704a` | `#4cc48a` | Confirmaciones |
| `--aviso` | `#8f5600` | `#f0b35a` | Advertencias |
| `--error` | `#b42318` | `#ff8b80` | Errores |
| `--ok-suave`, `--aviso-suave`, `--error-suave` | `#e3f4ea`, `#fbf0dc`, `#fce8e6` | `#17302a`, `#33291a`, `#3a1f1f` | Fondo de las etiquetas de estado (v1.2) |
| `--acento-2` | `#c2410c` | `#ff9e6b` | Segundo acento, cálido, para destacar (v1.2) |
| `--degradado` | `#3443c9` → `#6b2fd1` → `#b4236a` | `#2a338f` → `#4d2399` → `#8a1b52` | Fondo de la portada (v1.2) |
| `--degradado-1` | `#3443c9` | `#2a338f` | Texto de los botones blancos y números de pasos sobre la portada |
| `--sobre-degradado`, `--sobre-degradado-suave` | `#ffffff`, `#e6e9ff` | iguales | Texto sobre la portada |

El modo oscuro se activa solo, con `prefers-color-scheme: dark`.

### Contrastes medidos

Contraste mínimo de cada color sobre `--fondo`, `--superficie` y `--superficie-2`, con la fórmula de las WCAG 2.1:

| Par | Claro | Oscuro | Mínimo AA |
|---|---|---|---|
| Texto | 15,39:1 | 13,00:1 | 4,5:1 |
| Texto suave | 6,51:1 | 6,95:1 | 4,5:1 |
| Acento | 5,77:1 | 6,45:1 | 4,5:1 |
| Texto sobre acento | 6,65:1 | 7,89:1 | 4,5:1 |
| Acento sobre acento suave | 5,77:1 | 5,79:1 | 4,5:1 |
| Ok, aviso y error | 5,20:1 o más | 6,85:1 o más | 4,5:1 |
| Borde de controles | 3,22:1 | 3,30:1 | 3:1 (componentes) |
| Blanco sobre el degradado (v1.2) | 6,20:1 o más | 8,90:1 o más | 4,5:1 |
| Bajada de la portada (`#e6e9ff`) sobre el degradado (v1.2) | 5,15:1 o más | 7,40:1 o más | 4,5:1 |
| Texto de los pasos, blanco sobre su tarjeta translúcida (v1.2) | 5,09:1 o más | 6,87:1 o más | 4,5:1 |
| Ok, aviso, error y acento sobre su fondo suave (v1.2) | 5,32:1 o más | 5,79:1 o más | 4,5:1 |
| Segundo acento (v1.2) | 4,72:1 | 8,59:1 | 4,5:1 |

`--borde` es decorativo: separa paneles que ya se distinguen por su contenido, así que no necesita llegar a 3:1.

## Componentes

| Clase | Qué es |
|---|---|
| `.contenedor` | Ancho máximo centrado con márgenes laterales |
| `.saltar` | Enlace "Saltar al contenido", visible al recibir el foco |
| `.visualmente-oculto` | Oculta un texto a la vista pero no a los lectores de pantalla |
| `.btn` | Botón de 44 px de alto como mínimo, con borde de control |
| `.btn--primario` | Botón de la acción principal, con el color de acento |
| `.btn--fantasma` | Botón secundario, sin fondo |
| `.btn--grande`, `.btn--ancho` | Más alto, o a todo el ancho |
| `.campo` | Etiqueta, control, ayuda (`.campo__ayuda`) y error (`.campo__error`); el control con `aria-invalid="true"` se marca con el color de error |
| `.panel` | Superficie con borde, radio de 16 px y sombra suave |
| `.chip`, `.chip--acento` | Etiqueta en forma de píldora |
| `.aviso`, `--ok`, `--aviso`, `--error` | Mensaje destacado con borde de color |
| `.pasos` | Indicador de pasos numerados; el actual lleva `aria-current="step"` |
| `.pestanas` | Pestañas con `role="tablist"`; la activa lleva `aria-selected="true"`. Desde v1.2 son un control segmentado: la elegida es una pastilla blanca |
| `.cabecera`, `.cabecera__fila`, `.marca` | Barra superior con el nombre del proyecto y sus enlaces |
| `.intro` | Título y bajada de la página, con ancho de lectura |
| `.pie` | Pie con la nota de privacidad, los enlaces y la licencia |
| `.portada` (v1.2) | Banda con degradado de borde a borde arriba de cada app: `.portada__etiqueta`, `h1`, `.portada__bajada` y `.portada__acciones` con `.btn--blanco` y `.btn--claro`. Va dentro de `.contenedor` y se estira sola |
| `.como-funciona` (v1.2) | Lista de tres pasos numerados, cada uno con `<strong>` y `<span>`; dentro de la portada se ve translúcida |
| `.datos`, `.dato` (v1.2) | Grilla de números grandes con título, valor y nota; la franja de arriba dice el estado (`--ok`, `--aviso`, `--error`, `--neutro`) |
| `.estado` (v1.2) | Etiqueta de estado con color, ícono y texto: el color nunca va solo |
| `.explica` (v1.2) | `<details>` con un «¿Qué es esto?» para explicar la jerga sin ocupar lugar |
| `.titulo-icono` (v1.2) | Título con un ícono en un cuadrado de color |

Además, `[hidden]` siempre oculta, aunque un componente defina su propio `display`.

## Versiones

- **v1.2:** más color y más guía. Portada con degradado y «cómo funciona» en tres pasos, datos con estado, etiquetas de estado, ayudas plegables, pestañas segmentadas, fondo apenas azulado y ayudas de campo a 14 px. Todo medido en AA, en claro y en oscuro. Se aplicó a las cuatro apps nuevas del portafolio.
- **v1.1:** la cabecera, la intro y el pie pasan al sistema (antes estaban en los estilos de la tarjeta), y se suman las pestañas. Primer uso fuera de qr-business-card: aidoc.
- **v1:** tokens, paleta clara y oscura, botones, campos, paneles, chips, avisos y pasos.

## Accesibilidad: lo que cada proyecto tiene que hacer

- Un `lang` correcto en `<html>` y un `<title>` propio.
- Una etiqueta (`<label>`) por cada campo; los errores enlazados con `aria-describedby` y anunciados con `aria-live`.
- Los íconos decorativos con `aria-hidden="true"`; los botones que son solo un ícono, con texto oculto.
- Probar cada página a 375 px y a 1440 px, en claro y en oscuro, y recorrerla con Tab.
