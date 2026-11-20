import React from 'react';
import type {
  AccessRequestDraft,
  AccessScope,
} from '../business/accessBusiness';
import {
  type AccessRequestInspectorTab,
  useAccessRequestDispatch,
  useAccessRequestLayoutDispatch,
} from '../contexts/AccessRequestContexts';

type DraftStringField = 'requesterName' | 'email' | 'justification';

export function useAccessRequestActions() {
  const dispatch = useAccessRequestDispatch();
  const layoutDispatch = useAccessRequestLayoutDispatch();

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
    (productionAccess: boolean) =>
      dispatch('updateDraft', { productionAccess }),
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

  const resetDemo = React.useCallback(() => dispatch('resetDemo'), [dispatch]);

  const setInspectorTab = React.useCallback(
    (tab: AccessRequestInspectorTab) =>
      layoutDispatch('setInspectorTab', { tab }),
    [layoutDispatch]
  );

  return {
    updateTextField,
    updateScope,
    setProductionAccess,
    submitReview,
    prefillExample,
    resetDemo,
    setInspectorTab,
  };
}
