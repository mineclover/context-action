/**
 * Adaptive Composer
 * 
 * Implements adaptive composition for character-limited llms.txt generation
 * Optimally fills character limits using priority-based content selection
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig, PriorityMetadata } from '../types/index.js';
import { PriorityManager } from './PriorityManager.js';

export interface CompositionOptions {
  language: string;
  characterLimit: number;
  includeTableOfContents?: boolean;
  tocCharacterLimit?: number;
  priorityThreshold?: number;
}

export interface CompositionResult {
  content: string;
  summary: {
    totalCharacters: number;
    targetCharacters: number;
    utilization: number;
    documentsIncluded: number;
    tocCharacters: number;
    contentCharacters: number;
  };
  documents: Array<{
    documentId: string;
    title: string;
    priority: number;
    characterLimit: number;
    actualCharacters: number;
  }>;
}

export interface DocumentContent {
  documentId: string;
  title: string;
  priority: number;
  tier: string;
  availableCharacterLimits: number[];
  contents: Map<number, string>;
}

export class AdaptiveComposer {
  private config: LLMSConfig;
  private priorityManager: PriorityManager;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.priorityManager = new PriorityManager(config.paths.llmContentDir);
  }

  /**
   * Compose adaptive content for specified character limit
   */
  async composeAdaptiveContent(options: CompositionOptions): Promise<CompositionResult> {
    const {
      language,
      characterLimit,
      includeTableOfContents = true,
      tocCharacterLimit = 100,
      priorityThreshold = 0
    } = options;

    // Load all documents with their content summaries
    const documents = await this.loadDocumentContents(language);
    
    // Filter by priority threshold and sort by priority
    const filteredDocs = documents
      .filter(doc => doc.priority >= priorityThreshold)
      .sort((a, b) => b.priority - a.priority);

    let result: CompositionResult = {
      content: '',
      summary: {
        totalCharacters: 0,
        targetCharacters: characterLimit,
        utilization: 0,
        documentsIncluded: 0,
        tocCharacters: 0,
        contentCharacters: 0
      },
      documents: []
    };

    // Step 1: Generate Table of Contents using shortest summaries
    let tocContent = '';
    let tocCharacters = 0;
    
    if (includeTableOfContents && filteredDocs.length > 0) {
      tocContent = this.generateTableOfContents(filteredDocs, tocCharacterLimit);
      tocCharacters = tocContent.length;
    }

    // Step 2: Calculate remaining character budget for content
    const availableContentChars = characterLimit - tocCharacters;
    
    if (availableContentChars <= 0) {
      // If TOC takes all space, return just TOC
      result.content = tocContent;
      result.summary.tocCharacters = tocCharacters;
      result.summary.totalCharacters = tocCharacters;
      result.summary.utilization = (tocCharacters / characterLimit) * 100;
      return result;
    }

    // Step 3: Optimal content selection using greedy algorithm with priority weighting
    const selectedContent = this.selectOptimalContent(filteredDocs, availableContentChars);

    // Step 4: Compose final content
    let finalContent = '';
    
    if (tocContent) {
      finalContent += tocContent + '\n\n';
    }
    
    finalContent += selectedContent.content;

    // Step 5: Build result
    result.content = finalContent;
    result.summary = {
      totalCharacters: finalContent.length,
      targetCharacters: characterLimit,
      utilization: (finalContent.length / characterLimit) * 100,
      documentsIncluded: selectedContent.documents.length,
      tocCharacters: tocCharacters,
      contentCharacters: selectedContent.content.length
    };
    result.documents = selectedContent.documents;

    return result;
  }

  /**
   * Load all document contents with their available character limits
   */
  private async loadDocumentContents(language: string): Promise<DocumentContent[]> {
    const allPriorities = await this.priorityManager.loadAllPriorities();
    const priorities = this.priorityManager.filterByLanguage(allPriorities, language);
    
    const documents: DocumentContent[] = [];

    for (const [documentId, priority] of Object.entries(priorities)) {
      const documentContent: DocumentContent = {
        documentId,
        title: priority.document.title,
        priority: priority.priority.score,
        tier: priority.priority.tier,
        availableCharacterLimits: [],
        contents: new Map()
      };

      // Find all available character limit files for this document
      const documentDir = path.join(this.config.paths.llmContentDir, language, documentId);
      
      // Check for standard character limits
      const standardLimits = [100, 300, 500, 1000, 2000, 3000, 4000];
      
      for (const limit of standardLimits) {
        const filePath = path.join(documentDir, `${documentId}-${limit}.txt`);
        
        if (existsSync(filePath)) {
          try {
            const content = await readFile(filePath, 'utf-8');
            documentContent.availableCharacterLimits.push(limit);
            documentContent.contents.set(limit, content.trim());
          } catch (error) {
            console.warn(`⚠️  Could not read ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      if (documentContent.availableCharacterLimits.length > 0) {
        // Sort character limits in ascending order
        documentContent.availableCharacterLimits.sort((a, b) => a - b);
        documents.push(documentContent);
      }
    }

    return documents;
  }

  /**
   * Generate table of contents using shortest available summaries
   */
  private generateTableOfContents(documents: DocumentContent[], targetChars: number): string {
    let toc = '# 목차\n\n';
    let currentLength = toc.length;
    
    for (const doc of documents) {
      // Use shortest available summary for TOC
      const shortestLimit = Math.min(...doc.availableCharacterLimits);
      const shortSummary = doc.contents.get(shortestLimit) || doc.title;
      
      // Extract first line or first sentence as TOC entry
      const tocEntry = this.extractTocEntry(shortSummary, doc.title);
      const tocLine = `- ${tocEntry}\n`;
      
      if (currentLength + tocLine.length <= targetChars) {
        toc += tocLine;
        currentLength += tocLine.length;
      } else {
        // If we can't fit more entries, add ellipsis
        const ellipsis = '- ...\n';
        if (currentLength + ellipsis.length <= targetChars) {
          toc += ellipsis;
        }
        break;
      }
    }
    
    return toc.trim();
  }

  /**
   * Extract a concise TOC entry from content
   */
  private extractTocEntry(content: string, fallbackTitle: string): string {
    // Remove markdown headers
    const cleanContent = content.replace(/^#+\s*/gm, '').trim();
    
    // Try to get first meaningful line
    const lines = cleanContent.split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Limit to reasonable TOC entry length
      return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
    }
    
    return fallbackTitle;
  }

  /**
   * Select optimal content using priority-weighted greedy algorithm
   */
  private selectOptimalContent(
    documents: DocumentContent[], 
    availableChars: number
  ): { content: string; documents: Array<any> } {
    const selected: Array<{
      documentId: string;
      title: string;
      priority: number;
      characterLimit: number;
      actualCharacters: number;
      content: string;
    }> = [];

    let remainingChars = availableChars;
    let content = '';

    // Greedy selection with priority weighting
    for (const doc of documents) {
      if (remainingChars <= 50) break; // Reserve minimum space
      
      // Find best character limit for remaining space
      const bestLimit = this.findBestCharacterLimit(doc, remainingChars);
      
      if (bestLimit && doc.contents.has(bestLimit)) {
        const docContent = doc.contents.get(bestLimit)!;
        const actualChars = docContent.length;
        
        if (actualChars <= remainingChars) {
          selected.push({
            documentId: doc.documentId,
            title: doc.title,
            priority: doc.priority,
            characterLimit: bestLimit,
            actualCharacters: actualChars,
            content: docContent
          });
          
          content += docContent + '\n\n';
          remainingChars -= actualChars + 2; // +2 for newlines
        }
      }
    }

    return {
      content: content.trim(),
      documents: selected.map(({ content, ...rest }) => rest)
    };
  }

  /**
   * Find the best character limit for remaining space
   * Prioritizes larger content that still fits
   */
  private findBestCharacterLimit(doc: DocumentContent, remainingChars: number): number | null {
    const availableLimits = doc.availableCharacterLimits
      .filter(limit => {
        const content = doc.contents.get(limit);
        return content && content.length <= remainingChars;
      })
      .sort((a, b) => b - a); // Sort descending to prefer larger content

    return availableLimits[0] || null;
  }

  /**
   * Compose content for multiple character limits in batch
   */
  async composeBatchContent(
    language: string,
    characterLimits: number[],
    options: Partial<CompositionOptions> = {}
  ): Promise<Map<number, CompositionResult>> {
    const results = new Map<number, CompositionResult>();

    for (const limit of characterLimits) {
      const result = await this.composeAdaptiveContent({
        language,
        characterLimit: limit,
        ...options
      });
      
      results.set(limit, result);
    }

    return results;
  }

  /**
   * Get composition statistics for a language
   */
  async getCompositionStats(language: string): Promise<{
    totalDocuments: number;
    documentsWithContent: number;
    averagePriority: number;
    availableCharacterLimits: number[];
    totalContentSize: number;
  }> {
    const documents = await this.loadDocumentContents(language);
    
    const totalDocuments = documents.length;
    const documentsWithContent = documents.filter(doc => doc.contents.size > 0).length;
    const averagePriority = documents.length > 0 
      ? documents.reduce((sum, doc) => sum + doc.priority, 0) / documents.length 
      : 0;
    
    const allLimits = new Set<number>();
    let totalContentSize = 0;
    
    documents.forEach(doc => {
      doc.availableCharacterLimits.forEach(limit => allLimits.add(limit));
      doc.contents.forEach(content => totalContentSize += content.length);
    });

    return {
      totalDocuments,
      documentsWithContent,
      averagePriority,
      availableCharacterLimits: Array.from(allLimits).sort((a, b) => a - b),
      totalContentSize
    };
  }
}