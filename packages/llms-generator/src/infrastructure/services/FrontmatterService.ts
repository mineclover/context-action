/**
 * Infrastructure Implementation: FrontmatterService
 * 
 * Frontmatter 조작을 위한 구체적인 구현체
 * 외부 라이브러리 (gray-matter) 의존성 캡슐화
 */

import matter from 'gray-matter';
import type {
  IFrontmatterService,
  MarkdownWithFrontmatter,
  ParseResult,
  GenerateOptions
} from '../../domain/services/interfaces/IFrontmatterService.js';
import { Frontmatter } from '../../domain/value-objects/Frontmatter.js';
import { CharacterLimitUtils } from '../../domain/value-objects/ValueObjectUtils.js';

/**
 * FrontmatterService 구현
 * 
 * gray-matter 라이브러리를 사용한 YAML frontmatter 처리
 */
export class FrontmatterService implements IFrontmatterService {
  /**
   * Markdown 파일에서 frontmatter 추출
   */
  parse(markdown: string): ParseResult {
    try {
      const parsed = matter(markdown);
      
      if (!parsed.data || Object.keys(parsed.data).length === 0) {
        return {
          success: false,
          error: 'No frontmatter found in markdown'
        };
      }

      const frontmatter = Frontmatter.fromPlainObject(parsed.data);
      const validation = this.validate(frontmatter);

      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid frontmatter format',
          validationErrors: validation.errors
        };
      }

      return {
        success: true,
        frontmatter,
        content: parsed.content.trim()
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse frontmatter: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Frontmatter와 content를 결합하여 완전한 markdown 생성
   */
  generate(
    frontmatter: Frontmatter, 
    content: string, 
    options: GenerateOptions = {}
  ): MarkdownWithFrontmatter {
    const {
      includeGeneratedTimestamp = true,
      validateOnGenerate = true,
      format = 'yaml'
    } = options;

    // 생성 시간 업데이트
    let finalFrontmatter = frontmatter;
    if (includeGeneratedTimestamp) {
      finalFrontmatter = frontmatter.updateGenerated({
        timestamp: new Date(),
        characterCount: content.length
      });
    }

    // 검증
    if (validateOnGenerate) {
      const validation = this.validate(finalFrontmatter);
      if (!validation.isValid) {
        throw new Error(`Invalid frontmatter: ${validation.errors.join(', ')}`);
      }
    }

    // YAML frontmatter 생성
    const yamlData = finalFrontmatter.toPlainObject();
    const rawMarkdown = matter.stringify(content, yamlData);

    return {
      frontmatter: finalFrontmatter,
      content: content.trim(),
      rawMarkdown
    };
  }

  /**
   * 기존 markdown의 frontmatter만 업데이트
   */
  updateFrontmatter(markdown: string, newFrontmatter: Frontmatter): MarkdownWithFrontmatter {
    const parseResult = this.parse(markdown);
    
    if (!parseResult.success || !parseResult.content) {
      throw new Error(`Cannot update frontmatter: ${parseResult.error}`);
    }

    return this.generate(newFrontmatter, parseResult.content);
  }

  /**
   * Frontmatter 유효성 검증
   */
  validate(frontmatter: Frontmatter): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const data = frontmatter.data;

      // 필수 필드 검증
      if (!data.document.path) {
        errors.push('Document path is required');
      }

      if (!data.document.title) {
        errors.push('Document title is required');
      }

      if (!data.document.id) {
        errors.push('Document ID is required');
      }

      // 우선순위 범위 검증
      if (data.priority.score < 0 || data.priority.score > 100) {
        errors.push('Priority score must be between 0-100');
      }

      // 글자 수 제한 검증
      if (CharacterLimitUtils.isLessThanOrEqual(data.summary.characterLimit, 0)) {
        errors.push('Character limit must be positive');
      }

      // 열거값 검증
      const validTiers = ['critical', 'essential', 'important', 'reference', 'supplementary'];
      if (!validTiers.includes(data.priority.tier)) {
        errors.push(`Invalid priority tier: ${data.priority.tier}`);
      }

      const validStrategies = ['concept-first', 'api-first', 'example-first', 'tutorial-first', 'reference-first'];
      if (!validStrategies.includes(data.summary.strategy)) {
        errors.push(`Invalid extraction strategy: ${data.summary.strategy}`);
      }

      const validSources = ['minimum', 'origin', 'adaptive'];
      if (!validSources.includes(data.generated.from)) {
        errors.push(`Invalid generation source: ${data.generated.from}`);
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 두 frontmatter 간의 차이점 확인
   */
  compare(frontmatter1: Frontmatter, frontmatter2: Frontmatter): {
    hasChanges: boolean;
    changes: string[];
  } {
    const changes: string[] = [];
    const data1 = frontmatter1.data;
    const data2 = frontmatter2.data;

    // 문서 메타데이터 비교
    if (data1.document.path !== data2.document.path) {
      changes.push(`Path changed: ${data1.document.path} → ${data2.document.path}`);
    }
    if (data1.document.title !== data2.document.title) {
      changes.push(`Title changed: ${data1.document.title} → ${data2.document.title}`);
    }

    // 우선순위 비교
    if (data1.priority.score !== data2.priority.score) {
      changes.push(`Priority score changed: ${data1.priority.score} → ${data2.priority.score}`);
    }
    if (data1.priority.tier !== data2.priority.tier) {
      changes.push(`Priority tier changed: ${data1.priority.tier} → ${data2.priority.tier}`);
    }

    // 요약 메타데이터 비교
    if (data1.summary.characterLimit !== data2.summary.characterLimit) {
      changes.push(`Character limit changed: ${data1.summary.characterLimit} → ${data2.summary.characterLimit}`);
    }
    if (data1.summary.strategy !== data2.summary.strategy) {
      changes.push(`Strategy changed: ${data1.summary.strategy} → ${data2.summary.strategy}`);
    }

    return {
      hasChanges: changes.length > 0,
      changes
    };
  }

  /**
   * Frontmatter를 YAML 문자열로 직렬화
   */
  serialize(frontmatter: Frontmatter): string {
    const yamlData = frontmatter.toPlainObject();
    return matter.stringify('', yamlData).replace(/\n$/, ''); // 끝의 개행 제거
  }

  /**
   * YAML 문자열을 Frontmatter로 역직렬화
   */
  deserialize(yamlString: string): Frontmatter {
    try {
      const parsed = matter(`---\n${yamlString}\n---\n`);
      return Frontmatter.fromPlainObject(parsed.data);
    } catch (error) {
      throw new Error(`Failed to deserialize YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}