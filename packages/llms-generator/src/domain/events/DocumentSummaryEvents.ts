/**
 * DocumentSummary 관련 도메인 이벤트들
 * 
 * DocumentSummary 엔티티의 생명주기 동안 발생하는 이벤트들을 정의
 */

import { DomainEvent, DomainEventWithMetadata, EventMetadata } from './DomainEvent.js';

/**
 * DocumentSummary 생성 이벤트
 */
export class DocumentSummaryCreated extends DomainEventWithMetadata {
  constructor(
    readonly documentId: string,
    readonly documentPath: string,
    readonly characterLimit: number,
    readonly language: string,
    readonly strategy: string,
    readonly contentLength: number,
    metadata?: EventMetadata
  ) {
    super(metadata);
  }

  getEventName(): string {
    return 'DocumentSummaryCreated';
  }

  getData(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      documentPath: this.documentPath,
      characterLimit: this.characterLimit,
      language: this.language,
      strategy: this.strategy,
      contentLength: this.contentLength
    };
  }
}

/**
 * DocumentSummary 트리밍 이벤트
 */
export class DocumentSummaryTrimmed extends DomainEventWithMetadata {
  constructor(
    readonly documentId: string,
    readonly originalLimit: number,
    readonly newLimit: number,
    readonly originalLength: number,
    readonly trimmedLength: number,
    readonly trimmedContent: string,
    metadata?: EventMetadata
  ) {
    super(metadata);
  }

  getEventName(): string {
    return 'DocumentSummaryTrimmed';
  }

  getData(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      originalLimit: this.originalLimit,
      newLimit: this.newLimit,
      originalLength: this.originalLength,
      trimmedLength: this.trimmedLength,
      reductionPercentage: ((this.originalLength - this.trimmedLength) / this.originalLength * 100).toFixed(2)
    };
  }
}

/**
 * DocumentSummary 검증 실패 이벤트
 */
export class DocumentSummaryValidationFailed extends DomainEventWithMetadata {
  constructor(
    readonly documentPath: string,
    readonly validationErrors: string[],
    readonly attemptedData: Record<string, unknown>,
    metadata?: EventMetadata
  ) {
    super(metadata);
  }

  getEventName(): string {
    return 'DocumentSummaryValidationFailed';
  }

  getData(): Record<string, unknown> {
    return {
      documentPath: this.documentPath,
      validationErrors: this.validationErrors,
      attemptedData: this.attemptedData,
      errorCount: this.validationErrors.length
    };
  }
}

/**
 * DocumentSummary 업데이트 이벤트
 */
export class DocumentSummaryUpdated extends DomainEventWithMetadata {
  constructor(
    readonly documentId: string,
    readonly updatedFields: string[],
    readonly previousValues: Record<string, unknown>,
    readonly newValues: Record<string, unknown>,
    metadata?: EventMetadata
  ) {
    super(metadata);
  }

  getEventName(): string {
    return 'DocumentSummaryUpdated';
  }

  getData(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      updatedFields: this.updatedFields,
      previousValues: this.previousValues,
      newValues: this.newValues,
      fieldCount: this.updatedFields.length
    };
  }
}

/**
 * DocumentSummary 삭제 이벤트
 */
export class DocumentSummaryDeleted extends DomainEventWithMetadata {
  constructor(
    readonly documentId: string,
    readonly documentPath: string,
    readonly deletionReason: string,
    readonly finalState: Record<string, unknown>,
    metadata?: EventMetadata
  ) {
    super(metadata);
  }

  getEventName(): string {
    return 'DocumentSummaryDeleted';
  }

  getData(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      documentPath: this.documentPath,
      deletionReason: this.deletionReason,
      finalState: this.finalState
    };
  }
}

/**
 * DocumentSummary 우선순위 변경 이벤트
 */
