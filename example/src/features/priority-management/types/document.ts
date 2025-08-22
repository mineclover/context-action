/**
 * @fileoverview Document-related type definitions for Priority Management System
 */

export interface Document {
  id: string;
  title: string;
  category: 'guide' | 'concept' | 'examples' | 'reference';
  language: 'en' | 'ko';
  size: number;
  priority: number;
  lastModified: Date;
  keywordDensity: number;
  crossReferences: number;
  status: 'draft' | 'review' | 'completed';
  assignee?: string;
}

export interface DocumentTemplate {
  id: string;
  originalId: string;
  language: 'en' | 'ko';
  characterLimit: number;
  content: string;
  wordCount: number;
  generatedAt: Date;
  status: 'generating' | 'completed' | 'error';
}

export interface PriorityMetadata {
  id: string;
  documentId: string;
  language: 'en' | 'ko';
  title: string;
  category: string;
  priority: number;
  tags: string[];
  estimatedReadTime: number;
  complexity: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

export interface ProcessingJob {
  id: string;
  originalFile: string;
  language: 'en' | 'ko';
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  endTime?: Date;
  templates: DocumentTemplate[];
  metadata?: PriorityMetadata;
  error?: string;
}