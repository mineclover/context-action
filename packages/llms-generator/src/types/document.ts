/**
 * Document content and processing types
 */

export interface DocumentContent {
  id: string;
  title: string;
  sourcePath: string;
  language: string;
  rawContent: string;
  cleanContent: string; // without YAML frontmatter
  size: number;
  stats: DocumentStats;
}

export interface DocumentStats {
  totalCharacters: number;
  yamlCharacters: number;
  contentCharacters: number;
  wordCount: number;
  lineCount: number;
}

export interface DocumentCollection {
  [language: string]: DocumentContent[];
}

export interface SortedDocuments {
  language: string;
  documents: DocumentContent[];
  totalCount: number;
  totalSize: number;
}

export interface ProcessedContent {
  original: DocumentContent;
  processed: string;
  strategy: string;
  charactersUsed: number;
  completeness: number;
  qualityScore: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  completeness: number;
}