export class DocumentSummaryPriorityChanged extends DomainEventWithMetadata {
  constructor(
    readonly documentId: string,
    readonly previousScore: number,
    readonly newScore: number,
    readonly previousTier: string,
    readonly newTier: string,
    readonly changeReason: string,
    metadata?: EventMetadata
  ) {
    super(metadata);
  }

  getEventName(): string {
    return 'DocumentSummaryPriorityChanged';
  }

  getData(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      previousScore: this.previousScore,
      newScore: this.newScore,
      previousTier: this.previousTier,
      newTier: this.newTier,
      changeReason: this.changeReason,
      scoreDelta: this.newScore - this.previousScore
    };
  }
}

/**
 * DocumentSummary 일괄 생성 이벤트
 */
export class DocumentSummaryBatchCreated extends DomainEventWithMetadata {
  constructor(
    readonly batchId: string,
    readonly documentCount: number,
    readonly successfulCount: number,
    readonly failedCount: number,
    readonly processingTimeMs: number,
    readonly documentIds: string[],
    readonly failedDocuments: { path: string; error: string }[],
    metadata?: EventMetadata
  ) {
    super(metadata);
  }

  getEventName(): string {
    return 'DocumentSummaryBatchCreated';
  }

  getData(): Record<string, unknown> {
    return {
      batchId: this.batchId,
      documentCount: this.documentCount,
      successfulCount: this.successfulCount,
      failedCount: this.failedCount,
      successRate: ((this.successfulCount / this.documentCount) * 100).toFixed(2),
      processingTimeMs: this.processingTimeMs,
      averageTimePerDocument: (this.processingTimeMs / this.documentCount).toFixed(2),
      documentIds: this.documentIds,
      failedDocuments: this.failedDocuments
    };
  }
}

/**
 * DocumentSummary 캐시 히트 이벤트
 */
export class DocumentSummaryCacheHit extends DomainEvent {
  constructor(
    readonly documentId: string,
    readonly cacheKey: string,
    readonly hitType: 'memory' | 'disk' | 'remote',
    readonly retrievalTimeMs: number
  ) {
    super();
  }

  getEventName(): string {
    return 'DocumentSummaryCacheHit';
  }

  getData(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      cacheKey: this.cacheKey,
      hitType: this.hitType,
      retrievalTimeMs: this.retrievalTimeMs
    };
  }
}

/**
 * DocumentSummary 캐시 미스 이벤트
 */
export class DocumentSummaryCacheMiss extends DomainEvent {
  constructor(
    readonly documentId: string,
    readonly cacheKey: string,
    readonly missReason: 'not_found' | 'expired' | 'invalid',
    readonly fallbackStrategy: string
  ) {
    super();
  }

  getEventName(): string {
    return 'DocumentSummaryCacheMiss';
  }

  getData(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      cacheKey: this.cacheKey,
      missReason: this.missReason,
      fallbackStrategy: this.fallbackStrategy
    };
  }
}

/**
 * DocumentSummary 성능 메트릭 이벤트
 */
export class DocumentSummaryPerformanceMetric extends DomainEvent {
  constructor(
    readonly operation: string,
    readonly documentId: string,
    readonly executionTimeMs: number,
    readonly memoryUsageMB: number,
    readonly contentSize: number,
    readonly resultSize: number
  ) {
    super();
  }

  getEventName(): string {
    return 'DocumentSummaryPerformanceMetric';
  }

  getData(): Record<string, unknown> {
    return {
      operation: this.operation,
      documentId: this.documentId,
      executionTimeMs: this.executionTimeMs,
      memoryUsageMB: this.memoryUsageMB,
      contentSize: this.contentSize,
      resultSize: this.resultSize,
      compressionRatio: this.contentSize > 0 ? (this.resultSize / this.contentSize).toFixed(3) : 0,
      throughputMBps: this.executionTimeMs > 0 ? ((this.contentSize / 1024 / 1024) / (this.executionTimeMs / 1000)).toFixed(3) : 0
    };
  }
}