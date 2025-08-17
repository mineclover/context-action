/**
 * Simple Priority Manager
 * 
 * 단순화된 Priority JSON 관리 - 복잡한 스펙 제거
 */

import { readFile, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { LLMSConfig } from '../types/index.js';

export interface SimplePriorityDocument {
  id: string;
  title: string;
  source_path: string;
  category: 'guide' | 'api' | 'concept' | 'example' | 'reference';
}

export interface SimplePriority {
  score: number; // 1-100
  tier: 'critical' | 'essential' | 'important' | 'reference' | 'supplementary';
  rationale?: string;
}

export interface SimpleExtraction {
  strategy: 'tutorial-first' | 'api-first' | 'concept-first' | 'example-first' | 'reference-first';
  character_limits?: Record<string, {
    focus: string;
    structure?: string;
  }>;
}

export interface SimplePriorityMetadata {
  created?: string;
  updated?: string;
  version?: string;
  source_hash?: string;
}

export interface SimplePriorityFileStatus {
  schema_version?: string;
  needs_schema_update?: boolean;
  auto_generated?: boolean;
  manual_review_required?: boolean;
  source_document_last_seen?: string;
}

export interface SimplePriorityFile {
  document: SimplePriorityDocument;
  priority: SimplePriority;
  extraction: SimpleExtraction;
  metadata?: SimplePriorityMetadata;
  priority_file_status?: SimplePriorityFileStatus;
}

export class SimplePriorityManager {
  private config: LLMSConfig;
  private currentSchemaVersion = '1.0';

  constructor(config: LLMSConfig) {
    this.config = config;
  }

  /**
   * Load a simple priority file
   */
  async loadPriorityFile(language: string, documentId: string): Promise<SimplePriorityFile | null> {
    const priorityFilePath = this.getPriorityFilePath(language, documentId);
    
    if (!existsSync(priorityFilePath)) {
      return null;
    }

    try {
      const content = await readFile(priorityFilePath, 'utf-8');
      const priorityData = JSON.parse(content);
      
      // Convert from complex schema to simple schema if needed
      return this.normalizeToSimpleSchema(priorityData);
    } catch (error) {
      console.warn(`⚠️  Failed to load priority file ${priorityFilePath}: ${error}`);
      return null;
    }
  }

  /**
   * Save a simple priority file
   */
  async savePriorityFile(
    language: string, 
    documentId: string, 
    priorityFile: SimplePriorityFile
  ): Promise<void> {
    const priorityFilePath = this.getPriorityFilePath(language, documentId);
    
    // Update metadata
    const now = new Date().toISOString();
    priorityFile.metadata = {
      ...priorityFile.metadata,
      updated: now,
      version: this.currentSchemaVersion
    };

    // Update priority file status
    priorityFile.priority_file_status = {
      ...priorityFile.priority_file_status,
      schema_version: this.currentSchemaVersion,
      needs_schema_update: false
    };

    try {
      await writeFile(priorityFilePath, JSON.stringify(priorityFile, null, 2), 'utf-8');
    } catch (error) {
      console.error(`❌ Failed to save priority file ${priorityFilePath}: ${error}`);
      throw error;
    }
  }

  /**
   * Create a simple priority file from source document
   */
  async createSimplePriorityFile(
    language: string,
    documentId: string,
    sourceDocumentPath: string,
    title: string,
    category: SimplePriorityDocument['category']
  ): Promise<SimplePriorityFile> {
    const now = new Date().toISOString();
    
    // Calculate source document hash for change detection
    let sourceHash = '';
    if (existsSync(sourceDocumentPath)) {
      try {
        const sourceContent = await readFile(sourceDocumentPath, 'utf-8');
        sourceHash = createHash('md5').update(sourceContent).digest('hex');
      } catch (error) {
        console.warn(`⚠️  Could not read source document for hash: ${error}`);
      }
    }

    const priorityFile: SimplePriorityFile = {
      document: {
        id: documentId,
        title,
        source_path: path.relative(this.config.paths.docsDir, sourceDocumentPath),
        category
      },
      priority: {
        score: this.getDefaultPriorityScore(category),
        tier: this.getDefaultPriorityTier(category),
        rationale: 'Auto-generated priority assignment'
      },
      extraction: {
        strategy: this.getDefaultExtractionStrategy(category),
        character_limits: this.getDefaultCharacterLimits()
      },
      metadata: {
        created: now,
        updated: now,
        version: this.currentSchemaVersion,
        source_hash: sourceHash
      },
      priority_file_status: {
        schema_version: this.currentSchemaVersion,
        needs_schema_update: false,
        auto_generated: true,
        manual_review_required: true,
        source_document_last_seen: now
      }
    };

    return priorityFile;
  }

  /**
   * Check if priority file needs update
   */
  async checkNeedsUpdate(
    language: string,
    documentId: string,
    sourceDocumentPath: string
  ): Promise<{ needsUpdate: boolean; reasons: string[] }> {
    const priorityFile = await this.loadPriorityFile(language, documentId);
    const reasons: string[] = [];

    if (!priorityFile) {
      return { needsUpdate: true, reasons: ['priority_file_missing'] };
    }

    // Check schema version
    if (priorityFile.priority_file_status?.schema_version !== this.currentSchemaVersion) {
      reasons.push('schema_version_outdated');
    }

    // Check if source document changed
    if (existsSync(sourceDocumentPath)) {
      try {
        const sourceContent = await readFile(sourceDocumentPath, 'utf-8');
        const currentSourceHash = createHash('md5').update(sourceContent).digest('hex');
        
        if (priorityFile.metadata?.source_hash !== currentSourceHash) {
          reasons.push('source_document_changed');
        }

        // Check modification time
        const sourceStats = await stat(sourceDocumentPath);
        if (priorityFile.priority_file_status?.source_document_last_seen) {
          const lastSeen = new Date(priorityFile.priority_file_status.source_document_last_seen);
          if (sourceStats.mtime > lastSeen) {
            reasons.push('source_document_newer');
          }
        }
      } catch (error) {
        reasons.push('source_document_read_error');
      }
    }

    // Check if manual review required
    if (priorityFile.priority_file_status?.manual_review_required === true) {
      reasons.push('manual_review_required');
    }

    return { needsUpdate: reasons.length > 0, reasons };
  }

  /**
   * Update source document tracking
   */
  async updateSourceDocumentTracking(
    language: string,
    documentId: string,
    sourceDocumentPath: string
  ): Promise<void> {
    const priorityFile = await this.loadPriorityFile(language, documentId);
    if (!priorityFile) {
      throw new Error(`Priority file not found for ${documentId}`);
    }

    const now = new Date().toISOString();

    // Update source hash
    if (existsSync(sourceDocumentPath)) {
      try {
        const sourceContent = await readFile(sourceDocumentPath, 'utf-8');
        const sourceHash = createHash('md5').update(sourceContent).digest('hex');
        
        if (!priorityFile.metadata) priorityFile.metadata = {};
        priorityFile.metadata.source_hash = sourceHash;
      } catch (error) {
        console.warn(`⚠️  Could not update source hash: ${error}`);
      }
    }

    // Update tracking timestamp
    if (!priorityFile.priority_file_status) priorityFile.priority_file_status = {};
    priorityFile.priority_file_status.source_document_last_seen = now;

    await this.savePriorityFile(language, documentId, priorityFile);
  }

  /**
   * Convert complex schema to simple schema
   */
  private normalizeToSimpleSchema(complexData: any): SimplePriorityFile {
    return {
      document: {
        id: complexData.document?.id || '',
        title: complexData.document?.title || '',
        source_path: complexData.document?.source_path || '',
        category: complexData.document?.category || 'reference'
      },
      priority: {
        score: complexData.priority?.score || 50,
        tier: complexData.priority?.tier || 'reference',
        rationale: complexData.priority?.rationale
      },
      extraction: {
        strategy: complexData.extraction?.strategy || 'reference-first',
        character_limits: complexData.extraction?.character_limits || this.getDefaultCharacterLimits()
      },
      metadata: complexData.metadata,
      priority_file_status: complexData.priority_file_status || complexData.work_status?.priority_file_status
    };
  }

  /**
   * Get priority file path
   */
  private getPriorityFilePath(language: string, documentId: string): string {
    return path.join(
      this.config.paths.llmContentDir,
      language,
      documentId,
      'priority.json'
    );
  }

  /**
   * Get default priority score based on category
   */
  private getDefaultPriorityScore(category: SimplePriorityDocument['category']): number {
    const scores = {
      guide: 90,
      api: 85,
      concept: 80,
      example: 75,
      reference: 70
    };
    return scores[category] || 70;
  }

  /**
   * Get default priority tier based on category
   */
  private getDefaultPriorityTier(category: SimplePriorityDocument['category']): SimplePriority['tier'] {
    const tiers = {
      guide: 'essential' as const,
      api: 'important' as const,
      concept: 'important' as const,
      example: 'reference' as const,
      reference: 'supplementary' as const
    };
    return tiers[category] || 'reference';
  }

  /**
   * Get default extraction strategy based on category
   */
  private getDefaultExtractionStrategy(category: SimplePriorityDocument['category']): SimpleExtraction['strategy'] {
    const strategies = {
      guide: 'tutorial-first' as const,
      api: 'api-first' as const,
      concept: 'concept-first' as const,
      example: 'example-first' as const,
      reference: 'reference-first' as const
    };
    return strategies[category] || 'reference-first';
  }

  /**
   * Get default character limits configuration
   */
  private getDefaultCharacterLimits(): Record<string, { focus: string; structure?: string }> {
    return {
      '100': {
        focus: 'Core concept only',
        structure: 'Single sentence definition'
      },
      '300': {
        focus: 'Key points and usage',
        structure: 'Definition + main usage'
      },
      '1000': {
        focus: 'Practical understanding',
        structure: 'Concept + examples + usage'
      },
      '2000': {
        focus: 'Comprehensive overview',
        structure: 'Complete explanation with examples'
      }
    };
  }
}