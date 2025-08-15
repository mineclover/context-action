/**
 * Application Use Case: SummaryGeneratorUseCase
 * 
 * Minimum/Origin 형식 기반 요약 생성을 위한 고수준 유스케이스
 * 기존 LLMSGenerator와 통합하여 YAML frontmatter 포함 요약 생성
 */

import type { DocumentSummary } from '../../domain/entities/DocumentSummary.js';
import type { IDocumentSummaryRepository } from '../../domain/repositories/IDocumentSummaryRepository.js';
import type { ISummaryExtractor, MinimumDocumentInfo, OriginDocumentInfo } from '../../domain/services/interfaces/ISummaryExtractor.js';
import type { LLMSConfig } from '../../types/index.js';

/**
 * 요약 생성 소스 데이터
 */
export interface SummaryGenerationSource {
  readonly type: 'minimum' | 'origin';
  readonly content: string;
  readonly metadata: {
    readonly language: string;
    readonly documentsCount: number;
    readonly totalSize: number;
  };
}

/**
 * 대량 요약 생성 요청
 */
export interface BulkSummaryGenerationRequest {
  readonly source: SummaryGenerationSource;
  readonly characterLimits: readonly number[];
  readonly languages: readonly string[];
  readonly priorities?: {
    readonly minScore?: number;
    readonly maxScore?: number;
    readonly tiers?: readonly string[];
  };
  readonly extractionConfig?: {
    readonly defaultStrategy?: string;
    readonly qualityThreshold?: number;
    readonly retryOnFailure?: boolean;
  };
}

/**
 * 개별 문서 생성 결과
 */
export interface DocumentGenerationResult {
  readonly documentId: string;
  readonly language: string;
  readonly characterLimit: number;
  readonly success: boolean;
  readonly summary?: DocumentSummary;
  readonly filePath?: string;
  readonly quality?: {
    readonly score: number;
    readonly factors: Record<string, number>;
    readonly suggestions: string[];
  };
  readonly error?: string;
  readonly warnings?: string[];
  readonly extractionMethod?: string;
}

/**
 * 대량 생성 결과
 */
export interface BulkGenerationResult {
  readonly totalRequested: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly skippedCount: number;
  readonly results: readonly DocumentGenerationResult[];
  readonly statistics: {
    readonly averageQualityScore: number;
    readonly averageCharacterCount: number;
    readonly extractionMethodDistribution: Record<string, number>;
    readonly qualityDistribution: Record<string, number>; // poor, fair, good, excellent
    readonly processingTimeMs: number;
  };
  readonly recommendations: string[];
}

/**
 * SummaryGeneratorUseCase
 * 
 * Minimum/Origin 기반 대량 요약 생성을 담당하는 유스케이스
 */
export class SummaryGeneratorUseCase {
  constructor(
    private readonly summaryRepository: IDocumentSummaryRepository,
    private readonly summaryExtractor: ISummaryExtractor,
    private readonly config: LLMSConfig
  ) {}

  /**
   * Minimum 형식 기반 대량 요약 생성
   */
  async generateFromMinimum(request: BulkSummaryGenerationRequest): Promise<BulkGenerationResult> {
    if (request.source.type !== 'minimum') {
      throw new Error('Source type must be "minimum" for this method');
    }

    const startTime = Date.now();
    const minimumDocuments = this.parseMinimumContent(request.source.content);
    
    return this.executeBulkGeneration(
      minimumDocuments,
      request,
      'minimum',
      startTime
    );
  }

  /**
   * Origin 형식 기반 대량 요약 생성
   */
  async generateFromOrigin(request: BulkSummaryGenerationRequest): Promise<BulkGenerationResult> {
    if (request.source.type !== 'origin') {
      throw new Error('Source type must be "origin" for this method');
    }

    const startTime = Date.now();
    const originDocuments = this.parseOriginContent(request.source.content);
    
    return this.executeBulkGeneration(
      originDocuments,
      request,
      'origin',
      startTime
    );
  }

  /**
   * 특정 문서의 다중 글자 수 요약 생성
   */
  async generateMultiLengthSummaries(
    documentInfo: MinimumDocumentInfo | OriginDocumentInfo,
    characterLimits: readonly number[],
    language: string,
    sourceType: 'minimum' | 'origin'
  ): Promise<readonly DocumentGenerationResult[]> {
    const results: DocumentGenerationResult[] = [];

    for (const limit of characterLimits) {
      const result = await this.generateSingleSummary(
        documentInfo,
        limit,
        language,
        sourceType
      );
      results.push(result);
    }

    return results;
  }

