/**
 * Test Utility Functions Library for CLI Commands
 * 
 * Common utilities to reduce code duplication and improve test maintainability
 */

import { promises as fs } from 'fs';
import path from 'path';
import { EnhancedLLMSConfig } from '../../src/types/config.js';
import { CLIConfig } from '../../src/cli/types/CLITypes.js';

/**
 * Console spy utilities for capturing and analyzing command output
 */
export class ConsoleSpy {
  private consoleSpy: jest.SpyInstance;
  private consoleErrorSpy?: jest.SpyInstance;
  private consoleWarnSpy?: jest.SpyInstance;

  constructor(captureAll = false) {
    this.consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    if (captureAll) {
      this.consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      this.consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    }
  }

  getOutput(): string {
    return this.consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
  }

  getErrorOutput(): string {
    return this.consoleErrorSpy?.mock.calls.map(call => call.join(' ')).join('\n') || '';
  }

  getWarnOutput(): string {
    return this.consoleWarnSpy?.mock.calls.map(call => call.join(' ')).join('\n') || '';
  }

  getCallCount(): number {
    return this.consoleSpy.mock.calls.length;
  }

  restore(): void {
    this.consoleSpy.mockRestore();
    this.consoleErrorSpy?.mockRestore();
    this.consoleWarnSpy?.mockRestore();
  }
}

/**
 * Test workspace management utilities
 */
export class TestWorkspace {
  constructor(public readonly rootDir: string) {}

  async create(): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.rootDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  async createDirectoryStructure(structure: Record<string, any>): Promise<void> {
    await this._createStructure(this.rootDir, structure);
  }

  private async _createStructure(basePath: string, structure: Record<string, any>): Promise<void> {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = path.join(basePath, name);
      
      if (typeof content === 'string') {
        // Create file with content
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      } else if (typeof content === 'object' && content !== null) {
        // Create directory and recurse
        await fs.mkdir(fullPath, { recursive: true });
        await this._createStructure(fullPath, content);
      }
    }
  }

  async createFile(relativePath: string, content: string): Promise<string> {
    const fullPath = path.join(this.rootDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    return fullPath;
  }

  async createDirectory(relativePath: string): Promise<string> {
    const fullPath = path.join(this.rootDir, relativePath);
    await fs.mkdir(fullPath, { recursive: true });
    return fullPath;
  }

  getPath(relativePath = ''): string {
    return path.join(this.rootDir, relativePath);
  }

  async fileExists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.rootDir, relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async readFile(relativePath: string): Promise<string> {
    return fs.readFile(path.join(this.rootDir, relativePath), 'utf-8');
  }

  async readJsonFile<T>(relativePath: string): Promise<T> {
    const content = await this.readFile(relativePath);
    return JSON.parse(content);
  }
}

/**
 * Configuration builders for different test scenarios
 */
export class ConfigBuilder {
  static createEnhancedConfig(testDir: string, overrides: Partial<EnhancedLLMSConfig> = {}): EnhancedLLMSConfig {
    const defaultConfig: EnhancedLLMSConfig = {
      paths: {
        docsDir: path.join(testDir, 'docs'),
        llmContentDir: path.join(testDir, 'llmsData'),
        outputDir: path.join(testDir, 'output'),
        templatesDir: path.join(testDir, 'templates'),
        instructionsDir: path.join(testDir, 'instructions'),
        excludePatterns: ['**/api/core/src/**/*.md']
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 500, 1000, 2000, 5000],
        defaultLanguage: 'en',
        outputFormat: 'txt' as const
      },
      quality: {
        minPriorityScore: 0,
        maxDocumentAge: '1y',
        requireMinimumContent: false
      },
      categories: {
        guide: { priority: 95, name: 'Guide', description: 'User guides' },
        api: { priority: 90, name: 'API', description: 'API documentation' },
        concept: { priority: 85, name: 'Concept', description: 'Conceptual documentation' },
        examples: { priority: 80, name: 'Examples', description: 'Code examples' }
      },
      tags: {},
      dependencies: {
        rules: {
          prerequisite: { description: '', weight: 0, autoInclude: false },
          reference: { description: '', weight: 0, autoInclude: false },
          followup: { description: '', weight: 0, autoInclude: false },
          complement: { description: '', weight: 0, autoInclude: false }
        },
        conflictResolution: {
          strategy: 'exclude-conflicts' as const,
          priority: 'higher-score-wins' as const,
          allowPartialConflicts: false
        }
      },
      composition: {
        strategies: {},
        defaultStrategy: 'default',
        optimization: {
          spaceUtilizationTarget: 0.8,
          qualityThreshold: 0.7,
          diversityBonus: 0.1,
          redundancyPenalty: 0.2
        }
      },
      extraction: {
        defaultQualityThreshold: 0.7,
        autoTagExtraction: false,
        autoDependencyDetection: false,
        strategies: {}
      },
      validation: {
        schema: {
          enforceTagConsistency: false,
          validateDependencies: false,
          checkCategoryAlignment: false
        },
        quality: {
          minPriorityScore: 0,
          maxDocumentAge: '1y',
          requireMinimumContent: false
        }
      },
      ui: {
        dashboard: {
          enableTagCloud: false,
          showCategoryStats: false,
          enableDependencyGraph: false
        },
        reporting: {
          generateCompositionReports: false,
          includeQualityMetrics: false,
          exportFormats: ['json'] as ('json' | 'csv' | 'html')[]
        }
      }
    };

