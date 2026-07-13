import type { RenewalRiskBand, RenewalRiskPacket } from './renewalRiskPacket';

export type RenewalReviewPhase =
  | 'idle'
  | 'validating'
  | 'blocked'
  | 'scoring'
  | 'ready';

export type RenewalReviewState =
  | {
      phase: 'idle';
      reason: 'boot' | 'draft_changed' | 'prefill_loaded' | 'reset';
      packet: null;
      reviewedAt: null;
      accountName: null;
      riskBand: null;
    }
  | {
      phase: 'validating';
      reason: 'review_requested';
      packet: null;
      reviewedAt: null;
      accountName: null;
      riskBand: null;
    }
  | {
      phase: 'blocked';
      reason: 'validation_failed';
      packet: null;
      reviewedAt: null;
      accountName: null;
      riskBand: null;
    }
  | {
      phase: 'scoring';
      reason: 'validation_passed';
      packet: null;
      reviewedAt: null;
      accountName: null;
      riskBand: null;
    }
  | {
      phase: 'ready';
      reason: 'packet_ready';
      packet: RenewalRiskPacket;
      reviewedAt: string;
      accountName: string;
      riskBand: RenewalRiskBand;
    };

export type RenewalReviewEvent =
  | { type: 'draft_changed' }
  | { type: 'prefill_loaded' }
  | { type: 'reset' }
  | { type: 'review_requested' }
  | { type: 'validation_failed' }
  | { type: 'validation_passed' }
  | {
      type: 'packet_ready';
      packet: RenewalRiskPacket;
      reviewedAt: string;
      accountName: string;
      riskBand: RenewalRiskBand;
    };

function createIdleState(
  reason: 'boot' | 'draft_changed' | 'prefill_loaded' | 'reset'
): RenewalReviewState {
  return {
    phase: 'idle',
    reason,
    packet: null,
    reviewedAt: null,
    accountName: null,
    riskBand: null,
  };
}

export function createInitialRenewalReviewState(): RenewalReviewState {
  return createIdleState('boot');
}

export function transitionRenewalReviewState(
  current: RenewalReviewState,
  event: RenewalReviewEvent
): RenewalReviewState {
  switch (event.type) {
    case 'draft_changed':
      return createIdleState('draft_changed');
    case 'prefill_loaded':
      return createIdleState('prefill_loaded');
    case 'reset':
      return createIdleState('reset');
    case 'review_requested':
      if (
        current.phase === 'idle' ||
        current.phase === 'blocked' ||
        current.phase === 'ready'
      ) {
        return {
          phase: 'validating',
          reason: 'review_requested',
          packet: null,
          reviewedAt: null,
          accountName: null,
          riskBand: null,
        };
      }
      return current;
    case 'validation_failed':
      if (current.phase === 'validating') {
        return {
          phase: 'blocked',
          reason: 'validation_failed',
          packet: null,
          reviewedAt: null,
          accountName: null,
          riskBand: null,
        };
      }
      return current;
    case 'validation_passed':
      if (current.phase === 'validating') {
        return {
          phase: 'scoring',
          reason: 'validation_passed',
          packet: null,
          reviewedAt: null,
          accountName: null,
          riskBand: null,
        };
      }
      return current;
    case 'packet_ready':
      if (current.phase === 'scoring') {
        return {
          phase: 'ready',
          reason: 'packet_ready',
          packet: event.packet,
          reviewedAt: event.reviewedAt,
          accountName: event.accountName,
          riskBand: event.riskBand,
        };
      }
      return current;
  }
}
