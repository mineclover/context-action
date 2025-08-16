/**
 * Application Use Case: GenerateSummaryUseCase
 * 
 * 문서 요약 생성을 위한 애플리케이션 로직
 * 클린 아키텍처에서 Use Case 계층 구현
 */

import { DocumentSummary } from '../../domain/entities/DocumentSummary.js';
import { DocumentId } from '../../domain/value-objects/DocumentId.js';
import { CharacterLimit } from '../../domain/value-objects/CharacterLimit.js';
import type { IDocumentSummaryRepository } from '../../domain/repositories/IDocumentSummaryRepository.js';
import type { IFrontmatterService } from '../../domain/services/interfaces/IFrontmatterService.js';

/**
 * 요약 생성 입력 데이터
 */
export interface GenerateSummaryRequest {
  readonly documentId: string;
  readonly documentPath: string;
  readonly documentTitle: string;
  readonly category: string;
  readonly language: string;
  readonly characterLimit: number;
  readonly priorityScore: number;
  readonly priorityTier: 'critical' | 'essential' | 'important' | 'reference' | 'supplementary';
  readonly strategy: 'concept-first' | 'api-first' | 'example-first' | 'tutorial-first' | 'reference-first';
  readonly focus: string;
  readonly sourceContent: string;
  readonly sourceType: 'minimum' | 'origin' | 'adaptive';
}

/**
 * 요약 생성 결과
 */
export interface GenerateSummaryResponse {
  readonly success: boolean;
  readonly summary?: DocumentSummary;
  readonly filePath?: string;
  readonly error?: string;
  readonly warnings?: string[];
}

/**
 * 일괄 생성 요청
 */
export interface BatchGenerateRequest {
  readonly requests: ReadonlyArray<GenerateSummaryRequest>;
  readonly overwriteExisting?: boolean;
  readonly validateBeforeSave?: boolean;
}

/**
 * 일괄 생성 결과
 */
export interface BatchGenerateResponse {
  readonly totalProcessed: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly results: ReadonlyArray<GenerateSummaryResponse>;
  readonly summary: {
    averageCharacterCount: number;
    uniqueDocuments: number;
    tierDistribution: Record<string, number>;
  };
}

/**
 * GenerateSummaryUseCase
 * 
 * 문서 요약 생성의 비즈니스 로직을 담당하는 유스케이스
 * 도메인 엔티티와 서비스를 조합하여 애플리케이션 기능 제공
 */
export class GenerateSummaryUseCase {
  constructor(
    private readonly summaryRepository: IDocumentSummaryRepository,
    private readonly frontmatterService: IFrontmatterService
  ) {}