    return this.deepMerge(defaultConfig, overrides);
  }

  static createCLIConfig(testDir: string, overrides: Partial<CLIConfig> = {}): CLIConfig {
    const defaultConfig: CLIConfig = {
      paths: {
        docsDir: path.join(testDir, 'docs'),
        llmContentDir: path.join(testDir, 'llmsData'),
        outputDir: path.join(testDir, 'output'),
        templatesDir: path.join(testDir, 'templates'),
        instructionsDir: path.join(testDir, 'instructions'),
        excludePatterns: ['**/api/core/src/**/*.md']
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000],
        defaultCharacterLimits: {
          summary: 300,
          detailed: 1000,
          comprehensive: 2000
        },
        defaultLanguage: 'en',
        outputFormat: 'txt' as const
      },
      quality: {
        minPriorityScore: 0,
        maxDocumentAge: '1y',
        requireMinimumContent: false
      },
      categories: {
        guide: { priority: 95 },
        api: { priority: 90 },
        concept: { priority: 85 },
        examples: { priority: 80 }
      }
    };

    return this.deepMerge(defaultConfig, overrides);
  }

  static createNoFiltersConfig(testDir: string): EnhancedLLMSConfig {
    return this.createEnhancedConfig(testDir, {
      paths: {
        docsDir: path.join(testDir, 'docs'),
        llmContentDir: path.join(testDir, 'llmsData'),
        outputDir: path.join(testDir, 'output'),
        templatesDir: path.join(testDir, 'templates'),
        instructionsDir: path.join(testDir, 'instructions'),
        excludePatterns: [] // No exclusions
      }
    });
  }

  private static deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key], source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }
    
    return result;
  }
}

/**
 * Document creation utilities for testing
 */
export class DocumentBuilder {
  static createMarkdownDocument(title: string, content: string, frontmatter: Record<string, any> = {}): string {
    const fm = Object.keys(frontmatter).length > 0 
      ? `---\n${Object.entries(frontmatter).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n')}\n---\n\n`
      : '';
    
    return `${fm}# ${title}\n\n${content}`;
  }

  static createCompletedDocument(title: string, content: string, priorityScore = 90): string {
    return this.createMarkdownDocument(title, content, {
      completion_status: 'completed',
      priority_score: priorityScore,
      workflow_stage: 'content_filled'
    });
  }

  static createTemplateDocument(title: string, characterLimit: number): string {
    return this.createMarkdownDocument(title, '여기에 컨텐츠를 작성하세요.', {
      completion_status: 'template',
      character_limit: characterLimit,
      workflow_stage: 'template_created'
    });
  }

  static createKoreanDocument(title: string, content: string, priorityScore = 90): string {
    return this.createMarkdownDocument(title, content, {
      completion_status: 'completed',
      priority_score: priorityScore,
      language: 'ko'
    });
  }

  static createEnglishDocument(title: string, content: string, priorityScore = 90): string {
    return this.createMarkdownDocument(title, content, {
      completion_status: 'completed',
      priority_score: priorityScore,
      language: 'en'
    });
  }

  static createPriorityFile(documentId: string, title: string, priorityScore = 90): string {
    return JSON.stringify({
      document: {
        id: documentId,
        title: title,
        category: documentId.split('--')[0] || 'guide',
        language: 'en',
        lastModified: new Date().toISOString()
      },
      priority: {
        score: priorityScore,
        factors: {
          category: 0.4,
          recency: 0.3,
          completeness: 0.3
        },
        calculatedAt: new Date().toISOString()
      },
      metadata: {
        totalCharacters: 500,
        wordCount: 100,
        estimatedReadTime: '2 min'
      }
    }, null, 2);
  }
}

/**
 * Test assertion utilities
 */
export class TestAssertions {
  static expectOutputContains(output: string, expectedStrings: string[]): void {
    for (const expected of expectedStrings) {
      expect(output).toContain(expected);
    }
  }

  static expectOutputContainsAny(output: string, possibleStrings: string[]): void {
    const found = possibleStrings.some(str => output.includes(str));
    expect(found).toBe(true);
  }

