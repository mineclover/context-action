export type AccessScope = 'viewer' | 'editor' | 'admin';

export interface AccessRequestDraft {
  requesterName: string;
  email: string;
  scope: AccessScope;
  justification: string;
  productionAccess: boolean;
}

export type AccessRequestField = keyof AccessRequestDraft;

export function createEmptyAccessRequestDraft(): AccessRequestDraft {
  return {
    requesterName: '',
    email: '',
    scope: 'viewer',
    justification: '',
    productionAccess: false,
  };
}

export function createExampleAccessRequestDraft(): AccessRequestDraft {
  return {
    requesterName: 'Min Seo',
    email: 'min.seo@example.com',
    scope: 'admin',
    justification:
      '다음 주 프로덕션 롤아웃과 운영 이슈 대응을 위해 관리자 권한이 필요합니다.',
    productionAccess: true,
  };
}
