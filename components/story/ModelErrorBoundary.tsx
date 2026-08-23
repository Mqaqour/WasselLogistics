import React from 'react';

interface Props {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Guards a single GLB model against load failures (404, malformed file,
 * network error). Only the failing object's subtree is caught here — the
 * rest of the canvas (and every other object) keeps rendering normally.
 * Pair with the existing procedural JSX as `fallback` so a missing/broken
 * asset degrades gracefully instead of blanking the whole scene.
 */
export class ModelErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[WasselStory] GLB model failed to load, using procedural fallback:', error);
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
