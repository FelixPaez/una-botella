# Plan — «Mensaje en una botella»

Invitación web, estática y mobile-first, para invitar a salir a alguien a quien le encanta el mar.
Tono cálido, elegante y con humor ligero: una invitación a conocerse, no una declaración.
Se abre desde un enlace de WhatsApp. Se trabaja por fases y cada una necesita el OK explícito del autor.

## Decisiones aprobadas

| Tema | Decisión |
|---|---|
| Stack | Vite 8 + React 19 + TypeScript + Tailwind CSS 4 (tokens en `@theme`) + Motion 14 con `LazyMotion` + `m` + `domAnimation` |
| Dependencias de desarrollo extra | Vitest (lógica con casos límite), oxlint (el linter de la plantilla de Vite), `@csstools/postcss-cascade-layers` (compatibilidad) |
| Contenido | Todo en `src/config.ts`; los tipos en `src/config.types.ts` |
| Diseño | Responsive real: una composición para móvil (< 768 px), móvil con más aire (768–1023) y otra de escritorio (≥ 1024). El comportamiento (hover, huida por cercanía) depende del tipo de puntero, no del ancho |
| Fotos de lugares | 5:4 horizontal, 1000×800 px, WebP < 150 KB, en `public/places/`; campo opcional `imageFocus` |
| Ubicación | Santa Clara, Cuba (22,41° N, 79,96° O): hemisferio norte, formato de 12 h («6:30 de la tarde») |
| Sonido | Sí, sintetizado con Web Audio (0 KB de audio), en un chunk aparte que solo se descarga si hace falta |
| Service worker | Sí, propio y sin librerías: caché en tiempo de ejecución, HTML siempre primero desde la red (Fase 5) |
| Repositorio | `github.com/FelixPaez/una-botella`, público; despliegue con GitHub Actions en Pages |

### Mejoras aceptadas (dentro del concepto)

1. La intro usa la hora real de su móvil (si lo abre de noche, botella bajo las estrellas).
2. Faro al final del horizonte: el barquito llega y el faro se enciende al confirmar.
3. La botella es un personaje persistente: queda pequeña en el horizonte y regresa al final.
4. La luna del cielo nocturno es la fase real del día elegido.
5. Atardecer real: el plan «Atardecer» ofrece horarios 60 y 30 min antes de la puesta de sol calculada.
6. Guiños con humor ligero según lo que elija (luna llena, fin de semana, hoy mismo).

Descartadas: vibración en iPhone con el truco de `<input switch>`; «sin sonido».

### Sonido: cómo se evita que pese

1. `config.sound.enabled = false` → nunca se descarga el motor.
2. Ahorro de datos, red 2G o dispositivo modesto → empieza en silencio; solo se descarga si ella lo activa.
3. Si al arrancar el mar sonoro caen los fps (< 40), el fondo se apaga solo (los efectos cortos siguen).
4. Botón de silencio (una concha) siempre visible; la preferencia se recuerda durante la sesión.
5. En iPhone, Web Audio respeta el interruptor de silencio.

## Cuba: compatibilidad y datos

- Muchos móviles no actualizan Chrome (sin Google Play): el build apunta a Chrome 88+, Safari/iOS 15+, Firefox 90+.
  Tailwind 4 agrupa el CSS en `@layer`, que esos navegadores ignorarían entero; un paso de PostCSS lo traduce a especificidad normal.
- Cero peticiones a otros dominios (fuentes autoalojadas, sin CDN).
- Presupuesto: JS inicial < 150 KB gzip (hoy ~129 KB, más ~8 KB del plan precargado durante la pregunta),
  fuentes ≤ 120 KB (hoy 117 KB, 72 KB precargados).
- Cuba atrasa la hora el primer domingo de noviembre: las fechas se construyen por calendario, con test.
- Todas las horas se calculan en la zona del lugar (`America/Havana`), no en la del dispositivo:
  los tests corren a propósito con el reloj en Tokio.
