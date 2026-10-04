import { Component, type ReactNode } from 'react';
import { Button } from './Button.tsx';

type Props = { message: string; retry: string; children: ReactNode };

/** Si una parte no llega a cargar (se cortó la conexión), en vez de una pantalla en blanco: un aviso y reintentar. */
export class RetryBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="screen retry" role="alert">
        <p className="retry__message on-water font-serif text-letter">{this.props.message}</p>
        <Button onClick={() => window.location.reload()}>{this.props.retry}</Button>
      </div>
    );
  }
}
