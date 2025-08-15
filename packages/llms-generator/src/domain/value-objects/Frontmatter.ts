/**
 * Domain Value Object: Frontmatter
 * 
 * YAML frontmatter의 불변 값 객체
 * 클린 아키텍처에서 도메인 로직을 캡슐화
 */

import type { DocumentMetadata, PriorityInfo, SummaryMetadata, GenerationInfo } from '../entities/DocumentSummary.js';

export interface FrontmatterData {
  document: DocumentMetadata;
  priority: PriorityInfo;
  summary: SummaryMetadata;
  generated: GenerationInfo;
}

/**
 * Frontmatter Value Object
 * 
 * 불변성과 값 객체 특성을 보장
 */
export class Frontmatter {
  private constructor(private readonly _data: FrontmatterData) {
    this.validateFrontmatter();
  }

  /**
   * 팩토리 메서드
   */
  static create(data: FrontmatterData): Frontmatter {
    return new Frontmatter(data);
  }

  /**
   * 원시 객체로부터 생성
   */
  static fromPlainObject(obj: any): Frontmatter {
    const data: FrontmatterData = {
      document: {
        path: obj.document?.path ?? '',
        title: obj.document?.title ?? '',
        id: obj.document?.id ?? '',
        category: obj.document?.category ?? ''
      },
      priority: {
        score: obj.priority?.score ?? 0,
        tier: obj.priority?.tier ?? 'reference'
      },
      summary: {
        characterLimit: obj.summary?.character_limit ?? 0,
        focus: obj.summary?.focus ?? '',
        strategy: obj.summary?.strategy ?? 'concept-first',
        language: obj.summary?.language ?? 'ko'
      },
      generated: {
        from: obj.generated?.from ?? 'adaptive',
        timestamp: obj.generated?.timestamp ? new Date(obj.generated.timestamp) : new Date(),
        sourceType: obj.generated?.source_type ?? 'content_based',
        characterCount: obj.generated?.character_count ?? 0
      }
    };

    return new Frontmatter(data);
  }

  /**
   * 비즈니스 규칙 검증
   */
  private validateFrontmatter(): void {
    const { document, priority, summary } = this._data;

    if (!document.path || !document.title || !document.id) {
      throw new Error('Document metadata is incomplete');
    }

    if (priority.score < 0 || priority.score > 100) {
      throw new Error(`Invalid priority score: ${priority.score}`);
    }

    if (summary.characterLimit <= 0) {
      throw new Error(`Invalid character limit: ${summary.characterLimit}`);
    }

    const validTiers = ['critical', 'essential', 'important', 'reference', 'supplementary'];
    if (!validTiers.includes(priority.tier)) {
      throw new Error(`Invalid priority tier: ${priority.tier}`);
    }

    const validStrategies = ['concept-first', 'api-first', 'example-first', 'tutorial-first', 'reference-first'];
    if (!validStrategies.includes(summary.strategy)) {
      throw new Error(`Invalid extraction strategy: ${summary.strategy}`);
    }
  }

  /**
   * YAML 직렬화를 위한 플레인 객체 반환
   */
  toPlainObject(): Record<string, any> {
    return {
      document: {
        path: this._data.document.path,
        title: this._data.document.title,
        id: this._data.document.id,
        category: this._data.document.category
      },
      priority: {
        score: this._data.priority.score,
        tier: this._data.priority.tier
      },
      summary: {
        character_limit: this._data.summary.characterLimit,
        focus: this._data.summary.focus,
        strategy: this._data.summary.strategy,
        language: this._data.summary.language
      },
      generated: {
        from: this._data.generated.from,
        timestamp: this._data.generated.timestamp.toISOString(),
        source_type: this._data.generated.sourceType,
        character_count: this._data.generated.characterCount
      }
    };
  }

  /**
   * 도메인 로직: 특정 필드 업데이트 (새 인스턴스 반환)
   */
  updateGenerated(updates: Partial<GenerationInfo>): Frontmatter {
    const newData: FrontmatterData = {
      ...this._data,
      generated: {
        ...this._data.generated,
        ...updates
      }
    };

    return new Frontmatter(newData);
  }

  /**
   * 도메인 로직: 글자 수 제한 업데이트
   */
  updateCharacterLimit(newLimit: number): Frontmatter {
    const newData: FrontmatterData = {
      ...this._data,
      summary: {
        ...this._data.summary,
        characterLimit: newLimit
      }
    };

    return new Frontmatter(newData);
  }

  // Getters
  get data(): FrontmatterData {
    return {
      document: { ...this._data.document },
      priority: { ...this._data.priority },
      summary: { ...this._data.summary },
      generated: { ...this._data.generated }
    };
  }

  get documentId(): string {
    return this._data.document.id;
  }

  get characterLimit(): number {
    return this._data.summary.characterLimit;
  }

  get priorityScore(): number {
    return this._data.priority.score;
  }

  get language(): string {
    return this._data.summary.language;
  }

  /**
   * 값 객체 동등성 비교
   */
  equals(other: Frontmatter): boolean {
    return JSON.stringify(this.toPlainObject()) === JSON.stringify(other.toPlainObject());
  }

  /**
   * 고유 해시 생성
   */
  getHash(): string {
    return `${this._data.document.id}-${this._data.summary.characterLimit}-${this._data.summary.language}`;
  }
}