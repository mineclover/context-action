import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AdaptiveComposer } from '../../src/core/AdaptiveComposer';
import { promises as fs } from 'fs';
import path from 'path';
import { existsSync } from 'fs';
import type { LLMSConfig } from '../../src/types';

describe('AdaptiveComposer', () => {
  let composer: AdaptiveComposer;
  let testDir: string;
  let config: LLMSConfig;

  beforeEach(async () => {
    // Setup test directory
    testDir = path.join(process.cwd(), 'test-data-adaptive');
    
    // Create test directories
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'docs', 'en', 'guide'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'data', 'en'), { recursive: true });
    
    // Create test configuration
    config = {
      paths: {
        docsDir: path.join(testDir, 'docs'),
        dataDir: path.join(testDir, 'data'),
        outputDir: path.join(testDir, 'data'),
        llmContentDir: path.join(testDir, 'data'),
        templatesDir: path.join(testDir, 'templates'),
        instructionsDir: path.join(testDir, 'instructions')
      },
      generation: {
        characterLimits: [100, 200, 500, 1000],
        defaultLanguage: 'en',
        formats: ['minimum', 'origin', 'chars'],
        qualityThreshold: 70
      },
      languages: ['en', 'ko'],
      characterLimits: [100, 200, 500, 1000]
    };

    // Create test documents
    await fs.writeFile(
      path.join(testDir, 'docs', 'en', 'guide', 'getting-started.md'),
      `# Getting Started

This is a comprehensive guide to getting started with the Context-Action framework.

## Installation

Install the framework using npm or pnpm:

\`\`\`bash
npm install @context-action/core @context-action/react
\`\`\`

## Basic Usage

Here's a simple example of using the framework:

\`\`\`typescript
import { createActionContext } from '@context-action/react';

const { Provider, useActionDispatch } = createActionContext('MyApp');
\`\`\`

## Key Features

- Type-safe action dispatching
- Priority-based handler execution
- Store integration
- React hooks support

## Next Steps

Check out the advanced guides for more complex use cases.`
    );

    // Create priority.json for the test document
    await fs.mkdir(path.join(testDir, 'data', 'en', 'guide--getting-started'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'data', 'en', 'guide--getting-started', 'priority.json'),
      JSON.stringify({
        document: {
          id: 'guide--getting-started',
          title: 'Getting Started',
          source_path: 'en/guide/getting-started.md',
          category: 'guide'
        },
        priority: {
          score: 90,
          tier: 'critical'
        },
        purpose: {
          target_audience: ['beginners', 'framework-users']
        }
      }, null, 2)
    );

    composer = new AdaptiveComposer(config);
  });

  afterEach(async () => {
    // Cleanup test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('generateIndividualCharacterLimited', () => {
    it('should generate .md files with YAML frontmatter for existing source files', async () => {
      // Generate files
      await composer.generateIndividualCharacterLimited([100, 500], 'en');

      // Check if files were created
      const generatedDir = path.join(testDir, 'data', 'en', 'guide--getting-started');
      const file100 = path.join(generatedDir, 'guide--getting-started-100.md');
      const file500 = path.join(generatedDir, 'guide--getting-started-500.md');

      expect(existsSync(file100)).toBe(true);
      expect(existsSync(file500)).toBe(true);

      // Check file content
      const content100 = await fs.readFile(file100, 'utf-8');
      const content500 = await fs.readFile(file500, 'utf-8');

      // Verify YAML frontmatter
      expect(content100).toMatch(/^---\n/);
      expect(content100).toContain('title: "Getting Started"');
      expect(content100).toContain('category: "guide"');
      expect(content100).toContain('character_limit: 100');
      expect(content100).toContain('work-status: "generated"');

      expect(content500).toMatch(/^---\n/);
      expect(content500).toContain('character_limit: 500');
      expect(content500).toContain('work-status: "generated"');

      // Verify content is properly generated (character limit is approximately enforced)
      const lines100 = content100.split('\n');
      const contentStart = lines100.findIndex(line => line === '---', 1) + 1;
      const actualContent100 = lines100.slice(contentStart).join('\n').trim();
      expect(actualContent100.length).toBeGreaterThan(50); // Has meaningful content
      expect(actualContent100).toContain('Getting Started'); // Contains expected content
    });

    it('should generate placeholder .md files for missing source files', async () => {
      // Create a priority.json without corresponding source file
      await fs.mkdir(path.join(testDir, 'data', 'en', 'api--missing'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'data', 'en', 'api--missing', 'priority.json'),
        JSON.stringify({
          document: {
            id: 'api--missing',
            title: 'Missing API Doc',
            source_path: 'en/api/missing.md',
            category: 'api'
          },
          priority: {
            score: 70,
            tier: 'important'
          },
          purpose: {
            target_audience: ['developers']
          }
        }, null, 2)
      );

      // Generate files
      await composer.generateIndividualCharacterLimited([100, 200], 'en');

      // Check if placeholder files were created
      const placeholderDir = path.join(testDir, 'data', 'en', 'api--missing');
      const placeholder100 = path.join(placeholderDir, 'api--missing-100.md');
      const placeholder200 = path.join(placeholderDir, 'api--missing-200.md');

      expect(existsSync(placeholder100)).toBe(true);
      expect(existsSync(placeholder200)).toBe(true);

      // Check placeholder content
      const content100 = await fs.readFile(placeholder100, 'utf-8');
      const content200 = await fs.readFile(placeholder200, 'utf-8');

      // Verify placeholder frontmatter
      expect(content100).toContain('work-status: "placeholder"');
      expect(content100).toContain('title: "Missing API Doc"');
      expect(content100).toContain('Document ID**: api--missing');

      expect(content200).toContain('work-status: "placeholder"');
      expect(content200).toContain('placeholder - source file pending');
    });
  });

  describe('composeAdaptiveContent', () => {
    it('should compose content within character limits', async () => {
      const result = await composer.composeAdaptiveContent({
        language: 'en',
        characterLimit: 500,
        includeTableOfContents: true,
        priorityThreshold: 0
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.summary.totalCharacters).toBeLessThanOrEqual(500);
      expect(result.summary.documentsIncluded).toBeGreaterThan(0);
    });

    it('should respect priority threshold', async () => {
      const result = await composer.composeAdaptiveContent({
        language: 'en',
        characterLimit: 1000,
        priorityThreshold: 95
      });

      // Since our test document has priority 90, it should be excluded
      expect(result.summary.documentsIncluded).toBe(0);
    });

    it('should generate table of contents when requested', async () => {
      const result = await composer.composeAdaptiveContent({
        language: 'en',
        characterLimit: 1000,
        includeTableOfContents: true
      });

      expect(result.content).toContain('# Table of Contents');
    });
  });

  describe('getCompositionStats', () => {
    it('should return composition statistics', async () => {
      const stats = await composer.getCompositionStats('en');

      expect(stats).toBeDefined();
      expect(stats.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(stats.documentsWithContent).toBeGreaterThanOrEqual(0);
      expect(stats.averagePriority).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.availableCharacterLimits)).toBe(true);
    });
  });
});