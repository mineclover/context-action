/**
 * Specification Pattern Implementation
 * 
 * 복잡한 비즈니스 규칙을 명시적이고 재사용 가능하게 표현하기 위한 
 * Specification 패턴 구현
 */

/**
 * 기본 Specification 추상 클래스
 */
export abstract class Specification<T> {
  /**
   * 엔티티가 명세를 만족하는지 확인
   */
  abstract isSatisfiedBy(entity: T): boolean;

  /**
   * 명세를 만족하지 않을 때의 이유 반환
   */
  abstract getViolationReason(entity: T): string | null;

  /**
   * AND 조합
   */
  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  /**
   * OR 조합
   */
  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  /**
   * NOT 조합
   */
  not(): Specification<T> {
    return new NotSpecification(this);
  }

  /**
   * 명세 설명 반환
   */
  abstract getDescription(): string;

  /**
   * 복합 명세인지 확인
   */
  isComposite(): boolean {
    return false;
  }

  /**
   * 명세를 만족하는 엔티티들 필터링
   */
  filter(entities: T[]): T[] {
    return entities.filter(entity => this.isSatisfiedBy(entity));
  }

  /**
   * 명세를 만족하지 않는 엔티티들과 그 이유 반환
   */
  getViolations(entities: T[]): Array<{ entity: T; reason: string }> {
    return entities
      .map(entity => ({ entity, reason: this.getViolationReason(entity) }))
      .filter(item => item.reason !== null) as Array<{ entity: T; reason: string }>;
  }
}

/**
 * AND 조합 명세
 */
export class AndSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
  }

  getViolationReason(entity: T): string | null {
    const leftReason = this.left.getViolationReason(entity);
    const rightReason = this.right.getViolationReason(entity);

    if (leftReason && rightReason) {
      return `${leftReason} AND ${rightReason}`;
    }
    return leftReason || rightReason;
  }

  getDescription(): string {
    return `(${this.left.getDescription()}) AND (${this.right.getDescription()})`;
  }

  isComposite(): boolean {
    return true;
  }
}

/**
 * OR 조합 명세
 */
export class OrSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
  }

  getViolationReason(entity: T): string | null {
    const leftReason = this.left.getViolationReason(entity);
    const rightReason = this.right.getViolationReason(entity);

    // OR 조합에서는 둘 다 실패했을 때만 위반
    if (leftReason && rightReason) {
      return `${leftReason} OR ${rightReason}`;
    }
    return null;
  }

  getDescription(): string {
    return `(${this.left.getDescription()}) OR (${this.right.getDescription()})`;
  }

  isComposite(): boolean {
    return true;
  }
}

/**
 * NOT 조합 명세
 */
export class NotSpecification<T> extends Specification<T> {
  constructor(private readonly spec: Specification<T>) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return !this.spec.isSatisfiedBy(entity);
  }

  getViolationReason(entity: T): string | null {
    if (this.spec.isSatisfiedBy(entity)) {
      return `NOT (${this.spec.getDescription()})`;
    }
    return null;
  }

  getDescription(): string {
    return `NOT (${this.spec.getDescription()})`;
  }

  isComposite(): boolean {
    return true;
  }
}

/**
 * 항상 참인 명세
 */
export class TrueSpecification<T> extends Specification<T> {
  isSatisfiedBy(_entity: T): boolean {
    return true;
  }

  getViolationReason(_entity: T): string | null {
    return null;
  }

  getDescription(): string {
    return 'Always True';
  }
}

/**
 * 항상 거짓인 명세
 */
export class FalseSpecification<T> extends Specification<T> {
  isSatisfiedBy(_entity: T): boolean {
    return false;
  }

  getViolationReason(_entity: T): string | null {
    return 'Always False';
  }

  getDescription(): string {
    return 'Always False';
  }
}

/**
 * 범용 람다 명세
 */
export class PredicateSpecification<T> extends Specification<T> {
  constructor(
    private readonly predicate: (entity: T) => boolean,
    private readonly description: string,
    private readonly violationMessage: string
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.predicate(entity);
  }

  getViolationReason(entity: T): string | null {
    return this.isSatisfiedBy(entity) ? null : this.violationMessage;
  }

  getDescription(): string {
    return this.description;
  }
}

/**
 * 명세 빌더 (Fluent Interface)
 */
export class SpecificationBuilder<T> {
  private current: Specification<T>;

  constructor(initial: Specification<T>) {
    this.current = initial;
  }

  static for<T>(spec: Specification<T>): SpecificationBuilder<T> {
    return new SpecificationBuilder(spec);
  }

  static predicate<T>(
    predicate: (entity: T) => boolean,
    description: string,
    violationMessage: string
  ): SpecificationBuilder<T> {
    return new SpecificationBuilder(
      new PredicateSpecification(predicate, description, violationMessage)
    );
  }

  and(spec: Specification<T>): SpecificationBuilder<T> {
    this.current = this.current.and(spec);
    return this;
  }

  or(spec: Specification<T>): SpecificationBuilder<T> {
    this.current = this.current.or(spec);
    return this;
  }

  not(): SpecificationBuilder<T> {
    this.current = this.current.not();
    return this;
  }

  build(): Specification<T> {
    return this.current;
  }
}

/**
 * 명세 유틸리티 함수들
 */
export class SpecificationUtils {
  /**
   * 여러 명세의 AND 조합
   */
  static allOf<T>(...specs: Specification<T>[]): Specification<T> {
    if (specs.length === 0) {
      return new TrueSpecification<T>();
    }
    
    return specs.reduce((combined, spec) => combined.and(spec));
  }

  /**
   * 여러 명세의 OR 조합
   */
  static anyOf<T>(...specs: Specification<T>[]): Specification<T> {
    if (specs.length === 0) {
      return new FalseSpecification<T>();
    }
    
    return specs.reduce((combined, spec) => combined.or(spec));
  }

  /**
   * 명세 검증 결과
   */
  static validate<T>(
    entity: T,
    ...specs: Specification<T>[]
  ): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    for (const spec of specs) {
      const reason = spec.getViolationReason(entity);
      if (reason) {
        violations.push(reason);
      }
    }
    
    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * 엔티티 배열에 대한 상세 검증
   */
  static validateBatch<T>(
    entities: T[],
    ...specs: Specification<T>[]
  ): {
    totalCount: number;
    validCount: number;
    invalidCount: number;
    validEntities: T[];
    invalidEntities: Array<{ entity: T; violations: string[] }>;
  } {
    const validEntities: T[] = [];
    const invalidEntities: Array<{ entity: T; violations: string[] }> = [];
    
    for (const entity of entities) {
      const validation = SpecificationUtils.validate(entity, ...specs);
      
      if (validation.isValid) {
        validEntities.push(entity);
      } else {
        invalidEntities.push({
          entity,
          violations: validation.violations
        });
      }
    }
    
    return {
      totalCount: entities.length,
      validCount: validEntities.length,
      invalidCount: invalidEntities.length,
      validEntities,
      invalidEntities
    };
  }
}