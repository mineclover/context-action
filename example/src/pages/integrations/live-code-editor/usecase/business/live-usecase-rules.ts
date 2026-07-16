import type { UsecasePacket } from './live-usecase-domain';

export const MIN_USECASE_REASON_LENGTH = 24;

export type UsecaseValidationIssue = {
  readonly code: 'REASON_TOO_SHORT';
  readonly minimumLength: number;
  readonly actualLength: number;
} | null;

export function validateUsecaseReason(reason: string): UsecaseValidationIssue {
  const actualLength = reason.trim().length;
  if (actualLength >= MIN_USECASE_REASON_LENGTH) return null;

  return {
    code: 'REASON_TOO_SHORT',
    minimumLength: MIN_USECASE_REASON_LENGTH,
    actualLength,
  };
}

export function createReviewPacket(resourceId: string): UsecasePacket {
  return {
    priority: resourceId === 'production' ? 'high' : 'normal',
    scope: resourceId,
  };
}
