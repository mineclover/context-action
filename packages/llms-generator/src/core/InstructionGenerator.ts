/**
 * Instruction Generator - Automated instruction generation for document updates
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig, PriorityMetadata } from '../types/index.js';
import type { 
  InstructionTemplate, 
  InstructionContext, 
  GeneratedInstruction,
  InstructionGenerationOptions,
  InstructionGenerationResult
} from '../types/instruction.js';
import { WorkStatusManager } from './WorkStatusManager.js';
import { PriorityManager } from './PriorityManager.js';

export class InstructionGenerator {
  private config: LLMSConfig;
  private workStatusManager: WorkStatusManager;
  private priorityManager: PriorityManager;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.workStatusManager = new WorkStatusManager(config);
    this.priorityManager = new PriorityManager(config.paths.llmContentDir);
  }

  /**
   * Generate instructions for document updates
   */
  async generateInstructions(
    language: string,
    documentId: string,
    options: InstructionGenerationOptions = {}
  ): Promise<InstructionGenerationResult> {
    const {
      template = 'default',
      characterLimits,
      includeSourceContent = true,
      includeCurrentSummaries = true,
      maxLength,
      dryRun = false,
      overwrite = false
    } = options;

    const results: GeneratedInstruction[] = [];
    const errors: string[] = [];
    const summary = {
      totalGenerated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      byCharacterLimit: {} as Record<string, number>
    };

    try {
      // Get work context and priority information
      const workStatus = await this.workStatusManager.getWorkStatus(language, documentId);
      if (!workStatus) {
        throw new Error(`Document not found: ${documentId}`);
      }

      const priorityFile = path.join(this.config.paths.llmContentDir, language, documentId, 'priority.json');
      const priorityContent = await readFile(priorityFile, 'utf-8');
      const priorityInfo: PriorityMetadata = JSON.parse(priorityContent);

      // Determine character limits to process
      const targetCharLimits = characterLimits || 
        Object.keys(priorityInfo.extraction.characterLimit || {}).map(Number);

      // Load template
      const templateContent = await this.loadTemplate(template, language);

      // Load source content if requested
      let sourceContent: string | undefined;
      if (includeSourceContent) {
        try {
          sourceContent = await readFile(workStatus.sourceFile, 'utf-8');
          // Remove YAML frontmatter
          sourceContent = sourceContent.replace(/^---\n[\s\S]*?\n---\n/, '');
        } catch (error) {
          console.warn(`Warning: Could not load source content: ${error}`);
        }
      }

      // Generate instructions for each character limit
      for (const charLimit of targetCharLimits) {
        try {
          const targetFile = workStatus.generatedFiles.find(f => f.charLimit === charLimit);
          
          // Skip if file doesn't need work (unless overwrite is true)
          if (!overwrite && targetFile && !targetFile.needsUpdate) {
            summary.totalSkipped++;
            continue;
          }

          // Prepare instruction context
          const context = await this.prepareInstructionContext(
            language,
            documentId,
            charLimit,
            priorityInfo,
            workStatus,
            sourceContent,
            includeCurrentSummaries
          );

          // Generate instruction content
          const instructionContent = await this.renderTemplate(
            templateContent,
            context,
            maxLength
          );

          // Create instruction object
          const instruction: GeneratedInstruction = {
            id: `${documentId}-${charLimit}-${Date.now()}`,
            documentId,
            language,
            characterLimit: charLimit,
            content: instructionContent,
            template,
            createdAt: new Date(),
            context,
            filePath: this.getInstructionFilePath(language, documentId, charLimit)
          };

          // Save instruction if not dry run
          if (!dryRun) {
            await this.saveInstruction(instruction);
          }

          results.push(instruction);
          summary.totalGenerated++;
          summary.byCharacterLimit[charLimit.toString()] = 
            (summary.byCharacterLimit[charLimit.toString()] || 0) + 1;

        } catch (error) {
          const errorMsg = `Failed to generate instruction for ${documentId} (${charLimit} chars): ${error}`;
          errors.push(errorMsg);
          summary.totalErrors++;
        }
      }

    } catch (error) {
      const errorMsg = `Failed to generate instructions for ${documentId}: ${error}`;
      errors.push(errorMsg);
      summary.totalErrors++;
    }

    return {
      instructions: results,
      summary,
      errors
    };
  }

  /**
   * Generate instructions for multiple documents
   */
  async generateBatchInstructions(
    language: string,
    options: InstructionGenerationOptions = {}
  ): Promise<InstructionGenerationResult> {
    const priorities = await this.priorityManager.loadAllPriorities();
    const langPriorities = this.priorityManager.filterByLanguage(priorities, language);
    
    const allResults: GeneratedInstruction[] = [];
    const allErrors: string[] = [];
    const combinedSummary = {
      totalGenerated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      byCharacterLimit: {} as Record<string, number>
    };

    for (const [documentId] of Object.entries(langPriorities)) {
      try {
        const result = await this.generateInstructions(language, documentId, options);
        
        allResults.push(...result.instructions);
        allErrors.push(...result.errors);
        
        combinedSummary.totalGenerated += result.summary.totalGenerated;
        combinedSummary.totalSkipped += result.summary.totalSkipped;
        combinedSummary.totalErrors += result.summary.totalErrors;
        
        Object.entries(result.summary.byCharacterLimit).forEach(([limit, count]) => {
          combinedSummary.byCharacterLimit[limit] = 
            (combinedSummary.byCharacterLimit[limit] || 0) + count;
        });

      } catch (error) {
        allErrors.push(`Failed to process document ${documentId}: ${error}`);
        combinedSummary.totalErrors++;
      }
    }

    return {
      instructions: allResults,
      summary: combinedSummary,
      errors: allErrors
    };
  }

  /**
   * Load instruction template
   */
  private async loadTemplate(templateName: string, language: string): Promise<InstructionTemplate> {
    // Try language-specific template first
    const langTemplatePath = path.join(
      this.config.paths.templatesDir, 
      `${templateName}-${language}.json`
    );
    
    if (existsSync(langTemplatePath)) {
      const content = await readFile(langTemplatePath, 'utf-8');
      return JSON.parse(content);
    }

    // Fallback to default template
    const defaultTemplatePath = path.join(
      this.config.paths.templatesDir, 
      `${templateName}.json`
    );
    
    if (existsSync(defaultTemplatePath)) {
      const content = await readFile(defaultTemplatePath, 'utf-8');
      return JSON.parse(content);
    }

    // Use built-in default template
    return this.getBuiltInTemplate(templateName, language);
  }

  /**
   * Get built-in template
   */
  private getBuiltInTemplate(templateName: string, language: string): InstructionTemplate {
    const templates = {
      'default': {
        name: 'default',
        description: 'Default instruction template for document updates',
        languages: ['en', 'ko'],
        variables: [
          { name: 'title', description: 'Document title', required: true },
          { name: 'documentId', description: 'Document ID', required: true },
          { name: 'characterLimit', description: 'Target character limit', required: true },
          { name: 'focus', description: 'Focus area for this character limit', required: true },
          { name: 'keyPoints', description: 'Key points to include', required: true },
          { name: 'sourceContent', description: 'Original document content', required: false },
          { name: 'currentSummary', description: 'Current summary if any', required: false }
        ],
        content: language === 'ko' ? 
          this.getKoreanDefaultTemplate() : 
          this.getEnglishDefaultTemplate()
      }
    };

    const template = templates[templateName as keyof typeof templates];
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    return template;
  }

  /**
   * Get Korean default template
   */
  private getKoreanDefaultTemplate(): string {
    return `# 문서 수정 지시문

## 📋 작업 개요
- **문서 ID**: {{documentId}}
- **문서 제목**: {{title}}
- **목표 글자수**: {{characterLimit}}자
- **핵심 초점**: {{focus}}

## 🎯 핵심 포인트
{{#each keyPoints}}
{{#if this.priority}}
- {{this.priority_icon}} **{{this.text}}**{{#if this.category}} ({{this.category}}){{/if}}
{{else}}
- • {{this}}
{{/if}}
{{/each}}

## 📖 원본 내용
{{#if sourceContent}}
\`\`\`
{{sourceContent}}
\`\`\`
{{else}}
*원본 내용을 별도로 확인해주세요*
{{/if}}

## 📝 현재 요약
{{#if currentSummary}}
**현재 작성된 내용** ({{currentSummary.length}}자):
\`\`\`
{{currentSummary}}
\`\`\`
{{else}}
*아직 작성된 요약이 없습니다*
{{/if}}

## ✅ 작업 지침
1. **글자수 준수**: 정확히 {{characterLimit}}자 이내로 작성
2. **핵심 포인트 포함**: 위의 핵심 포인트를 우선순위에 따라 포함
3. **명확성**: 이해하기 쉽고 정확한 표현 사용
4. **완성도**: 독립적으로 읽어도 이해 가능한 내용

## 🔍 품질 검증
- [ ] 글자수가 {{characterLimit}}자 이내인가?
- [ ] 핵심 포인트가 모두 포함되었는가?
- [ ] 내용이 명확하고 정확한가?
- [ ] 원본 문서의 의도가 잘 전달되는가?`;
  }

  /**
   * Get English default template
   */
  private getEnglishDefaultTemplate(): string {
    return `# Document Update Instructions

## 📋 Task Overview
- **Document ID**: {{documentId}}
- **Document Title**: {{title}}
- **Target Length**: {{characterLimit}} characters
- **Primary Focus**: {{focus}}

## 🎯 Key Points
{{#each keyPoints}}
{{#if this.priority}}
- {{this.priority_icon}} **{{this.text}}**{{#if this.category}} ({{this.category}}){{/if}}
{{else}}
- • {{this}}
{{/if}}
{{/each}}

## 📖 Source Content
{{#if sourceContent}}
\`\`\`
{{sourceContent}}
\`\`\`
{{else}}
*Please refer to the source document separately*
{{/if}}

## 📝 Current Summary
{{#if currentSummary}}
**Current content** ({{currentSummary.length}} characters):
\`\`\`
{{currentSummary}}
\`\`\`
{{else}}
*No summary written yet*
{{/if}}

## ✅ Guidelines
1. **Character Limit**: Write exactly within {{characterLimit}} characters
2. **Include Key Points**: Include key points according to priority
3. **Clarity**: Use clear and accurate expressions
4. **Completeness**: Content should be understandable independently

## 🔍 Quality Check
- [ ] Is the length within {{characterLimit}} characters?
- [ ] Are all key points included?
- [ ] Is the content clear and accurate?
- [ ] Does it convey the original document's intent well?`;
  }

  /**
   * Prepare instruction context
   */
  private async prepareInstructionContext(
    language: string,
    documentId: string,
    characterLimit: number,
    priorityInfo: PriorityMetadata,
    workStatus: any,
    sourceContent?: string,
    includeCurrentSummaries = true
  ): Promise<InstructionContext> {
    const charLimitConfig = priorityInfo.extraction.characterLimit?.[characterLimit.toString()];
    
    // Prepare key points with priority formatting
    let keyPoints: Array<{
      text: string;
      priority?: 'critical' | 'important' | 'optional';
      category?: 'concept' | 'implementation' | 'example' | 'usage';
      priority_icon?: string;
    }> = [];

    if (charLimitConfig?.prioritized_key_points) {
      keyPoints = charLimitConfig.prioritized_key_points.map(kp => ({
        ...kp,
        priority_icon: { critical: '🔴', important: '🟡', optional: '🟢' }[kp.priority]
      }));
    } else if (charLimitConfig?.key_points) {
      keyPoints = charLimitConfig.key_points.map(point => ({ text: point }));
    }

    // Prepare current summaries
    let currentSummaries: any[] = [];
    if (includeCurrentSummaries) {
      for (const file of workStatus.generatedFiles) {
        if (file.exists) {
          try {
            const content = await readFile(file.path, 'utf-8');
            currentSummaries.push({
              characterLimit: file.charLimit,
              content: content.trim(),
              isEdited: file.edited,
              needsUpdate: file.needsUpdate
            });
          } catch (error) {
            console.warn(`Could not read summary file: ${file.path}`);
          }
        }
      }
    }

    return {
      document: {
        id: documentId,
        title: priorityInfo.document.title,
        language,
        category: priorityInfo.document.category,
        sourcePath: priorityInfo.document.source_path
      },
      priority: {
        score: priorityInfo.priority.score,
        tier: priorityInfo.priority.tier,
        strategy: priorityInfo.extraction.strategy
      },
      keyPoints: {
        characterLimit,
        focus: charLimitConfig?.focus || '',
        points: keyPoints
      },
      sourceContent,
      currentSummaries,
      workStatus: {
        needsWork: workStatus.needsWork,
        lastChecked: workStatus.lastChecked,
        filesToUpdate: workStatus.generatedFiles
          .filter((f: any) => f.needsUpdate)
          .map((f: any) => f.charLimit)
      }
    };
  }

  /**
   * Render template with context
   */
  private async renderTemplate(
    template: InstructionTemplate,
    context: InstructionContext,
    maxLength?: number
  ): Promise<string> {
    let content = template.content;

    // Simple template variable replacement
    const variables = {
      documentId: context.document.id,
      title: context.document.title,
      characterLimit: context.keyPoints.characterLimit.toString(),
      focus: context.keyPoints.focus,
      sourceContent: this.truncateContent(context.sourceContent, maxLength ? Math.floor(maxLength * 0.4) : 3000),
      currentSummary: context.currentSummaries?.find(s => s.characterLimit === context.keyPoints.characterLimit)?.content || '',
      keyPointsList: this.formatKeyPoints(context.keyPoints.points)
    };

    // Replace simple variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value || '');
    });

    // Handle key points loop
    content = this.renderKeyPointsLoop(content, context.keyPoints.points);

    // Handle conditional blocks
    content = this.renderConditionals(content, context);

    // Truncate if needed
    if (maxLength && content.length > maxLength) {
      content = content.substring(0, maxLength - 3) + '...';
    }

    return content;
  }

  /**
   * Format key points for simple replacement
   */
  private formatKeyPoints(points: Array<{
    text: string;
    priority?: 'critical' | 'important' | 'optional';
    category?: 'concept' | 'implementation' | 'example' | 'usage';
  }>): string {
    return points.map(point => {
      const priorityIcon = point.priority ? 
        { critical: '🔴', important: '🟡', optional: '🟢' }[point.priority] : '•';
      const categoryLabel = point.category ? ` (${point.category})` : '';
      return `- ${priorityIcon} ${point.text}${categoryLabel}`;
    }).join('\n');
  }

  /**
   * Render key points loop
   */
  private renderKeyPointsLoop(content: string, points: any[]): string {
    const loopRegex = /{{#each keyPoints}}([\s\S]*?){{\/each}}/g;
    
    return content.replace(loopRegex, (match, template) => {
      return points.map(point => {
        let itemContent = template;
        
        // Replace point properties
        itemContent = itemContent.replace(/{{this\.text}}/g, point.text || '');
        itemContent = itemContent.replace(/{{this\.priority_icon}}/g, point.priority_icon || '•');
        itemContent = itemContent.replace(/{{this\.category}}/g, point.category || '');
        itemContent = itemContent.replace(/{{this}}/g, point.text || point);
        
        // Handle conditionals
        itemContent = itemContent.replace(/{{#if this\.priority}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g, 
          (match: string, ifBlock: string, elseBlock: string) => point.priority ? ifBlock : elseBlock);
        itemContent = itemContent.replace(/{{#if this\.category}}([\s\S]*?){{\/if}}/g, 
          (match: string, block: string) => point.category ? block : '');
        
        return itemContent;
      }).join('');
    });
  }

  /**
   * Render conditional blocks
   */
  private renderConditionals(content: string, context: InstructionContext): string {
    // Handle {{#if sourceContent}}
    content = content.replace(/{{#if sourceContent}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g, 
      (match, ifBlock, elseBlock) => context.sourceContent ? ifBlock : elseBlock);
    
    // Handle {{#if currentSummary}}
    const currentSummary = context.currentSummaries?.find(s => s.characterLimit === context.keyPoints.characterLimit);
    content = content.replace(/{{#if currentSummary}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g, 
      (match, ifBlock, elseBlock) => currentSummary?.content ? ifBlock : elseBlock);
    
    return content;
  }

  /**
   * Truncate content to specified length
   */
  private truncateContent(content?: string, maxLength?: number): string {
    if (!content) return '';
    if (!maxLength || content.length <= maxLength) return content;
    
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get instruction file path
   */
  private getInstructionFilePath(language: string, documentId: string, characterLimit: number): string {
    return path.join(
      this.config.paths.instructionsDir,
      language,
      `${documentId}-${characterLimit}.md`
    );
  }

  /**
   * Save instruction to file
   */
  private async saveInstruction(instruction: GeneratedInstruction): Promise<void> {
    const dir = path.dirname(instruction.filePath);
    
    // Ensure directory exists
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Save instruction content
    await writeFile(instruction.filePath, instruction.content, 'utf-8');
    
    // Save metadata
    const metadataPath = instruction.filePath.replace('.md', '.meta.json');
    const metadata = {
      id: instruction.id,
      documentId: instruction.documentId,
      language: instruction.language,
      characterLimit: instruction.characterLimit,
      template: instruction.template,
      createdAt: instruction.createdAt.toISOString(),
      context: instruction.context
    };
    
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }
}