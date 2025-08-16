/**
 * DocumentSummary 관련 Specification 클래스들
 * 
 * DocumentSummary 엔티티의 비즈니스 규칙을 명시적으로 표현하는 
 * Specification Pattern 구현
 */

import { Specification, PredicateSpecification, SpecificationBuilder } from './Specification.js';
import { DocumentSummary } from '../entities/DocumentSummary.js';
import { CharacterLimit } from '../value-objects/CharacterLimit.js';
import { DocumentId } from '../value-objects/DocumentId.js';

/**
 * 글자 수 제한 명세
 */
export class CharacterLimitSpecification extends Specification<DocumentSummary> {
  constructor(private readonly maxLimit: CharacterLimit) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    return this.maxLimit.isSatisfiedBy(summary.content);
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    const excess = this.maxLimit.getExcessCharacters(summary.content);
    return `Content exceeds character limit by ${excess} characters (${summary.content.length} > ${this.maxLimit.value})`;
  }

  getDescription(): string {
    return `Content must be within ${this.maxLimit.value} characters`;
  }
}

/**
 * 우선순위 점수 범위 명세
 */
export class PriorityRangeSpecification extends Specification<DocumentSummary> {
  constructor(
    private readonly minScore: number,
    private readonly maxScore: number
  ) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    const score = summary.priority.score;
    return score >= this.minScore && score <= this.maxScore;
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    const score = summary.priority.score;
    return `Priority score ${score} is not within range [${this.minScore}, ${this.maxScore}]`;
  }

  getDescription(): string {
    return `Priority score must be between ${this.minScore} and ${this.maxScore}`;
  }
}

/**
 * 우선순위 티어 명세
 */
export class PriorityTierSpecification extends Specification<DocumentSummary> {
  constructor(
    private readonly allowedTiers: Array<'critical' | 'essential' | 'important' | 'reference' | 'supplementary'>
  ) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    return this.allowedTiers.includes(summary.priority.tier);
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    return `Priority tier '${summary.priority.tier}' is not in allowed tiers: [${this.allowedTiers.join(', ')}]`;
  }

  getDescription(): string {
    return `Priority tier must be one of: [${this.allowedTiers.join(', ')}]`;
  }
}

/**
 * 컨텐츠 최소 길이 명세
 */
export class MinimumContentLengthSpecification extends Specification<DocumentSummary> {
  constructor(private readonly minLength: number) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    return summary.content.trim().length >= this.minLength;
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    const actualLength = summary.content.trim().length;
    return `Content too short: ${actualLength} characters (minimum: ${this.minLength})`;
  }

  getDescription(): string {
    return `Content must be at least ${this.minLength} characters`;
  }
}

/**
 * 언어 명세
 */
export class LanguageSpecification extends Specification<DocumentSummary> {
  constructor(private readonly allowedLanguages: string[]) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    return this.allowedLanguages.includes(summary.summary.language);
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    return `Language '${summary.summary.language}' is not supported. Allowed: [${this.allowedLanguages.join(', ')}]`;
  }

  getDescription(): string {
    return `Language must be one of: [${this.allowedLanguages.join(', ')}]`;
  }
}

/**
 * 카테고리 명세
 */
export class CategorySpecification extends Specification<DocumentSummary> {
  constructor(private readonly allowedCategories: string[]) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    return this.allowedCategories.includes(summary.document.category);
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    return `Category '${summary.document.category}' is not allowed. Allowed: [${this.allowedCategories.join(', ')}]`;
  }

  getDescription(): string {
    return `Category must be one of: [${this.allowedCategories.join(', ')}]`;
  }
}

/**
 * 전략 명세
 */
export class StrategySpecification extends Specification<DocumentSummary> {
  constructor(
    private readonly allowedStrategies: Array<'concept-first' | 'api-first' | 'example-first' | 'tutorial-first' | 'reference-first'>
  ) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    return this.allowedStrategies.includes(summary.summary.strategy);
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    return `Strategy '${summary.summary.strategy}' is not allowed. Allowed: [${this.allowedStrategies.join(', ')}]`;
  }

  getDescription(): string {
    return `Strategy must be one of: [${this.allowedStrategies.join(', ')}]`;
  }
}

/**
 * 문서 ID 패턴 명세
 */
export class DocumentIdPatternSpecification extends Specification<DocumentSummary> {
  constructor(private readonly pattern: string) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    return summary.document.id.matchesPattern(this.pattern);
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    return `Document ID '${summary.document.id.value}' does not match pattern: ${this.pattern}`;
  }

  getDescription(): string {
    return `Document ID must match pattern: ${this.pattern}`;
  }
}

/**
 * 컨텐츠 품질 명세 (키워드 존재 여부)
 */
export class ContentQualitySpecification extends Specification<DocumentSummary> {
  constructor(
    private readonly requiredKeywords: string[],
    private readonly forbiddenKeywords: string[] = []
  ) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    const contentLower = summary.content.toLowerCase();
    
    // 필수 키워드 확인
    const hasAllRequired = this.requiredKeywords.every(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    
    // 금지 키워드 확인
    const hasNoForbidden = this.forbiddenKeywords.every(keyword =>
      !contentLower.includes(keyword.toLowerCase())
    );
    
    return hasAllRequired && hasNoForbidden;
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    const contentLower = summary.content.toLowerCase();
    const violations: string[] = [];
    
    // 누락된 필수 키워드
    const missingRequired = this.requiredKeywords.filter(keyword =>
      !contentLower.includes(keyword.toLowerCase())
    );
    if (missingRequired.length > 0) {
      violations.push(`Missing required keywords: [${missingRequired.join(', ')}]`);
    }
    
    // 포함된 금지 키워드
    const foundForbidden = this.forbiddenKeywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    );
    if (foundForbidden.length > 0) {
      violations.push(`Contains forbidden keywords: [${foundForbidden.join(', ')}]`);
    }
    