  static expectFileExists(workspace: TestWorkspace, relativePath: string): void {
    expect(workspace.fileExists(relativePath)).resolves.toBe(true);
  }

  static expectFileNotExists(workspace: TestWorkspace, relativePath: string): void {
    expect(workspace.fileExists(relativePath)).resolves.toBe(false);
  }

  static async expectJsonFileContains(workspace: TestWorkspace, relativePath: string, expectedContent: Record<string, any>): Promise<void> {
    const content = await workspace.readJsonFile(relativePath);
    
    for (const [key, value] of Object.entries(expectedContent)) {
      if (key.includes('.')) {
        // Handle nested properties like "document.id"
        const keys = key.split('.');
        let current = content;
        for (const k of keys) {
          current = current[k];
        }
        expect(current).toBe(value);
      } else {
        expect(content[key]).toBe(value);
      }
    }
  }
}

/**
 * Mock process utilities
 */
export class ProcessMock {
  private originalExit: typeof process.exit;
  private originalCwd: string;
  private originalArgv: string[];

  constructor() {
    this.originalExit = process.exit;
    this.originalCwd = process.cwd();
    this.originalArgv = process.argv;
  }

  mockExit(): jest.SpyInstance {
    return jest.spyOn(process, 'exit').mockImplementation() as jest.SpyInstance;
  }

  changeDirectory(newCwd: string): void {
    process.chdir(newCwd);
  }

  setArgv(argv: string[]): void {
    process.argv = argv;
  }

  restore(): void {
    process.exit = this.originalExit;
    process.chdir(this.originalCwd);
    process.argv = this.originalArgv;
  }
}

/**
 * Async test utilities
 */
export class AsyncTestUtils {
  static async withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  static async expectToComplete<T>(operation: () => Promise<T>): Promise<T> {
    return this.withTimeout(operation(), 5000);
  }

  static async expectToCompleteWithinTime<T>(operation: () => Promise<T>, maxTimeMs: number): Promise<T> {
    const start = Date.now();
    const result = await operation();
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeLessThan(maxTimeMs);
    return result;
  }
}

/**
 * Common test patterns
 */
export class CommonPatterns {
  static async testBasicExecution<T>(
    commandFactory: () => T,
    executeMethod: (cmd: T, options?: any) => Promise<void>,
    workspace: TestWorkspace,
    options: any = {}
  ): Promise<string> {
    const command = commandFactory();
    const consoleSpy = new ConsoleSpy();
    
    try {
      await executeMethod(command, options);
      return consoleSpy.getOutput();
    } finally {
      consoleSpy.restore();
    }
  }

  static async testDryRunMode<T>(
    commandFactory: () => T,
    executeMethod: (cmd: T, options?: any) => Promise<void>,
    workspace: TestWorkspace,
    options: any = {}
  ): Promise<{ output: string; filesCreated: boolean }> {
    const command = commandFactory();
    const consoleSpy = new ConsoleSpy();
    
    const filesBefore = await this.countFiles(workspace.rootDir);
    
    try {
      await executeMethod(command, { ...options, dryRun: true });
      const filesAfter = await this.countFiles(workspace.rootDir);
      
      return {
        output: consoleSpy.getOutput(),
        filesCreated: filesAfter > filesBefore
      };
    } finally {
      consoleSpy.restore();
    }
  }

  static async testErrorHandling<T>(
    commandFactory: () => T,
    executeMethod: (cmd: T, options?: any) => Promise<void>,
    options: any = {}
  ): Promise<{ completed: boolean; errorOutput: string }> {
    const command = commandFactory();
    const consoleSpy = new ConsoleSpy(true);
    
    try {
      await executeMethod(command, options);
      return {
        completed: true,
        errorOutput: consoleSpy.getErrorOutput()
      };
    } catch (error) {
      return {
        completed: false,
        errorOutput: consoleSpy.getErrorOutput()
      };
    } finally {
      consoleSpy.restore();
    }
  }

  private static async countFiles(dir: string): Promise<number> {
    try {
      const files = await fs.readdir(dir, { recursive: true });
      return files.length;
    } catch {
      return 0;
    }
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceUtils {
  static async measureExecutionTime<T>(operation: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
    const start = Date.now();
    const result = await operation();
    const timeMs = Date.now() - start;
    
    return { result, timeMs };
  }

  static expectExecutionTime<T>(measurement: { result: T; timeMs: number }, maxTimeMs: number): T {
    expect(measurement.timeMs).toBeLessThan(maxTimeMs);
    return measurement.result;
  }

  static async expectFastExecution<T>(operation: () => Promise<T>, maxTimeMs = 1000): Promise<T> {
    const measurement = await this.measureExecutionTime(operation);
    return this.expectExecutionTime(measurement, maxTimeMs);
  }
}