  /**
   * 기존 요약 품질 재평가 및 개선
   */
  async improveExistingSummaries(
    criteria: {
      readonly language?: string;
      readonly minQualityScore?: number;
      readonly characterLimits?: readonly number[];
      readonly maxAge?: Date;
    }
  ): Promise<BulkGenerationResult> {
    const startTime = Date.now();
    
    // 개선 대상 요약들 조회
    const existingSummaries = await this.summaryRepository.findByCriteria({
      language: criteria.language,
      characterLimit: criteria.characterLimits?.[0] // 단순화
    });

    const results: DocumentGenerationResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const summary of existingSummaries) {
      // 품질 평가
      const qualityAssessment = this.summaryExtractor.assessQuality(
        summary.content, // 원본으로 사용 (실제로는 별도 저장 필요)
        summary.content,
        {
          document: summary.document,
          priority: summary.priority,
          summary: summary.summary,
          sourceType: summary.generated.from
        }
      );

      // 개선 필요 여부 확인
      const needsImprovement = criteria.minQualityScore ? 
        qualityAssessment.score < criteria.minQualityScore : 
        qualityAssessment.score < 70;

      if (!needsImprovement) {
        results.push({
          documentId: summary.document.id,
          language: summary.summary.language,
          characterLimit: summary.summary.characterLimit,
          success: true,
          summary,
          quality: qualityAssessment
        });
        successCount++;
        continue;
      }

      // 요약 재생성 시도
      try {
        const improved = await this.regenerateSummary(summary);
        results.push(improved);
        
        if (improved.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        results.push({
          documentId: summary.document.id,
          language: summary.summary.language,
          characterLimit: summary.summary.characterLimit,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        failureCount++;
      }
    }

    // 통계 계산
    const statistics = this.calculateStatistics(results, startTime);
    const recommendations = this.generateRecommendations(results, statistics);

    return {
      totalRequested: existingSummaries.length,
      successCount,
      failureCount,
      skippedCount: 0,
      results,
      statistics,
      recommendations
    };
  }

  // Private Helper Methods

  /**
   * 대량 생성 실행
   */
  private async executeBulkGeneration(
    documents: (MinimumDocumentInfo | OriginDocumentInfo)[],
    request: BulkSummaryGenerationRequest,
    sourceType: 'minimum' | 'origin',
    startTime: number
  ): Promise<BulkGenerationResult> {
    const results: DocumentGenerationResult[] = [];
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    // 우선순위 필터링
    const filteredDocuments = this.applyPriorityFilter(documents, request.priorities);

    for (const document of filteredDocuments) {
      for (const language of request.languages) {
        for (const characterLimit of request.characterLimits) {
          // 기존 요약 존재 확인
          const exists = await this.summaryRepository.exists(
            document.documentId,
            language,
            characterLimit
          );

          if (exists) {
            skippedCount++;
            continue;
          }

          // 개별 요약 생성
          const result = await this.generateSingleSummary(
            document,
            characterLimit,
            language,
            sourceType
          );

          results.push(result);

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        }
      }
    }

    // 통계 및 추천사항 생성
    const statistics = this.calculateStatistics(results, startTime);
    const recommendations = this.generateRecommendations(results, statistics);

    return {
      totalRequested: filteredDocuments.length * request.languages.length * request.characterLimits.length,
      successCount,
      failureCount,
      skippedCount,
      results,
      statistics,
      recommendations
    };
  }

  /**
   * 단일 요약 생성
   */
  private async generateSingleSummary(
    documentInfo: MinimumDocumentInfo | OriginDocumentInfo,
    characterLimit: number,
    language: string,
    sourceType: 'minimum' | 'origin'
  ): Promise<DocumentGenerationResult> {
    try {
      // 추출 컨텍스트 구성
      const context = {
        document: {
          path: this.getDocumentPath(documentInfo),
          title: documentInfo.title,
          id: documentInfo.documentId,
          category: this.getDocumentCategory(documentInfo)
        },
        priority: {
          score: documentInfo.priority,
          tier: documentInfo.tier as any
        },
        summary: {
          characterLimit,
          focus: this.generateFocus(documentInfo, characterLimit),
          strategy: this.selectStrategy(documentInfo, characterLimit),
          language
        },
        sourceType
      };

      // 요약 추출
      const extractionResult = sourceType === 'minimum'
        ? await this.summaryExtractor.extractFromMinimum(
            documentInfo as MinimumDocumentInfo,
            context
          )
        : await this.summaryExtractor.extractFromOrigin(
            documentInfo as OriginDocumentInfo,
            context
          );

      if (!extractionResult.success) {
        return {
          documentId: documentInfo.documentId,
          language,
          characterLimit,
          success: false,
          error: extractionResult.error,
          warnings: extractionResult.warnings
        };
      }

      // DocumentSummary 엔티티 생성
      const summary = DocumentSummary.create({
        document: context.document,
        priority: context.priority,
        summary: context.summary,
        content: extractionResult.content,
        generated: {
          from: sourceType,
          timestamp: new Date(),
          sourceType: 'content_based',
          characterCount: extractionResult.actualCharacterCount
        }
      });

      // 저장
      const saveResult = await this.summaryRepository.save(summary);

      if (!saveResult.success) {
        return {
          documentId: documentInfo.documentId,
          language,
          characterLimit,
          success: false,
          error: saveResult.error
        };
      }

      // 품질 평가
      const quality = this.summaryExtractor.assessQuality(
        this.getOriginalContent(documentInfo),
        extractionResult.content,
        context
      );

      return {
        documentId: documentInfo.documentId,
        language,
        characterLimit,
        success: true,
        summary,
        filePath: saveResult.path,
        quality,
        extractionMethod: extractionResult.extractionMethod
      };

    } catch (error) {
      return {
        documentId: documentInfo.documentId,
        language,
        characterLimit,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Minimum 컨텐츠 파싱
   */
  private parseMinimumContent(content: string): MinimumDocumentInfo[] {
    const documents: MinimumDocumentInfo[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/- \[(.*?)\]\((.*?)\) - Priority: (\d+)/);
      if (match) {
        const [, title, url, priority] = match;
        const documentId = this.extractDocumentIdFromUrl(url);
        
        documents.push({
          documentId,
          title,
          priority: parseInt(priority),
          tier: this.determineTierFromPriority(parseInt(priority)),
          url,
          category: this.extractCategoryFromUrl(url)
        });
      }
    }

    return documents;
  }

  /**
   * Origin 컨텐츠 파싱
   */
  private parseOriginContent(content: string): OriginDocumentInfo[] {
    const documents: OriginDocumentInfo[] = [];
    const sections = content.split(/\n# /);

    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines[0].replace(/^# /, '');
      
      const sourceMatch = lines.find(line => line.startsWith('**Source**:'));
      const priorityMatch = lines.find(line => line.startsWith('**Priority**:'));
      
      if (sourceMatch && priorityMatch) {
        const sourcePath = sourceMatch.replace('**Source**: `', '').replace('`', '').trim();
        const priorityText = priorityMatch.replace('**Priority**:', '').trim();
        const [priorityStr, tier] = priorityText.split(' (');
        
        const documentId = this.generateDocumentIdFromPath(sourcePath);
        const fullContent = lines.slice(3).join('\n'); // Skip metadata lines
        
        documents.push({
          documentId,
          title,
          priority: parseInt(priorityStr),
          tier: tier?.replace(')', '') || 'reference',
          sourcePath,
          fullContent
        });
      }
    }

    return documents;
  }

  /**
   * 우선순위 필터 적용
   */
  private applyPriorityFilter(
    documents: (MinimumDocumentInfo | OriginDocumentInfo)[],
    priorities?: BulkSummaryGenerationRequest['priorities']
  ): (MinimumDocumentInfo | OriginDocumentInfo)[] {
    if (!priorities) return documents;

    return documents.filter(doc => {
      if (priorities.minScore && doc.priority < priorities.minScore) return false;
      if (priorities.maxScore && doc.priority > priorities.maxScore) return false;
      if (priorities.tiers && !priorities.tiers.includes(doc.tier)) return false;
      return true;
    });
  }

  /**
   * 통계 계산
   */
  private calculateStatistics(
    results: readonly DocumentGenerationResult[],
    startTime: number
  ): BulkGenerationResult['statistics'] {
    const successfulResults = results.filter(r => r.success && r.quality);
    
    const averageQualityScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + (r.quality?.score || 0), 0) / successfulResults.length
      : 0;

    const averageCharacterCount = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + (r.summary?.content.length || 0), 0) / successfulResults.length
      : 0;

    const extractionMethodDistribution: Record<string, number> = {};
    const qualityDistribution: Record<string, number> = {
      poor: 0, fair: 0, good: 0, excellent: 0
    };

    successfulResults.forEach(result => {
      // 추출 방법 분포
      const method = result.extractionMethod || 'unknown';
      extractionMethodDistribution[method] = (extractionMethodDistribution[method] || 0) + 1;

      // 품질 분포
      const score = result.quality?.score || 0;
      if (score >= 90) qualityDistribution.excellent++;
      else if (score >= 70) qualityDistribution.good++;
      else if (score >= 50) qualityDistribution.fair++;
      else qualityDistribution.poor++;
    });

    return {
      averageQualityScore,
      averageCharacterCount,
      extractionMethodDistribution,
      qualityDistribution,
      processingTimeMs: Date.now() - startTime
    };
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(
    results: readonly DocumentGenerationResult[],
    statistics: BulkGenerationResult['statistics']
  ): string[] {
    const recommendations: string[] = [];

    if (statistics.averageQualityScore < 70) {
      recommendations.push('전체적인 요약 품질이 낮습니다. 추출 전략을 검토하세요.');
    }

    if (statistics.qualityDistribution.poor > results.length * 0.2) {
      recommendations.push('20% 이상의 요약이 품질이 낮습니다. 소스 컨텐츠 품질을 확인하세요.');
    }

    if (statistics.averageCharacterCount < 50) {
      recommendations.push('요약이 너무 짧습니다. 글자 수 제한을 늘리거나 추출 방법을 개선하세요.');
    }

    const failureRate = results.filter(r => !r.success).length / results.length;
    if (failureRate > 0.1) {
      recommendations.push('10% 이상의 요약 생성이 실패했습니다. 에러 로그를 확인하세요.');
    }

    return recommendations;
  }

  // Utility Methods

  private getDocumentPath(info: MinimumDocumentInfo | OriginDocumentInfo): string {
    return 'sourcePath' in info ? info.sourcePath : this.generatePathFromUrl(info.url);
  }

  private getDocumentCategory(info: MinimumDocumentInfo | OriginDocumentInfo): string {
    return 'category' in info ? info.category : this.extractCategoryFromPath(this.getDocumentPath(info));
  }

  private getOriginalContent(info: MinimumDocumentInfo | OriginDocumentInfo): string {
    return 'fullContent' in info ? info.fullContent : info.title;
  }

  private generateFocus(info: MinimumDocumentInfo | OriginDocumentInfo, characterLimit: number): string {
    if (characterLimit <= 100) return '핵심 개념';
    if (characterLimit <= 300) return '주요 기능과 사용법';
    return '상세 설명과 예제';
  }

  private selectStrategy(info: MinimumDocumentInfo | OriginDocumentInfo, characterLimit: number): string {
    const category = this.getDocumentCategory(info);
    
    if (category === 'api') return 'api-first';
    if (category === 'guide') return characterLimit <= 200 ? 'concept-first' : 'tutorial-first';
    if (category === 'example') return 'example-first';
    return 'concept-first';
  }

  private extractDocumentIdFromUrl(url: string): string {
    return url.split('/').pop()?.replace(/\.html?$/, '') || 'unknown';
  }

  private extractCategoryFromUrl(url: string): string {
    const segments = url.split('/');
    return segments[segments.length - 2] || 'guide';
  }

  private generateDocumentIdFromPath(path: string): string {
    return path.replace(/\.md$/, '').replace(/\//g, '-');
  }

  private generatePathFromUrl(url: string): string {
    return url.replace(/^https?:\/\/[^\/]+\//, '').replace(/\.html?$/, '.md');
  }

  private extractCategoryFromPath(path: string): string {
    return path.split('/')[1] || 'guide';
  }

  private determineTierFromPriority(priority: number): string {
    if (priority >= 90) return 'critical';
    if (priority >= 80) return 'essential';
    if (priority >= 70) return 'important';
    if (priority >= 50) return 'reference';
    return 'supplementary';
  }

  private async regenerateSummary(existingSummary: DocumentSummary): Promise<DocumentGenerationResult> {
    // 기존 요약 재생성 로직 (간단한 구현)
    const fakeInfo: OriginDocumentInfo = {
      documentId: existingSummary.document.id,
      title: existingSummary.document.title,
      priority: existingSummary.priority.score,
      tier: existingSummary.priority.tier,
      sourcePath: existingSummary.document.path,
      fullContent: existingSummary.content // 실제로는 원본 컨텐츠 필요
    };

    return this.generateSingleSummary(
      fakeInfo,
      existingSummary.summary.characterLimit,
      existingSummary.summary.language,
      existingSummary.generated.from
    );
  }
}