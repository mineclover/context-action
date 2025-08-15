/**
 * Domain Service Interface: ISummaryExtractor
 * 
 * 다양한 소스로부터 요약을 추출하는 도메인 서비스 인터페이스
 * 클린 아키텍처에서 비즈니스 로직을 캡슐화
 */

import type { DocumentMetadata, PriorityInfo, SummaryMetadata } from '../../entities/DocumentSummary.js';

/**
 * 요약 추출 컨텍스트
 */
export interface ExtractionContext {
  readonly document: DocumentMetadata;
  readonly priority: PriorityInfo;
  readonly summary: SummaryMetadata;
  readonly sourceType: 'minimum' | 'origin' | 'adaptive';
}

/**
 * 요약 추출 결과
 */
export interface ExtractionResult {
  readonly success: boolean;
  readonly content: string;
  readonly actualCharacterCount: number;
  readonly extractionMethod: string;
  readonly warnings?: string[];
  readonly error?: string;
}

/**
 * Minimum 형식 문서 정보
 */
export interface MinimumDocumentInfo {
  readonly documentId: string;
  readonly title: string;
  readonly priority: number;
  readonly tier: string;
  readonly url: string;
  readonly category: string;
}

/**
 * Origin 형식 문서 정보
 */
export interface OriginDocumentInfo {
  readonly documentId: string;
  readonly title: string;
  readonly priority: number;
  readonly tier: string;
  readonly sourcePath: string;
  readonly fullContent: string;
}

/**
 * ISummaryExtractor
 * 
 * 다양한 형식의 문서로부터 요약을 추출하는 도메인 서비스
 */
export interface ISummaryExtractor {
  /**
   * Minimum 형식 (navigation links)에서 요약 추출
   */
  extractFromMinimum(
    minimumData: MinimumDocumentInfo,
    context: ExtractionContext
  ): Promise<ExtractionResult>;

  /**
   * Origin 형식 (complete documents)에서 요약 추출
   */
  extractFromOrigin(
    originData: OriginDocumentInfo,
    context: ExtractionContext
  ): Promise<ExtractionResult>;

  /**
   * 원시 텍스트에서 직접 요약 추출
   */
  extractFromRawText(
    rawText: string,
    context: ExtractionContext
  ): Promise<ExtractionResult>;

  /**
   * 추출 전략별 처리 지원 여부 확인
   */
  supportsStrategy(strategy: string): boolean;

  /**
   * 최적 글자 수 추천
   */
  recommendCharacterLimit(
    contentLength: number,
    strategy: string
  ): number;

  /**
   * 추출 품질 평가
   */
  assessQuality(
    originalContent: string,
    extractedContent: string,
    context: ExtractionContext
  ): {
    score: number; // 0-100
    factors: Record<string, number>;
    suggestions: string[];
  };
}