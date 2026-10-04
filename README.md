# Mensaje en una botella

Invitación web interactiva: una botella llega con la marea, se abre una carta y al final se elige un plan
que se confirma por WhatsApp. Estática, ligera y pensada para el móvil (con diseño propio para escritorio).

Dirección pública: **https://felixpaez.github.io/una-botella/**

El plan completo y las decisiones de diseño están en [docs/PLAN.md](docs/PLAN.md).

---

## 1. Editar el contenido

Todo lo que se lee y todos los datos del plan están en **`src/config.ts`**. No hace falta tocar nada más.

Mientras quede algún `TODO` en ese archivo, la web muestra una cinta de **BORRADOR** en una esquina.
Cuando desaparece, está lista para enviar.

| Sección | Qué es |
|---|---|
| `recipient.name` | Su nombre. Aparece en la etiqueta de la botella, en el título y en el saludo |
| `sender.name` | Tu nombre, como quieres firmar la carta |
| `sender.whatsapp` | Tu número en formato internacional, solo dígitos: Cuba = `53` + 8 cifras → `'5351234567'` |
| `meta` | Título y frase de la vista previa del enlace en WhatsApp |
| `intro` | Título y subtítulo de la primera pantalla |
| `letter.pages` | La carta: de 2 a 4 páginas. `advance` es el gesto para pasar: `'tap'` (tocar), `'hold'` (mantener) o `'swipe'` (deslizar) |
| `question` | La pregunta y los textos de Sí / No |
| `noButton` | Las frases del No que huye, cuántos intentos (`maxAttempts`) y si después aparece «Mejor otro día» |
| `celebration`, `decline`, `farewell` | Textos tras el Sí, tras «Mejor otro día» y de la despedida final |
| `places` | Las postales (ver la sección 2) |
| `schedule` | Días y horarios (ver la sección 3) |
| `whatsapp.template` | El mensaje que ella te enviará al confirmar |
| `quips` | Los guiños según el día elegido (luna llena, fin de semana…) |
| `sound` | `enabled: false` quita el sonido del todo; `startMuted: true` empieza en silencio |
| `serviceWorker` | Caché para reabrir rápido y sin red (ver la sección 6) |

Huecos que se rellenan solos: `{nombre}` (su nombre) y `{remitente}` (el tuyo) en cualquier texto;
`{fecha}` en el título de la despedida; `{lugar}`, `{fecha}`, `{hora}` y `{nota}` en el mensaje de WhatsApp.

> Si te equivocas en algo (una hora mal escrita, un día de la semana inexistente…), al abrir `npm run dev`
> la consola del navegador lo avisa con el sitio exacto.

## 2. Cómo agregar lugares reales

Cada lugar es una postal. Funciona igual con 3, 5 u 8. Copia un bloque dentro de `places` y cámbialo:

```ts
{
  id: 'malecon',                       // único, sin espacios ni tildes
  name: 'Atardecer en el malecón',     // título de la postal y del mensaje
  tagline: 'El sol también tiene una cita a esa hora',
  description: 'Vemos cómo el sol se esconde en el mar, sin mirar el reloj.',
  illustration: 'sunset',              // dibujo de respaldo: sunset · picnic · cafe · night-walk · mystery
  image: 'places/malecon.webp',        // opcional: la foto (ver abajo)
  imageAlt: 'El malecón al atardecer', // opcional: descripción de la foto
  imageFocus: 'center 30%',            // opcional: qué parte de la foto se ve
  times: { from: '16:00', to: '19:00' }, // la franja en la que puedes (ver abajo)
},
```

- `times` es **la franja en la que puedes quedar**. Ella elige la hora exacta deslizando el sol por un arco,
  de 15 en 15 minutos (`schedule.stepMinutes`), y el mar cambia a esa hora mientras lo mueve.
  - `{ from: '16:00', to: '19:00' }`: cualquier hora entre las 4:00 y las 7:00 de la tarde (formato 24 h; medianoche es `'24:00'`).
  - `'sunset'`: la franja se calcula sola cada día con la **puesta de sol real** (de 90 a 15 minutos antes).
  - `['16:00', '17:30']`: solo esas horas, si prefieres horas fijas.
  - Sin `times`: la franja por defecto (`schedule.defaultWindow`).
- `mystery: true` deja la postal boca abajo hasta que ella la toca. En el mensaje sale como «Plan sorpresa».
- Para quitar un lugar, borra su bloque entero.

### Fotos

