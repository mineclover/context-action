import React from 'react';
import { useAccessRequestDispatch } from '../contexts/AccessRequestContexts';
import type {
  AccessRequestDraft,
  AccessScope,
} from '../business/accessBusiness';

type DraftStringField = 'requesterName' | 'email' | 'justification';

export function useAccessRequestActions() {
  const dispatch = useAccessRequestDispatch();

  const updateTextField = React.useCallback(
    (field: DraftStringField, value: string) => {
      return dispatch('updateDraft', {
        [field]: value,
      } as Partial<AccessRequestDraft>);
    },
    [dispatch]
  );

  const updateScope = React.useCallback(
    (scope: AccessScope) => dispatch('updateDraft', { scope }),
    [dispatch]
  );

  const setProductionAccess = React.useCallback(
    (productionAccess: boolean) => dispatch('updateDraft', { productionAccess }),
    [dispatch]
  );

  const submitReview = React.useCallback(
    () => dispatch('submitReview'),
    [dispatch]
  );

  const prefillExample = React.useCallback(
    () => dispatch('prefillExample'),
    [dispatch]
  );

  const resetDemo = React.useCallback(
    () => dispatch('resetDemo'),
    [dispatch]
  );

  return {
    updateTextField,
    updateScope,
    setProductionAccess,
    submitReview,
    prefillExample,
    resetDemo,
  };
}
