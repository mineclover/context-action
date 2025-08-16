/**
 * Domain Factory: DocumentSummaryFactory
 * 
 * DocumentSummary 엔티티 생성을 위한 팩토리 클래스
 * 복잡한 생성 로직을 캡슐화하고 일관된 생성 규칙 적용
 */

import { DocumentSummary, DocumentMetadata, PriorityInfo, SummaryMetadata, GenerationInfo } from '../entities/DocumentSummary.js';
import { DocumentId } from '../value-objects/DocumentId.js';
import { CharacterLimit } from '../value-objects/CharacterLimit.js';
import { Result, Errors, ValidationError } from '../value-objects/Result.js';

export type GenerationStrategy = 'concept-first' | 'api-first' | 'example-first' | 'tutorial-first' | 'reference-first';
export type GenerationSource = 'minimum' | 'origin' | 'adaptive';
export type SourceType = 'priority_based' | 'content_based';

/**
 * DocumentSummary 생성을 위한 팩토리 클래스
 */
export class DocumentSummaryFactory {
  private constructor() {
    // 정적 팩토리 메서드만 사용
  }

  /**
   * 우선순위 기반 생성 (가장 일반적인 생성 방식)
   */
  static fromPriorityBasedGeneration(params: {
    documentPath: string;
    documentTitle: string;
    documentCategory: string;
    content: string;
    characterLimit: number;
    language: string;
    strategy?: GenerationStrategy;
    priorityScore?: number;
    priorityTier?: 'critical' | 'essential' | 'important' | 'reference' | 'supplementary';
  }): Result<DocumentSummary, ValidationError> {
    try {
      // DocumentId 생성
      const documentId = DocumentId.fromPath(params.documentPath, params.language);
      
      // CharacterLimit 생성 (유연한 검증)
      const characterLimit = CharacterLimit.create(params.characterLimit);
      
      // 기본값 설정
      const strategy = params.strategy || DocumentSummaryFactory.inferStrategy(params.content, params.documentCategory);
      const priorityScore = params.priorityScore ?? DocumentSummaryFactory.inferPriorityScore(params.documentCategory);
      const priorityTier = params.priorityTier || DocumentSummaryFactory.inferPriorityTier(priorityScore);
      
      // 메타데이터 구성
      const document: DocumentMetadata = {
        path: params.documentPath,
        title: params.documentTitle,
        id: documentId,
        category: params.documentCategory
      };
      
      const priority: PriorityInfo = {
        score: priorityScore,
        tier: priorityTier
      };
      
      const summary: SummaryMetadata = {
        characterLimit,
        focus: DocumentSummaryFactory.inferFocus(params.content, params.documentCategory),
        strategy,
        language: params.language
      };
      
      const generated: GenerationInfo = {
        from: 'adaptive',
        timestamp: new Date(),
        sourceType: 'priority_based',
        characterCount: params.content.length
      };
      
      return DocumentSummary.create({
        document,
        priority,
        summary,
        content: params.content,
        generated
      });
      
    } catch (error) {
      return Result.failure(Errors.validation(
        `Failed to create DocumentSummary: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
    }
  }
  
  /**
   * 컨텐츠 기반 생성
   */
  static fromContentBasedGeneration(params: {
    documentPath: string;
    documentTitle: string;
    content: string;
    language: string;
    sourceType?: SourceType;
  }): Result<DocumentSummary, ValidationError> {
    try {
      const documentId = DocumentId.fromPath(params.documentPath, params.language);
      const category = documentId.getCategory();
      
      // 컨텐츠 기반 추론
      const characterLimit = CharacterLimit.getRecommendedForCategory(category);
      const strategy = DocumentSummaryFactory.inferStrategy(params.content, category);
      const priorityScore = DocumentSummaryFactory.inferPriorityScore(category);
      
      const document: DocumentMetadata = {
        path: params.documentPath,
        title: params.documentTitle,
        id: documentId,
        category
      };
      
      const priority: PriorityInfo = {
        score: priorityScore,
        tier: DocumentSummaryFactory.inferPriorityTier(priorityScore)
      };
      
      const summary: SummaryMetadata = {
        characterLimit,
        focus: DocumentSummaryFactory.inferFocus(params.content, category),
        strategy,
        language: params.language
      };
      
      const generated: GenerationInfo = {
        from: 'adaptive',
        timestamp: new Date(),
        sourceType: params.sourceType || 'content_based',
        characterCount: params.content.length
      };
      
      return DocumentSummary.create({
        document,
        priority,
        summary,
        content: params.content,
        generated
      });
      
    } catch (error) {
      return Result.failure(Errors.validation(
        `Failed to create DocumentSummary: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
    }
  }
  
  /**
   * 최소 정보로 생성 (테스트 및 기본값 사용)
   */
  static createMinimal(params: {
    documentPath: string;
    content: string;
    language?: string;
  }): Result<DocumentSummary, ValidationError> {
    const language = params.language || 'ko';
    const documentId = DocumentId.fromPath(params.documentPath, language);
    const category = documentId.getCategory();
    
    return DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: params.documentPath,
      documentTitle: DocumentSummaryFactory.inferTitle(params.documentPath),
      documentCategory: category,
      content: params.content,
      characterLimit: CharacterLimit.getRecommendedForCategory(category).value,
      language
    });
  }
  
