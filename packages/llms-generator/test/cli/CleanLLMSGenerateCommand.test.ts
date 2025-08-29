import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { createCleanLLMSGenerateCommand } from '../../src/cli/commands/clean-llms-generate.js';
import { Command } from 'commander';

describe('CleanLLMSGenerateCommand', () => {
  let testDataDir: string;
  let originalCwd: string;
  let originalArgv: string[];
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    // Setup test directory
    testDataDir = path.join(__dirname, 'test-workspace-clean-llms');
    originalCwd = process.cwd();
    originalArgv = process.argv;
    
    // Mock process.exit to prevent test termination
    originalExit = process.exit;
    process.exit = jest.fn() as any;
    
    // Create test directory structure
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'llmsData', 'ko', 'api--core'), { recursive: true });
    await fs.mkdir(path.join(testDataDir, 'output'), { recursive: true });
    
    // Change to test directory
    process.chdir(testDataDir);

    // Create basic config file
    const configContent = {
      paths: {
        docsDir: path.join(testDataDir, 'docs'),
        llmContentDir: path.join(testDataDir, 'llmsData'),
        outputDir: path.join(testDataDir, 'output'),
        templatesDir: path.join(testDataDir, 'templates'),
        instructionsDir: path.join(testDataDir, 'instructions')
      },
      generation: {
        supportedLanguages: ['ko', 'en'],
        characterLimits: [100, 300, 500, 1000, 2000],
        defaultLanguage: 'ko',
        outputFormat: 'txt'
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
    
    await fs.writeFile('llms-generator.config.json', JSON.stringify(configContent, null, 2));
  });

  afterEach(async () => {
    // Restore original state
    process.chdir(originalCwd);
    process.argv = originalArgv;
    process.exit = originalExit;
    
    // Cleanup test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('command creation and configuration', () => {
    it('should create command with correct configuration', () => {
      const cmd = createCleanLLMSGenerateCommand();
      
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('clean-llms-generate');
      expect(cmd.description()).toContain('Generate clean LLMS-TXT files');
    });

    it('should have correct command options', () => {
      const cmd = createCleanLLMSGenerateCommand();
      const options = cmd.options;
      
      const optionNames = options.map(opt => opt.long);
      expect(optionNames).toContain('--language');
      expect(optionNames).toContain('--category');
      expect(optionNames).toContain('--pattern');
      expect(optionNames).toContain('--generate-all');
      expect(optionNames).toContain('--output-dir');
      expect(optionNames).toContain('--dry-run');
      expect(optionNames).toContain('--verbose');
    });
  });

  describe('basic command execution', () => {
    beforeEach(async () => {
      // Create test documents
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n시작하기 가이드입니다.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'api--core', 'api--core-300.md'),
        '---\ncompletion_status: completed\npriority_score: 85\n---\n\n# API 핵심\n\nAPI 핵심 문서입니다.'
      );
    });

    it('should execute with specific character limit', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should generate file successfully
        expect(output).toContain('Clean LLMS file generated successfully') || 
        expect(output).toContain('Found') ||
        expect(output).toContain('Output:');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should execute with generate-all flag', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '--generate-all', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show multiple generation
        expect(output).toContain('Generation Summary') ||
        expect(output).toContain('Generated Files') ||
        expect(output).toContain('Successful:');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle dry run mode', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300', '--dry-run', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show dry run information
        expect(output).toContain('DRY RUN') ||
        expect(output).toContain('Would generate') ||
        expect(output).toContain('Dry Run Summary');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle no arguments (default behavior)', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show default help message
        expect(output).toContain('Default: Generating origin, minimum, and default character files') ||
        expect(output).toContain('Use specific options to generate individual files') ||
        expect(output).toContain('Generation Summary');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('parameter validation', () => {
    it('should validate character limit parameter', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', 'invalid-number']);
        
        // Should exit with error for invalid character limit
        expect(process.exit).toHaveBeenCalledWith(1);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle zero or negative character limit', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '--', '-100']);
        
        // Should exit with error for invalid character limit
        expect(process.exit).toHaveBeenCalledWith(1);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('filtering options', () => {
    beforeEach(async () => {
      // Create test documents in different categories and languages
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n가이드 문서입니다.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'api--core', 'api--core-300.md'),
        '---\ncompletion_status: completed\npriority_score: 85\n---\n\n# API 핵심\n\nAPI 문서입니다.'
      );

      // Create English directory and document
      await fs.mkdir(path.join(testDataDir, 'llmsData', 'en', 'guide--introduction'), { recursive: true });
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'en', 'guide--introduction', 'guide--introduction-300.md'),
        '---\ncompletion_status: completed\npriority_score: 95\n---\n\n# Introduction\n\nEnglish guide document.'
      );
    });

    it('should filter by language', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300', '--language', 'en', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should process English documents
        expect(output).toContain('Found') && expect(output).toContain('Introduction');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should filter by category', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300', '--category', 'guide', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should process only guide documents
        expect(output).toContain('Found') && (expect(output).toContain('시작하기') || expect(output).toContain('guide'));
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle pattern option', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '--pattern', 'minimal', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should use minimal pattern
        expect(output).toContain('Pattern: minimal') ||
        expect(output).toContain('Clean LLMS file generated successfully');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('output directory handling', () => {
    it('should handle custom output directory', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const customOutput = path.join(testDataDir, 'custom-output');
      
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n테스트 문서입니다.'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300', '--output-dir', customOutput, '--verbose']);
        
        // Check that files were created in custom directory with language structure
        const outputPath = path.join(customOutput, 'ko', 'llms', 'llms-300chars.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        
        expect(fileExists).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('error handling', () => {
    it('should handle missing config file gracefully', async () => {
      // Remove config file
      await fs.unlink('llms-generator.config.json').catch(() => {});
      
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300']);
        
        // Should use default config and show appropriate message
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('No completed documents found') ||
        expect(output).toContain('Language directory does not exist');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle no matching documents', async () => {
      // Don't create any documents
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should report no documents found
        expect(output).toContain('No completed documents found');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle command execution errors', async () => {
      // Create invalid config to trigger error
      await fs.writeFile('llms-generator.config.json', 'invalid json content');
      
      const cmd = createCleanLLMSGenerateCommand();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300']);
        
        // Should exit with error
        expect(process.exit).toHaveBeenCalledWith(1);
        
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('verbose mode', () => {
    it('should show detailed output in verbose mode', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n상세 테스트 문서입니다.'
      );

      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show detailed information
        expect(output).toContain('Found') && expect(output).toContain('completed documents') ||
        expect(output).toContain('시작하기') ||
        expect(output).toContain('Total Characters:');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should suppress verbose output when not specified', async () => {
      // Create test document
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n간단 테스트 문서입니다.'
      );

      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show minimal output
        expect(consoleSpy.mock.calls.length).toBeLessThan(10);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('command help and usage', () => {
    it('should show help message with no specific arguments', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show usage information
        expect(output).toContain('Default: Generating origin, minimum, and default character files') ||
        expect(output).toContain('Use specific options to generate individual files');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should show usage examples', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show usage examples
        expect(output).toContain('pnpm cli clean-llms-generate') ||
        expect(output).toContain('Generate 300-char limit file') ||
        expect(output).toContain('Generate minimal pattern');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('multiple patterns and generation', () => {
    beforeEach(async () => {
      // Create test documents for multiple generation
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-500.md'),
        '---\ncompletion_status: completed\npriority_score: 90\n---\n\n# 시작하기\n\n다중 생성 테스트 문서입니다.'
      );
    });

    it('should execute multiple patterns with generate-all', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '--generate-all']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show multiple file generation
        expect(output).toContain('Generation Summary') ||
        expect(output).toContain('Successful:') ||
        expect(output).toContain('Generated Files:');
        
        // Check that multiple files were created
        const originFile = path.join(testDataDir, 'output', 'ko', 'llms', 'llms-origin.txt');
        const minimalFile = path.join(testDataDir, 'output', 'ko', 'llms', 'llms-minimal.txt');
        
        const originExists = await fs.access(originFile).then(() => true).catch(() => false);
        const minimalExists = await fs.access(minimalFile).then(() => true).catch(() => false);
        
        expect(originExists || minimalExists).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle generate-all with dry run', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '--generate-all', '--dry-run']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show dry run for multiple files (dry-run generates files, so shows Generation Summary)
        expect(output).toContain('Generation Summary') ||
        expect(output).toContain('Generated Files');
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('integration with SimpleLLMSCommand', () => {
    beforeEach(async () => {
      // Create comprehensive test documents
      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'guide--getting-started', 'guide--getting-started-300.md'),
        '---\ncompletion_status: completed\npriority_score: 90\ndocument_id: guide--getting-started\n---\n\n# 시작하기\n\n통합 테스트 가이드 문서입니다.'
      );

      await fs.writeFile(
        path.join(testDataDir, 'llmsData', 'ko', 'api--core', 'api--core-300.md'),
        '---\ncompletion_status: completed\npriority_score: 85\ndocument_id: api--core\n---\n\n# API 핵심\n\n통합 테스트 API 문서입니다.'
      );
    });

    it('should properly delegate to SimpleLLMSCommand', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync(['node', 'test', '300', '--verbose']);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should show proper execution results
        expect(output).toContain('Found 2 completed documents') ||
        expect(output).toContain('Clean LLMS file generated successfully');
        
        // Check that file was actually created  
        const outputPath = path.join(testDataDir, 'output', 'ko', 'llms', 'llms-300chars.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should pass through all options correctly', async () => {
      const cmd = createCleanLLMSGenerateCommand();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cmd.parseAsync([
          'node', 'test', '300',
          '--language', 'ko',
          '--category', 'guide',
          '--pattern', 'raw',
          '--verbose'
        ]);
        
        const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
        
        // Should use the specified options and create a file successfully
        expect(output).toContain('Found') && 
        expect(output).toContain('시작하기') && 
        expect(output).toContain('Clean LLMS file generated successfully');
        
        // Check that file was created with correct pattern (including category in filename)
        const outputPath = path.join(testDataDir, 'output', 'ko', 'llms', 'llms-300chars-guide-raw.txt');
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});