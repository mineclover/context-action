import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConfirmationRequest } from '../views/editor-dialogs';

export function useConfirmationRequest() {
  const [confirmationRequest, setConfirmationRequest] =
    useState<ConfirmationRequest | null>(null);
  const confirmationResolverRef = useRef<((confirmed: boolean) => void) | null>(
    null
  );

  const requestConfirmation = useCallback(
    (request: ConfirmationRequest) =>
      new Promise<boolean>((resolve) => {
        confirmationResolverRef.current?.(false);
        confirmationResolverRef.current = resolve;
        setConfirmationRequest(request);
      }),
    []
  );

  const resolveConfirmation = useCallback((confirmed: boolean) => {
    const resolve = confirmationResolverRef.current;
    confirmationResolverRef.current = null;
    setConfirmationRequest(null);
    resolve?.(confirmed);
  }, []);

  useEffect(() => {
    return () => {
      confirmationResolverRef.current?.(false);
      confirmationResolverRef.current = null;
    };
  }, []);

  return {
    confirmationRequest,
    requestConfirmation,
    resolveConfirmation,
  };
}
