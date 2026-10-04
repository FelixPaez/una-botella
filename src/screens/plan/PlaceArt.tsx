import { useState } from 'react';
import type { Place } from '../../config.types.ts';
import { PlaceIllustration } from '../../illustrations/PlaceIllustration.tsx';

/**
 * Imagen de la postal: la foto si existe (public/places/…) y, si no, la ilustración.
 * Con foto, la ilustración queda debajo como fondo mientras carga.
 */
export function PlaceArt({ place, eager = false }: { place: Place; eager?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="place-art">
      <PlaceIllustration kind={place.illustration} />
      {place.image && (
        <img
          src={`${import.meta.env.BASE_URL}${place.image}`}
          alt={place.imageAlt ?? place.name}
          width={1000}
          height={800}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className={`place-art__photo ${loaded ? 'is-loaded' : ''}`}
          style={place.imageFocus ? { objectPosition: place.imageFocus } : undefined}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
