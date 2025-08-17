import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { WorkNextCommand, WorkItem } from '../../src/cli/commands/WorkNextCommand.js';
import { EnhancedLLMSConfig } from '../../src/types/config.js';

describe('WorkNextCommand', () => {
  let workNextCommand: WorkNextCommand;
  let testDataDir: string;
  let config: EnhancedLLMSConfig;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-work-next');
    
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

    workNextCommand = new WorkNextCommand(config);

    // Create test directory structure
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'en', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'docs', 'ko', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'data', 'en', 'guide--getting-started'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'data', 'ko', 'guide--getting-started'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('analyzeWorkItem', () => {
    it('should identify missing priority.json', async () => {
      // Create source document
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a guide.');

      // Execute work-next analysis (limited to one item for testing)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1, language: 'en' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should indicate that priority.json needs to be generated
        expect(output).toContain('Priority');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });

    it('should identify missing template file', async () => {
      // Create source document
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a guide.');

      // Create priority.json
      const priorityJson = {
        document: {
          id: 'guide--getting-started',
          title: 'Getting Started',
          source_path: 'en/guide/getting-started.md',
          category: 'guide'
        },
        priority: {
          score: 95,
          tier: 'high',
          rationale: 'Essential getting started guide'
        }
      };
      
      await fs.writeFile(
        path.join(testDataDir, 'data', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priorityJson, null, 2)
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1, language: 'en' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should suggest template generation
        expect(output).toContain('Template') || expect(output).toContain('template');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });

    it('should identify content that needs editing', async () => {
      // Create source document
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a comprehensive guide.');

      // Create priority.json
      const priorityJson = {
        document: {
          id: 'guide--getting-started',
          title: 'Getting Started',
          source_path: 'en/guide/getting-started.md',
          category: 'guide'
        },
        priority: {
          score: 95,
          tier: 'high'
        }
      };
      
      await fs.writeFile(
        path.join(testDataDir, 'data', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priorityJson, null, 2)
      );

      // Create template with placeholder content
      const templateContent = `---
document_id: guide--getting-started
category: guide
source_path: en/guide/getting-started.md
character_limit: 100
last_update: 2025-01-01T00:00:00.000Z
---

# Getting Started (100자)

## 템플릿 내용 (100자 이내)

\`\`\`markdown
<!-- 여기에 100자 이내의 요약 내용을 작성하세요 -->

Getting Started: Provide comprehensive guidance on getting started의 핵심 개념과 Context-Action 프레임워크에서의 역할을 간단히 설명.
\`\`\`
`;

      await fs.writeFile(
        path.join(testDataDir, 'data', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        templateContent
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1, language: 'en' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should indicate needs content editing
        expect(output).toContain('Needs Content') || expect(output).toContain('Missing Template');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });

    it('should handle completed items correctly', async () => {
      // Create source document
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a comprehensive guide.');

      // Create priority.json
      const priorityJson = {
        document: {
          id: 'guide--getting-started',
          title: 'Getting Started',
          source_path: 'en/guide/getting-started.md',
          category: 'guide'
        },
        priority: {
          score: 95,
          tier: 'high'
        }
      };
      
      await fs.writeFile(
        path.join(testDataDir, 'data', 'en', 'guide--getting-started', 'priority.json'),
        JSON.stringify(priorityJson, null, 2)
      );

      // Create template with actual content (not placeholder)
      const templateContent = `---
document_id: guide--getting-started
category: guide
source_path: en/guide/getting-started.md
character_limit: 100
last_update: 2025-01-01T00:00:00.000Z
---

# Getting Started (100자)

## 템플릿 내용 (100자 이내)

\`\`\`markdown
Context-Action 프레임워크 시작 가이드: 설치부터 첫 번째 컴포넌트 작성까지 단계별로 안내하는 완전한 가이드입니다.
\`\`\`
`;

      await fs.writeFile(
        path.join(testDataDir, 'data', 'en', 'guide--getting-started', 'guide--getting-started-100.md'),
        templateContent
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1, language: 'en', showCompleted: true });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show completion status
        expect(output).toContain('Completed') || expect(output).toContain('✅');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });
  });

  describe('filtering and sorting', () => {
    it('should filter by language correctly', async () => {
      // Create Korean source document
      const koSourceDoc = path.join(testDataDir, 'docs', 'ko', 'guide', 'getting-started.md');
      await fs.writeFile(koSourceDoc, '# 시작하기\n\n이것은 가이드입니다.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1, language: 'ko' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show Korean language
        expect(output).toContain('🌐 Language: ko');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });

    it('should filter by character limit correctly', async () => {
      // Create source document
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a guide.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1, characterLimit: 300 });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show character limit 300
        expect(output).toContain('📏 Character Limit: 300');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });

    it('should filter by category correctly', async () => {
      // Create source document
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a guide.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1, category: 'guide' });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show guide category
        expect(output).toContain('📁 Category: guide');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });
  });

  describe('recommended actions', () => {
    it('should provide correct actions for missing priority', async () => {
      // Create source document only
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a guide.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1 });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should suggest priority generation
        expect(output).toContain('priority-generate') || expect(output).toContain('Priority');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });

    it('should provide file paths for content editing', async () => {
      // Create source document to ensure there's a work item
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a guide.');
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1 });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show file paths
        expect(output).toContain('📂 File Paths:') || expect(output).toContain('Source:');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });
  });

  describe('error handling', () => {
    it('should handle non-existent directories gracefully', async () => {
      // Don't create any test files
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1 });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should handle gracefully
        expect(output).toContain('No pending work items found') || 
               expect(output).toContain('🎉');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });

    it('should handle malformed priority.json files', async () => {
      // Create source document
      const sourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(sourceDoc, '# Getting Started\n\nThis is a guide.');

      // Create malformed priority.json
      await fs.writeFile(
        path.join(testDataDir, 'data', 'en', 'guide--getting-started', 'priority.json'),
        'invalid json content'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1 });
        
        // Should not crash and should handle the malformed file
        expect(true).toBe(true); // Test passes if no exception is thrown
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });
  });

  describe('statistics', () => {
    it('should provide accurate summary statistics', async () => {
      // Create multiple test documents
      const enSourceDoc = path.join(testDataDir, 'docs', 'en', 'guide', 'getting-started.md');
      await fs.writeFile(enSourceDoc, '# Getting Started\n\nThis is a guide.');
      
      const koSourceDoc = path.join(testDataDir, 'docs', 'ko', 'guide', 'getting-started.md');
      await fs.writeFile(koSourceDoc, '# 시작하기\n\n가이드입니다.');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await workNextCommand.execute({ limit: 1 });
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show statistics
        expect(output).toContain('📊 Summary Statistics') || 
               expect(output).toContain('Total Items:');
        
      } finally {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });
  });
});