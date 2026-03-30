import type { AccessRequestDraft } from './accessDraft';

export interface AccessRequestFieldErrors {
  requesterName?: string;
  email?: string;
  scope?: string;
  justification?: string;
}

export type AccessValidationField = keyof AccessRequestFieldErrors;

export type AccessValidationCode =
  | 'requester_name_required'
  | 'email_required'
  | 'email_invalid'
  | 'justification_required'
  | 'justification_too_short'
  | 'production_requires_admin';

export interface AccessValidationIssue {
  field: AccessValidationField;
  code: AccessValidationCode;
}

export interface AccessValidationResult {
  isValid: boolean;
  issues: AccessValidationIssue[];
}

const MIN_JUSTIFICATION_LENGTH = 24;

export function validateAccessRequestDraft(
  draft: AccessRequestDraft
): AccessValidationResult {
  const issues: AccessValidationIssue[] = [];

  if (!draft.requesterName.trim()) {
    issues.push({
      field: 'requesterName',
      code: 'requester_name_required',
    });
  }

  if (!draft.email.trim()) {
    issues.push({
      field: 'email',
      code: 'email_required',
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    issues.push({
      field: 'email',
      code: 'email_invalid',
    });
  }

  if (!draft.justification.trim()) {
    issues.push({
      field: 'justification',
      code: 'justification_required',
    });
  } else if (draft.justification.trim().length < MIN_JUSTIFICATION_LENGTH) {
    issues.push({
      field: 'justification',
      code: 'justification_too_short',
    });
  }

  if (draft.productionAccess && draft.scope !== 'admin') {
    issues.push({
      field: 'scope',
      code: 'production_requires_admin',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
