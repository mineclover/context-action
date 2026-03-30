import type { RenewalReviewDraft } from './renewalDraft';

export interface RenewalFieldErrors {
  accountName?: string;
  renewalWindow?: string;
  usageScore?: string;
  riskNotes?: string;
}

export type RenewalValidationField = keyof RenewalFieldErrors;

export type RenewalValidationCode =
  | 'account_name_required'
  | 'usage_score_range'
  | 'risk_notes_required'
  | 'risk_notes_too_short'
  | 'short_window_requires_sponsor';

export interface RenewalValidationIssue {
  field: RenewalValidationField;
  code: RenewalValidationCode;
}

export interface RenewalValidationResult {
  isValid: boolean;
  issues: RenewalValidationIssue[];
}

const MIN_RISK_NOTE_LENGTH = 24;

export function validateRenewalReviewDraft(
  draft: RenewalReviewDraft
): RenewalValidationResult {
  const issues: RenewalValidationIssue[] = [];

  if (!draft.accountName.trim()) {
    issues.push({
      field: 'accountName',
      code: 'account_name_required',
    });
  }

  if (!Number.isFinite(draft.usageScore) || draft.usageScore < 0 || draft.usageScore > 100) {
    issues.push({
      field: 'usageScore',
      code: 'usage_score_range',
    });
  }

  if (!draft.riskNotes.trim()) {
    issues.push({
      field: 'riskNotes',
      code: 'risk_notes_required',
    });
  } else if (draft.riskNotes.trim().length < MIN_RISK_NOTE_LENGTH) {
    issues.push({
      field: 'riskNotes',
      code: 'risk_notes_too_short',
    });
  }

  if (draft.renewalWindow === '30d' && !draft.executiveSponsor) {
    issues.push({
      field: 'renewalWindow',
      code: 'short_window_requires_sponsor',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
