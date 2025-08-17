#!/usr/bin/env node

/**
 * YAML 프론트매터 일관성 검증 시스템
 * Git 훅에서 호출되어 프론트매터의 일관성과 유효성을 검증
 */

import path from 'path';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import { glob } from 'glob';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  filePath: string;
}

interface FrontmatterSchema {
  document_id: string;
  category: string;
  source_path: string;
  character_limit: number;
  last_update: string;
  completion_status: 'template' | 'draft' | 'review' | 'completed';
  workflow_stage: string;
  update_status: string;
  priority_score: number;
  priority_tier: string;
}

class FrontmatterValidator {
  private projectRoot: string;
  private validCategories = ['guide', 'api', 'concept', 'examples'];
  private validCompletionStatuses = ['template', 'draft', 'review', 'completed'];
  private validWorkflowStages = [
    'template_generation',
    'content_drafting', 
    'content_review',
    'quality_validation',
    'final_approval',
    'published'
  ];

  constructor() {
    this.projectRoot = process.cwd();
  }

  async validateAllTemplates(): Promise<boolean> {
    console.log('🔍 Validating all template frontmatter...');
    
    const templateFiles = await glob('data/**/*.md', { 
      cwd: this.projectRoot,
      absolute: true 
    });
    
    let totalErrors = 0;
    let totalWarnings = 0;
    const results: ValidationResult[] = [];
    
    for (const filePath of templateFiles) {
      const result = await this.validateFile(filePath);
      results.push(result);
      
      if (result.errors.length > 0) {
        totalErrors += result.errors.length;
        console.error(`❌ ${path.relative(this.projectRoot, filePath)}:`);
        result.errors.forEach(error => console.error(`   - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        totalWarnings += result.warnings.length;
        console.warn(`⚠️  ${path.relative(this.projectRoot, filePath)}:`);
        result.warnings.forEach(warning => console.warn(`   - ${warning}`));
      }
    }
    
    // Summary
    console.log(`\n📊 Validation Summary:`);
    console.log(`   Files checked: ${templateFiles.length}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   Warnings: ${totalWarnings}`);
    
    if (totalErrors > 0) {
      console.error(`\n❌ Validation failed with ${totalErrors} errors`);
      return false;
    } else if (totalWarnings > 0) {
      console.warn(`\n⚠️  Validation passed with ${totalWarnings} warnings`);
    } else {
      console.log(`\n✅ All frontmatter validation passed!`);
    }
    
    return true;
  }

  private async validateFile(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      filePath
    };
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const frontmatter = parsed.data as Partial<FrontmatterSchema>;
      
      // Required fields validation
      await this.validateRequiredFields(frontmatter, result);
      
      // Field value validation
      await this.validateFieldValues(frontmatter, result);
      
      // Cross-field consistency validation
      await this.validateConsistency(frontmatter, result, filePath);
      
      // Content consistency validation
      await this.validateContentConsistency(frontmatter, parsed.content, result);
      
      result.isValid = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Failed to parse file: ${error}`);
      result.isValid = false;
    }
    
    return result;
  }

  private async validateRequiredFields(
    frontmatter: Partial<FrontmatterSchema>, 
    result: ValidationResult
  ): Promise<void> {
    const requiredFields = [
      'document_id',
      'category', 
      'source_path',
      'character_limit',
      'last_update',
      'completion_status',
      'workflow_stage',
      'priority_score'
    ];
    
    for (const field of requiredFields) {
      if (!frontmatter[field as keyof FrontmatterSchema]) {
        result.errors.push(`Missing required field: ${field}`);
      }
    }
  }

  private async validateFieldValues(
    frontmatter: Partial<FrontmatterSchema>,
    result: ValidationResult
  ): Promise<void> {
    // Category validation
    if (frontmatter.category && !this.validCategories.includes(frontmatter.category)) {
      result.errors.push(`Invalid category: ${frontmatter.category}. Must be one of: ${this.validCategories.join(', ')}`);
    }
    
    // Completion status validation
    if (frontmatter.completion_status && !this.validCompletionStatuses.includes(frontmatter.completion_status)) {
      result.errors.push(`Invalid completion_status: ${frontmatter.completion_status}. Must be one of: ${this.validCompletionStatuses.join(', ')}`);
    }
    
    // Workflow stage validation
    if (frontmatter.workflow_stage && !this.validWorkflowStages.includes(frontmatter.workflow_stage)) {
      result.errors.push(`Invalid workflow_stage: ${frontmatter.workflow_stage}. Must be one of: ${this.validWorkflowStages.join(', ')}`);
    }
    
    // Character limit validation
    if (frontmatter.character_limit) {
      const validLimits = [100, 300, 500, 1000, 2000, 5000];
      if (!validLimits.includes(frontmatter.character_limit)) {
        result.warnings.push(`Unusual character_limit: ${frontmatter.character_limit}. Common limits are: ${validLimits.join(', ')}`);
      }
    }
    
    // Priority score validation
    if (frontmatter.priority_score !== undefined) {
      if (frontmatter.priority_score < 0 || frontmatter.priority_score > 100) {
        result.errors.push(`Invalid priority_score: ${frontmatter.priority_score}. Must be between 0 and 100`);
      }
    }
    
    // Date validation
    if (frontmatter.last_update) {
      try {
        new Date(frontmatter.last_update);
      } catch {
        result.errors.push(`Invalid last_update date format: ${frontmatter.last_update}`);
      }
    }
  }

  private async validateConsistency(
    frontmatter: Partial<FrontmatterSchema>,
    result: ValidationResult,
    filePath: string
  ): Promise<void> {
    // File path consistency
    if (frontmatter.document_id && frontmatter.character_limit) {
      const expectedFileName = `${frontmatter.document_id}-${frontmatter.character_limit}.md`;
      const actualFileName = path.basename(filePath);
      
      if (actualFileName !== expectedFileName) {
        result.warnings.push(`Filename mismatch. Expected: ${expectedFileName}, Actual: ${actualFileName}`);
      }
    }
    
    // Category path consistency
    if (frontmatter.category) {
      const pathParts = filePath.split(path.sep);
      const categoryInPath = pathParts.find(part => this.validCategories.some(cat => part.includes(cat)));
      
      if (categoryInPath && !categoryInPath.includes(frontmatter.category)) {
        result.warnings.push(`Category mismatch between frontmatter (${frontmatter.category}) and file path`);
      }
    }
    
    // Source path existence validation
    if (frontmatter.source_path) {
      const sourcePath = path.join(this.projectRoot, 'docs', frontmatter.source_path);
      try {
        await fs.access(sourcePath);
      } catch {
        result.warnings.push(`Source file not found: ${frontmatter.source_path}`);
      }
    }
  }

  private async validateContentConsistency(
    frontmatter: Partial<FrontmatterSchema>,
    content: string,
    result: ValidationResult
  ): Promise<void> {
    // Extract template content
    const contentMatch = content.match(/## 템플릿 내용[^]*?```markdown\s*([\s\S]*?)\s*```/);
    
    if (!contentMatch) {
      result.warnings.push('No template content section found');
      return;
    }
    
    const templateContent = contentMatch[1]?.trim() || '';
    const cleanContent = templateContent.replace(/<!--[\s\S]*?-->/g, '').trim();
    
    // Completion status vs content consistency
    if (frontmatter.completion_status) {
      const hasPlaceholders = 
        cleanContent.includes('여기에') ||
        cleanContent.includes('작성하세요') ||
        cleanContent.includes('Provide comprehensive guidance on');
      
      if (frontmatter.completion_status === 'completed' && hasPlaceholders) {
        result.errors.push('Status is "completed" but content still contains placeholders');
      }
      
      if (frontmatter.completion_status === 'template' && !hasPlaceholders && cleanContent.length > 50) {
        result.warnings.push('Status is "template" but content appears to be written');
      }
    }
    
    // Character limit vs content length
    if (frontmatter.character_limit && cleanContent.length > 0) {
      if (cleanContent.length > frontmatter.character_limit * 1.2) {
        result.warnings.push(`Content length (${cleanContent.length}) significantly exceeds character limit (${frontmatter.character_limit})`);
      }
    }
    
    // Content quality indicators
    if (frontmatter.completion_status === 'completed') {
      if (cleanContent.length < 30) {
        result.warnings.push('Completed content seems too short');
      }
      
      if (!cleanContent.includes('Context-Action') && !cleanContent.includes('액션')) {
        result.warnings.push('Completed content should mention framework context');
      }
    }
  }
}

async function main() {
  const validator = new FrontmatterValidator();
  const isValid = await validator.validateAllTemplates();
  
  if (!isValid) {
    process.exit(1); // Fail the Git hook if validation fails
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { FrontmatterValidator };