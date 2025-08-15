/**
 * Infrastructure Implementation: SummaryExtractor
 * 
 * 다양한 소스로부터 요약을 추출하는 구체적인 구현체
 * 전략 패턴을 사용한 추출 알고리즘 분리
 */

import type {
  ISummaryExtractor,
  ExtractionContext,
  ExtractionResult,
  MinimumDocumentInfo,
  OriginDocumentInfo
} from '../../domain/services/interfaces/ISummaryExtractor.js';

/**
 * 추출 전략 인터페이스
 */
interface ExtractionStrategy {
  extract(content: string, context: ExtractionContext): Promise<ExtractionResult>;
  getPriority(): number;
  getDescription(): string;
}

/**
 * SummaryExtractor 구현
 * 
 * 전략 패턴과 템플릿 메서드 패턴을 활용한 요약 추출
 */
export class SummaryExtractor implements ISummaryExtractor {
  private readonly strategies: Map<string, ExtractionStrategy>;

  constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Minimum 형식에서 요약 추출
   */
  async extractFromMinimum(
    minimumData: MinimumDocumentInfo,
    context: ExtractionContext
  ): Promise<ExtractionResult> {
    try {
      // Minimum 형식은 제한된 정보만 제공하므로 간단한 설명 생성
      const content = this.generateMinimumSummary(minimumData, context);
      
      return {
        success: true,
        content,
        actualCharacterCount: content.length,
        extractionMethod: 'minimum-based',
        warnings: content.length > context.summary.characterLimit ? 
          ['Content exceeds character limit'] : undefined
      };

    } catch (error) {
      return {
        success: false,
        content: '',
        actualCharacterCount: 0,
        extractionMethod: 'minimum-based',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Origin 형식에서 요약 추출
   */
  async extractFromOrigin(
    originData: OriginDocumentInfo,
    context: ExtractionContext
  ): Promise<ExtractionResult> {
    try {
      const strategy = this.strategies.get(context.summary.strategy);
      
      if (!strategy) {
        throw new Error(`Unsupported extraction strategy: ${context.summary.strategy}`);
      }

      // 원본 컨텐츠 전처리
      const preprocessedContent = this.preprocessContent(originData.fullContent);
      
      // 전략별 추출
      const result = await strategy.extract(preprocessedContent, context);
      
      // 후처리
      const finalContent = this.postprocessContent(result.content, context);
      
      return {
        ...result,
        content: finalContent,
        actualCharacterCount: finalContent.length,
        extractionMethod: `origin-${context.summary.strategy}`
      };

    } catch (error) {
      return {
        success: false,
        content: '',
        actualCharacterCount: 0,
        extractionMethod: `origin-${context.summary.strategy}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 원시 텍스트에서 직접 요약 추출
   */
  async extractFromRawText(
    rawText: string,
    context: ExtractionContext
  ): Promise<ExtractionResult> {
    const fakeOriginData: OriginDocumentInfo = {
      documentId: context.document.id,
      title: context.document.title,
      priority: context.priority.score,
      tier: context.priority.tier,
      sourcePath: context.document.path,
      fullContent: rawText
    };

    return this.extractFromOrigin(fakeOriginData, context);
  }

  /**
   * 추출 전략별 처리 지원 여부 확인
   */
  supportsStrategy(strategy: string): boolean {
    return this.strategies.has(strategy);
  }

  /**
   * 최적 글자 수 추천
   */
  recommendCharacterLimit(contentLength: number, strategy: string): number {
    const ratios: Record<string, number> = {
      'concept-first': 0.15,     // 개념 중심 - 15%
      'api-first': 0.20,         // API 중심 - 20%
      'example-first': 0.25,     // 예제 중심 - 25%
      'tutorial-first': 0.18,    // 튜토리얼 중심 - 18%
      'reference-first': 0.10    // 레퍼런스 중심 - 10%
    };

    const ratio = ratios[strategy] || 0.15;
    const recommended = Math.round(contentLength * ratio);
    
    // 최소/최대 제한
    return Math.max(100, Math.min(recommended, 5000));
  }

  /**
   * 추출 품질 평가
   */
  assessQuality(
    originalContent: string,
    extractedContent: string,
    context: ExtractionContext
  ): { score: number; factors: Record<string, number>; suggestions: string[] } {
    const factors: Record<string, number> = {};
    const suggestions: string[] = [];

    // 길이 비율 (적절한 압축률)
    const compressionRatio = extractedContent.length / originalContent.length;
    factors.compression = this.scoreCompressionRatio(compressionRatio);

    // 정보 보존도 (키워드 매칭)
    factors.informationPreservation = this.scoreInformationPreservation(
      originalContent,
      extractedContent
    );

    // 가독성 (문장 구조)
    factors.readability = this.scoreReadability(extractedContent);

    // 일관성 (전략 준수)
    factors.strategyConsistency = this.scoreStrategyConsistency(
      extractedContent,
      context.summary.strategy
    );

    // 글자 수 준수
    factors.characterLimitCompliance = this.scoreCharacterLimit(
      extractedContent.length,
      context.summary.characterLimit
    );

    // 전체 점수 계산 (가중 평균)
    const weights = {
      compression: 0.15,
      informationPreservation: 0.30,
      readability: 0.20,
      strategyConsistency: 0.20,
      characterLimitCompliance: 0.15
    };

    const score = Object.entries(factors).reduce((sum, [key, value]) => {
      return sum + (value * (weights[key as keyof typeof weights] || 0));
    }, 0);

    // 개선 제안 생성
    if (factors.compression < 50) {
      suggestions.push('내용이 너무 길거나 짧습니다. 압축률을 조정하세요.');
    }
    if (factors.informationPreservation < 60) {
      suggestions.push('핵심 정보가 누락되었습니다. 주요 키워드를 포함하세요.');
    }
    if (factors.readability < 70) {
      suggestions.push('문장 구조를 개선하여 가독성을 높이세요.');
    }

    return {
      score: Math.round(score),
      factors,
      suggestions
    };
  }

  // Private Helper Methods

  /**
   * 추출 전략들 초기화
   */
  private initializeStrategies(): void {
    this.strategies.set('concept-first', new ConceptFirstStrategy());
    this.strategies.set('api-first', new ApiFirstStrategy());
    this.strategies.set('example-first', new ExampleFirstStrategy());
    this.strategies.set('tutorial-first', new TutorialFirstStrategy());
    this.strategies.set('reference-first', new ReferenceFirstStrategy());
  }

  /**
   * Minimum 형식 요약 생성
   */
  private generateMinimumSummary(
    data: MinimumDocumentInfo,
    context: ExtractionContext
  ): string {
    const { characterLimit, focus, language } = context.summary;
    
    // 언어별 템플릿
    const templates = {
      ko: `${data.title}는 ${data.category} 카테고리의 문서로 우선순위 ${data.priority}/${data.tier}입니다. ${focus}에 대한 내용을 다룹니다.`,
      en: `${data.title} is a ${data.category} document with priority ${data.priority}/${data.tier}, covering ${focus}.`,
      ja: `${data.title}は${data.category}カテゴリの文書で、優先度${data.priority}/${data.tier}です。${focus}について説明しています。`
    };

    let content = templates[language as keyof typeof templates] || templates.ko;
    
    // 글자 수 제한에 맞춰 조정
    if (content.length > characterLimit) {
      content = this.smartTrim(content, characterLimit);
    }

    return content;
  }

  /**
   * 컨텐츠 전처리
   */
  private preprocessContent(content: string): string {
    return content
      .replace(/^---[\s\S]*?---/m, '') // YAML frontmatter 제거
      .replace(/\n{3,}/g, '\n\n')      // 과도한 줄바꿈 정리
      .trim();
  }

  /**
   * 컨텐츠 후처리
   */
  private postprocessContent(content: string, context: ExtractionContext): string {
    let processed = content.trim();
    
    // 글자 수 제한 적용
    if (processed.length > context.summary.characterLimit) {
      processed = this.smartTrim(processed, context.summary.characterLimit);
    }

    // 언어별 후처리
    if (context.summary.language === 'ko') {
      processed = this.postprocessKorean(processed);
    }

    return processed;
  }

  /**
   * 한국어 후처리
   */
  private postprocessKorean(content: string): string {
    return content
      .replace(/\s+([을를이가에서와과])/g, '$1')  // 조사 앞 공백 제거
      .replace(/([다음니])(\s*)\./, '$1.$2')     // 문장 끝 정리
      .replace(/\s+/g, ' ')                      // 연속 공백 정리
      .trim();
  }

  /**
   * 스마트 트리밍
   */
  private smartTrim(content: string, limit: number): string {
    if (content.length <= limit) {
      return content;
    }

    // 문장 단위로 자르기 시도
    const sentences = content.split(/[.!?]\s+/);
    let result = '';
    
    for (const sentence of sentences) {
      const candidate = result + sentence + '. ';
      if (candidate.length > limit) {
        break;
      }
      result = candidate;
    }

    // 문장 단위로 자르기 실패 시 단어 단위로 자르기
    if (!result.trim()) {
      const words = content.split(/\s+/);
      result = '';
      
      for (const word of words) {
        const candidate = result + word + ' ';
        if (candidate.length > limit - 3) {
          break;
        }
        result = candidate;
      }
      result += '...';
    }

    return result.trim();
  }

  // 품질 평가 메서드들

  private scoreCompressionRatio(ratio: number): number {
    // 0.1-0.3 사이가 적절한 압축률
    if (ratio >= 0.1 && ratio <= 0.3) return 100;
    if (ratio >= 0.05 && ratio <= 0.5) return 80;
    if (ratio >= 0.02 && ratio <= 0.7) return 60;
    return 30;
  }

  private scoreInformationPreservation(original: string, extracted: string): number {
    // 키워드 기반 정보 보존도 측정 (단순 구현)
    const originalKeywords = this.extractKeywords(original);
    const extractedKeywords = this.extractKeywords(extracted);
    
    const preservation = extractedKeywords.filter(keyword => 
      originalKeywords.includes(keyword)
    ).length / originalKeywords.length;
    
    return Math.min(100, preservation * 100);
  }

  private scoreReadability(content: string): number {
    // 가독성 점수 (문장 길이, 구두점 사용 등)
    const sentences = content.split(/[.!?]/).filter(s => s.trim());
    const avgSentenceLength = content.length / sentences.length;
    
    if (avgSentenceLength > 20 && avgSentenceLength < 100) return 100;
    if (avgSentenceLength > 10 && avgSentenceLength < 150) return 80;
    return 60;
  }

  private scoreStrategyConsistency(content: string, strategy: string): number {
    // 전략별 일관성 평가 (키워드 존재 여부)
    const strategyKeywords = {
      'concept-first': ['개념', '정의', '의미', 'concept', 'definition'],
      'api-first': ['함수', '메서드', 'API', 'function', 'method'],
      'example-first': ['예제', '사용법', 'example', 'usage'],
      'tutorial-first': ['단계', '과정', 'step', 'tutorial'],
      'reference-first': ['참조', '문서', 'reference', 'documentation']
    };

    const keywords = strategyKeywords[strategy as keyof typeof strategyKeywords] || [];
    const hasKeywords = keywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    return hasKeywords ? 100 : 50;
  }

  private scoreCharacterLimit(actualLength: number, targetLimit: number): number {
    const ratio = actualLength / targetLimit;
    if (ratio >= 0.8 && ratio <= 1.0) return 100;
    if (ratio >= 0.6 && ratio <= 1.2) return 80;
    if (ratio >= 0.4 && ratio <= 1.5) return 60;
    return 30;
  }

  private extractKeywords(content: string): string[] {
    // 간단한 키워드 추출 (향후 고도화 필요)
    return content
      .toLowerCase()
      .match(/\b[가-힣a-z]{3,}\b/g) || [];
  }
}

// 전략 구현체들

class ConceptFirstStrategy implements ExtractionStrategy {
  async extract(content: string, context: ExtractionContext): Promise<ExtractionResult> {
    // 개념과 정의 중심으로 추출
    const lines = content.split('\n');
    const conceptLines: string[] = [];
    
    for (const line of lines) {
      if (line.includes('정의') || line.includes('개념') || 
          line.includes('란') || line.includes('는') ||
          line.startsWith('#') || line.includes('definition')) {
        conceptLines.push(line);
      }
    }
    
    const extracted = conceptLines.join(' ').substring(0, context.summary.characterLimit);
    
    return {
      success: true,
      content: extracted,
      actualCharacterCount: extracted.length,
      extractionMethod: 'concept-first'
    };
  }
  
  getPriority(): number { return 1; }
  getDescription(): string { return 'Concept and definition focused extraction'; }
}

class ApiFirstStrategy implements ExtractionStrategy {
  async extract(content: string, context: ExtractionContext): Promise<ExtractionResult> {
    // API와 함수 시그니처 중심으로 추출
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    const functionDefs = content.match(/^\s*\w+\s+\w+\s*\(/gm) || [];
    
    const apiContent = [
      content.split('\n')[0], // 제목
      ...codeBlocks.slice(0, 2),
      ...functionDefs.slice(0, 3)
    ].join('\n\n');
    
    const extracted = apiContent.substring(0, context.summary.characterLimit);
    
    return {
      success: true,
      content: extracted,
      actualCharacterCount: extracted.length,
      extractionMethod: 'api-first'
    };
  }
  
  getPriority(): number { return 2; }
  getDescription(): string { return 'API and function signature focused extraction'; }
}

class ExampleFirstStrategy implements ExtractionStrategy {
  async extract(content: string, context: ExtractionContext): Promise<ExtractionResult> {
    // 예제와 사용법 중심으로 추출
    const examples = content.match(/예제|example|usage[\s\S]*?(?=\n\n|\n#|$)/gi) || [];
    const codeExamples = content.match(/```[\s\S]*?```/g) || [];
    
    const exampleContent = [
      content.split('\n')[0], // 제목
      ...examples.slice(0, 2),
      ...codeExamples.slice(0, 1)
    ].join('\n\n');
    
    const extracted = exampleContent.substring(0, context.summary.characterLimit);
    
    return {
      success: true,
      content: extracted,
      actualCharacterCount: extracted.length,
      extractionMethod: 'example-first'
    };
  }
  
  getPriority(): number { return 3; }
  getDescription(): string { return 'Example and usage focused extraction'; }
}

class TutorialFirstStrategy implements ExtractionStrategy {
  async extract(content: string, context: ExtractionContext): Promise<ExtractionResult> {
    // 튜토리얼과 단계별 설명 중심으로 추출
    const steps = content.match(/\d+\.\s+.*?(?=\n\d+\.|\n\n|$)/g) || [];
    const headers = content.match(/^#+\s+.*$/gm) || [];
    
    const tutorialContent = [
      ...headers.slice(0, 3),
      ...steps.slice(0, 3)
    ].join('\n\n');
    
    const extracted = tutorialContent.substring(0, context.summary.characterLimit);
    
    return {
      success: true,
      content: extracted,
      actualCharacterCount: extracted.length,
      extractionMethod: 'tutorial-first'
    };
  }
  
  getPriority(): number { return 4; }
  getDescription(): string { return 'Tutorial and step-by-step focused extraction'; }
}

class ReferenceFirstStrategy implements ExtractionStrategy {
  async extract(content: string, context: ExtractionContext): Promise<ExtractionResult> {
    // 레퍼런스와 링크 중심으로 추출
    const links = content.match(/\[.*?\]\(.*?\)/g) || [];
    const references = content.match(/참조|reference|see also[\s\S]*?(?=\n\n|\n#|$)/gi) || [];
    
    const referenceContent = [
      content.split('\n')[0], // 제목
      ...references.slice(0, 2),
      ...links.slice(0, 5)
    ].join('\n\n');
    
    const extracted = referenceContent.substring(0, context.summary.characterLimit);
    
    return {
      success: true,
      content: extracted,
      actualCharacterCount: extracted.length,
      extractionMethod: 'reference-first'
    };
  }
  
  getPriority(): number { return 5; }
  getDescription(): string { return 'Reference and link focused extraction'; }
}