#!/usr/bin/env node

/**
 * YAML 프론트매터 자동 업데이트 시스템
 * Git 훅에서 호출되어 문서 변경사항에 따라 프론트매터를 자동 업데이트
 */

import path from 'path';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import crypto from 'crypto';

interface FrontmatterData {
  document_id: string;
  category: string;
  source_path: string;
  character_limit: number;
  last_update: string;
  source_last_modified?: string;
  content_hash?: string;
  completion_status: 'template' | 'draft' | 'review' | 'completed';
  workflow_stage: 'template_generation' | 'content_drafting' | 'content_review' | 'quality_validation' | 'final_approval' | 'published';
  update_status: string;
  priority_score: number;
  priority_tier: string;
  quality_score?: number;
  content_length?: number;
  last_editor?: string;
  review_required?: boolean;
}

class FrontmatterUpdater {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async updateSourceChanged(changedFiles: string[]): Promise<void> {
    console.log('📝 Processing source document changes...');
    
    for (const filePath of changedFiles) {
      await this.updateTemplatesForSourceFile(filePath);
    }
  }

  async updateTemplateChanged(changedFiles: string[]): Promise<void> {
    console.log('📋 Processing template document changes...');
    
    for (const filePath of changedFiles) {
      await this.updateTemplateStatus(filePath);
    }
  }

  private async updateTemplatesForSourceFile(sourceFilePath: string): Promise<void> {
    try {
      const documentId = this.extractDocumentId(sourceFilePath);
      const category = this.extractCategory(sourceFilePath);
      const language = this.extractLanguage(sourceFilePath);
      
      // Get source file stats
      const sourcePath = path.join(this.projectRoot, sourceFilePath);
      const sourceStats = await fs.stat(sourcePath);
      const sourceContent = await fs.readFile(sourcePath, 'utf-8');
      const sourceHash = crypto.createHash('md5').update(sourceContent).digest('hex');
      
      // Find all template files for this document
      const dataDir = path.join(this.projectRoot, 'data', language, documentId);
      
      try {
        const files = await fs.readdir(dataDir);
        const templateFiles = files.filter(f => f.endsWith('.md') && f.includes(documentId));
        
        for (const templateFile of templateFiles) {
          const templatePath = path.join(dataDir, templateFile);
          await this.updateTemplateFrontmatter(templatePath, {
            source_last_modified: sourceStats.mtime.toISOString(),
            content_hash: sourceHash,
            update_status: 'source_updated',
            last_update: new Date().toISOString()
          });
        }
        
        console.log(`✅ Updated ${templateFiles.length} templates for ${documentId}`);
      } catch (error) {
        console.warn(`⚠️  No templates found for ${documentId}: ${error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${sourceFilePath}: ${error}`);
    }
  }

  private async updateTemplateStatus(templateFilePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.projectRoot, templateFilePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const parsed = matter(content);
      const frontmatter = parsed.data as FrontmatterData;
      
      // Analyze template content to determine status
      const newStatus = await this.analyzeTemplateContent(parsed.content);
      const qualityScore = this.calculateQualityScore(parsed.content);
      const contentLength = this.getActualContentLength(parsed.content);
      
      // Update frontmatter based on content analysis
      const updates: Partial<FrontmatterData> = {
        completion_status: newStatus.completion_status,
        workflow_stage: newStatus.workflow_stage,
        quality_score: qualityScore,
        content_length: contentLength,
        last_update: new Date().toISOString(),
        last_editor: this.getCurrentUser(),
        review_required: newStatus.completion_status === 'review'
      };
      
      // Set update_status if content changed
      if (newStatus.completion_status !== frontmatter.completion_status) {
        updates.update_status = 'status_changed';
      }
      
      await this.updateTemplateFrontmatter(fullPath, updates);
      
      console.log(`✅ Updated status for ${path.basename(templateFilePath)}: ${frontmatter.completion_status} → ${newStatus.completion_status}`);
      
    } catch (error) {
      console.error(`❌ Error updating template ${templateFilePath}: ${error}`);
    }
  }

