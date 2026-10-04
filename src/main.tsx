import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './App.tsx';
import { config } from './config.ts';
import { checkConfig, findTodos } from './lib/configCheck.ts';
import { setupServiceWorker } from './lib/serviceWorker.ts';
import { initSound } from './sound/index.ts';

if (import.meta.env.DEV) {
  const problems = checkConfig(config);
  if (problems.length) console.warn(`config.ts tiene ${problems.length} problema(s):\n• ${problems.join('\n• ')}`);
  const todos = findTodos(config);
  if (todos.length) console.info(`Faltan datos en config.ts (${todos.length}): ${todos.join(', ')}`);
}

initSound();

// Solo en la web publicada: en desarrollo una caché solo estorbaría.
if (import.meta.env.PROD) setupServiceWorker(config.serviceWorker);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
