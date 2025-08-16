/**
 * Adaptive Composer
 * 
 * Implements adaptive composition for character-limited llms.txt generation
 * Optimally fills character limits using priority-based content selection
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig } from '../types/index.js';
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
   * Now supports both .txt and .md (with YAML frontmatter) files
   */
  private async loadDocumentContents(language: string): Promise<DocumentContent[]> {
    const allPriorities = await this.priorityManager.loadAllPriorities();
    const priorities = this.priorityManager.filterByLanguage(allPriorities, language);
    
    const documents: DocumentContent[] = [];

    for (const [documentId, priority] of Object.entries(priorities)) {
      const documentContent: DocumentContent = {
        documentId,
        title: priority.document.title,
        priority: priority.priority.score || 50, // Default priority if null
        tier: priority.priority.tier || 'important',
        availableCharacterLimits: [],
        contents: new Map()
      };

      // Try to read the original markdown file from docs directory
      const sourcePath = priority.document.source_path;
      if (!sourcePath) {
        console.warn(`⚠️  No source_path for document ${documentId}`);
        continue;
      }

      const originalFilePath = path.join(this.config.paths.docsDir, sourcePath);
      
      if (existsSync(originalFilePath)) {
        try {
          const originalContent = await readFile(originalFilePath, 'utf-8');
          
          // Generate content summaries for different character limits
          const standardLimits = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000];
          
          for (const limit of standardLimits) {
            const summary = this.generateContentSummary(originalContent, limit);
            if (summary.trim()) {
              documentContent.availableCharacterLimits.push(limit);
              documentContent.contents.set(limit, summary.trim());
            }
          }
          
          if (documentContent.availableCharacterLimits.length > 0) {
            // Sort character limits in ascending order
            documentContent.availableCharacterLimits.sort((a, b) => a - b);
            documents.push(documentContent);
          }
        } catch (error) {
          console.warn(`⚠️  Could not read original file ${originalFilePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        console.warn(`⚠️  Original file not found: ${originalFilePath}`);
      }
    }

    return documents;
  }

  /**
   * Generate content summary for a specific character limit
   */
  private generateContentSummary(originalContent: string, characterLimit: number): string {
    // Clean the content (remove frontmatter if exists)
    const cleanContent = this.extractContentFromFile(originalContent, true);
    
    if (cleanContent.length <= characterLimit) {
      return cleanContent;
    }
    
    // For very small limits, just return the title and a brief description
    if (characterLimit <= 100) {
      const lines = cleanContent.split('\n').filter(line => line.trim());
      const title = lines.find(line => line.startsWith('#'))?.replace(/^#+\s*/, '') || 'Document';
      return `# ${title}\n\nBrief reference for ${title}.`;
    }
    
    // For larger limits, try to preserve structure while truncating
    const lines = cleanContent.split('\n');
    let result = '';
    let currentLength = 0;
    
    for (const line of lines) {
      const lineWithNewline = line + '\n';
      if (currentLength + lineWithNewline.length > characterLimit - 20) { // Reserve space for ellipsis
        if (result.trim()) {
          result += '\n\n...';
        }
        break;
      }
      result += lineWithNewline;
      currentLength += lineWithNewline.length;
    }
    
    return result.trim();
  }

  /**
   * Extract content from file, handling both .md (with frontmatter) and .txt formats
   */
  private extractContentFromFile(rawContent: string, isMarkdown: boolean): string {
    if (!isMarkdown) {
      return rawContent; // .txt files - return as is
    }

    // .md files - extract content after YAML frontmatter
    const frontmatterMatch = rawContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    
    if (frontmatterMatch) {
      return frontmatterMatch[2]; // Content after frontmatter
    }

    // No frontmatter found, return entire content
    return rawContent;
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
    // For TOC, just use the title to avoid placeholder text
    // Remove any extra characters and return clean title
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

  /**
   * Generate individual character-limited files for all documents
   */
  async generateIndividualCharacterLimited(
    characterLimits: number[], 
    language: string = 'en'
  ): Promise<void> {
    console.log(`📝 Generating individual character-limited files for ${language}...`);
    
    const allPriorities = await this.priorityManager.loadAllPriorities();
    const priorities = this.priorityManager.filterByLanguage(allPriorities, language);
    
    let generatedCount = 0;
    
    for (const [documentId, priority] of Object.entries(priorities)) {
      const sourcePath = priority.document.source_path;
      if (!sourcePath) {
        console.warn(`⚠️  No source_path for document ${documentId}`);
        continue;
      }

      const originalFilePath = path.join(this.config.paths.docsDir, sourcePath);
      
      if (existsSync(originalFilePath)) {
        try {
          const originalContent = await readFile(originalFilePath, 'utf-8');
          
          // Generate files for each character limit
          for (const limit of characterLimits) {
            const summary = this.generateContentSummary(originalContent, limit);
            
            if (summary.trim()) {
              // Create frontmatter
              const frontmatter = {
                title: priority.document.title,
                category: priority.document.category,
                complexity: priority.tags?.complexity || 'intermediate',
                character_limit: limit,
                tags: priority.tags?.primary || [],
                audience: priority.tags?.audience || [],
                source: sourcePath
              };
              
              // Combine frontmatter and content
              const fileContent = `---\n${Object.entries(frontmatter)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join('\n')}\n---\n\n${summary}`;
              
              // Write to individual document directory
              const documentDir = path.join(this.config.paths.llmContentDir, language, documentId);
              await mkdir(documentDir, { recursive: true });
              
              const filePath = path.join(documentDir, `${documentId}-${limit}.md`);
              await writeFile(filePath, fileContent, 'utf-8');
              
              generatedCount++;
            }
          }
        } catch (error) {
          console.warn(`⚠️  Could not process ${originalFilePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        console.warn(`⚠️  Original file not found: ${originalFilePath}`);
      }
    }
    
    console.log(`✅ Generated ${generatedCount} individual character-limited files`);
  }
}