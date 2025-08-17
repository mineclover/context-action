import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { LLMSGenerateCommand } from '../../src/cli/commands/LLMSGenerateCommand.js';
import { EnhancedLLMSConfig } from '../../src/types/config.js';

describe('LLMSGenerateCommand', () => {
  let llmsGenerateCommand: LLMSGenerateCommand;
  let testDataDir: string;
  let config: EnhancedLLMSConfig;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-llms-generate');
    
    config = {
      paths: {
        docsDir: path.join(testDataDir, 'docs'),
        llmContentDir: path.join(testDataDir, 'data'),
        outputDir: path.join(testDataDir, 'output'),
        templatesDir: path.join(testDataDir, 'templates'),
        instructionsDir: path.join(testDataDir, 'instructions')
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000],
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      categories: {
        guide: { priority: 95 },
        api: { priority: 90 },
        concept: { priority: 85 },
        examples: { priority: 80 }
      }
    } as EnhancedLLMSConfig;

    llmsGenerateCommand = new LLMSGenerateCommand(config);

    // Create test directory structure
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'ko', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'data', 'en', 'guide--getting-started'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'data', 'ko', 'guide--getting-started'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'data', 'en', 'api--action-context'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'output'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('standard LLMS generation', () => {
    it('should generate standard LLMS file with completed documents', async () => {
      // Create completed template files
      await createCompletedTemplate('en', 'guide--getting-started', 100, 'Getting Started', 'Complete guide to Context-Action framework setup and basic usage patterns.');
      await createCompletedTemplate('en', 'api--action-context', 100, 'Action Context', 'ActionContext provides action dispatching and handler registration for React components.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          pattern: 'standard',
          dryRun: false
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        expect(output).toContain('LLMS file generated successfully');
        expect(output).toContain('Total Documents: 2');
        
        // Check if output file was created
        const outputPath = path.join(testDataDir, 'output', 'llms-en.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
        if (fileExists) {
          const content = await fs.readFile(outputPath, 'utf-8');
          expect(content).toContain('Context-Action Framework');
          expect(content).toContain('Type: Standard');
          expect(content).toContain('Getting Started');
          expect(content).toContain('Action Context');
        }
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should filter by character limit', async () => {
      // Create templates with different character limits
      await createCompletedTemplate('en', 'guide--getting-started', 100, 'Getting Started', 'Short guide summary.');
      await createCompletedTemplate('en', 'guide--getting-started', 300, 'Getting Started', 'Medium length guide summary with more details about the framework.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          characterLimit: 100,
          dryRun: false
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        expect(output).toContain('Total Documents: 1');
        
        // Check output file
        const outputPath = path.join(testDataDir, 'output', 'llms-en-100chars.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should filter by category', async () => {
      // Create templates in different categories
      await createCompletedTemplate('en', 'guide--getting-started', 100, 'Getting Started', 'Guide content here.');
      await createCompletedTemplate('en', 'api--action-context', 100, 'Action Context', 'API content here.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          category: 'api',
          dryRun: false
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        expect(output).toContain('Total Documents: 1');
        
        // Check output file
        const outputPath = path.join(testDataDir, 'output', 'llms-en-api.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
        if (fileExists) {
          const content = await fs.readFile(outputPath, 'utf-8');
          expect(content).toContain('Action Context');
          expect(content).not.toContain('Getting Started');
        }
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should combine character limit and category filters', async () => {
      // Create multiple templates
      await createCompletedTemplate('en', 'guide--getting-started', 100, 'Getting Started', 'Guide 100 chars.');
      await createCompletedTemplate('en', 'guide--getting-started', 300, 'Getting Started', 'Guide 300 chars.');
      await createCompletedTemplate('en', 'api--action-context', 100, 'Action Context', 'API 100 chars.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          characterLimit: 100,
          category: 'guide',
          dryRun: false
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        expect(output).toContain('Total Documents: 1');
        
        // Check output file
        const outputPath = path.join(testDataDir, 'output', 'llms-en-100chars-guide.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('pattern generation', () => {
    it('should generate minimum pattern LLMS', async () => {
      await createCompletedTemplate('en', 'guide--getting-started', 100, 'Getting Started', 'Guide content.');
      await createCompletedTemplate('en', 'api--action-context', 100, 'Action Context', 'API content.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          pattern: 'minimum',
          dryRun: false
        });
        
        // Check output file
        const outputPath = path.join(testDataDir, 'output', 'llms-en-minimum.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
        if (fileExists) {
          const content = await fs.readFile(outputPath, 'utf-8');
          expect(content).toContain('Document Navigation');
          expect(content).toContain('Type: Minimum');
          expect(content).toContain('Quick Start Path');
        }
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should generate origin pattern LLMS', async () => {
      await createCompletedTemplate('en', 'guide--getting-started', 100, 'Getting Started', 'Guide content.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          pattern: 'origin',
          dryRun: false
        });
        
        // Check output file
        const outputPath = path.join(testDataDir, 'output', 'llms-en-origin.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
        if (fileExists) {
          const content = await fs.readFile(outputPath, 'utf-8');
          expect(content).toContain('Complete Documentation');
          expect(content).toContain('Type: Origin');
        }
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('dry run mode', () => {
    it('should show what would be generated without creating files', async () => {
      await createCompletedTemplate('en', 'guide--getting-started', 100, 'Getting Started', 'Guide content.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          dryRun: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        expect(output).toContain('DRY RUN');
        expect(output).toContain('Would generate LLMS file with');
        expect(output).toContain('1 documents');
        
        // Check that no output file was created
        const outputPath = path.join(testDataDir, 'output', 'llms-en.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(false);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('error handling', () => {
    it('should handle no documents found gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          category: 'nonexistent'
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        expect(output).toContain('No documents found matching the specified criteria');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should validate unsupported language', async () => {
      await expect(async () => {
        await llmsGenerateCommand.execute({
          language: 'unsupported'
        });
      }).rejects.toThrow('Unsupported language');
    });

    it('should handle incomplete documents correctly', async () => {
      // Create template with placeholder content
      await createIncompleteTemplate('en', 'guide--getting-started', 100);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en'
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        expect(output).toContain('No documents found matching the specified criteria');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('sorting options', () => {
    it('should sort by priority correctly', async () => {
      await createCompletedTemplate('en', 'guide--getting-started', 100, 'Getting Started', 'Guide content.', 95);
      await createCompletedTemplate('en', 'api--action-context', 100, 'Action Context', 'API content.', 90);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await llmsGenerateCommand.execute({
          language: 'en',
          sortBy: 'priority',
          verbose: true,
          dryRun: true
        });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Check that guide (priority 95) comes before api (priority 90)
        const guideIndex = output.indexOf('guide--getting-started');
        const apiIndex = output.indexOf('api--action-context');
        expect(guideIndex).toBeLessThan(apiIndex);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  // Helper functions
  async function createCompletedTemplate(
    language: string,
    documentId: string,
    characterLimit: number,
    title: string,
    content: string,
    priority: number = 80
  ): Promise<void> {
    const templateContent = `---
document_id: ${documentId}
category: ${documentId.split('--')[0]}
source_path: ${language}/${documentId.split('--')[0]}/${documentId.split('--')[1]}.md
character_limit: ${characterLimit}
last_update: 2025-01-01T00:00:00.000Z
completion_status: completed
workflow_stage: final_approval
priority_score: ${priority}
priority_tier: high
---

# ${title} (${characterLimit}자)

## 템플릿 내용 (${characterLimit}자 이내)

\`\`\`markdown
${content}
\`\`\`
`;

    const filePath = path.join(
      testDataDir,
      'data',
      language,
      documentId,
      `${documentId}-${characterLimit}.md`
    );
    
    await fs.writeFile(filePath, templateContent, 'utf-8');
  }

  async function createIncompleteTemplate(
    language: string,
    documentId: string,
    characterLimit: number
  ): Promise<void> {
    const templateContent = `---
document_id: ${documentId}
category: ${documentId.split('--')[0]}
source_path: ${language}/${documentId.split('--')[0]}/${documentId.split('--')[1]}.md
character_limit: ${characterLimit}
last_update: 2025-01-01T00:00:00.000Z
completion_status: template
workflow_stage: template_generation
priority_score: 80
priority_tier: high
---

# Getting Started (${characterLimit}자)

## 템플릿 내용 (${characterLimit}자 이내)

\`\`\`markdown
<!-- 여기에 ${characterLimit}자 이내의 요약 내용을 작성하세요 -->
\`\`\`
`;

    const filePath = path.join(
      testDataDir,
      'data',
      language,
      documentId,
      `${documentId}-${characterLimit}.md`
    );
    
    await fs.writeFile(filePath, templateContent, 'utf-8');
  }
});