/**
 * 카테고리별 미니멀 LLMS 생성기
 * 특정 카테고리(api-spec, guide 등)의 문서만 추출하여 최소형 LLMS 파일 생성
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface CategoryDocument {
  id: string;
  title: string;
  category: string;
  priority_score: number;
  priority_tier: string;
  source_path: string;
  folder_name: string;
  url: string;
}

export interface CategoryMinimumOptions {
  dataDir?: string;
  outputDir?: string;
  languages?: string[];
  categories?: string[];
  baseUrl?: string;
}

export interface CategoryStats {
  category: string;
  totalDocuments: number;
  tierBreakdown: Record<string, number>;
  averagePriorityScore: number;
}

export interface GenerationResult {
  category: string;
  language: string;
  documentCount: number;
  filePath: string;
  success: boolean;
  error?: string;
}

/**
 * 카테고리별 미니멀 LLMS 생성기 클래스
 */
export class CategoryMinimumGenerator {
  private static readonly CATEGORY_PATTERNS: Record<string, string[]> = {
    'api-spec': ['api--*', 'api/*'],
    'guide': ['guide--*', 'guide/*', 'concept--*guide*', 'concept/*guide*']
  };

  private static readonly PRIORITY_TIER_ORDER: Record<string, number> = {
    'critical': 1,
    'essential': 2,
    'important': 3,
    'reference': 4,
    'supplementary': 5
  };

  private dataDir: string;
  private outputDir: string;
  private baseUrl: string;

  constructor(options: CategoryMinimumOptions = {}) {
    this.dataDir = options.dataDir || './data';
    this.outputDir = options.outputDir || './test/outputs';
    this.baseUrl = options.baseUrl || 'https://mineclover.github.io/context-action';
    
    // 입력 검증
    this.validateOptions(options);
  }

  /**
   * 옵션 검증
   */
  private validateOptions(options: CategoryMinimumOptions): void {
    if (options.dataDir && !fs.existsSync(options.dataDir)) {
      throw new Error(`Data directory does not exist: ${options.dataDir}`);
    }
    
    if (options.categories) {
      const validCategories = this.getAvailableCategories();
      const invalidCategories = options.categories.filter(cat => !validCategories.includes(cat));
      if (invalidCategories.length > 0) {
        throw new Error(`Invalid categories: ${invalidCategories.join(', ')}. Available: ${validCategories.join(', ')}`);
      }
    }
    
    if (options.languages) {
      const validLanguages = ['en', 'ko', 'ja', 'zh'];
      const invalidLanguages = options.languages.filter(lang => !validLanguages.includes(lang));
      if (invalidLanguages.length > 0) {
        console.warn(`Warning: Potentially unsupported languages: ${invalidLanguages.join(', ')}`);
      }
    }
  }