- Horizontales **5:4**, unos **1000×800 px**, en formato **WebP** y de **menos de 150 KB**.
- Guárdalas en **`public/places/`** con un nombre sencillo, sin espacios ni tildes: `malecon.webp`.
- En el lugar, `image: 'places/malecon.webp'` (sin `/` al principio).
- Para convertir y comprimir: [squoosh.app](https://squoosh.app) → WebP, calidad 70–80, ancho 1000.

Mientras un lugar no tenga foto, se ve su ilustración. Cuando la tiene, la ilustración hace de fondo
mientras la foto carga, así que nunca hay un hueco vacío aunque la conexión sea lenta.

## 3. Días y horarios

En `schedule`:

| Campo | Qué hace |
|---|---|
| `daysAhead` | Cuántos días se ofrecen desde hoy (14 = dos semanas) |
| `excludedWeekdays` | Días de la semana que no puedes, ej. `['lunes', 'martes']` |
| `excludedDates` | Fechas concretas que no puedes, ej. `['2026-10-12']` |
| `minHoursAhead` | Si elige hoy, solo horas que empiecen dentro de al menos estas horas |
| `stepMinutes` | Cada cuántos minutos se puede elegir dentro de una franja (15 → 6:00, 6:15, 6:30…) |
| `defaultWindow` | Franja de los lugares que no tienen la suya; hoy `{ from: '12:00', to: '24:00' }` (del mediodía a medianoche) |
| `sunsetMinutesBefore` | Planes de atardecer: desde y hasta cuántos minutos antes de la puesta, ej. `{ from: 90, to: 15 }` |
| `dayparts` | A qué hora empiezan la mañana, la tarde y la noche (para decir «6:30 de la tarde») |

Al elegir un día, el arco propone la hora del medio de la franja; ella la mueve si quiere.

Las horas son siempre las de **Santa Clara** (`location.timeZone`), aunque alguien abra el enlace
con el móvil en otra zona horaria. El cambio de hora de Cuba está contemplado.

## 4. Probar en tu ordenador

```bash
npm install        # solo la primera vez
npm run dev        # abre http://localhost:5173
npm run dev:movil  # igual, pero accesible desde tu móvil en la misma wifi
```

Parámetros para revisar cualquier pantalla (se añaden al final de la dirección):

| Parámetro | Qué hace |
|---|---|
| `?paso=inicio` | Empieza de cero (olvida el progreso guardado) |
| `?paso=carta` · `carta-2` · `carta-3` | Abre la carta en esa página |
| `?paso=pregunta` | Abre la pregunta |
| `?paso=plan` | Abre las postales |
| `?paso=fecha` · `resumen` · `final` | Fecha, resumen o despedida, con un plan de ejemplo |
| `?hora=manana` · `dia` · `atardecer` · `noche` | Fuerza la hora del cielo |
| `?demo` | Muestra del sistema de diseño |

Se pueden combinar: `?paso=fecha&hora=noche`. También funcionan en la web publicada.

Si recargas a mitad de la experiencia, retoma donde estabas (se guarda solo en esa pestaña, sin cookies).
En Android, el gesto de «atrás» vuelve un paso dentro de la experiencia.

## 5. Publicar

Cada `git push` a `main` comprueba el código y publica la web en GitHub Pages en un par de minutos.
(La configuración inicial ya está hecha: **Settings → Pages → Source: GitHub Actions**.)

```bash
git add -A
git commit -m "Textos y fotos reales"
git push
```

Antes de enviarle el enlace:

1. Que no quede ningún `TODO` en `src/config.ts` (la cinta de BORRADOR desaparece).
2. Recorre la experiencia entera en tu móvil, con `?paso=inicio` para empezar de cero.
3. Envíale la dirección **sin parámetros**: `https://felixpaez.github.io/una-botella/`.
4. WhatsApp guarda la vista previa del enlace: si la cambiaste, compártelo primero contigo mismo
   para comprobar que se ve la imagen de la botella al atardecer.

## 6. Rendimiento y datos móviles

- JS inicial ~129 KB gzip; las pantallas del plan (~8 KB) se descargan mientras ella lee la pregunta.
- Fuentes propias (sin Google Fonts), cero peticiones a otros dominios, sin cookies ni analítica.
- El sonido se sintetiza en el móvil (0 KB de audio). Con ahorro de datos, red 2G o un móvil
  modesto empieza en silencio; si el mar sonoro va lento, se apaga solo.
- Funciona en Chrome 88+ y iOS 15+, pensando en móviles que no se actualizan.

### Service worker

Guarda lo que ella ya descargó para que, si vuelve a abrir el enlace (por ejemplo al regresar de
WhatsApp), cargue al instante y aguante cortes de conexión. No descarga nada por adelantado y la página
siempre se pide primero a la red, así que los cambios publicados se ven en cuanto se reabre.

**Quitar el service worker:** pon `serviceWorker: false` en `src/config.ts` y publica. Al abrir el enlace,
cada móvil que lo tenía lo desinstala y borra sus copias.

## 7. Comprobaciones

```bash
npm run check  # tipos + lint + tests (fechas, luna, atardecer, zona horaria, máquina de estados…)
npm run build  # compila en dist/
npm run preview
```

Lighthouse (móvil): rendimiento 96, accesibilidad 100, buenas prácticas 100.
El SEO sale bajo a propósito: la web lleva `noindex` para que no aparezca en buscadores.
