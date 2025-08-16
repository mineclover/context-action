/**
 * Domain Value Object: CharacterLimit
 * 
 * 문자 수 제한을 표현하는 값 객체
 * 유효한 제한값과 비즈니스 규칙을 캡슐화
 */

export class CharacterLimit {
  private static readonly VALID_LIMITS = [100, 200, 300, 400, 1000, 3000, 5000, 8000, 10000];
  private static readonly DEFAULT_LIMIT = 1000;
  private static readonly MIN_LIMIT = 50;
  private static readonly MAX_LIMIT = 50000;

  private constructor(private readonly _value: number) {
    this.validate();
  }

  /**
   * 숫자로부터 CharacterLimit 생성
   */
  static create(value: number): CharacterLimit {
    return new CharacterLimit(value);
  }

  /**
   * 숫자로부터 CharacterLimit 생성 (표준 Static Method)
   */
  static fromNumber(value: number): CharacterLimit {
    return new CharacterLimit(value);
  }

  /**
   * 기본 제한값으로 생성
   */
  static default(): CharacterLimit {
    return new CharacterLimit(CharacterLimit.DEFAULT_LIMIT);
  }

  /**
   * 설정에서 유효한 제한값들 가져오기
   */
  static getValidLimits(): readonly number[] {
    return CharacterLimit.VALID_LIMITS;
  }

  /**
   * 값이 유효한 제한값인지 확인 (유연한 범위 허용)
   */
  static isValidLimit(value: number): boolean {
    return value >= CharacterLimit.MIN_LIMIT && 
           value <= CharacterLimit.MAX_LIMIT &&
           Number.isInteger(value);
  }

  /**
   * 가장 가까운 유효한 제한값 찾기
   */
  static findNearestValidLimit(value: number): CharacterLimit {
    const validLimits = CharacterLimit.VALID_LIMITS;
    
    let nearest = validLimits[0];
    let minDiff = Math.abs(value - nearest);
    
    for (const limit of validLimits) {
      const diff = Math.abs(value - limit);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = limit;
      }
    }
    
    return new CharacterLimit(nearest);
  }

  /**
   * 카테고리별 권장 제한값 가져오기
   */
  static getRecommendedForCategory(category: string): CharacterLimit {
    const recommendations: Record<string, number> = {
      'guide': 3000,        // 가이드는 상세한 설명 필요
      'concept': 5000,      // 개념 설명은 더 많은 내용 필요
      'api': 1000,          // API 문서는 간결하게
      'examples': 1000,     // 예제는 간결하게
      'reference': 8000     // 참조 문서는 포괄적으로
    };
    
    const limit = recommendations[category] || CharacterLimit.DEFAULT_LIMIT;
    return new CharacterLimit(limit);
  }

  /**
   * 비즈니스 규칙 검증 (유연한 검증)
   */
  private validate(): void {
    if (!Number.isInteger(this._value)) {
      throw new Error('CharacterLimit must be an integer');
    }

    if (this._value < CharacterLimit.MIN_LIMIT) {
      throw new Error(
        `CharacterLimit too small: ${this._value} (minimum: ${CharacterLimit.MIN_LIMIT})`
      );
    }

    if (this._value > CharacterLimit.MAX_LIMIT) {
      throw new Error(
        `CharacterLimit too large: ${this._value} (maximum: ${CharacterLimit.MAX_LIMIT})`
      );
    }

    // VALID_LIMITS는 가이드라인일 뿐, 강제하지 않음
    // 실제 글자 수는 작성 기준이며 약간의 오차는 허용
  }

  /**
   * 값 접근자
   */
  get value(): number {
    return this._value;
  }

  /**
   * 동등성 비교
   */
  equals(other: CharacterLimit): boolean {
    return this._value === other._value;
  }

  /**
   * 크기 비교
   */
  isLessThan(other: CharacterLimit): boolean {
    return this._value < other._value;
  }

  isGreaterThan(other: CharacterLimit): boolean {
    return this._value > other._value;
  }

  isLessOrEqualTo(other: CharacterLimit): boolean {
    return this._value <= other._value;
  }

  isGreaterOrEqualTo(other: CharacterLimit): boolean {
    return this._value >= other._value;
  }

  /**
   * 범위 확인
   */
  isBetween(min: CharacterLimit, max: CharacterLimit): boolean {
    return this._value >= min._value && this._value <= max._value;
  }

  /**
   * 문자열이 이 제한을 만족하는지 확인
   */
  isSatisfiedBy(content: string): boolean {
    return content.length <= this._value;
  }

  /**
   * 제한 대비 사용률 계산 (0.0 ~ 1.0)
   */
  getUtilizationRate(content: string): number {
    return Math.min(content.length / this._value, 1.0);
  }

  /**
   * 여유 공간 계산
   */
  getRemainingSpace(content: string): number {
    return Math.max(this._value - content.length, 0);
  }

  /**
   * 제한 초과 여부 확인
   */
  isExceededBy(content: string): boolean {
    return content.length > this._value;
  }

  /**
   * 초과된 문자 수 계산
   */
  getExcessCharacters(content: string): number {
    return Math.max(content.length - this._value, 0);
  }

  /**
   * 카테고리 분류 (제한값 기준)
   */
  getCategory(): 'micro' | 'mini' | 'small' | 'medium' | 'large' | 'xlarge' {
    if (this._value <= 200) return 'micro';
    if (this._value <= 500) return 'mini';
    if (this._value <= 1500) return 'small';
    if (this._value <= 4000) return 'medium';
    if (this._value <= 10000) return 'large';
    return 'xlarge';
  }

  /**
   * 유사한 제한값들 찾기 (±20% 범위)
   */
  findSimilarLimits(): CharacterLimit[] {
    const margin = this._value * 0.2;
    const min = this._value - margin;
    const max = this._value + margin;
    
    return CharacterLimit.VALID_LIMITS
      .filter(limit => limit >= min && limit <= max && limit !== this._value)
      .map(limit => new CharacterLimit(limit));
  }

  /**
   * 제한값을 배수로 조정
   */
  multiply(factor: number): CharacterLimit {
    if (factor <= 0) {
      throw new Error('Multiplication factor must be positive');
    }
    
    const newValue = Math.round(this._value * factor);
    return CharacterLimit.findNearestValidLimit(newValue);
  }

  /**
   * 제한값을 백분율로 조정
   */
  adjustByPercentage(percentage: number): CharacterLimit {
    const factor = 1 + (percentage / 100);
    return this.multiply(factor);
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * 암시적 숫자 변환을 위한 valueOf
   */
  valueOf(): number {
    return this._value;
  }

  /**
   * Symbol.toPrimitive 구현으로 타입 호환성 향상
   */
  [Symbol.toPrimitive](hint: string): number {
    return this._value;
  }

  /**
   * 사용자 친화적 문자열 표현
   */
  toDisplayString(): string {
    if (this._value >= 1000) {
      const k = this._value / 1000;
      return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    }
    return this._value.toString();
  }

  /**
   * JSON 직렬화를 위한 표현
   */
  toJSON(): number {
    return this._value;
  }

  /**
   * 해시 코드 (캐싱용)
   */
  hashCode(): string {
    return this._value.toString();
  }
}