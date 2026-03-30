export type RenewalWindow = '30d' | '60d' | '90d';

export interface RenewalReviewDraft {
  accountName: string;
  renewalWindow: RenewalWindow;
  usageScore: number;
  riskNotes: string;
  executiveSponsor: boolean;
}

export type RenewalDraftField = keyof RenewalReviewDraft;

export function createEmptyRenewalReviewDraft(): RenewalReviewDraft {
  return {
    accountName: '',
    renewalWindow: '90d',
    usageScore: 50,
    riskNotes: '',
    executiveSponsor: false,
  };
}

export function createExampleRenewalReviewDraft(): RenewalReviewDraft {
  return {
    accountName: 'Northstar Commerce',
    renewalWindow: '30d',
    usageScore: 42,
    riskNotes:
      '활성 사용량이 지난 두 달 연속 하락했고, 핵심 관리자 교체 이후 내부 champion이 약해졌습니다.',
    executiveSponsor: true,
  };
}
