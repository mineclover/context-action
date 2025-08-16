/**
 * Domain Entity: DocumentSummary
 * 
 * 문서 요약의 핵심 비즈니스 엔티티
 * 클린 아키텍처에서 가장 안정적인 계층
 */

import { DocumentId } from '../value-objects/DocumentId.js';
import { CharacterLimit } from '../value-objects/CharacterLimit.js';
import { Result, Errors, ValidationError } from '../value-objects/Result.js';

export interface DocumentMetadata {
  readonly path: string;
  readonly title: string;
  readonly id: DocumentId;
  readonly category: string;
}

export interface PriorityInfo {
  readonly score: number;
  readonly tier: 'critical' | 'essential' | 'important' | 'reference' | 'supplementary';
}

export interface SummaryMetadata {
  readonly characterLimit: CharacterLimit;
  readonly focus: string;
  readonly strategy: 'concept-first' | 'api-first' | 'example-first' | 'tutorial-first' | 'reference-first';
  readonly language: string;
}

export interface GenerationInfo {
  readonly from: 'minimum' | 'origin' | 'adaptive';
  readonly timestamp: Date;
  readonly sourceType: 'priority_based' | 'content_based';
  readonly characterCount: number;
}

/**
 * DocumentSummary 엔티티
 * 
 * 불변성과 비즈니스 규칙을 보장하는 도메인 엔티티
 */
export class DocumentSummary {
  private constructor(
    private readonly _document: DocumentMetadata,
    private readonly _priority: PriorityInfo,
    private readonly _summary: SummaryMetadata,
    private readonly _content: string,
    private readonly _generated: GenerationInfo
  ) {
    this.validateBusinessRules();
  }

  /**
   * 팩토리 메서드 - 도메인 객체 생성의 단일 진입점
   */
  static create(params: {
    document: DocumentMetadata;
    priority: PriorityInfo;
    summary: SummaryMetadata;
    content: string;
    generated: GenerationInfo;
  }): Result<DocumentSummary, ValidationError> {
    try {
      const summary = new DocumentSummary(
        params.document,
        params.priority,
        params.summary,
        params.content,
        params.generated
      );
      return Result.success(summary);
    } catch (error) {
      return Result.failure(Errors.validation(
        error instanceof Error ? error.message : 'Invalid DocumentSummary parameters'
      ));
    }
  }

  /**
   * 비즈니스 규칙 검증
   */
  private validateBusinessRules(): void {
    // CharacterLimit Value Object가 자체 검증을 담당하므로 내용 길이만 확인
    // 10% 오차 허용 (글자 수는 작성 기준이므로 약간의 오차 허용)
    const maxAllowed = this._summary.characterLimit.value * 1.1;
    if (this._content.length > maxAllowed) {
      throw new Error(
        `Content exceeds character limit: ${this._content.length} > ${this._summary.characterLimit.value} (with 10% tolerance: ${maxAllowed})`
      );
    }

    if (this._priority.score < 0 || this._priority.score > 100) {
      throw new Error(`Priority score must be between 0-100: ${this._priority.score}`);
    }

    if (!this._document.path || !this._document.title) {
      throw new Error('Document path and title are required');
    }

    if (this._content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }
  }

  /**
   * 도메인 로직: 우선순위 기반 정렬을 위한 비교
   */
  comparePriority(other: DocumentSummary): number {
    return other._priority.score - this._priority.score;
  }

  /**
   * 도메인 로직: 글자 수 제한 내에서 적합성 확인
   */
  fitsInCharacterLimit(limit: CharacterLimit): boolean {
    return limit.isSatisfiedBy(this._content);
  }

  /**
   * 도메인 로직: 현재 Character Limit 내에서 적합성 확인
   */
  fitsInCurrentLimit(): boolean {
    return this._summary.characterLimit.isSatisfiedBy(this._content);
  }

  /**
   * 도메인 로직: 컨텐츠 트리밍 (새 인스턴스 반환)
   */
  trimToLimit(newLimit: CharacterLimit): Result<DocumentSummary, ValidationError> {
    if (newLimit.isSatisfiedBy(this._content)) {
      return Result.success(this);
    }

    const trimmedContent = this.smartTrim(this._content, newLimit.value);
    const newGenerated: GenerationInfo = {
      ...this._generated,
      timestamp: new Date(),
      characterCount: trimmedContent.length
    };

    return DocumentSummary.create({
      document: this._document,
      priority: this._priority,
      summary: { ...this._summary, characterLimit: newLimit },
      content: trimmedContent,
      generated: newGenerated
    });
  }

  /**
   * 스마트 트리밍 로직 (문장 단위 자연스러운 끊기)
   */
  private smartTrim(content: string, limit: number): string {
    if (content.length <= limit) {
      return content;
    }

    // 문장 끝을 찾아서 자연스럽게 자르기
    const sentences = content.split(/[.!?]\s+/);
    let result = '';
    
    for (const sentence of sentences) {
      const candidate = result + sentence + '. ';
      if (candidate.length > limit) {
        break;
      }
      result = candidate;
    }

    return result.trim() || content.substring(0, limit - 3) + '...';
  }

  // Getters (읽기 전용 접근)
  get document(): DocumentMetadata {
    return { ...this._document };
  }

  get priority(): PriorityInfo {
    return { ...this._priority };
  }

  get summary(): SummaryMetadata {
    return { ...this._summary };
  }

  get content(): string {
    return this._content;
  }

  get generated(): GenerationInfo {
    return { ...this._generated };
  }

  /**
   * 도메인 로직: 동등성 비교
   */
  equals(other: DocumentSummary): boolean {
    return (
      this._document.id.equals(other._document.id) &&
      this._summary.characterLimit.equals(other._summary.characterLimit) &&
      this._summary.language === other._summary.language
    );
  }

  /**
   * 도메인 로직: 고유 식별자
   */
  getUniqueId(): string {
    return `${this._document.id.value}-${this._summary.characterLimit.value}-${this._summary.language}`;
  }

  /**
   * 도메인 로직: 사용률 계산
   */
  getUtilizationRate(): number {
    return this._summary.characterLimit.getUtilizationRate(this._content);
  }

  /**
   * 도메인 로직: 여유 공간 계산
   */
  getRemainingSpace(): number {
    return this._summary.characterLimit.getRemainingSpace(this._content);
  }

  /**
   * 도메인 로직: 카테고리 추출
   */
  getCategory(): string {
    return this._document.id.getCategory();
  }

  /**
   * 도메인 로직: 복잡도 판단
   */
  isComplex(): boolean {
    return this._document.id.isComplex();
  }
}