  /**
   * 단일 문서 요약 생성
   */
  async execute(request: GenerateSummaryRequest): Promise<GenerateSummaryResponse> {
    try {
      // 1. 기존 요약 존재 여부 확인
      const documentId = DocumentId.create(request.documentId);
      const characterLimit = CharacterLimit.create(request.characterLimit);
      
      const existingSummary = await this.summaryRepository.findByDocumentAndLimit(
        documentId,
        request.language,
        characterLimit
      );

      if (existingSummary) {
        return {
          success: false,
          error: `Summary already exists: ${existingSummary.getUniqueId()}`
        };
      }

      // 2. 소스 컨텐츠에서 요약 추출
      const extractedContent = this.extractSummaryFromSource(
        request.sourceContent,
        characterLimit.value,
        request.strategy
      );

      // 3. DocumentSummary 엔티티 생성
      const summaryResult = DocumentSummary.create({
        document: {
          path: request.documentPath,
          title: request.documentTitle,
          id: documentId,
          category: request.category
        },
        priority: {
          score: request.priorityScore,
          tier: request.priorityTier
        },
        summary: {
          characterLimit: characterLimit,
          focus: request.focus,
          strategy: request.strategy,
          language: request.language
        },
        content: extractedContent,
        generated: {
          from: request.sourceType,
          timestamp: new Date(),
          sourceType: 'content_based',
          characterCount: extractedContent.length
        }
      });

      if (summaryResult.isFailure) {
        return {
          success: false,
          error: `Failed to create summary: ${summaryResult.error.message}`
        };
      }

      const summary = summaryResult.value;

      // 4. 저장소에 저장
      const saveResult = await this.summaryRepository.save(summary);

      if (!saveResult.success) {
        return {
          success: false,
          error: `Failed to save summary: ${saveResult.error}`
        };
      }

      // 5. 성공 응답
      return {
        success: true,
        summary,
        filePath: saveResult.path
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 일괄 문서 요약 생성
   */
  async executeBatch(request: BatchGenerateRequest): Promise<BatchGenerateResponse> {
    const results: GenerateSummaryResponse[] = [];
    let successCount = 0;
    let failureCount = 0;

    // 통계 수집용
    const characterCounts: number[] = [];
    const uniqueDocuments = new Set<string>();
    const tierDistribution: Record<string, number> = {};

    for (const summaryRequest of request.requests) {
      // 기존 요약 확인 및 덮어쓰기 옵션 처리
      if (!request.overwriteExisting) {
        const exists = await this.summaryRepository.exists(
          summaryRequest.documentId,
          summaryRequest.language,
          summaryRequest.characterLimit
        );

        if (exists) {
          const skipResult: GenerateSummaryResponse = {
            success: false,
            error: 'Summary already exists (use overwriteExisting=true to replace)'
          };
          results.push(skipResult);
          failureCount++;
          continue;
        }
      }

      // 개별 요약 생성
      const result = await this.execute(summaryRequest);
      results.push(result);

      if (result.success && result.summary) {
        successCount++;
        characterCounts.push(result.summary.content.length);
        uniqueDocuments.add(result.summary.document.id.value);
        
        const tier = result.summary.priority.tier;
        tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
      } else {
        failureCount++;
      }
    }

    // 통계 계산
    const averageCharacterCount = characterCounts.length > 0
      ? characterCounts.reduce((sum, count) => sum + count, 0) / characterCounts.length
      : 0;

    return {
      totalProcessed: request.requests.length,
      successCount,
      failureCount,
      results,
      summary: {
        averageCharacterCount,
        uniqueDocuments: uniqueDocuments.size,
        tierDistribution
      }
    };
  }

  /**
   * 기존 요약 업데이트
   */
  async updateExisting(
    uniqueId: string,
    updates: Partial<GenerateSummaryRequest>
  ): Promise<GenerateSummaryResponse> {
    try {
      // 기존 요약 조회
      const existingSummary = await this.summaryRepository.findByUniqueId(uniqueId);
      if (!existingSummary) {
        return {
          success: false,
          error: `Summary not found: ${uniqueId}`
        };
      }

      // 업데이트된 요약 생성
      const updatedRequest: GenerateSummaryRequest = {
        documentId: updates.documentId ?? existingSummary.document.id.value,
        documentPath: updates.documentPath ?? existingSummary.document.path,
        documentTitle: updates.documentTitle ?? existingSummary.document.title,
        category: updates.category ?? existingSummary.document.category,
        language: updates.language ?? existingSummary.summary.language,
        characterLimit: updates.characterLimit ?? existingSummary.summary.characterLimit.value,
        priorityScore: updates.priorityScore ?? existingSummary.priority.score,
        priorityTier: updates.priorityTier ?? existingSummary.priority.tier,
        strategy: updates.strategy ?? existingSummary.summary.strategy,
        focus: updates.focus ?? existingSummary.summary.focus,
        sourceContent: updates.sourceContent ?? existingSummary.content,
        sourceType: updates.sourceType ?? existingSummary.generated.from
      };

      // 기존 삭제 후 새로 생성
      await this.summaryRepository.delete(uniqueId);
      return this.execute(updatedRequest);

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 특정 조건의 요약들 재생성
   */
  async regenerateByCondition(
    criteria: {
      language?: string;
      documentIds?: string[];
      characterLimits?: number[];
      olderThan?: Date;
    },
    sourceContentProvider: (documentId: string, language: string) => Promise<string>
  ): Promise<BatchGenerateResponse> {
    try {
      // 조건에 맞는 기존 요약들 조회
      const existingSummaries = await this.summaryRepository.findByCriteria({
        language: criteria.language,
        characterLimit: criteria.characterLimits?.[0] ? CharacterLimit.create(criteria.characterLimits[0]) : undefined // 단순화
      });

      // 필터링
      const targetSummaries = existingSummaries.filter(summary => {
        if (criteria.documentIds && !criteria.documentIds.includes(summary.document.id.value)) {
          return false;
        }
        if (criteria.characterLimits && !criteria.characterLimits.includes(summary.summary.characterLimit.value)) {
          return false;
        }
        if (criteria.olderThan && summary.generated.timestamp >= criteria.olderThan) {
          return false;
        }
        return true;
      });

      // 재생성 요청 생성
      const requests: GenerateSummaryRequest[] = [];
      for (const summary of targetSummaries) {
        try {
          const sourceContent = await sourceContentProvider(summary.document.id.value, summary.summary.language);
          
          requests.push({
            documentId: summary.document.id.value,
            documentPath: summary.document.path,
            documentTitle: summary.document.title,
            category: summary.document.category,
            language: summary.summary.language,
            characterLimit: summary.summary.characterLimit.value,
            priorityScore: summary.priority.score,
            priorityTier: summary.priority.tier,
            strategy: summary.summary.strategy,
            focus: summary.summary.focus,
            sourceContent,
            sourceType: summary.generated.from
          });
        } catch (error) {
          console.warn(`Failed to get source content for ${summary.document.id}:`, error);
        }
      }

      // 일괄 재생성
      return this.executeBatch({
        requests,
        overwriteExisting: true,
        validateBeforeSave: true
      });

    } catch (error) {
      throw new Error(`Failed to regenerate summaries: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Private Helper Methods

  /**
   * 소스 컨텐츠에서 요약 추출
   * TODO: 추후 별도 도메인 서비스로 분리
   */
  private extractSummaryFromSource(
    sourceContent: string,
    characterLimit: number,
    strategy: string
  ): string {
    // 전략별 추출 로직 (간단한 구현)
    let content = sourceContent.trim();

    switch (strategy) {
      case 'concept-first':
        content = this.extractConceptFirst(content);
        break;
      case 'api-first':
        content = this.extractApiFirst(content);
        break;
      case 'example-first':
        content = this.extractExampleFirst(content);
        break;
      default:
        // 기본적으로 앞에서부터 자르기
        break;
    }

    // 글자 수 제한 적용
    if (content.length > characterLimit) {
      content = this.smartTrim(content, characterLimit);
    }

    return content;
  }

  private extractConceptFirst(content: string): string {
    // 개념 중심 추출: 헤더와 첫 번째 단락 우선
    const lines = content.split('\n');
    const result: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('#') || line.trim().length > 20) {
        result.push(line);
        if (result.length >= 3) break;
      }
    }
    
    return result.join('\n');
  }

  private extractApiFirst(content: string): string {
    // API 중심 추출: 코드 블록과 함수 시그니처 우선
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    const functionDefs = content.match(/^\s*\w+\s+\w+\s*\(/gm) || [];
    
    return [content.split('\n')[0], ...codeBlocks.slice(0, 2), ...functionDefs.slice(0, 3)]
      .join('\n\n');
  }

  private extractExampleFirst(content: string): string {
    // 예제 중심 추출: 코드 예제와 사용법 우선
    const examples = content.match(/예제|example|usage[\s\S]*?(?=\n\n|\n#|$)/gi) || [];
    return examples.slice(0, 2).join('\n\n');
  }

  private smartTrim(content: string, limit: number): string {
    if (content.length <= limit) {
      return content;
    }

    // 문장 끝에서 자르기
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
}