import type { AccessRequestDraft, AccessScope } from './accessDraft';

export type ReviewPriority = 'standard' | 'elevated' | 'critical';

export interface AccessReviewPacket {
  scope: AccessScope;
  reviewers: string[];
  checklist: string[];
  priority: ReviewPriority;
  productionAccess: boolean;
  summary: string;
}

export function buildAccessReviewPacket(
  draft: AccessRequestDraft
): AccessReviewPacket {
  const reviewers = ['Workspace Owner'];
  const checklist = ['소속 확인', '요청 목적 검토'];

  if (draft.scope === 'editor' || draft.scope === 'admin') {
    reviewers.push('Security Reviewer');
    checklist.push('권한 범위 확인');
  }

  if (draft.productionAccess) {
    reviewers.push('Operations Lead');
    checklist.push('프로덕션 접근 승인');
  }

  let priority: ReviewPriority = 'standard';
  if (draft.scope === 'admin') {
    priority = 'elevated';
  }
  if (draft.productionAccess && draft.scope === 'admin') {
    priority = 'critical';
  }

  return {
    scope: draft.scope,
    reviewers,
    checklist,
    priority,
    productionAccess: draft.productionAccess,
    summary: `${draft.requesterName}님의 ${draft.scope} 접근 요청 검토 패키지`,
  };
}
