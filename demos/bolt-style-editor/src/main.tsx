import { Component, lazy, type ReactNode, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const BoltStyleEditor = lazy(() =>
  import('./BoltStyleEditor').then(({ BoltStyleEditor: Editor }) => ({
    default: Editor,
  }))
);

type EditorLoadBoundaryState = {
  hasError: boolean;
};

class EditorLoadBoundary extends Component<
  { children: ReactNode },
  EditorLoadBoundaryState
> {
  state: EditorLoadBoundaryState = { hasError: false };

  static getDerivedStateFromError(): EditorLoadBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main aria-live="assertive" className="studio-loading" role="alert">
        <span className="brand-mark">!</span>
        <strong>Web Studio could not load</strong>
        <span>Reload the page to fetch the latest editor bundle.</span>
        <button onClick={() => window.location.reload()} type="button">
          Reload studio
        </button>
      </main>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EditorLoadBoundary>
      <Suspense
        fallback={
          <main aria-live="polite" className="studio-loading" role="status">
            <span className="brand-mark">✦</span>
            <strong>Loading Web Studio</strong>
            <span>Preparing the editor and tool registry…</span>
          </main>
        }
      >
        <BoltStyleEditor />
      </Suspense>
    </EditorLoadBoundary>
  </StrictMode>
);
