import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { config } from '../config.ts';
import { createFlowReducer } from './flow.ts';
import { FlowContext } from './flowContext.ts';
import { STORAGE_KEY, loadFlow } from './persistence.ts';

const PAGES = config.letter.pages.length;

const reducer = createFlowReducer({
  pages: PAGES,
  maxNoAttempts: config.noButton.maxAttempts,
  allowDecline: config.noButton.allowGracefulDecline,
});

function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function FlowProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadFlow(window.location.search, safeSession(), PAGES));
  const [state, dispatch] = useReducer(reducer, initial);

  // Si el navegador recarga (o ella vuelve de WhatsApp), retoma donde estaba.
  useEffect(() => {
    try {
      safeSession()?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // sin almacenamiento: no pasa nada, solo no se recuerda
    }
  }, [state]);

  // El gesto «atrás» del móvil retrocede un paso en lugar de cerrar la página
  // (una entrada de historial de guardia, sin cambiar la URL).
  const canGoBack = state.step === 'datetime' || state.step === 'summary' || state.returnTo === 'summary';
  useEffect(() => {
    if (!canGoBack) return;
    if (!(window.history.state as { botella?: boolean } | null)?.botella) {
      window.history.pushState({ botella: true }, '');
    }
  }, [canGoBack, state.step]);
  useEffect(() => {
    const onPop = () => dispatch({ type: 'BACK' });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const value = useMemo(() => ({ state, dispatch, initialStep: initial.step }), [state, initial.step]);
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}