  private async analyzeTemplateContent(content: string): Promise<{
    completion_status: FrontmatterData['completion_status'];
    workflow_stage: FrontmatterData['workflow_stage'];
  }> {
    // Extract content from template section
    const contentMatch = content.match(/## 템플릿 내용[^]*?```markdown\s*([\s\S]*?)\s*```/);
    if (!contentMatch || !contentMatch[1]) {
      return {
        completion_status: 'template',
        workflow_stage: 'template_generation'
      };
    }
    
    const templateContent = contentMatch[1].trim();
    
    // Remove comments for analysis
    const cleanContent = templateContent
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    
    // Check for placeholder content
    const hasPlaceholders = 
      cleanContent.includes('여기에') ||
      cleanContent.includes('작성하세요') ||
      cleanContent.includes('Provide comprehensive guidance on') ||
      cleanContent.includes('의 핵심 개념과 Context-Action 프레임워크에서의 역할을 간단히 설명');
    
    // Determine status based on content
    if (cleanContent.length < 30 || hasPlaceholders) {
      return {
        completion_status: 'template',
        workflow_stage: 'template_generation'
      };
    } else if (cleanContent.length > 30 && !hasPlaceholders) {
      // Check content quality for further classification
      const wordCount = cleanContent.split(/\s+/).length;
      const hasStructure = cleanContent.includes('#') || cleanContent.includes('-') || cleanContent.includes('*');
      
      if (wordCount > 50 && hasStructure) {
        return {
          completion_status: 'review',
          workflow_stage: 'content_review'
        };
      } else {
        return {
          completion_status: 'draft',
          workflow_stage: 'content_drafting'
        };
      }
    }
    
    return {
      completion_status: 'template',
      workflow_stage: 'template_generation'
    };
  }

  private calculateQualityScore(content: string): number {
    const contentMatch = content.match(/## 템플릿 내용[^]*?```markdown\s*([\s\S]*?)\s*```/);
    if (!contentMatch || !contentMatch[1]) return 0;
    
    const templateContent = contentMatch[1].trim();
    const cleanContent = templateContent.replace(/<!--[\s\S]*?-->/g, '').trim();
    
    let score = 0;
    
    // Length check (0-30 points)
    if (cleanContent.length > 100) score += 30;
    else if (cleanContent.length > 50) score += 20;
    else if (cleanContent.length > 30) score += 10;
    
    // Structure check (0-20 points)
    if (cleanContent.includes(':')) score += 10; // Has definition structure
    if (cleanContent.includes('Context-Action')) score += 10; // Framework mention
    
    // Completeness check (0-30 points)
    const hasNoPlaceholders = !cleanContent.includes('여기에') && 
                             !cleanContent.includes('작성하세요') &&
                             !cleanContent.includes('Provide comprehensive guidance');
    if (hasNoPlaceholders) score += 30;
    
    // Korean/English consistency (0-20 points)
    const hasKorean = /[가-힣]/.test(cleanContent);
    const hasEnglish = /[a-zA-Z]/.test(cleanContent);
    if (hasKorean && hasEnglish) score += 20; // Good mix
    else if (hasKorean || hasEnglish) score += 10;
    
    return Math.min(score, 100);
  }

  private getActualContentLength(content: string): number {
    const contentMatch = content.match(/## 템플릿 내용[^]*?```markdown\s*([\s\S]*?)\s*```/);
    if (!contentMatch || !contentMatch[1]) return 0;
    
    return contentMatch[1]
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()
      .length;
  }

  private async updateTemplateFrontmatter(templatePath: string, updates: Partial<FrontmatterData>): Promise<void> {
    const content = await fs.readFile(templatePath, 'utf-8');
    const parsed = matter(content);
    
    // Merge updates with existing frontmatter
    const updatedFrontmatter = {
      ...parsed.data,
      ...updates
    };
    
    // Reconstruct the file with updated frontmatter
    const updatedContent = matter.stringify(parsed.content, updatedFrontmatter);
    await fs.writeFile(templatePath, updatedContent, 'utf-8');
  }

  private extractDocumentId(filePath: string): string {
    const pathParts = filePath.replace(/\.md$/, '').split('/');
    const fileName = pathParts[pathParts.length - 1];
    const categoryPart = pathParts[pathParts.length - 2];
    
    return `${categoryPart}--${fileName}`.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{3,}/g, '--')
      .replace(/^-+|-+$/g, '');
  }

  private extractCategory(filePath: string): string {
    const pathParts = filePath.split('/');
    if (pathParts.length >= 3) {
      return pathParts[pathParts.length - 2]; // Category is the parent directory
    }
    return 'guide'; // default
  }

  private extractLanguage(filePath: string): string {
    const pathParts = filePath.split('/');
    if (pathParts.length >= 2 && (pathParts[1] === 'en' || pathParts[1] === 'ko')) {
      return pathParts[1];
    }
    return 'en'; // default
  }

  private getCurrentUser(): string {
    try {
      return execSync('git config user.name', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const updater = new FrontmatterUpdater();
  
  if (args.includes('--source-changed')) {
    const filesIndex = args.indexOf('--source-changed') + 1;
    const files = args.slice(filesIndex);
    await updater.updateSourceChanged(files);
  }
  
  if (args.includes('--template-changed')) {
    const filesIndex = args.indexOf('--template-changed') + 1;
    const files = args.slice(filesIndex);
    await updater.updateTemplateChanged(files);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { FrontmatterUpdater };