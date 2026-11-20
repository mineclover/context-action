import { useStoreValue } from '@context-action/react';
import { buildIncidentEscalationPacket } from '../business/incidentBusiness';
import {
  useIncidentEscalationLayoutStore,
  useIncidentEscalationRef,
  useIncidentEscalationStore,
} from '../contexts/IncidentEscalationContexts';
import {
  isEscalationBusy,
  toActivityEntry,
  toEscalationViewState,
} from '../handlers/incidentHandlerSupport';

export function useIncidentEscalationData() {
  const draftStore = useIncidentEscalationStore('draft');
  const validationStore = useIncidentEscalationStore('validation');
  const escalationStore = useIncidentEscalationStore('escalation');
  const activityStore = useIncidentEscalationStore('activity');
  const inspectorTabStore = useIncidentEscalationLayoutStore('inspectorTab');

  const draft = useStoreValue(draftStore);
  const validation = useStoreValue(validationStore);
  const escalation = useStoreValue(escalationStore);
  const activity = useStoreValue(activityStore);
  const inspectorTab = useStoreValue(inspectorTabStore);
  const livePacket = buildIncidentEscalationPacket(draft);
  const escalationView = toEscalationViewState(escalation);
  const activityEntries = activity.map(toActivityEntry);

  return {
    draft,
    validation,
    escalation,
    escalationView,
    livePacket,
    activity: activityEntries,
    inspectorTab,
    isBusy: isEscalationBusy(escalation),
    hasErrors: Object.keys(validation.fieldErrors).length > 0,
  };
}

export function useIncidentEscalationRefs() {
  return {
    incidentTitleRef: useIncidentEscalationRef('incidentTitleInput'),
    severityRef: useIncidentEscalationRef('severitySelect'),
    affectedUsersRef: useIncidentEscalationRef('affectedUsersInput'),
    communicationChannelRef: useIncidentEscalationRef(
      'communicationChannelSelect'
    ),
    summaryRef: useIncidentEscalationRef('summaryInput'),
    statusPanelRef: useIncidentEscalationRef('statusPanel'),
  };
}
