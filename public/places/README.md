# Fotos de los lugares

Aquí van las fotos reales de cada plan.

- Formato **WebP**, horizontal **5:4**, unos **1000×800 px** y **menos de 150 KB**.
- Nombre sencillo, sin espacios ni tildes: `atardecer.webp`, `cafe-malecon.webp`…
- En `src/config.ts`, añade al lugar `image: 'places/atardecer.webp'` (sin "/" al principio).
- Opcional: `imageFocus: 'center 30%'` para elegir qué parte de la foto se ve.

Mientras un lugar no tenga foto, se muestra su ilustración. Cuando la tenga, la ilustración
hará de fondo mientras la foto carga.
