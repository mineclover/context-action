/**
 * Work Status Manager - tracks content generation work status
 */

import { readFile, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
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
    content_hash?: string;
    quality_score?: number;
    template_detected?: boolean;
    manual_review_needed?: boolean;
  }>;
  last_checked?: string;
  check_count?: number;
  last_auto_update?: string;
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
    contentHash?: string;
    qualityScore?: number;
    templateDetected?: boolean;
    manualReviewNeeded?: boolean;
    updateReason?: 'source_newer' | 'template_detected' | 'quality_low' | 'manual_edit_needed' | 'missing';
  }>;
  lastChecked?: Date;
  needsWork: boolean;
  updateReasons: string[];
  qualityIssues: string[];
  recommendations: string[];
}

export interface WorkListFilters {
  needsUpdate?: boolean;
  missing?: boolean;
  outdated?: boolean;
  characterLimit?: number;
  templateDetected?: boolean;
  qualityBelow?: number;
  manualReviewNeeded?: boolean;
  updateReason?: 'source_newer' | 'template_detected' | 'quality_low' | 'manual_edit_needed' | 'missing';
}

export class WorkStatusManager {
  private config: LLMSConfig;
  private priorityManager: PriorityManager;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.priorityManager = new PriorityManager(config.paths.llmContentDir);
  }

  /**
   * Calculate content hash for change detection
   */
  private calculateContentHash(content: string): string {
    return createHash('md5').update(content.trim()).digest('hex');
  }

  /**
   * Enhanced quality assessment
   */
  private assessContentQuality(content: string, charLimit: number): {
    score: number;
    templateDetected: boolean;
    manualReviewNeeded: boolean;
    issues: string[];
  } {
    const trimmedContent = content.trim();
    const issues: string[] = [];
    let score = 100;

    // Template detection - enhanced patterns
    const templateIndicators = [
      '개요를 제공합니다',
      '설명하는 내용입니다', 
      '다음과 같습니다',
      'This section provides',
      'This document describes',
      'The following describes',
      '{{',
      'TODO:',
      'PLACEHOLDER',
      '[INSERT',
      'EXAMPLE:',
      '예시:',
      '다음 예시',
      '아래 예시'
    ];
    
    const templateDetected = templateIndicators.some(indicator => 
      trimmedContent.toLowerCase().includes(indicator.toLowerCase())
    );

    if (templateDetected) {
      score -= 40;
      issues.push('템플릿 표현 감지됨');
    }

    // Length assessment
    const lengthRatio = trimmedContent.length / charLimit;
    if (lengthRatio < 0.3) {
      score -= 30;
      issues.push(`내용이 너무 짧음 (${Math.round(lengthRatio * 100)}%)`);
    } else if (lengthRatio > 1.5) {
      score -= 20;
      issues.push(`내용이 너무 김 (${Math.round(lengthRatio * 100)}%)`);
    }

    // Content quality indicators
    const sentences = trimmedContent.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) {
      score -= 25;
      issues.push('문장 수가 부족함');
    }

    // Repetitive content detection
    const words = trimmedContent.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const uniqueRatio = uniqueWords.size / words.length;
    if (uniqueRatio < 0.5) {
      score -= 20;
      issues.push('반복적인 내용 감지됨');
    }

    // Special character overuse
    const specialChars = trimmedContent.match(/[!@#$%^&*()_+={}\[\]|\\:;"'<>?]/g);
    if (specialChars && specialChars.length > charLimit * 0.1) {
      score -= 15;
      issues.push('특수문자 과다 사용');
    }

    const manualReviewNeeded = score < 60 || templateDetected;

    return {
      score: Math.max(0, score),
      templateDetected,
      manualReviewNeeded,
      issues
    };
  }

  /**
   * Determine update reason
   */
  private determineUpdateReason(
    exists: boolean,
    sourceNewer: boolean,
    templateDetected: boolean,
    qualityScore: number,
    edited: boolean
  ): 'source_newer' | 'template_detected' | 'quality_low' | 'manual_edit_needed' | 'missing' | null {
    if (!exists) return 'missing';
    if (sourceNewer) return 'source_newer';
    if (templateDetected) return 'template_detected';
    if (qualityScore < 50) return 'quality_low';
    if (!edited && qualityScore < 70) return 'manual_edit_needed';
    return null;
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
    const priority: PriorityMetadata & { work_status?: WorkStatusData } = JSON.parse(priorityContent);
    
    // Get previous work status for comparison
    const previousWorkStatus = priority.work_status;

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

    // Check generated files with enhanced analysis
    const generatedFiles: Record<string, any> = {};
    const docDir = path.join(this.config.paths.llmContentDir, language, documentId);
    
    for (const charLimit of characterLimits) {
      const generatedFile = path.join(docDir, `${documentId}-${charLimit}.txt`);
      const prevFileInfo = previousWorkStatus?.generated_files?.[charLimit.toString()];
      
      const fileInfo: any = {
        path: generatedFile,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        edited: false,
        needs_update: false,
        content_hash: '',
        quality_score: 0,
        template_detected: false,
        manual_review_needed: false
      };

      if (existsSync(generatedFile)) {
        const fileStat = await stat(generatedFile);
        fileInfo.created = fileStat.birthtime.toISOString();
        fileInfo.modified = fileStat.mtime.toISOString();
        
        // Read and analyze content
        const content = await readFile(generatedFile, 'utf-8');
        const contentHash = this.calculateContentHash(content);
        const qualityAssessment = this.assessContentQuality(content, charLimit);
        
        fileInfo.content_hash = contentHash;
        fileInfo.quality_score = qualityAssessment.score;
        fileInfo.template_detected = qualityAssessment.templateDetected;
        fileInfo.manual_review_needed = qualityAssessment.manualReviewNeeded;
        
        // Determine if content was manually edited
        const contentChanged = prevFileInfo?.content_hash !== contentHash;
        const wasManuallyModified = contentChanged && prevFileInfo?.content_hash;
        
        // Enhanced edit detection
        const lengthRatio = content.trim().length / charLimit;
        const isReasonableLength = lengthRatio >= 0.5 && lengthRatio <= 1.5;
        const hasSpecificContent = !qualityAssessment.templateDetected;
        
        fileInfo.edited = wasManuallyModified || 
          (qualityAssessment.score >= 70 && isReasonableLength && hasSpecificContent);
        
        // Determine if update is needed
        const sourceNewer = sourceModified && fileStat.mtime < sourceModified;
        const updateReason = this.determineUpdateReason(
          true,
          Boolean(sourceNewer),
          qualityAssessment.templateDetected,
          qualityAssessment.score,
          fileInfo.edited
        );
        
        fileInfo.needs_update = updateReason !== null;
        
      } else {
        fileInfo.needs_update = true; // Missing file needs creation
        fileInfo.manual_review_needed = true;
      }

      generatedFiles[charLimit.toString()] = fileInfo;
    }

    // Update priority.json with enhanced work status
    const checkCount = (previousWorkStatus?.check_count || 0) + 1;
    const updatedPriority = {
      ...priority,
      work_status: {
        source_modified: sourceModified?.toISOString(),
        generated_files: generatedFiles,
        last_checked: new Date().toISOString(),
        check_count: checkCount,
        last_auto_update: new Date().toISOString()
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
    const characterLimits = Object.keys(priority.extraction.characterLimit || {}).map(Number);

    const generatedFiles = [];
    const updateReasons: string[] = [];
    const qualityIssues: string[] = [];
    const recommendations: string[] = [];
    let needsWork = false;

    for (const charLimit of characterLimits) {
      const workStatusFile = priority.work_status?.generated_files?.[charLimit.toString()];
      const filePath = path.join(this.config.paths.llmContentDir, language, documentId, `${documentId}-${charLimit}.txt`);
      
      let exists = existsSync(filePath);
      let fileSize: number | undefined;
      let modified: Date | undefined;
      let created: Date | undefined;
      let contentHash: string | undefined;
      let qualityScore: number | undefined;
      let templateDetected: boolean = false;
      let manualReviewNeeded: boolean = false;
      let updateReason: string | undefined;

      if (exists) {
        const fileStat = await stat(filePath);
        fileSize = fileStat.size;
        modified = fileStat.mtime;
        created = fileStat.birthtime;
        
        // Get enhanced data from work status
        contentHash = workStatusFile?.content_hash;
        qualityScore = workStatusFile?.quality_score;
        templateDetected = workStatusFile?.template_detected || false;
        manualReviewNeeded = workStatusFile?.manual_review_needed || false;
      }

      const edited = workStatusFile?.edited || false;
      const sourceNewer = sourceModified && modified && modified < sourceModified;
      
      // Enhanced update reason determination
      if (!exists) {
        updateReason = 'missing';
        updateReasons.push(`${charLimit}자: 파일 누락`);
        recommendations.push(`${charLimit}자 제한 파일을 생성하세요`);
      } else if (sourceNewer) {
        updateReason = 'source_newer';
        updateReasons.push(`${charLimit}자: 소스 파일이 더 최신`);
        recommendations.push(`${charLimit}자 파일을 업데이트하세요`);
      } else if (templateDetected) {
        updateReason = 'template_detected';
        updateReasons.push(`${charLimit}자: 템플릿 표현 감지됨`);
        qualityIssues.push(`${charLimit}자: 템플릿 표현이 포함되어 있습니다`);
        recommendations.push(`${charLimit}자 파일의 템플릿 표현을 구체적인 내용으로 교체하세요`);
      } else if (qualityScore && qualityScore < 50) {
        updateReason = 'quality_low';
        updateReasons.push(`${charLimit}자: 품질 점수 낮음 (${qualityScore})`);
        qualityIssues.push(`${charLimit}자: 품질 점수가 낮습니다 (${qualityScore}/100)`);
        recommendations.push(`${charLimit}자 파일의 내용을 개선하세요`);
      } else if (!edited && qualityScore && qualityScore < 70) {
        updateReason = 'manual_edit_needed';
        updateReasons.push(`${charLimit}자: 수동 편집 필요`);
        recommendations.push(`${charLimit}자 파일을 수동으로 검토하고 개선하세요`);
      }
      
      const needsUpdate = updateReason !== undefined;
      
      if (needsUpdate || !exists) {
        needsWork = true;
      }
      
      // Add quality issues for reporting
      if (manualReviewNeeded) {
        qualityIssues.push(`${charLimit}자: 수동 검토 필요`);
      }

      generatedFiles.push({
        charLimit,
        path: filePath,
        exists,
        created,
        modified,
        edited,
        needsUpdate,
        size: fileSize,
        contentHash,
        qualityScore,
        templateDetected,
        manualReviewNeeded,
        updateReason: updateReason as any
      });
    }

    return {
      documentId,
      sourceFile,
      sourceModified,
      characterLimits,
      generatedFiles,
      lastChecked: priority.work_status?.last_checked ? new Date(priority.work_status.last_checked) : undefined,
      needsWork,
      updateReasons,
      qualityIssues,
      recommendations
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
    const charLimitConfig = priorityInfo.extraction.characterLimit?.[characterLimit.toString()];
    
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

      // Apply enhanced filters
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
      
      // Enhanced filter options
      if (filters.templateDetected !== undefined) {
        const hasTemplateDetected = workStatus.generatedFiles.some(f => f.templateDetected === filters.templateDetected);
        if (!hasTemplateDetected) {
          include = false;
        }
      }
      
      if (filters.qualityBelow !== undefined) {
        const hasLowQuality = workStatus.generatedFiles.some(f => 
          f.qualityScore !== undefined && f.qualityScore < filters.qualityBelow!
        );
        if (!hasLowQuality) {
          include = false;
        }
      }
      
      if (filters.manualReviewNeeded !== undefined) {
        const hasManualReviewNeeded = workStatus.generatedFiles.some(f => 
          f.manualReviewNeeded === filters.manualReviewNeeded
        );
        if (!hasManualReviewNeeded) {
          include = false;
        }
      }
      
      if (filters.updateReason) {
        const hasUpdateReason = workStatus.generatedFiles.some(f => 
          f.updateReason === filters.updateReason
        );
        if (!hasUpdateReason) {
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
   * Get detailed work summary for a language
   */
  async getWorkSummary(language: string): Promise<{
    totalDocuments: number;
    documentsNeedingWork: number;
    missingFiles: number;
    outdatedFiles: number;
    templateFiles: number;
    lowQualityFiles: number;
    manualReviewNeeded: number;
    byCharacterLimit: Record<number, {
      total: number;
      missing: number;
      outdated: number;
      template: number;
      lowQuality: number;
    }>;
    topIssues: Array<{
      documentId: string;
      issues: number;
      reasons: string[];
    }>;
  }> {
    const priorities = await this.priorityManager.loadAllPriorities();
    const langPriorities = this.priorityManager.filterByLanguage(priorities, language);
    
    let totalDocuments = 0;
    let documentsNeedingWork = 0;
    let missingFiles = 0;
    let outdatedFiles = 0;
    let templateFiles = 0;
    let lowQualityFiles = 0;
    let manualReviewNeeded = 0;
    
    const byCharacterLimit: Record<number, any> = {};
    const topIssues: Array<{ documentId: string; issues: number; reasons: string[] }> = [];
    
    for (const [documentId] of Object.entries(langPriorities)) {
      const workStatus = await this.getWorkStatus(language, documentId);
      if (!workStatus) continue;
      
      totalDocuments++;
      
      if (workStatus.needsWork) {
        documentsNeedingWork++;
        topIssues.push({
          documentId,
          issues: workStatus.updateReasons.length + workStatus.qualityIssues.length,
          reasons: [...workStatus.updateReasons, ...workStatus.qualityIssues]
        });
      }
      
      for (const file of workStatus.generatedFiles) {
        if (!byCharacterLimit[file.charLimit]) {
          byCharacterLimit[file.charLimit] = {
            total: 0,
            missing: 0,
            outdated: 0,
            template: 0,
            lowQuality: 0
          };
        }
        
        byCharacterLimit[file.charLimit].total++;
        
        if (!file.exists) {
          missingFiles++;
          byCharacterLimit[file.charLimit].missing++;
        } else if (file.updateReason === 'source_newer') {
          outdatedFiles++;
          byCharacterLimit[file.charLimit].outdated++;
        } else if (file.templateDetected) {
          templateFiles++;
          byCharacterLimit[file.charLimit].template++;
        } else if (file.qualityScore && file.qualityScore < 60) {
          lowQualityFiles++;
          byCharacterLimit[file.charLimit].lowQuality++;
        }
        
        if (file.manualReviewNeeded) {
          manualReviewNeeded++;
        }
      }
    }
    
    // Sort top issues by issue count
    topIssues.sort((a, b) => b.issues - a.issues);
    
    return {
      totalDocuments,
      documentsNeedingWork,
      missingFiles,
      outdatedFiles,
      templateFiles,
      lowQualityFiles,
      manualReviewNeeded,
      byCharacterLimit,
      topIssues: topIssues.slice(0, 10) // Top 10 issues
    };
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