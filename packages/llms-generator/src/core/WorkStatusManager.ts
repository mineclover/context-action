/**
 * Work Status Manager - tracks content generation work status
 */

import { readFile, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig, PriorityMetadata } from '../types/index.js';
import { PriorityManager } from './PriorityManager.js';

export interface WorkStatusData {
  source_modified?: string;
  generated_files?: Record<string, {
    path: string;
    created: string;
    modified: string;
    edited: boolean;
    needs_update: boolean;
  }>;
  last_checked?: string;
}

export interface WorkStatusInfo {
  documentId: string;
  sourceFile: string;
  sourceModified?: Date;
  characterLimits: number[];
  generatedFiles: Array<{
    charLimit: number;
    path: string;
    exists: boolean;
    created?: Date;
    modified?: Date;
    edited: boolean;
    needsUpdate: boolean;
    size?: number;
  }>;
  lastChecked?: Date;
  needsWork: boolean;
}

export interface WorkListFilters {
  needsUpdate?: boolean;
  missing?: boolean;
  outdated?: boolean;
  characterLimit?: number;
}

export class WorkStatusManager {
  private config: LLMSConfig;
  private priorityManager: PriorityManager;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.priorityManager = new PriorityManager(config.paths.llmContentDir);
  }

  /**
   * Update work status for a document
   */
  async updateWorkStatus(
    language: string, 
    documentId: string, 
    characterLimits: number[] = [100, 300, 1000, 2000]
  ): Promise<void> {
    const priorityFile = path.join(this.config.paths.llmContentDir, language, documentId, 'priority.json');
    
    if (!existsSync(priorityFile)) {
      throw new Error(`Priority file not found: ${priorityFile}`);
    }

    // Load current priority data
    const priorityContent = await readFile(priorityFile, 'utf-8');
    const priority: PriorityMetadata = JSON.parse(priorityContent);

    // Get source file info (include language prefix if not already present)
    let sourceFile: string;
    if (priority.document.source_path.startsWith(`${language}/`)) {
      // Language prefix already included
      sourceFile = path.join(this.config.paths.docsDir, priority.document.source_path);
    } else {
      // Need to add language prefix
      sourceFile = path.join(this.config.paths.docsDir, language, priority.document.source_path);
    }
    let sourceModified: Date | undefined;
    
    if (existsSync(sourceFile)) {
      const sourceStat = await stat(sourceFile);
      sourceModified = sourceStat.mtime;
    }

    // Check generated files
    const generatedFiles: Record<string, any> = {};
    const docDir = path.join(this.config.paths.llmContentDir, language, documentId);
    
    for (const charLimit of characterLimits) {
      const generatedFile = path.join(docDir, `${documentId}-${charLimit}.txt`);
      const fileInfo: any = {
        path: generatedFile,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        edited: false,
        needs_update: false
      };

      if (existsSync(generatedFile)) {
        const fileStat = await stat(generatedFile);
        fileInfo.created = fileStat.birthtime.toISOString();
        fileInfo.modified = fileStat.mtime.toISOString();
        
        // Check if file needs update (source newer than generated)
        if (sourceModified && fileStat.mtime < sourceModified) {
          fileInfo.needs_update = true;
        }

        // Enhanced quality assessment: check content quality and template detection
        const content = await readFile(generatedFile, 'utf-8');
        const trimmedContent = content.trim();
        
        // Template detection - common template phrases
        const templateIndicators = [
          '개요를 제공합니다',
          '설명하는 내용입니다',
          'This section provides',
          'This document describes',
          '{{',
          'TODO:',
          'PLACEHOLDER'
        ];
        
        const hasTemplateIndicators = templateIndicators.some(indicator => 
          trimmedContent.includes(indicator)
        );
        
        // Quality scoring
        const lengthRatio = trimmedContent.length / charLimit;
        const isReasonableLength = lengthRatio >= 0.5 && lengthRatio <= 1.5;
        const hasSpecificContent = !hasTemplateIndicators;
        
        // Determine edit status based on multiple factors
        if (hasTemplateIndicators || trimmedContent.length < charLimit * 0.3) {
          fileInfo.edited = false; // Likely template or auto-generated
        } else if (isReasonableLength && hasSpecificContent) {
          fileInfo.edited = true; // Likely manually edited
        } else {
          fileInfo.edited = false; // Uncertain, treat as auto-generated
        }
      } else {
        fileInfo.needs_update = true; // Missing file needs creation
      }

      generatedFiles[charLimit.toString()] = fileInfo;
    }

    // Update priority.json with work status
    const updatedPriority = {
      ...priority,
      work_status: {
        source_modified: sourceModified?.toISOString(),
        generated_files: generatedFiles,
        last_checked: new Date().toISOString()
      }
    };

    await writeFile(priorityFile, JSON.stringify(updatedPriority, null, 2), 'utf-8');
  }

  /**
   * Get work status for a document
   */
  async getWorkStatus(language: string, documentId: string): Promise<WorkStatusInfo | null> {
    const priorityFile = path.join(this.config.paths.llmContentDir, language, documentId, 'priority.json');
    
    if (!existsSync(priorityFile)) {
      return null;
    }

    const priorityContent = await readFile(priorityFile, 'utf-8');
    const priority: PriorityMetadata & { work_status?: WorkStatusData } = JSON.parse(priorityContent);
    
    // Get source file info (include language prefix if not already present)
    let sourceFile: string;
    if (priority.document.source_path.startsWith(`${language}/`)) {
      // Language prefix already included
      sourceFile = path.join(this.config.paths.docsDir, priority.document.source_path);
    } else {
      // Need to add language prefix
      sourceFile = path.join(this.config.paths.docsDir, language, priority.document.source_path);
    }
    let sourceModified: Date | undefined;
    
    if (existsSync(sourceFile)) {
      const sourceStat = await stat(sourceFile);
      sourceModified = sourceStat.mtime;
    }

    // Get character limits from extraction config
    const characterLimits = Object.keys(priority.extraction.character_limits || {}).map(Number);

    const generatedFiles = [];
    let needsWork = false;

    for (const charLimit of characterLimits) {
      const workStatusFile = priority.work_status?.generated_files?.[charLimit.toString()];
      const filePath = path.join(this.config.paths.llmContentDir, language, documentId, `${documentId}-${charLimit}.txt`);
      
      let exists = existsSync(filePath);
      let fileSize: number | undefined;
      let modified: Date | undefined;
      let created: Date | undefined;

      if (exists) {
        const fileStat = await stat(filePath);
        fileSize = fileStat.size;
        modified = fileStat.mtime;
        created = fileStat.birthtime;
      }

      const edited = workStatusFile?.edited || false;
      const needsUpdate = Boolean(workStatusFile?.needs_update || !exists || 
        (sourceModified && modified && modified < sourceModified));

      if (needsUpdate || !exists) {
        needsWork = true;
      }

      generatedFiles.push({
        charLimit,
        path: filePath,
        exists,
        created,
        modified,
        edited,
        needsUpdate,
        size: fileSize
      });
    }

    return {
      documentId,
      sourceFile,
      sourceModified,
      characterLimits,
      generatedFiles,
      lastChecked: priority.work_status?.last_checked ? new Date(priority.work_status.last_checked) : undefined,
      needsWork
    };
  }

  /**
   * Get work context for a specific document and character limit
   */
  async getWorkContext(language: string, documentId: string, characterLimit: number = 100): Promise<{
    documentId: string;
    title: string;
    sourceContent: string;
    currentSummary: string;
    priorityInfo: PriorityMetadata;
    workStatus: WorkStatusInfo;
    keyPoints?: string[];
    focus?: string;
  } | null> {
    // Get work status
    const workStatus = await this.getWorkStatus(language, documentId);
    if (!workStatus) {
      return null;
    }

    // Load priority info
    const priorityFile = path.join(this.config.paths.llmContentDir, language, documentId, 'priority.json');
    const priorityContent = await readFile(priorityFile, 'utf-8');
    const priorityInfo: PriorityMetadata = JSON.parse(priorityContent);

    // Load source content
    let sourceContent = '';
    if (existsSync(workStatus.sourceFile)) {
      sourceContent = await readFile(workStatus.sourceFile, 'utf-8');
      // Remove YAML frontmatter if present
      sourceContent = sourceContent.replace(/^---\n[\s\S]*?\n---\n/, '');
    }

    // Load current summary
    const summaryFile = workStatus.generatedFiles.find(f => f.charLimit === characterLimit);
    let currentSummary = '';
    if (summaryFile?.exists) {
      currentSummary = await readFile(summaryFile.path, 'utf-8');
    }

    // Extract key points and focus for the specific character limit
    const charLimitConfig = priorityInfo.extraction.character_limits?.[characterLimit.toString()];
    
    // Handle both simple and prioritized key points
    let keyPoints: string[] | undefined;
    if (charLimitConfig?.prioritized_key_points) {
      // Sort prioritized key points by priority and format for display
      const sortedKeyPoints = charLimitConfig.prioritized_key_points.sort((a, b) => {
        const priorityOrder = { critical: 0, important: 1, optional: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      keyPoints = sortedKeyPoints.map(kp => {
        const priorityIcon = { critical: '🔴', important: '🟡', optional: '🟢' }[kp.priority];
        const categoryLabel = kp.category ? ` [${kp.category}]` : '';
        return `${priorityIcon} ${kp.text}${categoryLabel}`;
      });
    } else if (charLimitConfig?.key_points) {
      // Fallback to simple key points
      keyPoints = charLimitConfig.key_points;
    }
    
    const focus = charLimitConfig?.focus;

    return {
      documentId,
      title: priorityInfo.document.title,
      sourceContent,
      currentSummary,
      priorityInfo,
      workStatus,
      keyPoints,
      focus
    };
  }

  /**
   * List documents that need work
   */
  async listWorkNeeded(language: string, filters: WorkListFilters = {}): Promise<WorkStatusInfo[]> {
    const priorities = await this.priorityManager.loadAllPriorities();
    const langPriorities = this.priorityManager.filterByLanguage(priorities, language);
    
    const results = [];

    for (const [documentId] of Object.entries(langPriorities)) {
      const workStatus = await this.getWorkStatus(language, documentId);
      if (!workStatus) continue;

      // Apply filters
      let include = true;

      if (filters.needsUpdate && !workStatus.generatedFiles.some(f => f.needsUpdate)) {
        include = false;
      }

      if (filters.missing && !workStatus.generatedFiles.some(f => !f.exists)) {
        include = false;
      }

      if (filters.outdated && !workStatus.generatedFiles.some(f => f.needsUpdate && f.exists)) {
        include = false;
      }

      if (filters.characterLimit) {
        const charLimitFile = workStatus.generatedFiles.find(f => f.charLimit === filters.characterLimit);
        if (!charLimitFile || (!charLimitFile.needsUpdate && charLimitFile.exists)) {
          include = false;
        }
      }

      if (include && (workStatus.needsWork || !filters.needsUpdate)) {
        results.push(workStatus);
      }
    }

    // Sort by priority score (higher first)
    return results.sort((a, b) => {
      // We'll need to load priority info for sorting - for now just sort by document ID
      return a.documentId.localeCompare(b.documentId);
    });
  }

  /**
   * Update work status for all documents in a language
   */
  async updateAllWorkStatus(language: string): Promise<{
    updated: number;
    errors: Array<{ documentId: string; error: string }>;
  }> {
    const priorities = await this.priorityManager.loadAllPriorities();
    const langPriorities = this.priorityManager.filterByLanguage(priorities, language);
    
    let updated = 0;
    const errors = [];

    for (const [documentId] of Object.entries(langPriorities)) {
      try {
        await this.updateWorkStatus(language, documentId);
        updated++;
      } catch (error) {
        errors.push({
          documentId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { updated, errors };
  }
}