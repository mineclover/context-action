import React from 'react';
import {
  buildIncidentEscalationPacket,
  type IncidentActivityEventInput,
  type IncidentValidationField,
  transitionIncidentEscalationState,
  validateIncidentDraft,
} from '../business/incidentBusiness';
import {
  useIncidentEscalationActionHandler,
  useIncidentEscalationRef,
  useIncidentEscalationStoreManager,
} from '../contexts/IncidentEscalationContexts';
import { toValidationViewState } from './incidentHandlerSupport';

interface SubmissionHandlerOptions {
  appendActivity: (event: IncidentActivityEventInput) => void;
}

export function useIncidentSubmissionHandlers({
  appendActivity,
}: SubmissionHandlerOptions) {
  const storeManager = useIncidentEscalationStoreManager();
  const incidentTitleRef = useIncidentEscalationRef('incidentTitleInput');
  const severityRef = useIncidentEscalationRef('severitySelect');
  const affectedUsersRef = useIncidentEscalationRef('affectedUsersInput');
  const communicationChannelRef = useIncidentEscalationRef(
    'communicationChannelSelect'
  );
  const summaryRef = useIncidentEscalationRef('summaryInput');
  const statusPanelRef = useIncidentEscalationRef('statusPanel');

  useIncidentEscalationActionHandler(
    'submitEscalation',
    React.useCallback(async () => {
      const draftStore = storeManager.getStore('draft');
      const validationStore = storeManager.getStore('validation');
      const escalationStore = storeManager.getStore('escalation');
      const draft = draftStore.getValue();

      escalationStore.update((current) =>
        transitionIncidentEscalationState(current, {
          type: 'escalation_requested',
        })
      );
      appendActivity({ type: 'escalation_requested' });

      const validation = validateIncidentDraft(draft);
      const validationView = toValidationViewState(validation);

      validationStore.setValue({
        fieldErrors: validationView.fieldErrors,
        focusField: validationView.focusField,
        hasAttemptedSubmit: true,
        summary: validationView.summary,
      });

      if (!validation.isValid) {
        escalationStore.update((current) =>
          transitionIncidentEscalationState(current, {
            type: 'validation_failed',
          })
        );
        appendActivity({
          type: 'validation_failed',
          issues: validation.issues,
        });

        const focusField = validationView.focusField;
        const focusHandlers: Record<IncidentValidationField, () => void> = {
          incidentTitle: () =>
            incidentTitleRef.executeIfMounted((target) => {
              target.focus();
              target.select?.();
            }),
          severity: () =>
            severityRef.executeIfMounted((target) => {
              target.focus();
            }),
          affectedUsers: () =>
            affectedUsersRef.executeIfMounted((target) => {
              target.focus();
              target.select?.();
            }),
          communicationChannel: () =>
            communicationChannelRef.executeIfMounted((target) => {
              target.focus();
            }),
          summary: () =>
            summaryRef.executeIfMounted((target) => {
              target.focus();
              target.select?.();
            }),
        };

        if (focusField !== null) {
          focusHandlers[focusField]();
        }

        statusPanelRef.executeIfMounted((target) => {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        return;
      }

      escalationStore.update((current) =>
        transitionIncidentEscalationState(current, {
          type: 'validation_passed',
        })
      );
      appendActivity({ type: 'validation_passed' });

      await new Promise((resolve) => setTimeout(resolve, 40));
      const packet = buildIncidentEscalationPacket(draft);
      const escalatedAt = new Date().toISOString();

      escalationStore.update((current) =>
        transitionIncidentEscalationState(current, {
          type: 'packet_ready',
          packet,
          escalatedAt,
          incidentTitle: draft.incidentTitle,
          severity: draft.severity,
        })
      );
      appendActivity({
        type: 'packet_ready',
        priority: packet.priority,
        severity: draft.severity,
        channel: draft.communicationChannel,
      });

      statusPanelRef.executeIfMounted((target) => {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }, [
      affectedUsersRef,
      appendActivity,
      communicationChannelRef,
      incidentTitleRef,
      severityRef,
      statusPanelRef,
      storeManager,
      summaryRef,
    ])
  );
}
