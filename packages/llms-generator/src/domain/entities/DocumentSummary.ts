/**
 * Domain Entity: DocumentSummary
 * 
 * 문서 요약의 핵심 비즈니스 엔티티
 * 클린 아키텍처에서 가장 안정적인 계층
 */

export interface DocumentMetadata {
  readonly path: string;
  readonly title: string;
  readonly id: string;
  readonly category: string;
}

export interface PriorityInfo {
  readonly score: number;
  readonly tier: 'critical' | 'essential' | 'important' | 'reference' | 'supplementary';
}

export interface SummaryMetadata {
  readonly characterLimit: number;
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
  }): DocumentSummary {
    return new DocumentSummary(
      params.document,
      params.priority,
      params.summary,
      params.content,
      params.generated
    );
  }

  /**
   * 비즈니스 규칙 검증
   */
  private validateBusinessRules(): void {
    if (this._content.length > this._summary.characterLimit * 1.1) {
      throw new Error(
        `Content exceeds character limit: ${this._content.length} > ${this._summary.characterLimit}`
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
  fitsInCharacterLimit(limit: number): boolean {
    return this._content.length <= limit;
  }

  /**
   * 도메인 로직: 컨텐츠 트리밍 (새 인스턴스 반환)
   */
  trimToLimit(newLimit: number): DocumentSummary {
    if (this._content.length <= newLimit) {
      return this;
    }

    const trimmedContent = this.smartTrim(this._content, newLimit);
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
      this._document.id === other._document.id &&
      this._summary.characterLimit === other._summary.characterLimit &&
      this._summary.language === other._summary.language
    );
  }

  /**
   * 도메인 로직: 고유 식별자
   */
  getUniqueId(): string {
    return `${this._document.id}-${this._summary.characterLimit}-${this._summary.language}`;
  }
}