import React from 'react';
import type {
  CommunicationChannel,
  IncidentDraft,
  IncidentSeverity,
} from '../business/incidentBusiness';
import {
  type IncidentEscalationInspectorTab,
  useIncidentEscalationDispatch,
  useIncidentEscalationLayoutDispatch,
} from '../contexts/IncidentEscalationContexts';

type DraftStringField = 'incidentTitle' | 'summary';

export function useIncidentEscalationActions() {
  const dispatch = useIncidentEscalationDispatch();
  const layoutDispatch = useIncidentEscalationLayoutDispatch();

  const updateTextField = React.useCallback(
    (field: DraftStringField, value: string) => {
      return dispatch('updateDraft', {
        [field]: value,
      } as Partial<IncidentDraft>);
    },
    [dispatch]
  );

  const updateSeverity = React.useCallback(
    (severity: IncidentSeverity) => dispatch('updateDraft', { severity }),
    [dispatch]
  );

  const updateAffectedUsers = React.useCallback(
    (affectedUsers: number) => dispatch('updateDraft', { affectedUsers }),
    [dispatch]
  );

  const setRollbackReady = React.useCallback(
    (rollbackReady: boolean) => dispatch('updateDraft', { rollbackReady }),
    [dispatch]
  );

  const updateCommunicationChannel = React.useCallback(
    (communicationChannel: CommunicationChannel) =>
      dispatch('updateDraft', { communicationChannel }),
    [dispatch]
  );

  const submitEscalation = React.useCallback(
    () => dispatch('submitEscalation'),
    [dispatch]
  );

  const prefillExample = React.useCallback(
    () => dispatch('prefillExample'),
    [dispatch]
  );

  const resetDemo = React.useCallback(() => dispatch('resetDemo'), [dispatch]);

  const setInspectorTab = React.useCallback(
    (tab: IncidentEscalationInspectorTab) =>
      layoutDispatch('setInspectorTab', { tab }),
    [layoutDispatch]
  );

  return {
    updateTextField,
    updateSeverity,
    updateAffectedUsers,
    setRollbackReady,
    updateCommunicationChannel,
    submitEscalation,
    prefillExample,
    resetDemo,
    setInspectorTab,
  };
}
