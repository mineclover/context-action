import type { RenewalReviewDraft, RenewalWindow } from './renewalDraft';

export type RenewalRiskBand = 'healthy' | 'watch' | 'critical';

export interface RenewalRiskPacket {
  riskBand: RenewalRiskBand;
  renewalWindow: RenewalWindow;
  recommendation: string;
  owners: string[];
  nextActions: string[];
  summary: string;
}

function buildOwners(draft: RenewalReviewDraft): string[] {
  const owners = ['Account Owner'];

  if (draft.usageScore < 65) {
    owners.push('Customer Success Lead');
  }

  if (draft.renewalWindow === '30d') {
    owners.push('Renewal Manager');
  }

  if (draft.executiveSponsor) {
    owners.push('Executive Sponsor');
  }

  return owners;
}

function buildRiskBand(draft: RenewalReviewDraft): RenewalRiskBand {
  if (draft.usageScore < 50 || draft.renewalWindow === '30d') {
    return 'critical';
  }

  if (draft.usageScore < 75) {
    return 'watch';
  }

  return 'healthy';
}

function buildNextActions(
  draft: RenewalReviewDraft,
  riskBand: RenewalRiskBand
): string[] {
  const actions = ['최근 사용량 추세 검토'];

  if (riskBand !== 'healthy') {
    actions.push('담당자 리스크 인터뷰 일정 수립');
  }

  if (draft.renewalWindow === '30d') {
    actions.push('갱신 브리지 미팅 준비');
  }

  if (!draft.executiveSponsor) {
    actions.push('executive sponsor 확보 여부 확인');
  }

  return actions;
}

export function buildRenewalRiskPacket(
  draft: RenewalReviewDraft
): RenewalRiskPacket {
  const riskBand = buildRiskBand(draft);
  const owners = buildOwners(draft);
  const nextActions = buildNextActions(draft, riskBand);

  const recommendation =
    riskBand === 'critical'
      ? '즉시 retention plan을 만들고 갱신 리스크를 임원 레벨로 올립니다.'
      : riskBand === 'watch'
        ? '사용량 회복 계획과 stakeholder alignment를 우선 점검합니다.'
        : '기본 갱신 준비 흐름으로 진행합니다.';

  return {
    riskBand,
    renewalWindow: draft.renewalWindow,
    recommendation,
    owners,
    nextActions,
    summary: `${draft.accountName} account renewal review packet`,
  };
}