  /**
   * 기존 DocumentSummary를 다른 CharacterLimit으로 복제
   */
  static createWithNewLimit(
    original: DocumentSummary,
    newLimit: CharacterLimit
  ): Result<DocumentSummary, ValidationError> {
    const trimResult = original.trimToLimit(newLimit);
    
    if (trimResult.isFailure) {
      return trimResult;
    }
    
    return Result.success(trimResult.value);
  }
  
  /**
   * 여러 DocumentSummary를 배치로 생성
   */
  static createBatch(
    params: Array<Parameters<typeof DocumentSummaryFactory.fromPriorityBasedGeneration>[0]>
  ): Result<DocumentSummary[], ValidationError> {
    const results: DocumentSummary[] = [];
    
    for (const param of params) {
      const result = DocumentSummaryFactory.fromPriorityBasedGeneration(param);
      
      if (result.isFailure) {
        return Result.failure(Errors.validation(
          `Batch creation failed at document ${param.documentPath}: ${result.error.message}`
        ));
      }
      
      results.push(result.value);
    }
    
    return Result.success(results);
  }
  
  // === 추론 메서드들 ===
  
  /**
   * 컨텐츠와 카테고리 기반 전략 추론
   */
  private static inferStrategy(content: string, category: string): GenerationStrategy {
    const contentLower = content.toLowerCase();
    
    // API 관련 키워드
    if (contentLower.includes('api') || contentLower.includes('function') || 
        contentLower.includes('method') || contentLower.includes('endpoint')) {
      return 'api-first';
    }
    
    // 튜토리얼 관련 키워드
    if (contentLower.includes('tutorial') || contentLower.includes('step') || 
        contentLower.includes('guide') || contentLower.includes('how to')) {
      return 'tutorial-first';
    }
    
    // 예제 관련 키워드
    if (contentLower.includes('example') || contentLower.includes('sample') || 
        contentLower.includes('demo')) {
      return 'example-first';
    }
    
    // 참조 관련 키워드
    if (contentLower.includes('reference') || contentLower.includes('spec') || 
        contentLower.includes('documentation')) {
      return 'reference-first';
    }
    
    // 카테고리 기반 기본값
    if (category.includes('api')) return 'api-first';
    if (category.includes('guide') || category.includes('tutorial')) return 'tutorial-first';
    if (category.includes('example')) return 'example-first';
    if (category.includes('reference')) return 'reference-first';
    
    return 'concept-first';
  }
  
  /**
   * 컨텐츠와 카테고리 기반 포커스 추론
   */
  private static inferFocus(content: string, category: string): string {
    const contentLower = content.toLowerCase();
    
    // 기술적 포커스
    if (contentLower.includes('typescript') || contentLower.includes('javascript')) {
      return 'TypeScript Development';
    }
    if (contentLower.includes('react') || contentLower.includes('component')) {
      return 'React Components';
    }
    if (contentLower.includes('api') || contentLower.includes('endpoint')) {
      return 'API Usage';
    }
    
    // 카테고리 기반 기본값
    const categoryFocusMap: Record<string, string> = {
      'api': 'API Reference',
      'guide': 'User Guide',
      'concept': 'Core Concepts',
      'tutorial': 'Step-by-step Tutorial',
      'example': 'Practical Examples',
      'reference': 'Technical Reference'
    };
    
    return categoryFocusMap[category] || 'General Documentation';
  }
  
  /**
   * 카테고리 기반 우선순위 점수 추론
   */
  private static inferPriorityScore(category: string): number {
    const priorityMap: Record<string, number> = {
      'core': 95,
      'api': 90,
      'guide': 85,
      'concept': 80,
      'tutorial': 75,
      'example': 70,
      'reference': 65,
      'misc': 50
    };
    
    return priorityMap[category] || 60;
  }
  
  /**
   * 우선순위 점수 기반 티어 추론
   */
  private static inferPriorityTier(score: number): 'critical' | 'essential' | 'important' | 'reference' | 'supplementary' {
    if (score >= 90) return 'critical';
    if (score >= 80) return 'essential';
    if (score >= 70) return 'important';
    if (score >= 60) return 'reference';
    return 'supplementary';
  }
  
  /**
   * 파일 경로 기반 제목 추론
   */
  private static inferTitle(documentPath: string): string {
    const fileName = documentPath.split('/').pop()?.replace(/\.md$/, '') || 'Untitled';
    
    // 하이픈과 언더스코어를 공백으로 변환하고 각 단어의 첫 글자를 대문자로
    return fileName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }
}