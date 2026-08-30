import { type ReactNode, useContext, useState } from 'react';
import { createToastSystem, type ToastSystemController } from './actions';
import { ToastSystemContext } from './ToastSystemContext';

export function ToastSystemProvider({
  children,
  system,
}: {
  children: ReactNode;
  /** Injectable system used by focused tests or intentionally isolated roots. */
  system?: ToastSystemController;
}) {
  const [ownedSystem] = useState(createToastSystem);

  return (
    <ToastSystemContext.Provider value={system ?? ownedSystem}>
      {children}
    </ToastSystemContext.Provider>
  );
}

/** Optional form lets LogMonitor remain log-only outside an application shell. */
export function useOptionalToastSystem(): ToastSystemController | undefined {
  return useContext(ToastSystemContext) ?? undefined;
}

export function useToastSystem(): ToastSystemController {
  const system = useOptionalToastSystem();
  if (!system) {
    throw new Error(
      'ToastSystem components must be used within ToastSystemProvider.'
    );
  }
  return system;
}
