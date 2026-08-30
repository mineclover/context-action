import { createContext } from 'react';
import type { ToastSystemController } from './actions';

// Keep the token in a dependency-only module so refreshes of the provider or
// consumers do not replace the Context object during local development.
export const ToastSystemContext = createContext<ToastSystemController | null>(
  null
);
