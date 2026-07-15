import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const BoltStyleEditor = lazy(() =>
  import('./BoltStyleEditor').then(({ BoltStyleEditor: Editor }) => ({
    default: Editor,
  }))
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense
      fallback={
        <main className="studio-loading" role="status">
          <span className="brand-mark">✦</span>
          <strong>Loading Web Studio</strong>
          <span>Preparing the editor and tool registry…</span>
        </main>
      }
    >
      <BoltStyleEditor />
    </Suspense>
  </StrictMode>
);
