import type { AccessScope } from './accessDraft';
import type { AccessReviewPacket } from './accessReviewPacket';

export type AccessReviewPhase =
  | 'idle'
  | 'validating'
  | 'blocked'
  | 'packaging'
  | 'ready';

export type AccessReviewState =
  | {
      phase: 'idle';
      reason: 'boot' | 'draft_changed' | 'prefill_loaded' | 'reset';
      packet: null;
      reviewedAt: null;
      requesterName: null;
      scope: null;
    }
  | {
      phase: 'validating';
      reason: 'review_requested';
      packet: null;
      reviewedAt: null;
      requesterName: null;
      scope: null;
    }
  | {
      phase: 'blocked';
      reason: 'validation_failed';
      packet: null;
      reviewedAt: null;
      requesterName: null;
      scope: null;
    }
  | {
      phase: 'packaging';
      reason: 'validation_passed';
      packet: null;
      reviewedAt: null;
      requesterName: null;
      scope: null;
    }
  | {
      phase: 'ready';
      reason: 'packet_ready';
      packet: AccessReviewPacket;
      reviewedAt: string;
      requesterName: string;
      scope: AccessScope;
    };

export type AccessReviewEvent =
  | { type: 'draft_changed' }
  | { type: 'prefill_loaded' }
  | { type: 'reset' }
  | { type: 'review_requested' }
  | { type: 'validation_failed' }
  | { type: 'validation_passed' }
  | {
      type: 'packet_ready';
      packet: AccessReviewPacket;
      reviewedAt: string;
      requesterName: string;
      scope: AccessScope;
    };

function createIdleState(
  reason: 'boot' | 'draft_changed' | 'prefill_loaded' | 'reset'
): AccessReviewState {
  return {
    phase: 'idle',
    reason,
    packet: null,
    reviewedAt: null,
    requesterName: null,
    scope: null,
  };
}

export function createInitialAccessReviewState(): AccessReviewState {
  return createIdleState('boot');
}

export function transitionAccessReviewState(
  current: AccessReviewState,
  event: AccessReviewEvent
): AccessReviewState {
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
          requesterName: null,
          scope: null,
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
          requesterName: null,
          scope: null,
        };
      }
      return current;
    case 'validation_passed':
      if (current.phase === 'validating') {
        return {
          phase: 'packaging',
          reason: 'validation_passed',
          packet: null,
          reviewedAt: null,
          requesterName: null,
          scope: null,
        };
      }
      return current;
    case 'packet_ready':
      if (current.phase === 'packaging') {
        return {
          phase: 'ready',
          reason: 'packet_ready',
          packet: event.packet,
          reviewedAt: event.reviewedAt,
          requesterName: event.requesterName,
          scope: event.scope,
        };
      }
      return current;
  }
}
