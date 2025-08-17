import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('CLI generate-all command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    
    // Setup test directory
    testDir = path.join(process.cwd(), 'test-cli-generate-all');
    await fs.mkdir(testDir, { recursive: true });
    
    // Create minimal project structure
    await fs.mkdir(path.join(testDir, 'docs', 'en', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'docs', 'ko', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'data', 'en'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'data', 'ko'), { recursive: true });
    
    // Create test configuration
    const config = {
      paths: {
        docsDir: './docs',
        dataDir: './data',
        outputDir: './data',
        llmContentDir: './data',
        templatesDir: './templates',
        instructionsDir: './instructions'
      },
      generation: {
        characterLimits: [100, 500],
        defaultLanguage: 'en',
        formats: ['minimum', 'origin', 'chars'],
        qualityThreshold: 70
      },
      languages: ['en', 'ko'],
      characterLimits: [100, 500]
    };
    
    await fs.writeFile(
      path.join(testDir, 'llms-generator.config.json'),
      JSON.stringify(config, null, 2)
    );

    // Create test documents for English
    await fs.writeFile(
      path.join(testDir, 'docs', 'en', 'guide', 'test.md'),
      `# Test Document

This is a test document for the Context-Action framework.

## Section 1

Content for section 1.

## Section 2

Content for section 2.`
    );

    // Create test documents for Korean
    await fs.writeFile(
      path.join(testDir, 'docs', 'ko', 'guide', 'test.md'),
      `# 테스트 문서

Context-Action 프레임워크를 위한 테스트 문서입니다.

## 섹션 1

섹션 1의 내용입니다.

## 섹션 2

섹션 2의 내용입니다.`
    );

    // Create priority files for English
    await fs.mkdir(path.join(testDir, 'data', 'en', 'guide--test'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'data', 'en', 'guide--test', 'priority.json'),
      JSON.stringify({
        document: {
          id: 'guide--test',
          title: 'Test Document',
          source_path: 'en/guide/test.md',
          category: 'guide'
        },
        priority: {
          score: 80,
          tier: 'important'
        },
        purpose: {
          target_audience: ['developers']
        }
      }, null, 2)
    );

    // Create priority files for Korean
    await fs.mkdir(path.join(testDir, 'data', 'ko', 'guide--test'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'data', 'ko', 'guide--test', 'priority.json'),
      JSON.stringify({
        document: {
          id: 'guide--test',
          title: '테스트 문서',
          source_path: 'ko/guide/test.md',
          category: 'guide'
        },
        priority: {
          score: 80,
          tier: 'important'
        },
        purpose: {
          target_audience: ['developers']
        }
      }, null, 2)
    );

    // Create priority for missing document
    await fs.mkdir(path.join(testDir, 'data', 'en', 'api--missing'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'data', 'en', 'api--missing', 'priority.json'),
      JSON.stringify({
        document: {
          id: 'api--missing',
          title: 'Missing API',
          source_path: 'en/api/missing.md',
          category: 'api'
        },
        priority: {
          score: 60,
          tier: 'normal'
        },
        purpose: {
          target_audience: ['developers']
        }
      }, null, 2)
    );

    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore original directory
    process.chdir(originalCwd);
    
    // Cleanup test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('generate-all', () => {
    it('should generate .md files for all configured languages', async () => {
      // Execute the command
      const cliPath = path.join(originalCwd, 'src', 'cli', 'index.ts');
      const output = execSync(`npx tsx ${cliPath} generate-all`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      // Check output messages
      expect(output).toContain('Generating .md files for all languages');
      expect(output).toContain('en:');
      expect(output).toContain('ko:');
      expect(output).toContain('All .md file generation completed!');

      // Check if files were created for English
      const enFile100 = path.join(testDir, 'data', 'en', 'guide--test', 'guide--test-100.md');
      const enFile500 = path.join(testDir, 'data', 'en', 'guide--test', 'guide--test-500.md');
      
      expect(existsSync(enFile100)).toBe(true);
      expect(existsSync(enFile500)).toBe(true);

      // Check if files were created for Korean
      const koFile100 = path.join(testDir, 'data', 'ko', 'guide--test', 'guide--test-100.md');
      const koFile500 = path.join(testDir, 'data', 'ko', 'guide--test', 'guide--test-500.md');
      
      expect(existsSync(koFile100)).toBe(true);
      expect(existsSync(koFile500)).toBe(true);

      // Check if placeholder was created for missing file
      const missingFile100 = path.join(testDir, 'data', 'en', 'api--missing', 'api--missing-100.md');
      expect(existsSync(missingFile100)).toBe(true);
      
      const missingContent = await fs.readFile(missingFile100, 'utf-8');
      expect(missingContent).toContain('work-status: "placeholder"');
    });

    it('should support custom language selection', async () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'index.ts');
      const output = execSync(`npx tsx ${cliPath} generate-all --lang=en`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Generating .md files for all languages: en');
      expect(output).toContain('en:');
      expect(output).not.toContain('ko:');

      // Check that only English files were created
      const enFile = path.join(testDir, 'data', 'en', 'guide--test', 'guide--test-100.md');
      expect(existsSync(enFile)).toBe(true);
    });

    it('should support custom character limits', async () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'index.ts');
      const output = execSync(`npx tsx ${cliPath} generate-all --chars=100`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Character limits: 100');

      // Check that only 100-char files were created
      const file100 = path.join(testDir, 'data', 'en', 'guide--test', 'guide--test-100.md');
      const file500 = path.join(testDir, 'data', 'en', 'guide--test', 'guide--test-500.md');
      
      expect(existsSync(file100)).toBe(true);
      expect(existsSync(file500)).toBe(false);
    });
  });

  describe('generate-md', () => {
    it('should generate .md files for a specific language', async () => {
      const cliPath = path.join(originalCwd, 'src', 'cli', 'index.ts');
      const output = execSync(`npx tsx ${cliPath} generate-md ko`, {
        encoding: 'utf-8',
        cwd: testDir
      });

      expect(output).toContain('Generating individual .md files for language: ko');
      expect(output).toContain('Individual .md files generated!');

      // Check if Korean files were created
      const koFile100 = path.join(testDir, 'data', 'ko', 'guide--test', 'guide--test-100.md');
      const koFile500 = path.join(testDir, 'data', 'ko', 'guide--test', 'guide--test-500.md');
      
      expect(existsSync(koFile100)).toBe(true);
      expect(existsSync(koFile500)).toBe(true);

      // Verify content
      const content = await fs.readFile(koFile100, 'utf-8');
      expect(content).toContain('title: "테스트 문서"');
      expect(content).toContain('work-status: "generated"');
      expect(content).toContain('character_limit: 100');
    });
  });
});