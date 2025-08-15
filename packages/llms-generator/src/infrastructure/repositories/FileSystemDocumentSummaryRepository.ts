/**
 * Infrastructure Implementation: FileSystemDocumentSummaryRepository
 * 
 * 파일 시스템 기반 DocumentSummary 저장소 구현
 * 클린 아키텍처에서 인프라스트럭처 계층의 구체적 구현
 */

import { readFile, writeFile, readdir, stat, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type {
  IDocumentSummaryRepository,
  SummarySearchCriteria,
  SummarySortOptions,
  SaveResult,
  BatchResult
} from '../../domain/repositories/IDocumentSummaryRepository.js';
import { DocumentSummary } from '../../domain/entities/DocumentSummary.js';
import type { IFrontmatterService } from '../../domain/services/interfaces/IFrontmatterService.js';

/**
 * FileSystemDocumentSummaryRepository
 * 
 * 파일 시스템을 사용한 DocumentSummary 영속성 관리
 * 각 요약은 개별 .md 파일로 저장
 */
export class FileSystemDocumentSummaryRepository implements IDocumentSummaryRepository {
  constructor(
    private readonly basePath: string,
    private readonly frontmatterService: IFrontmatterService
  ) {}

  /**
   * 단일 문서 요약 저장
   */
  async save(summary: DocumentSummary): Promise<SaveResult> {
    try {
      const filePath = this.getFilePath(summary);
      await this.ensureDirectoryExists(path.dirname(filePath));

      const markdownWithFrontmatter = this.frontmatterService.generate(
        this.createFrontmatterFromSummary(summary),
        summary.content,
        { includeGeneratedTimestamp: true }
      );

      await writeFile(filePath, markdownWithFrontmatter.rawMarkdown, 'utf-8');

      return {
        success: true,
        path: filePath
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 여러 문서 요약 일괄 저장
   */
  async saveMany(summaries: ReadonlyArray<DocumentSummary>): Promise<BatchResult> {
    const result = {
      totalProcessed: summaries.length,
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{
        documentSummary: DocumentSummary;
        error: string;
      }>
    };

    for (const summary of summaries) {
      const saveResult = await this.save(summary);
      
      if (saveResult.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.failures.push({
          documentSummary: summary,
          error: saveResult.error || 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * 고유 ID로 문서 요약 조회
   */
  async findByUniqueId(uniqueId: string): Promise<DocumentSummary | null> {
    const [documentId, characterLimit, language] = uniqueId.split('-');
    const numericLimit = parseInt(characterLimit, 10);
    
    if (isNaN(numericLimit)) {
      return null;
    }

    return this.findByDocumentAndLimit(documentId, language, numericLimit);
  }

  /**
   * 문서 ID와 언어, 글자 수로 조회
   */
  async findByDocumentAndLimit(
    documentId: string,
    language: string,
    characterLimit: number
  ): Promise<DocumentSummary | null> {
    try {
      const filePath = this.getFilePathByComponents(documentId, language, characterLimit);
      
      if (!existsSync(filePath)) {
        return null;
      }

      const markdown = await readFile(filePath, 'utf-8');
      return this.parseMarkdownToSummary(markdown);

    } catch (error) {
      console.warn(`Failed to load summary ${documentId}-${characterLimit}-${language}:`, error);
      return null;
    }
  }

  /**
   * 조건에 맞는 모든 문서 요약 조회
   */
  async findByCriteria(
    criteria: SummarySearchCriteria,
    sortOptions?: SummarySortOptions
  ): Promise<ReadonlyArray<DocumentSummary>> {
    try {
      const allSummaries = await this.loadAllSummaries();
      let filtered = this.applyCriteria(allSummaries, criteria);

      if (sortOptions) {
        filtered = this.applySorting(filtered, sortOptions);
      }

      return filtered;

    } catch (error) {
      console.warn('Failed to find summaries by criteria:', error);
      return [];
    }
  }

  /**
   * 특정 언어의 모든 문서 요약 조회
   */
  async findByLanguage(language: string): Promise<ReadonlyArray<DocumentSummary>> {
    return this.findByCriteria({ language });
  }

  /**
   * 특정 글자 수 제한의 모든 문서 요약 조회
   */
  async findByCharacterLimit(characterLimit: number): Promise<ReadonlyArray<DocumentSummary>> {
    return this.findByCriteria({ characterLimit });
  }

  /**
   * 문서 요약 존재 여부 확인
   */
  async exists(documentId: string, language: string, characterLimit: number): Promise<boolean> {
    const filePath = this.getFilePathByComponents(documentId, language, characterLimit);
    return existsSync(filePath);
  }

  /**
   * 문서 요약 삭제
   */
  async delete(uniqueId: string): Promise<boolean> {
    try {
      const summary = await this.findByUniqueId(uniqueId);
      if (!summary) {
        return false;
      }

      const filePath = this.getFilePath(summary);
      await unlink(filePath);
      return true;

    } catch (error) {
      console.warn(`Failed to delete summary ${uniqueId}:`, error);
      return false;
    }
  }

  /**
   * 조건에 맞는 모든 문서 요약 삭제
   */
  async deleteMany(criteria: SummarySearchCriteria): Promise<BatchResult> {
    const summaries = await this.findByCriteria(criteria);
    const result = {
      totalProcessed: summaries.length,
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{
        documentSummary: DocumentSummary;
        error: string;
      }>
    };

    for (const summary of summaries) {
      const success = await this.delete(summary.getUniqueId());
      
      if (success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.failures.push({
          documentSummary: summary,
          error: 'Failed to delete file'
        });
      }
    }

    return result;
  }

  /**
   * 저장소 통계 정보
   */
  async getStats(language?: string): Promise<{
    totalSummaries: number;
    uniqueDocuments: number;
    characterLimits: ReadonlyArray<number>;
    averagePriority: number;
    tierDistribution: Record<string, number>;
  }> {
    const criteria = language ? { language } : {};
    const summaries = await this.findByCriteria(criteria);

    const uniqueDocuments = new Set(summaries.map(s => s.document.id)).size;
    const characterLimits = [...new Set(summaries.map(s => s.summary.characterLimit))].sort((a, b) => a - b);
    const averagePriority = summaries.length > 0 
      ? summaries.reduce((sum, s) => sum + s.priority.score, 0) / summaries.length 
      : 0;

    const tierDistribution: Record<string, number> = {};
    summaries.forEach(s => {
      tierDistribution[s.priority.tier] = (tierDistribution[s.priority.tier] || 0) + 1;
    });

    return {
      totalSummaries: summaries.length,
      uniqueDocuments,
      characterLimits,
      averagePriority,
      tierDistribution
    };
  }

  /**
   * 중복 제거
   */
  async deduplicate(criteria: SummarySearchCriteria): Promise<BatchResult> {
    const summaries = await this.findByCriteria(criteria);
    const duplicateGroups = this.groupDuplicates(summaries);
    
    const result = {
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{
        documentSummary: DocumentSummary;
        error: string;
      }>
    };

    for (const group of duplicateGroups) {
      if (group.length <= 1) continue;

      // 가장 최신 것을 제외하고 나머지 삭제
      const toDelete = group
        .sort((a, b) => b.generated.timestamp.getTime() - a.generated.timestamp.getTime())
        .slice(1);

      result.totalProcessed += toDelete.length;

      for (const summary of toDelete) {
        const success = await this.delete(summary.getUniqueId());
        if (success) {
          result.successCount++;
        } else {
          result.failureCount++;
          result.failures.push({
            documentSummary: summary,
            error: 'Failed to delete duplicate'
          });
        }
      }
    }

    return result;
  }

  // Private Helper Methods

  private getFilePath(summary: DocumentSummary): string {
    return this.getFilePathByComponents(
      summary.document.id,
      summary.summary.language,
      summary.summary.characterLimit
    );
  }

  private getFilePathByComponents(documentId: string, language: string, characterLimit: number): string {
    return path.join(
      this.basePath,
      language,
      documentId,
      `${documentId}-${characterLimit}.md`
    );
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  private createFrontmatterFromSummary(summary: DocumentSummary): any {
    // DocumentSummary에서 Frontmatter 생성 로직은 별도 도메인 서비스로 분리 권장
    // 여기서는 간단히 구현
    return {
      document: summary.document,
      priority: summary.priority,
      summary: {
        character_limit: summary.summary.characterLimit,
        focus: summary.summary.focus,
        strategy: summary.summary.strategy,
        language: summary.summary.language
      },
      generated: {
        from: summary.generated.from,
        timestamp: summary.generated.timestamp.toISOString(),
        source_type: summary.generated.sourceType,
        character_count: summary.generated.characterCount
      }
    };
  }

  private async parseMarkdownToSummary(markdown: string): Promise<DocumentSummary | null> {
    try {
      const parseResult = this.frontmatterService.parse(markdown);
      
      if (!parseResult.success || !parseResult.frontmatter || !parseResult.content) {
        return null;
      }

      const frontmatter = parseResult.frontmatter;
      const data = frontmatter.data;

      return DocumentSummary.create({
        document: data.document,
        priority: data.priority,
        summary: data.summary,
        content: parseResult.content,
        generated: data.generated
      });

    } catch (error) {
      console.warn('Failed to parse markdown to summary:', error);
      return null;
    }
  }

  private async loadAllSummaries(): Promise<DocumentSummary[]> {
    const summaries: DocumentSummary[] = [];
    
    try {
      await this.scanDirectory(this.basePath, summaries);
    } catch (error) {
      console.warn('Failed to load all summaries:', error);
    }

    return summaries;
  }

  private async scanDirectory(dirPath: string, summaries: DocumentSummary[]): Promise<void> {
    if (!existsSync(dirPath)) {
      return;
    }

    const entries = await readdir(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        await this.scanDirectory(fullPath, summaries);
      } else if (entry.endsWith('.md')) {
        try {
          const markdown = await readFile(fullPath, 'utf-8');
          const summary = await this.parseMarkdownToSummary(markdown);
          if (summary) {
            summaries.push(summary);
          }
        } catch (error) {
          console.warn(`Failed to load summary from ${fullPath}:`, error);
        }
      }
    }
  }

  private applyCriteria(summaries: DocumentSummary[], criteria: SummarySearchCriteria): DocumentSummary[] {
    return summaries.filter(summary => {
      if (criteria.documentId && summary.document.id !== criteria.documentId) {
        return false;
      }

      if (criteria.language && summary.summary.language !== criteria.language) {
        return false;
      }

      if (criteria.characterLimit && summary.summary.characterLimit !== criteria.characterLimit) {
        return false;
      }

      if (criteria.priorityRange) {
        const score = summary.priority.score;
        if (score < criteria.priorityRange.min || score > criteria.priorityRange.max) {
          return false;
        }
      }

      if (criteria.tiers && !criteria.tiers.includes(summary.priority.tier)) {
        return false;
      }

      if (criteria.sourceType && summary.generated.from !== criteria.sourceType) {
        return false;
      }

      return true;
    });
  }

  private applySorting(summaries: DocumentSummary[], sortOptions: SummarySortOptions): DocumentSummary[] {
    return [...summaries].sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.field) {
        case 'priority':
          comparison = a.priority.score - b.priority.score;
          break;
        case 'characterLimit':
          comparison = a.summary.characterLimit - b.summary.characterLimit;
          break;
        case 'timestamp':
          comparison = a.generated.timestamp.getTime() - b.generated.timestamp.getTime();
          break;
        case 'documentId':
          comparison = a.document.id.localeCompare(b.document.id);
          break;
      }

      return sortOptions.direction === 'desc' ? -comparison : comparison;
    });
  }

  private groupDuplicates(summaries: ReadonlyArray<DocumentSummary>): DocumentSummary[][] {
    const groups = new Map<string, DocumentSummary[]>();

    summaries.forEach(summary => {
      const key = `${summary.document.id}-${summary.summary.language}-${summary.summary.characterLimit}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(summary);
    });

    return Array.from(groups.values());
  }
}