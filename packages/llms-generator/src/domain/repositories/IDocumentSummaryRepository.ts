/**
 * Domain Repository Interface: IDocumentSummaryRepository
 * 
 * DocumentSummary 영속성을 위한 저장소 인터페이스
 * 클린 아키텍처에서 도메인과 인프라스트럭처 간 경계 정의
 */

import type { DocumentSummary } from '../entities/DocumentSummary.js';
import type { DocumentId } from '../value-objects/DocumentId.js';
import type { CharacterLimit } from '../value-objects/CharacterLimit.js';

/**
 * 문서 요약 검색 조건
 */
export interface SummarySearchCriteria {
  readonly documentId?: DocumentId;
  readonly language?: string;
  readonly characterLimit?: CharacterLimit;
  readonly priorityRange?: {
    min: number;
    max: number;
  };
  readonly tiers?: ReadonlyArray<string>;
  readonly sourceType?: 'minimum' | 'origin' | 'adaptive';
}

/**
 * 문서 요약 정렬 옵션
 */
export interface SummarySortOptions {
  readonly field: 'priority' | 'characterLimit' | 'timestamp' | 'documentId';
  readonly direction: 'asc' | 'desc';
}

/**
 * 저장 결과
 */
export interface SaveResult {
  readonly success: boolean;
  readonly path?: string;
  readonly error?: string;
}

/**
 * 일괄 작업 결과
 */
export interface BatchResult {
  readonly totalProcessed: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly failures: Array<{
    documentSummary: DocumentSummary;
    error: string;
  }>;
}

/**
 * IDocumentSummaryRepository
 * 
 * DocumentSummary 엔티티의 영속성 관리를 위한 저장소 인터페이스
 * 도메인 계층에서 정의하고 인프라 계층에서 구현
 */
export interface IDocumentSummaryRepository {
  /**
   * 단일 문서 요약 저장
   */
  save(summary: DocumentSummary): Promise<SaveResult>;

  /**
   * 여러 문서 요약 일괄 저장
   */
  saveMany(summaries: ReadonlyArray<DocumentSummary>): Promise<BatchResult>;

  /**
   * 고유 ID로 문서 요약 조회
   */
  findByUniqueId(uniqueId: string): Promise<DocumentSummary | null>;

  /**
   * 문서 ID와 언어, 글자 수로 조회
   */
  findByDocumentAndLimit(
    documentId: DocumentId, 
    language: string, 
    characterLimit: CharacterLimit
  ): Promise<DocumentSummary | null>;

  /**
   * 조건에 맞는 모든 문서 요약 조회
   */
  findByCriteria(
    criteria: SummarySearchCriteria,
    sortOptions?: SummarySortOptions
  ): Promise<ReadonlyArray<DocumentSummary>>;

  /**
   * 특정 언어의 모든 문서 요약 조회
   */
  findByLanguage(language: string): Promise<ReadonlyArray<DocumentSummary>>;

  /**
   * 특정 글자 수 제한의 모든 문서 요약 조회
   */
  findByCharacterLimit(characterLimit: number): Promise<ReadonlyArray<DocumentSummary>>;

  /**
   * 문서 요약 존재 여부 확인
   */
  exists(documentId: string, language: string, characterLimit: number): Promise<boolean>;

  /**
   * 문서 요약 삭제
   */
  delete(uniqueId: string): Promise<boolean>;

  /**
   * 조건에 맞는 모든 문서 요약 삭제
   */
  deleteMany(criteria: SummarySearchCriteria): Promise<BatchResult>;

  /**
   * 저장소 통계 정보
   */
  getStats(language?: string): Promise<{
    totalSummaries: number;
    uniqueDocuments: number;
    characterLimits: ReadonlyArray<number>;
    averagePriority: number;
    tierDistribution: Record<string, number>;
  }>;

  /**
   * 중복 제거 (같은 문서의 다른 버전 정리)
   */
  deduplicate(criteria: SummarySearchCriteria): Promise<BatchResult>;
}