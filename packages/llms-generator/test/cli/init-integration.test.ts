import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('Init Command Integration Tests', () => {
  let testWorkspace: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    
    // Create temporary test workspace
    testWorkspace = path.join(process.cwd(), 'test-workspace-init');
    
    if (existsSync(testWorkspace)) {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    }
    
    await fs.mkdir(testWorkspace, { recursive: true });
    process.chdir(testWorkspace);

    // Create basic project structure
    await createTestProjectStructure();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    
    if (existsSync(testWorkspace)) {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    }
  });

  async function createTestProjectStructure() {
    // Create directories
    await fs.mkdir('docs/en/guide', { recursive: true });
    await fs.mkdir('docs/ko/guide', { recursive: true });
    await fs.mkdir('docs/en/api', { recursive: true });
    await fs.mkdir('docs/ko/api', { recursive: true });

    // Create sample markdown files
    await fs.writeFile('docs/en/guide/getting-started.md', `# Getting Started

This is a guide to getting started with the framework.

## Installation

Install the package using npm:

\`\`\`bash
npm install @context-action/react
\`\`\`

## Quick Start

Here's how to get started quickly...
`);

    await fs.writeFile('docs/ko/guide/getting-started.md', `# 시작하기

프레임워크를 시작하는 가이드입니다.

## 설치

npm을 사용하여 패키지를 설치하세요:

\`\`\`bash
npm install @context-action/react
\`\`\`

## 빠른 시작

빠르게 시작하는 방법...
`);

    await fs.writeFile('docs/en/api/action-only.md', `# Action Only Pattern

The Action Only pattern provides pure action dispatching capabilities.

## Usage

\`\`\`typescript
import { createActionContext } from '@context-action/react';

const { useActionDispatch } = createActionContext<Actions>('MyActions');
\`\`\`
`);

    await fs.writeFile('docs/ko/api/action-only.md', `# Action Only 패턴

Action Only 패턴은 순수한 액션 디스패칭 기능을 제공합니다.

## 사용법

\`\`\`typescript
import { createActionContext } from '@context-action/react';

const { useActionDispatch } = createActionContext<Actions>('MyActions');
\`\`\`
`);

    // Create llms-generator config
    await fs.writeFile('llms-generator.config.json', JSON.stringify({
      "$schema": "./packages/llms-generator/src/types/config.schema.json",
      "paths": {
        "docsDir": "./docs",
        "llmContentDir": "./data",
        "outputDir": "./docs/llms",
        "templatesDir": "./templates",
        "instructionsDir": "./instructions"
      },
      "generation": {
        "supportedLanguages": ["en", "ko"],
        "characterLimits": [100, 300, 500],
        "defaultLanguage": "en",
        "outputFormat": "txt"
      },
      "quality": {
        "minCompletenessThreshold": 0.8,
        "enableValidation": true,
        "strictMode": false
      },
      "categories": {
        "guide": {
          "name": "가이드",
          "description": "사용자 가이드 및 튜토리얼",
          "priority": 95,
          "defaultStrategy": "tutorial-first",
          "tags": ["beginner", "step-by-step", "practical"],
          "color": "#28a745",
          "icon": "📖"
        },
        "api": {
          "name": "API 참조",
          "description": "API 문서 및 참조 자료",
          "priority": 90,
          "defaultStrategy": "api-first",
          "tags": ["reference", "technical", "developer"],
          "color": "#17a2b8",
          "icon": "🔧"
        }
      }
    }, null, 2));
  }

  async function runCLICommand(args: string[]): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    return new Promise((resolve) => {
      const cliPath = path.join(originalCwd, 'packages/llms-generator/dist/cli/index.js');
      const child = spawn('node', [cliPath, ...args], {
        cwd: testWorkspace,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      });
    });
  }

  describe('init command execution', () => {
    it('should successfully run init command', async () => {
      // Build the CLI first
      await runCLICommand(['config-show']); // This will ensure CLI is available

      const result = await runCLICommand(['init', '--dry-run']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('🚀 Starting project initialization');
      expect(result.stdout).toContain('🔍 [DRY RUN MODE]');
      expect(result.stdout).toContain('🎉 Project initialization completed successfully!');
    }, 30000);

    it('should show help for init command', async () => {
      const result = await runCLICommand(['help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('PROJECT INITIALIZATION:');
      expect(result.stdout).toContain('init [options]');
      expect(result.stdout).toContain('discovery → priority → templates');
    });

    it('should respect quiet flag', async () => {
      const result = await runCLICommand(['init', '--dry-run', '--quiet']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe(''); // Should have no output in quiet mode
    }, 30000);

    it('should show project structure information', async () => {
      const result = await runCLICommand(['init', '--dry-run']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Languages: en, ko');
      expect(result.stdout).toContain('Character Limits: 100, 300, 500');
    }, 30000);

    it('should handle skip options correctly', async () => {
      const result = await runCLICommand(['init', '--dry-run', '--skip-discovery']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('🚀 Starting project initialization');
      // Should skip discovery step
      expect(result.stdout).not.toContain('🔍 Step 1: Document Discovery');
      // But should include other steps
      expect(result.stdout).toContain('📊 Step 2: Priority JSON Generation');
    }, 30000);
  });

  describe('config integration', () => {
    it('should load config correctly', async () => {
      const result = await runCLICommand(['config-show']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('📋 Loading enhanced config from llms-generator.config.json');
      expect(result.stdout).toContain('Languages: en, ko');
    });

    it('should validate config before init', async () => {
      const result = await runCLICommand(['config-validate']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✅ Configuration is valid!');
    });

    it('should work with invalid config', async () => {
      // Create invalid config
      await fs.writeFile('llms-generator.config.json', JSON.stringify({
        "generation": {
          "supportedLanguages": [], // Invalid: empty array
          "characterLimits": []     // Invalid: empty array
        }
      }));

      const result = await runCLICommand(['init', '--dry-run']);
      
      // Should still work with default fallbacks
      expect(result.exitCode).toBe(0);
    });
  });

  describe('file system integration', () => {
    it('should create expected directory structure in dry-run', async () => {
      const result = await runCLICommand(['init', '--dry-run']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('📁 Output Structure:');
      expect(result.stdout).toContain('./data/');
      expect(result.stdout).toContain('priority.json');
      expect(result.stdout).toContain('100chars.md');
    }, 30000);

    it('should discover existing markdown files', async () => {
      const result = await runCLICommand(['discover', 'en']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('🔍 Discovering documents for language: en');
      expect(result.stdout).toContain('guide--getting-started');
      expect(result.stdout).toContain('api--action-only');
    });

    it('should show next steps after completion', async () => {
      const result = await runCLICommand(['init', '--dry-run']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('🚀 Next Steps:');
      expect(result.stdout).toContain('Review generated priority.json files');
      expect(result.stdout).toContain('Run `simple-llms-batch` to generate final LLMS files');
    }, 30000);
  });

  describe('error handling', () => {
    it('should handle missing config gracefully', async () => {
      // Remove config file
      await fs.unlink('llms-generator.config.json');

      const result = await runCLICommand(['init', '--dry-run']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('📋 Loading legacy config');
      // Should still work with defaults
    }, 30000);

    it('should handle missing docs directory gracefully', async () => {
      // Remove docs directory
      await fs.rm('docs', { recursive: true, force: true });

      const result = await runCLICommand(['init', '--dry-run']);
      
      // Should handle missing docs directory (PriorityGenerator should handle this)
      expect(result.exitCode).toBe(0);
    }, 30000);

    it('should provide meaningful error messages', async () => {
      // Create a config with invalid paths
      await fs.writeFile('llms-generator.config.json', JSON.stringify({
        "paths": {
          "docsDir": "/nonexistent/path"
        },
        "generation": {
          "supportedLanguages": ["en"],
          "characterLimits": [100]
        }
      }));

      const result = await runCLICommand(['init', '--dry-run']);
      
      // Should either succeed with warnings or fail with clear error
      if (result.exitCode !== 0) {
        expect(result.stderr).toContain('❌');
      }
    }, 30000);
  });

  describe('step-by-step validation', () => {
    it('should execute steps in correct order', async () => {
      const result = await runCLICommand(['init', '--dry-run']);
      
      expect(result.exitCode).toBe(0);
      
      const steps = result.stdout.split('\n').filter(line => line.includes('Step'));
      expect(steps.length).toBeGreaterThanOrEqual(3);
      
      // Verify step order
      expect(steps[0]).toContain('Step 1: Document Discovery');
      expect(steps[1]).toContain('Step 2: Priority JSON Generation');
      expect(steps[2]).toContain('Step 3: Template Generation');
    }, 30000);

    it('should handle step skipping correctly', async () => {
      const result = await runCLICommand(['init', '--dry-run', '--skip-priority', '--skip-templates']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Step 1: Document Discovery');
      expect(result.stdout).not.toContain('Step 2: Priority JSON Generation');
      expect(result.stdout).not.toContain('Step 3: Template Generation');
    }, 30000);
  });
});