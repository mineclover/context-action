/**
 * Core Types - Shared types across the application
 */

export interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
  characterLimit?: number;
  path: string;
  lastModified: Date;
}

export interface Priority {
  documentId: string;
  priority: number;
  category: string;
  tier: 'essential' | 'important' | 'optional';
}

export interface WorkItem {
  documentId: string;
  category: string;
  language: string;
  characterLimit: number;
  priority: number;
  status: CompletionStatus;
  workflowStage: WorkflowStage;
  sourcePath: string;
  priorityPath: string;
  templatePath: string;
  qualityScore: number;
}

export type CompletionStatus = 
  | 'template'
  | 'draft' 
  | 'review'
  | 'completed';

export type WorkflowStage = 
  | 'template_generation'
  | 'content_drafting'
  | 'content_review'
  | 'quality_validation'
  | 'final_approval'
  | 'published';

export type Language = 'en' | 'ko';

export type Category = 'guide' | 'api' | 'concept' | 'examples';

export type CharacterLimit = 100 | 200 | 300 | 500 | 1000 | 2000 | 5000;

export interface Frontmatter {
  document_id: string;
  category: string;
  source_path: string;
  character_limit: number;
  last_update: string;
  update_status: string;
  priority_score: number;
  priority_tier: string;
  completion_status: CompletionStatus;
  workflow_stage: WorkflowStage;
  quality_score?: number;
  content_hash?: string;
  last_editor?: string;
  review_required?: boolean;
}