  /**
   * 단일 카테고리와 언어로 미니멀 LLMS 생성
   */
  async generateSingle(category: string, language: string): Promise<GenerationResult> {
    try {
      const documents = this.collectDocuments(language, category);
      
      if (documents.length === 0) {
        return {
          category,
          language,
          documentCount: 0,
          filePath: '',
          success: false,
          error: `No documents found for category: ${category} (${language})`
        };
      }

      const sortedDocuments = this.sortDocuments(documents);
      const llmsContent = this.generateMinimumLLMS(category, language, sortedDocuments);
      
      const filename = `llms-minimum-${category}-${language}.txt`;
      const filePath = path.join(this.outputDir, filename);
      
      // 출력 디렉토리 생성
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, llmsContent, 'utf8');
      
      return {
        category,
        language,
        documentCount: documents.length,
        filePath,
        success: true
      };

    } catch (error) {
      return {
        category,
        language,
        documentCount: 0,
        filePath: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 여러 카테고리와 언어로 일괄 생성
   */
  async generateBatch(options: CategoryMinimumOptions = {}): Promise<GenerationResult[]> {
    const languages = options.languages || ['ko', 'en'];
    const categories = options.categories || ['api-spec', 'guide'];
    const results: GenerationResult[] = [];

    for (const language of languages) {
      for (const category of categories) {
        const result = await this.generateSingle(category, language);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 사용 가능한 카테고리 목록 반환
   */
  getAvailableCategories(): string[] {
    return Object.keys(CategoryMinimumGenerator.CATEGORY_PATTERNS);
  }

  /**
   * 특정 카테고리의 패턴 정보 반환
   */
  getCategoryPatterns(category: string): string[] | undefined {
    return CategoryMinimumGenerator.CATEGORY_PATTERNS[category];
  }

  /**
   * 카테고리별 통계 정보 반환
   */
  getCategoryStats(category: string, language: string): CategoryStats {
    const documents = this.collectDocuments(language, category);
    const grouped = this.groupByTier(documents);
    
    const tierBreakdown: Record<string, number> = {};
    Object.entries(grouped).forEach(([tier, docs]) => {
      tierBreakdown[tier] = docs.length;
    });
    
    const totalScore = documents.reduce((sum, doc) => sum + doc.priority_score, 0);
    const averagePriorityScore = documents.length > 0 ? totalScore / documents.length : 0;
    
    return {
      category,
      totalDocuments: documents.length,
      tierBreakdown,
      averagePriorityScore: Math.round(averagePriorityScore * 100) / 100
    };
  }

  /**
   * 모든 카테고리의 통계 정보 반환
   */
  getAllStats(language: string): CategoryStats[] {
    return this.getAvailableCategories().map(category => 
      this.getCategoryStats(category, language)
    );
  }

  /**
   * 특정 언어로 사용 가능한 문서 확인
   */
  getAvailableDocuments(language: string): { category: string; count: number }[] {
    return this.getAvailableCategories().map(category => ({
      category,
      count: this.collectDocuments(language, category).length
    }));
  }

  /**
   * priority.json 파일 읽기
   */
  private readPriorityFile(filePath: string): any | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to read ${filePath}: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  /**
   * 카테고리 매칭 확인
   */
  private matchesCategory(documentPath: string, category: string): boolean {
    const patterns = CategoryMinimumGenerator.CATEGORY_PATTERNS[category];
    if (!patterns) return false;

    return patterns.some(pattern => {
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\//g, '\\/');
      const regex = new RegExp(`^${regexPattern}`, 'i');
      return regex.test(documentPath);
    });
  }

  /**
   * 문서 정보 수집
   */
  private collectDocuments(language: string, category: string): CategoryDocument[] {
    const documents: CategoryDocument[] = [];
    const priorityFiles = glob.sync(`${this.dataDir}/${language}/*/priority.json`);

    for (const priorityFile of priorityFiles) {
      const priority = this.readPriorityFile(priorityFile);
      if (!priority) continue;

      const dirName = path.dirname(priorityFile);
      const folderName = path.basename(dirName);

      if (!this.matchesCategory(folderName, category)) {
        continue;
      }

      documents.push({
        id: priority.id || folderName,
        title: priority.title || folderName.replace(/--/g, ' ').replace(/-/g, ' '),
        category: priority.category || 'unknown',
        priority_score: priority.priority_score || 0,
        priority_tier: priority.priority_tier || 'reference',
        source_path: priority.source_path || '',
        folder_name: folderName,
        url: this.generateUrl(folderName, language)
      });
    }

    return documents;
  }

  /**
   * URL 생성
   */
  private generateUrl(folderName: string, language: string): string {
    const pathParts = folderName.replace(/--/g, '/');
    return `${this.baseUrl}/${language}/${pathParts}`;
  }

  /**
   * 문서 정렬
   */
  private sortDocuments(documents: CategoryDocument[]): CategoryDocument[] {
    return documents.sort((a, b) => {
      const tierA = CategoryMinimumGenerator.PRIORITY_TIER_ORDER[a.priority_tier] || 999;
      const tierB = CategoryMinimumGenerator.PRIORITY_TIER_ORDER[b.priority_tier] || 999;

      if (tierA !== tierB) {
        return tierA - tierB;
      }

      if (a.priority_score !== b.priority_score) {
        return b.priority_score - a.priority_score;
      }

      return a.title.localeCompare(b.title);
    });
  }

  /**
   * 티어별 그룹화
   */
  private groupByTier(documents: CategoryDocument[]): Record<string, CategoryDocument[]> {
    const grouped: Record<string, CategoryDocument[]> = {};

    for (const doc of documents) {
      const tier = doc.priority_tier || 'reference';
      if (!grouped[tier]) {
        grouped[tier] = [];
      }
      grouped[tier].push(doc);
    }

    return grouped;
  }

  /**
   * 미니멀 LLMS 텍스트 생성
   */
  private generateMinimumLLMS(category: string, language: string, documents: CategoryDocument[]): string {
    const categoryTitle = {
      'api-spec': 'API 참조',
      'guide': '가이드 문서'
    }[category] || category;

    const languageTitle = language === 'ko' ? 'KO' : 'EN';
    const today = new Date().toISOString().split('T')[0];

    let content = `# Context-Action Framework - ${categoryTitle}

생성일: ${today}
유형: 최소 (${categoryTitle} 탐색 링크)
언어: ${languageTitle}
카테고리: ${category}

이 문서는 Context-Action 프레임워크의 ${categoryTitle} 문서에 대한 빠른 탐색 링크를 우선순위 등급별로 정리하여 제공합니다.

`;

    const grouped = this.groupByTier(documents);
    const tiers = ['critical', 'essential', 'important', 'reference', 'supplementary'];
    const tierNames = {
      'critical': 'Critical Documents',
      'essential': 'Essential Documents',
      'important': 'Important Documents',
      'reference': 'Reference Documents',
      'supplementary': 'Supplementary Documents'
    };

    let totalDocs = 0;

    for (const tier of tiers) {
      if (!grouped[tier] || grouped[tier].length === 0) continue;

      const tierDocs = grouped[tier];
      totalDocs += tierDocs.length;

      content += `\n## ${tierNames[tier]} (${tierDocs.length})\n\n`;

      for (const doc of tierDocs) {
        const priorityText = doc.priority_score > 0 ? doc.priority_score : 'null';
        content += `- [${doc.title}](${doc.url}) - Priority: ${priorityText}\n`;
      }
    }

    // 요약 정보 추가
    content += `\n\n## ${categoryTitle} 요약\n\n`;
    content += `- **총 문서 수**: ${totalDocs}개\n`;
    content += `- **카테고리**: ${category}\n`;
    content += `- **언어**: ${languageTitle}\n`;

    if (category === 'api-spec') {
      content += `\n## API 문서 사용 안내\n\n`;
      content += `- **Critical**: 핵심 API 및 필수 인터페이스\n`;
      content += `- **Essential**: 주요 함수 및 훅 참조자료\n`;
      content += `- **Important**: 유용한 유틸리티 및 헬퍼\n`;
      content += `- **Reference**: 고급 API 및 타입 정의\n`;

      content += `\n## 빠른 API 참조 경로\n\n`;
      content += `개발자를 위한 권장 참조 순서:\n`;
      content += `1. 핵심 API (Critical)\n`;
      content += `2. 주요 훅 (Essential)\n`;
      content += `3. 패턴 및 유틸리티 (Important)\n`;
      content += `4. 고급 타입 (Reference)\n`;
    } else if (category === 'guide') {
      content += `\n## 가이드 문서 사용 안내\n\n`;
      content += `- **Critical**: 프레임워크 이해를 위한 필수 가이드\n`;
      content += `- **Essential**: 중요한 사용법 및 패턴 가이드\n`;
      content += `- **Important**: 유용한 모범 사례 및 팁\n`;
      content += `- **Reference**: 고급 가이드 및 심화 내용\n`;

      content += `\n## 빠른 학습 경로\n\n`;
      content += `초급자를 위한 권장 읽기 순서:\n`;
      content += `1. 시작하기 (Critical)\n`;
      content += `2. 핵심 개념 (Essential)\n`;
      content += `3. 패턴 가이드 (Important)\n`;
      content += `4. 고급 활용 (Reference)\n`;
    }

    content += `\n---\n\n*llm-content 구조에서 자동 생성됨*\n`;

    return content;
  }
}