    return violations.join('; ');
  }

  getDescription(): string {
    const parts = [];
    if (this.requiredKeywords.length > 0) {
      parts.push(`Must contain: [${this.requiredKeywords.join(', ')}]`);
    }
    if (this.forbiddenKeywords.length > 0) {
      parts.push(`Must not contain: [${this.forbiddenKeywords.join(', ')}]`);
    }
    return parts.join(' and ');
  }
}

/**
 * 생성 시간 명세 (얼마나 최근인지)
 */
export class RecentGenerationSpecification extends Specification<DocumentSummary> {
  constructor(private readonly maxAgeHours: number) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    const now = new Date();
    const generated = summary.generated.timestamp;
    const ageMs = now.getTime() - generated.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    
    return ageHours <= this.maxAgeHours;
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    const now = new Date();
    const generated = summary.generated.timestamp;
    const ageMs = now.getTime() - generated.getTime();
    const ageHours = (ageMs / (1000 * 60 * 60)).toFixed(1);
    
    return `Document too old: ${ageHours} hours (maximum: ${this.maxAgeHours} hours)`;
  }

  getDescription(): string {
    return `Document must be generated within ${this.maxAgeHours} hours`;
  }
}

/**
 * 사용률 명세 (Character Limit 대비 컨텐츠 사용률)
 */
export class UtilizationRateSpecification extends Specification<DocumentSummary> {
  constructor(
    private readonly minRate: number,
    private readonly maxRate: number
  ) {
    super();
  }

  isSatisfiedBy(summary: DocumentSummary): boolean {
    const rate = summary.getUtilizationRate();
    return rate >= this.minRate && rate <= this.maxRate;
  }

  getViolationReason(summary: DocumentSummary): string | null {
    if (this.isSatisfiedBy(summary)) {
      return null;
    }
    
    const rate = (summary.getUtilizationRate() * 100).toFixed(1);
    const minPercent = (this.minRate * 100).toFixed(1);
    const maxPercent = (this.maxRate * 100).toFixed(1);
    
    return `Utilization rate ${rate}% is not within range [${minPercent}%, ${maxPercent}%]`;
  }

  getDescription(): string {
    const minPercent = (this.minRate * 100).toFixed(1);
    const maxPercent = (this.maxRate * 100).toFixed(1);
    return `Utilization rate must be between ${minPercent}% and ${maxPercent}%`;
  }
}

/**
 * 사전 정의된 명세 조합들
 */
export class DocumentSummarySpecifications {
  /**
   * 기본 품질 명세 (모든 DocumentSummary가 만족해야 함)
   */
  static basic(): Specification<DocumentSummary> {
    return SpecificationBuilder
      .predicate(
        (summary: DocumentSummary) => summary.content.trim().length > 0,
        'Content is not empty',
        'Content cannot be empty'
      )
      .and(new PriorityRangeSpecification(0, 100))
      .and(new MinimumContentLengthSpecification(10))
      .build();
  }

  /**
   * 프로덕션 품질 명세 (프로덕션 환경에서 사용할 수 있는 품질)
   */
  static production(): Specification<DocumentSummary> {
    return DocumentSummarySpecifications.basic()
      .and(new MinimumContentLengthSpecification(50))
      .and(new UtilizationRateSpecification(0.3, 1.0))
      .and(new LanguageSpecification(['ko', 'en']))
      .and(new PriorityTierSpecification(['critical', 'essential', 'important']));
  }

  /**
   * 고품질 명세 (우수한 품질의 문서 요약)
   */
  static highQuality(): Specification<DocumentSummary> {
    return DocumentSummarySpecifications.production()
      .and(new UtilizationRateSpecification(0.7, 0.95))
      .and(new PriorityRangeSpecification(70, 100))
      .and(new RecentGenerationSpecification(24));
  }

  /**
   * API 문서 명세
   */
  static apiDocument(): Specification<DocumentSummary> {
    return DocumentSummarySpecifications.basic()
      .and(new CategorySpecification(['api', 'api-core', 'api-react']))
      .and(new StrategySpecification(['api-first', 'reference-first']))
      .and(new ContentQualitySpecification(['function', 'method', 'parameter'], ['TODO', 'FIXME']));
  }

  /**
   * 가이드 문서 명세
   */
  static guideDocument(): Specification<DocumentSummary> {
    return DocumentSummarySpecifications.basic()
      .and(new CategorySpecification(['guide', 'tutorial', 'concept']))
      .and(new StrategySpecification(['concept-first', 'tutorial-first']))
      .and(new MinimumContentLengthSpecification(200))
      .and(new ContentQualitySpecification(['단계', 'step', '방법', 'how'], ['TODO', 'WIP']));
  }

  /**
   * 예제 문서 명세
   */
  static exampleDocument(): Specification<DocumentSummary> {
    return DocumentSummarySpecifications.basic()
      .and(new CategorySpecification(['example', 'examples']))
      .and(new StrategySpecification(['example-first', 'tutorial-first']))
      .and(new ContentQualitySpecification(['예제', 'example', 'code'], ['TODO']));
  }

  /**
   * 중요 문서 명세 (높은 우선순위)
   */
  static criticalDocument(): Specification<DocumentSummary> {
    return DocumentSummarySpecifications.basic()
      .and(new PriorityTierSpecification(['critical', 'essential']))
      .and(new PriorityRangeSpecification(80, 100))
      .and(new UtilizationRateSpecification(0.6, 0.95));
  }
}