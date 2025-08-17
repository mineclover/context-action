/**
 * Document processing and content extraction
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type {
  DocumentContent,
  DocumentStats,
  DocumentCollection,
  PriorityMetadata
} from '../types/index.js';

export class DocumentProcessor {
  private docsPath: string;

  constructor(docsPath: string) {
    this.docsPath = docsPath;
  }

  /**
   * Read and process a source document
   */
  async readSourceDocument(sourcePath: string, language: string, documentId: string): Promise<DocumentContent> {
    // Remove language prefix from sourcePath if it exists (priority.json might include it)
    const cleanSourcePath = sourcePath.startsWith(`${language}/`) 
      ? sourcePath.slice(language.length + 1) 
      : sourcePath;
    
    const fullPath = path.join(this.docsPath, language, cleanSourcePath);
    
    if (!existsSync(fullPath)) {
      throw new Error(`Source document not found: ${fullPath}`);
    }

    const rawContent = await readFile(fullPath, 'utf-8');
    const cleanContent = this.removeYAMLFrontmatter(rawContent);
    const stats = this.analyzeDocumentSize(rawContent, cleanContent);

    return {
      id: documentId,
      title: this.extractTitle(cleanContent, documentId),
      sourcePath,
      language,
      rawContent,
      cleanContent,
      size: rawContent.length,
      stats
    };
  }

  /**
   * Remove YAML frontmatter from document content
   */
  removeYAMLFrontmatter(content: string): string {
    // Remove YAML frontmatter (--- at start to first --- or end)
    return content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  }

  /**
   * Analyze document size and statistics
   */
  analyzeDocumentSize(rawContent: string, cleanContent: string): DocumentStats {
    const totalCharacters = rawContent.length;
    const contentCharacters = cleanContent.length;
    const yamlCharacters = totalCharacters - contentCharacters;
    
    // Estimate word count (rough approximation)
    const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;
    
    // Count lines
    const lineCount = cleanContent.split('\n').length;

    return {
      totalCharacters,
      yamlCharacters,
      contentCharacters,
      wordCount,
      lineCount
    };
  }

  /**
   * Extract title from document content or generate from ID
   */
  private extractTitle(content: string, documentId: string): string {
    // Try to find the first H1 heading
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Fallback: generate title from document ID
    return this.generateTitleFromId(documentId);
  }

  /**
   * Generate human-readable title from document ID
   */
  private generateTitleFromId(documentId: string): string {
    return documentId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Process multiple documents based on priority metadata
   */
  async processDocuments(
    priorities: Record<string, PriorityMetadata>,
    language: string
  ): Promise<DocumentContent[]> {
    const documents: DocumentContent[] = [];

    for (const [documentId, priority] of Object.entries(priorities)) {
      try {
        const document = await this.readSourceDocument(
          priority.document.source_path,
          language,
          documentId
        );
        
        // Update title from priority metadata if available
        if (priority.document.title) {
          document.title = priority.document.title;
        }

        documents.push(document);
      } catch (error) {
        console.warn(`Failed to process document ${documentId}:`, error instanceof Error ? error.message : error);
        // Continue processing other documents
      }
    }

    return documents;
  }

  /**
   * Get document collection statistics
   */
  getCollectionStats(documents: DocumentContent[]): {
    totalDocuments: number;
    totalSize: number;
    averageSize: number;
    totalWords: number;
    averageWords: number;
  } {
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    const totalWords = documents.reduce((sum, doc) => sum + doc.stats.wordCount, 0);

    return {
      totalDocuments,
      totalSize,
      averageSize: totalDocuments > 0 ? Math.round(totalSize / totalDocuments) : 0,
      totalWords,
      averageWords: totalDocuments > 0 ? Math.round(totalWords / totalDocuments) : 0
    };
  }

  /**
   * Filter documents by category
   */
  filterByCategory(
    documents: DocumentContent[],
    priorities: Record<string, PriorityMetadata>,
    category: string
  ): DocumentContent[] {
    return documents.filter(doc => {
      const priority = priorities[doc.id];
      return priority && priority.document.category === category;
    });
  }

  /**
   * Sort documents by priority score
   */
  sortByPriority(
    documents: DocumentContent[],
    priorities: Record<string, PriorityMetadata>
  ): DocumentContent[] {
    return documents.sort((a, b) => {
      const aPriority = priorities[a.id]?.priority.score || 0;
      const bPriority = priorities[b.id]?.priority.score || 0;
      return bPriority - aPriority;
    });
  }
}