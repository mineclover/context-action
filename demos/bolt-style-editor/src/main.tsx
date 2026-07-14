import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BoltStyleEditor } from './BoltStyleEditor';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BoltStyleEditor />
  </StrictMode>
);
