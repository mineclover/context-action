/**
 * Domain Value Object: DocumentId
 * 
 * 문서 ID를 표현하는 값 객체
 * 더블 대시 규칙과 비즈니스 규칙을 캡슐화
 */

export class DocumentId {
  private constructor(private readonly _value: string) {
    this.validate();
  }

  /**
   * 문자열로부터 DocumentId 생성
   */
  static create(value: string): DocumentId {
    return new DocumentId(value);
  }

  /**
   * 파일 경로로부터 DocumentId 생성 (더블 대시 규칙 적용)
   */
  static fromPath(sourcePath: string, language?: string): DocumentId {
    // 언어 프리픽스 제거 (있는 경우)
    let pathToProcess = sourcePath;
    if (language) {
      pathToProcess = sourcePath.replace(`${language}/`, '');
    }

    // 확장자 제거
    const withoutExt = pathToProcess.replace(/\.md$/, '');
    
    // 경로 분할
    const pathParts = withoutExt.split('/');
    
    // 더블 대시 방식: 경로는 --, 단어 내부는 -
    const id = pathParts.join('--').toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{3,}/g, '--')  // 3개 이상 연속 대시를 --로 변환
      .replace(/^-+|-+$/g, ''); // 앞뒤 대시 제거
      
    return new DocumentId(id);
  }

  /**
   * 비즈니스 규칙 검증
   */
  private validate(): void {
    if (!this._value || this._value.trim().length === 0) {
      throw new Error('DocumentId cannot be empty');
    }

    if (this._value.length > 200) {
      throw new Error(`DocumentId too long: ${this._value.length} characters (max: 200)`);
    }

    // 더블 대시 규칙 검증
    if (!/^[a-z0-9-]+$/.test(this._value)) {
      throw new Error(
        'DocumentId can only contain lowercase letters, numbers, and dashes'
      );
    }

    // 연속된 더블 대시나 시작/끝 대시 검증
    if (this._value.startsWith('-') || this._value.endsWith('-')) {
      throw new Error('DocumentId cannot start or end with dashes');
    }

    if (this._value.includes('---')) {
      throw new Error('DocumentId cannot contain triple dashes or more');
    }
  }

  /**
   * 값 접근자
   */
  get value(): string {
    return this._value;
  }

  /**
   * 동등성 비교
   */
  equals(other: DocumentId): boolean {
    return this._value === other._value;
  }

  /**
   * 해시 코드 (캐싱용)
   */
  hashCode(): string {
    return this._value;
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this._value;
  }

  /**
   * 카테고리 추출 (첫 번째 세그먼트)
   */
  getCategory(): string {
    if (this._value.includes('--')) {
      return this._value.split('--')[0];
    }
    return this._value.split('-')[0];
  }

  /**
   * 복잡도 판단 (경로 깊이 기반)
   */
  isComplex(): boolean {
    return this._value.includes('--');
  }

  /**
   * 경로 깊이 계산
   */
  getDepth(): number {
    if (this._value.includes('--')) {
      return this._value.split('--').length;
    }
    return 1;
  }

  /**
   * ID가 특정 패턴과 일치하는지 확인
   */
  matchesPattern(pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(this._value);
  }

  /**
   * 유니크 파일명 생성 (캐릭터 제한 포함)
   */
  createUniqueFileName(characterLimit: number, language: string): string {
    return `${this._value}-${characterLimit}-${language}.md`;
  }

  /**
   * 파일 시스템 안전한 버전 (특수 문자 제거)
   */
  toFileSystemSafe(): string {
    return this._value.replace(/[^a-z0-9-]/g, '-');
  }
}