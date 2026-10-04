# Mensaje en una botella

Invitación web interactiva: una botella llega con la marea, se abre una carta y al final se elige un plan
que se confirma por WhatsApp. Estática, ligera y pensada para el móvil (con diseño propio para escritorio).

> Esta guía se completará en la fase de pulido (cómo añadir lugares reales, fotos y la publicación final).
> El plan completo y las decisiones están en [docs/PLAN.md](docs/PLAN.md).

## Editar el contenido

Todo lo que se lee y todos los datos del plan están en **`src/config.ts`**: su nombre, tu número,
la carta, las frases del botón No, los lugares, los días y los horarios. No hace falta tocar nada más.

Mientras quede algún `TODO` en ese archivo, la web muestra una cinta de **BORRADOR**.

## Probar en tu ordenador

```bash
npm install        # solo la primera vez
npm run dev        # abre http://localhost:5173
npm run dev:movil  # igual, pero accesible desde tu móvil en la misma wifi
```

Parámetros para revisar (se añaden al final de la dirección):

| Parámetro | Qué hace |
|---|---|
| `?hora=manana` · `dia` · `atardecer` · `noche` | Fuerza la hora del cielo |
| `?paso=inicio` | Empieza de cero (olvida el progreso guardado) |
| `?paso=carta` · `carta-2` · `carta-3` | Abre la carta en esa página |
| `?paso=pregunta` | Abre la pregunta |
| `?demo` | Muestra del sistema de diseño |

Se pueden combinar: `?paso=inicio&hora=noche`.

Si recargas a mitad de la experiencia, retoma donde estabas (se guarda solo en la pestaña, sin cookies).

## Comprobaciones

```bash
npm test       # lógica: fechas, luna, atardecer, máquina de estados, config
npm run lint   # estilo y reglas de React
npm run build  # compila en dist/
```

## Publicar

Cada `git push` a `main` publica la web en GitHub Pages con GitHub Actions
(una única vez: en el repositorio, **Settings → Pages → Source: GitHub Actions**).

Dirección: https://felixpaez.github.io/una-botella/
