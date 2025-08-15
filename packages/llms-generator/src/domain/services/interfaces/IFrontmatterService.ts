/**
 * Domain Service Interface: IFrontmatterService
 * 
 * Frontmatter 조작을 위한 도메인 서비스 인터페이스
 * 클린 아키텍처에서 의존성 역전 원칙 적용
 */

import type { Frontmatter } from '../../value-objects/Frontmatter.js';

/**
 * Markdown with Frontmatter 표현
 */
export interface MarkdownWithFrontmatter {
  readonly frontmatter: Frontmatter;
  readonly content: string;
  readonly rawMarkdown: string;
}

/**
 * Frontmatter 파싱 결과
 */
export interface ParseResult {
  readonly success: boolean;
  readonly frontmatter?: Frontmatter;
  readonly content?: string;
  readonly error?: string;
  readonly validationErrors?: string[];
}

/**
 * Frontmatter 생성 옵션
 */
export interface GenerateOptions {
  readonly includeGeneratedTimestamp?: boolean;
  readonly validateOnGenerate?: boolean;
  readonly format?: 'yaml' | 'json';
}

/**
 * IFrontmatterService
 * 
 * Frontmatter와 관련된 모든 도메인 로직을 캡슐화하는 인터페이스
 * 구현체는 Infrastructure 계층에서 제공
 */
export interface IFrontmatterService {
  /**
   * Markdown 파일에서 frontmatter 추출
   */
  parse(markdown: string): ParseResult;

  /**
   * Frontmatter와 content를 결합하여 완전한 markdown 생성
   */
  generate(frontmatter: Frontmatter, content: string, options?: GenerateOptions): MarkdownWithFrontmatter;

  /**
   * 기존 markdown의 frontmatter만 업데이트
   */
  updateFrontmatter(markdown: string, newFrontmatter: Frontmatter): MarkdownWithFrontmatter;

  /**
   * Frontmatter 유효성 검증
   */
  validate(frontmatter: Frontmatter): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * 두 frontmatter 간의 차이점 확인
   */
  compare(frontmatter1: Frontmatter, frontmatter2: Frontmatter): {
    hasChanges: boolean;
    changes: string[];
  };

  /**
   * Frontmatter를 YAML 문자열로 직렬화
   */
  serialize(frontmatter: Frontmatter): string;

  /**
   * YAML 문자열을 Frontmatter로 역직렬화
   */
  deserialize(yamlString: string): Frontmatter;
}