- Service worker propio (`public/sw.js`): HTML siempre primero de la red, archivos con hash desde la caché,
  sin precarga. Si la caché del navegador falla, todo sigue por la red. `serviceWorker: false` lo desinstala.
- Si un archivo del plan no llega (versión nueva publicada a mitad de la visita), se recarga una vez
  y se sigue donde iba; si no hay conexión, aviso con «Volver a intentarlo» en vez de pantalla en blanco.

## Sistema de diseño

**Paleta** (contraste WCAG verificado): `foam #F4FBF9`, `paper #FBF9F4`, `mist #E4F3EF`, `sky #DCEEF5`, `mint #CBECE2`,
`aqua #9FDCD1`, `lagoon #8CCAD9`, `seaglass #6FC0B1`, `tide #3B8792`, `deep #1F4E5A`, `abyss #143A45`, `ink-soft #456E79`,
`sand #F2E8D8`, `sun #F1CB86`. Texto principal: deep sobre foam 8,7:1. `tide` y `seaglass` nunca son fondo de texto.

**Tipografía**: Fraunces (instancia propia con SOFT 50 y opsz 32, peso 300–700; romana e itálica) para títulos y carta;
DM Sans para la interfaz. Nunca menos de 16 px en campos (iOS no hace zoom).

**Movimiento** (`src/design/motion.ts`, replicado en CSS y verificado por test):

| Token | Valor | Uso |
|---|---|---|
| `ease.surface` | `cubic-bezier(.16,1,.3,1)` | entradas |
| `ease.sink` | `cubic-bezier(.5,0,.75,0)` | salidas |
| `ease.swell` | `cubic-bezier(.45,0,.55,1)` | bucles, vaivenes y la marea entre pantallas |
| `spring.buoy` / `spring.stamp` / `spring.drift` | 260/18 · 700/32 · 40/18 | lo que flota · impactos · paralaje |
| `dur.tap · exit · enter · tide · ambient` | 150 · 320 · 600 · 1000 · 2400 ms | |
| `stagger.word · item` | 55 · 70 ms | |

Solo se anima `transform` y `opacity`. Hápticos y sonidos comparten nombres: `tick`, `nudge`, `pop`, `bubble`, `splash`, `stamp`, `yes`, `whoosh`.

## Arquitectura

Capas, de atrás hacia delante: cielo → olas lejanas → **botella** (entre olas) → olas cercanas, burbujas y destellos →
horizonte con el barquito → pantalla actual (marea entre pantallas) → overlay. El mar, la botella y el barquito nunca se desmontan.

Máquina de estados (`src/state/flow.ts`, reducer puro con tests):

```
intro ─toca─▶ opening ─▶ letter[0..n] ─▶ question
question ─No ×N → «Mejor otro día»─▶ declined
question ─Sí─▶ celebration ─▶ plan ⇄ datetime ⇄ summary ─WhatsApp─▶ farewell
                                ▲──── editar desde el resumen ───┘
```

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Plan | ✅ aprobado |
| 1 | Base, sistema de diseño, mar persistente, barquito, sonido, config.ts, layout responsive, despliegue | ✅ aprobada |
| 2 | Intro (botella), apertura y carta con sus gestos | ✅ aprobada |
| 3 | La pregunta (botón No), «Mejor otro día» y celebración | ✅ hecha |
| 4 | Postales, fecha y hora, mar según la hora, resumen con matasellos, WhatsApp y final | ✅ hecha |
| 5 | Lighthouse, og:image, reduced motion, 360 px, service worker y README completo | ✅ hecha |
| — | Contenido real: nombres, número, carta, lugares y fotos | ⏳ pendiente del autor |

Lighthouse (build de producción): móvil 96 / 100 / 100 (rendimiento, accesibilidad, buenas prácticas),
escritorio 100 / 100 / 100. SEO 54 a propósito (`noindex`).
