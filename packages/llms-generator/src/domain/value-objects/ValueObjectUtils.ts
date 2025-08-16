/**
 * Value Object Utilities
 * 
 * Value Object와 primitive 타입 간의 변환 및 호환성을 위한 유틸리티
 */

import { CharacterLimit } from './CharacterLimit.js';
import { DocumentId } from './DocumentId.js';

/**
 * CharacterLimit 관련 유틸리티
 */
export class CharacterLimitUtils {
  /**
   * 값을 CharacterLimit으로 변환 (null-safe)
   */
  static toCharacterLimit(value: number | CharacterLimit | undefined | null): CharacterLimit {
    if (value === null || value === undefined) {
      return CharacterLimit.default();
    }
    
    if (value instanceof CharacterLimit) {
      return value;
    }
    
    return CharacterLimit.create(value);
  }

  /**
   * 값을 number로 변환 (null-safe)
   */
  static toNumber(value: number | CharacterLimit | undefined | null): number {
    if (value === null || value === undefined) {
      return CharacterLimit.default().value;
    }
    
    if (value instanceof CharacterLimit) {
      return value.value;
    }
    
    return value;
  }

  /**
   * 값이 CharacterLimit보다 작거나 같은지 확인
   */
  static isLessThanOrEqual(left: number | CharacterLimit, right: number | CharacterLimit): boolean {
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);
    return leftNum <= rightNum;
  }

  /**
   * 값이 CharacterLimit보다 큰지 확인
   */
  static isGreaterThan(left: number | CharacterLimit, right: number | CharacterLimit): boolean {
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);
    return leftNum > rightNum;
  }

  /**
   * CharacterLimit 배열을 number 배열로 변환
   */
  static arrayToNumbers(limits: (number | CharacterLimit)[]): number[] {
    return limits.map(limit => this.toNumber(limit));
  }
}

/**
 * DocumentId 관련 유틸리티
 */
export class DocumentIdUtils {
  /**
   * 값을 DocumentId로 변환 (null-safe)
   */
  static toDocumentId(value: string | DocumentId | undefined | null): DocumentId {
    if (value === null || value === undefined) {
      throw new Error('DocumentId cannot be null or undefined');
    }
    
    if (value instanceof DocumentId) {
      return value;
    }
    
    return DocumentId.create(value);
  }

  /**
   * 값을 string으로 변환 (null-safe)
   */
  static toString(value: string | DocumentId | undefined | null): string {
    if (value === null || value === undefined) {
      throw new Error('DocumentId cannot be null or undefined');
    }
    
    if (value instanceof DocumentId) {
      return value.value;
    }
    
    return value;
  }

  /**
   * DocumentId 배열을 string 배열로 변환
   */
  static arrayToStrings(ids: (string | DocumentId)[]): string[] {
    return ids.map(id => this.toString(id));
  }

  /**
   * DocumentId 정렬 비교 함수
   */
  static compare(a: string | DocumentId, b: string | DocumentId): number {
    const aStr = this.toString(a);
    const bStr = this.toString(b);
    return aStr.localeCompare(bStr);
  }
}

/**
 * Value Object 타입 가드
 */
export class ValueObjectTypeGuards {
  static isCharacterLimit(value: any): value is CharacterLimit {
    return value instanceof CharacterLimit;
  }

  static isDocumentId(value: any): value is DocumentId {
    return value instanceof DocumentId;
  }

  static isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  static isString(value: any): value is string {
    return typeof value === 'string';
  }
}

/**
 * 전역 타입 호환성 헬퍼
 */
export class ValueObjectCompatibility {
  /**
   * 자동 타입 변환을 통한 안전한 비교
   */
  static safeCompare<T extends number | CharacterLimit>(
    left: T,
    right: T,
    operator: '<' | '<=' | '>' | '>=' | '==' | '==='
  ): boolean {
    const leftNum = CharacterLimitUtils.toNumber(left as any);
    const rightNum = CharacterLimitUtils.toNumber(right as any);
    
    switch (operator) {
      case '<': return leftNum < rightNum;
      case '<=': return leftNum <= rightNum;
      case '>': return leftNum > rightNum;
      case '>=': return leftNum >= rightNum;
      case '==': return leftNum == rightNum;
      case '===': return leftNum === rightNum;
      default: throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * 안전한 산술 연산
   */
  static safeArithmetic(
    left: number | CharacterLimit,
    right: number | CharacterLimit,
    operator: '+' | '-' | '*' | '/'
  ): number {
    const leftNum = CharacterLimitUtils.toNumber(left);
    const rightNum = CharacterLimitUtils.toNumber(right);
    
    switch (operator) {
      case '+': return leftNum + rightNum;
      case '-': return leftNum - rightNum;
      case '*': return leftNum * rightNum;
      case '/': return leftNum / rightNum;
      default: throw new Error(`Unsupported operator: ${operator}`);
    }
  }
}