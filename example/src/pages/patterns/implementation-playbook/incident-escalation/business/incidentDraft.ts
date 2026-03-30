export type IncidentSeverity = 'sev3' | 'sev2' | 'sev1';
export type CommunicationChannel = 'slack' | 'email' | 'statuspage';

export interface IncidentDraft {
  incidentTitle: string;
  severity: IncidentSeverity;
  affectedUsers: number;
  rollbackReady: boolean;
  communicationChannel: CommunicationChannel;
  summary: string;
}

export type IncidentDraftField = keyof IncidentDraft;

export function createEmptyIncidentDraft(): IncidentDraft {
  return {
    incidentTitle: '',
    severity: 'sev3',
    affectedUsers: 1,
    rollbackReady: false,
    communicationChannel: 'slack',
    summary: '',
  };
}

export function createExampleIncidentDraft(): IncidentDraft {
  return {
    incidentTitle: 'API gateway latency spike',
    severity: 'sev1',
    affectedUsers: 12000,
    rollbackReady: true,
    communicationChannel: 'statuspage',
    summary:
      '주요 API 요청이 급격히 느려져 전체 결제 흐름에 영향이 발생했습니다. 즉시 escalaton bridge와 외부 공지가 필요합니다.',
  };
}
