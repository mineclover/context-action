/**
 * Markdown Work Status Manager
 * 
 * 개별 .md 파일의 YAML frontmatter에서 work_status 관리
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import yaml from 'js-yaml';
import type { LLMSConfig } from '../types/index.js';
import { TEMPLATE_INDICATORS, QUALITY_THRESHOLDS } from '../constants/template-patterns.js';

export interface MarkdownWorkStatus {
  created: string;
  modified?: string;
  edited: boolean;
  needs_update: boolean;
  content_hash?: string;
  quality_score?: number;
  template_detected?: boolean;
  manual_review_needed?: boolean;
  auto_generated?: boolean;
}

export interface MarkdownSourceInfo {
  priority_file?: string;
  source_document?: string;
  extraction_strategy?: string;
}

export interface MarkdownFrontmatter {
  document_id: string;
  character_limit: number;
  work_status: MarkdownWorkStatus;
  source_info?: MarkdownSourceInfo;
}

export class MarkdownWorkStatusManager {
  private config: LLMSConfig;

  constructor(config: LLMSConfig) {
    this.config = config;
  }

  /**
   * Read frontmatter from markdown file
   */
  async readMarkdownFrontmatter(filePath: string): Promise<MarkdownFrontmatter | null> {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const frontmatter = this.extractFrontmatter(content);
      
      if (!frontmatter || !frontmatter.document_id || !frontmatter.character_limit) {
        return null;
      }

      return frontmatter as MarkdownFrontmatter;
    } catch (error) {
      console.warn(`⚠️  Failed to read frontmatter from ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Write frontmatter to markdown file
   */
  async writeMarkdownFrontmatter(
    filePath: string,
    frontmatter: MarkdownFrontmatter,
    content: string
  ): Promise<void> {
    try {
      const frontmatterYaml = yaml.dump(frontmatter, { 
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });
      
      const fullContent = `---\n${frontmatterYaml}---\n\n${content}`;
      await writeFile(filePath, fullContent, 'utf-8');
    } catch (error) {
      console.error(`❌ Failed to write frontmatter to ${filePath}: ${error}`);
      throw error;
    }
  }

  /**
   * Update work status for a markdown file
   */
  async updateWorkStatus(
    filePath: string,
    updates: Partial<MarkdownWorkStatus>
  ): Promise<void> {
    const frontmatter = await this.readMarkdownFrontmatter(filePath);
    if (!frontmatter) {
      throw new Error(`No frontmatter found in ${filePath}`);
    }

    const now = new Date().toISOString();
    
    // Update work status
    frontmatter.work_status = {
      ...frontmatter.work_status,
      ...updates,
      modified: now
    };

    // Get current content without frontmatter
    const content = await readFile(filePath, 'utf-8');
    const contentWithoutFrontmatter = this.extractContent(content);

    await this.writeMarkdownFrontmatter(filePath, frontmatter, contentWithoutFrontmatter);
  }

  /**
   * Create initial frontmatter for a new markdown file
   */
  async createInitialFrontmatter(
    filePath: string,
    documentId: string,
    characterLimit: number,
    content: string,
    sourceInfo?: MarkdownSourceInfo
  ): Promise<void> {
    const now = new Date().toISOString();
    
    // Calculate content quality
    const { qualityScore, templateDetected } = this.assessContentQuality(content, characterLimit);
    const contentHash = createHash('md5').update(content).digest('hex');

    const frontmatter: MarkdownFrontmatter = {
      document_id: documentId,
      character_limit: characterLimit,
      work_status: {
        created: now,
        modified: now,
        edited: false,
        needs_update: qualityScore < QUALITY_THRESHOLDS.minimumScore || templateDetected,
        content_hash: contentHash,
        quality_score: qualityScore,
        template_detected: templateDetected,
        manual_review_needed: qualityScore < QUALITY_THRESHOLDS.minimumScore,
        auto_generated: true
      },
      source_info: sourceInfo
    };

    await this.writeMarkdownFrontmatter(filePath, frontmatter, content);
  }

  /**
   * Check if markdown file needs update
   */
  async checkNeedsUpdate(filePath: string): Promise<{ needsUpdate: boolean; reasons: string[] }> {
    const frontmatter = await this.readMarkdownFrontmatter(filePath);
    const reasons: string[] = [];

    if (!frontmatter) {
      return { needsUpdate: true, reasons: ['no_frontmatter'] };
    }

    const workStatus = frontmatter.work_status;

    // Check explicit needs_update flag
    if (workStatus.needs_update === true) {
      reasons.push('explicit_needs_update');
    }

    // Check if manual review needed
    if (workStatus.manual_review_needed === true) {
      reasons.push('manual_review_needed');
    }

    // Check if template detected
    if (workStatus.template_detected === true) {
      reasons.push('template_detected');
    }

    // Check quality score
    if (workStatus.quality_score !== undefined && workStatus.quality_score < QUALITY_THRESHOLDS.minimumScore) {
      reasons.push('quality_score_low');
    }

    // Check if not edited and has issues
    if (workStatus.edited === false && workStatus.auto_generated === true) {
      if (workStatus.quality_score !== undefined && workStatus.quality_score < 70) {
        reasons.push('auto_generated_needs_review');
      }
    }

    return { needsUpdate: reasons.length > 0, reasons };
  }

  /**
   * Mark file as manually edited
   */
  async markAsEdited(filePath: string): Promise<void> {
    await this.updateWorkStatus(filePath, {
      edited: true,
      needs_update: false,
      manual_review_needed: false,
      auto_generated: false
    });
  }

  /**
   * Update content hash after content change
   */
  async updateContentHash(filePath: string): Promise<void> {
    const content = await readFile(filePath, 'utf-8');
    const contentWithoutFrontmatter = this.extractContent(content);
    const contentHash = createHash('md5').update(contentWithoutFrontmatter).digest('hex');

    // Reassess content quality
    const frontmatter = await this.readMarkdownFrontmatter(filePath);
    if (frontmatter) {
      const { qualityScore, templateDetected } = this.assessContentQuality(
        contentWithoutFrontmatter, 
        frontmatter.character_limit
      );

      await this.updateWorkStatus(filePath, {
        content_hash: contentHash,
        quality_score: qualityScore,
        template_detected: templateDetected,
        needs_update: templateDetected || qualityScore < QUALITY_THRESHOLDS.minimumScore
      });
    }
  }

  /**
   * Get all markdown files that need updates in a directory
   */
  async getFilesNeedingUpdate(directoryPath: string): Promise<string[]> {
    const filesNeedingUpdate: string[] = [];
    
    if (!existsSync(directoryPath)) {
      return filesNeedingUpdate;
    }

    const { readdir } = await import('fs/promises');
    
    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const filePath = path.join(directoryPath, entry.name);
          const { needsUpdate } = await this.checkNeedsUpdate(filePath);
          
          if (needsUpdate) {
            filesNeedingUpdate.push(filePath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not scan directory ${directoryPath}: ${error}`);
    }

    return filesNeedingUpdate;
  }

  /**
   * Extract YAML frontmatter from markdown content
   */
  private extractFrontmatter(content: string): any {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return null;
    }

    try {
      return yaml.load(match[1]);
    } catch (error) {
      console.warn(`⚠️  Failed to parse YAML frontmatter: ${error}`);
      return null;
    }
  }

  /**
   * Extract content without frontmatter
   */
  private extractContent(content: string): string {
    const frontmatterRegex = /^---\n[\s\S]*?\n---\n\n?/;
    return content.replace(frontmatterRegex, '');
  }

  /**
   * Assess content quality and detect templates
   */
  private assessContentQuality(content: string, charLimit: number): { qualityScore: number; templateDetected: boolean } {
    const trimmedContent = content.trim();
    let score = 100;

    // Template detection using constants
    const templateDetected = TEMPLATE_INDICATORS.all.some(indicator => 
      trimmedContent.toLowerCase().includes(indicator.toLowerCase())
    );

    if (templateDetected) {
      score -= QUALITY_THRESHOLDS.penalties.templateDetected;
    }

    // Length assessment
    const lengthRatio = trimmedContent.length / charLimit;
    if (lengthRatio < QUALITY_THRESHOLDS.lengthRatio.tooShort) {
      score -= QUALITY_THRESHOLDS.penalties.tooShort;
    } else if (lengthRatio > QUALITY_THRESHOLDS.lengthRatio.tooLong) {
      score -= QUALITY_THRESHOLDS.penalties.tooLong;
    }

    // Content quality indicators
    const sentences = trimmedContent.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) {
      score -= 25;
    }

    // Empty or minimal content
    if (trimmedContent.length < 10) {
      score = 0;
    }

    return { 
      qualityScore: Math.max(0, Math.min(100, score)), 
      templateDetected 
    };
  }
}