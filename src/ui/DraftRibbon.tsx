import { config } from '../config.ts';
import { findTodos } from '../lib/configCheck.ts';

const TODOS = findTodos(config);

/** Mientras queden TODO en config.ts, una cinta deja claro que es un borrador. */
export function DraftRibbon() {
  if (TODOS.length === 0) return null;
  return (
    <div className="draft-ribbon label-caps" role="note" aria-label={`Borrador: faltan ${TODOS.length} datos en config.ts`}>
      Borrador
    </div>
  );
}
