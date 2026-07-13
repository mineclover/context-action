import type { IncidentDraft } from './incidentDraft';

export interface IncidentFieldErrors {
  incidentTitle?: string;
  severity?: string;
  affectedUsers?: string;
  communicationChannel?: string;
  summary?: string;
}

export type IncidentValidationField = keyof IncidentFieldErrors;

export type IncidentValidationCode =
  | 'incident_title_required'
  | 'affected_users_min'
  | 'summary_required'
  | 'summary_too_short'
  | 'sev1_requires_statuspage';

export interface IncidentValidationIssue {
  field: IncidentValidationField;
  code: IncidentValidationCode;
}

export interface IncidentValidationResult {
  isValid: boolean;
  issues: IncidentValidationIssue[];
}

const MIN_SUMMARY_LENGTH = 24;

export function validateIncidentDraft(
  draft: IncidentDraft
): IncidentValidationResult {
  const issues: IncidentValidationIssue[] = [];

  if (!draft.incidentTitle.trim()) {
    issues.push({
      field: 'incidentTitle',
      code: 'incident_title_required',
    });
  }

  if (!Number.isFinite(draft.affectedUsers) || draft.affectedUsers < 1) {
    issues.push({
      field: 'affectedUsers',
      code: 'affected_users_min',
    });
  }

  if (!draft.summary.trim()) {
    issues.push({
      field: 'summary',
      code: 'summary_required',
    });
  } else if (draft.summary.trim().length < MIN_SUMMARY_LENGTH) {
    issues.push({
      field: 'summary',
      code: 'summary_too_short',
    });
  }

  if (
    draft.severity === 'sev1' &&
    draft.communicationChannel !== 'statuspage'
  ) {
    issues.push({
      field: 'communicationChannel',
      code: 'sev1_requires_statuspage',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
