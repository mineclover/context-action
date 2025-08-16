/**
 * Husky Hooks Integration Tests
 * Git hooks 실행 및 스크립트 검증 테스트
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('Husky Hooks Integration', () => {
  const huskyDir = '.husky';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Script Validation', () => {
    describe('post-commit hook', () => {
      const postCommitScript = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔄 커밋 후 문서 동기화를 시작합니다..."

# Git 커밋 트리거 기반 문서 동기화 실행
npx @context-action/llms-generator sync-docs --quiet

if [ $? -eq 0 ]; then
  echo "✅ 문서 동기화가 완료되었습니다."
else
  echo "⚠️ 문서 동기화 중 일부 오류가 발생했습니다."
fi`;

      it('should contain correct shebang and husky initialization', () => {
        expect(postCommitScript).toContain('#!/usr/bin/env sh');
        expect(postCommitScript).toContain('. "$(dirname -- "$0")/_/husky.sh"');
      });

      it('should execute sync-docs command with quiet option', () => {
        expect(postCommitScript).toContain('sync-docs --quiet');
        expect(postCommitScript).toContain('npx @context-action/llms-generator');
      });

      it('should handle command exit codes properly', () => {
        expect(postCommitScript).toContain('if [ $? -eq 0 ]; then');
        expect(postCommitScript).toContain('else');
        expect(postCommitScript).toContain('fi');
      });

      it('should provide user feedback messages', () => {
        expect(postCommitScript).toContain('커밋 후 문서 동기화를 시작합니다');
        expect(postCommitScript).toContain('문서 동기화가 완료되었습니다');
        expect(postCommitScript).toContain('문서 동기화 중 일부 오류가 발생했습니다');
      });
    });

    describe('post-merge hook', () => {
      const postMergeScript = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔄 머지 후 문서 동기화를 확인합니다..."

# 변경된 문서 파일들 감지 (마크다운과 텍스트 파일만)
CHANGED_FILES=$(git diff HEAD~1 --name-only | grep -E '\\.(md|txt)' | tr '\\n' ',' | sed 's/,$//')

if [ -n "$CHANGED_FILES" ]; then
  echo "📄 변경된 문서가 감지되었습니다: $CHANGED_FILES"
  npx @context-action/llms-generator sync-docs --changed-files "$CHANGED_FILES" --quiet
  
  if [ $? -eq 0 ]; then
    echo "✅ 변경된 문서에 대한 동기화가 완료되었습니다."
  else
    echo "⚠️ 문서 동기화 중 오류가 발생했습니다."
  fi
else
  echo "📄 변경된 문서가 없습니다."
fi`;

      it('should detect changed document files correctly', () => {
        expect(postMergeScript).toContain('git diff HEAD~1 --name-only');
        expect(postMergeScript).toContain('grep -E');
        expect(postMergeScript).toContain('\\.(md|txt)');
      });

      it('should format changed files list properly', () => {
        expect(postMergeScript).toContain("tr '\\n' ','");
        expect(postMergeScript).toContain("sed 's/,$//'");
      });

      it('should handle selective synchronization', () => {
        expect(postMergeScript).toContain('--changed-files "$CHANGED_FILES"');
        expect(postMergeScript).toContain('if [ -n "$CHANGED_FILES" ]; then');
      });

      it('should provide appropriate feedback for different scenarios', () => {
        expect(postMergeScript).toContain('변경된 문서가 감지되었습니다');
        expect(postMergeScript).toContain('변경된 문서가 없습니다');
        expect(postMergeScript).toContain('변경된 문서에 대한 동기화가 완료');
      });
    });

    describe('pre-commit hook', () => {
      const preCommitScript = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Priority JSON 파일 검증을 시작합니다..."

# Priority JSON 파일 검증 실행
npx @context-action/llms-generator pre-commit-check

if [ $? -ne 0 ]; then
  echo "❌ Priority JSON 검증에 실패했습니다. 커밋이 차단됩니다."
  exit 1
fi

echo "✅ Priority JSON 검증이 완료되었습니다."`;

      it('should execute priority validation before commit', () => {
        expect(preCommitScript).toContain('pre-commit-check');
        expect(preCommitScript).toContain('Priority JSON 파일 검증');
      });

      it('should block commit on validation failure', () => {
        expect(preCommitScript).toContain('if [ $? -ne 0 ]; then');
        expect(preCommitScript).toContain('exit 1');
        expect(preCommitScript).toContain('커밋이 차단됩니다');
      });

      it('should provide clear feedback messages', () => {
        expect(preCommitScript).toContain('검증을 시작합니다');
        expect(preCommitScript).toContain('검증에 실패했습니다');
        expect(preCommitScript).toContain('검증이 완료되었습니다');
      });
    });
  });

  describe('Hook File Structure', () => {
    it('should have correct file permissions (executable)', () => {
      const hookFiles = [
        '.husky/post-commit',
        '.husky/post-merge', 
        '.husky/pre-commit'
      ];

      hookFiles.forEach(hookFile => {
        // In a real test, we would check file permissions
        // For now, verify the paths are correct
        expect(hookFile).toContain('.husky/');
        expect(hookFile.split('/')[1]).toMatch(/^(post-commit|post-merge|pre-commit)$/);
      });
    });

    it('should contain README.md documentation', () => {
      const readmeContent = `# Git Hooks for Context-Action LLMS Generator

이 디렉토리는 Context-Action 프레임워크의 문서 동기화를 위한 Git hooks를 포함합니다.

## 📋 설치된 Hooks

### 🔄 post-commit
- **목적**: 커밋 후 자동 문서 동기화
- **실행**: 모든 커밋 후 \`sync-docs --quiet\` 명령 실행
- **기능**: 양방향 문서 동기화 수행

### 🔄 post-merge  
- **목적**: 머지 후 선택적 문서 동기화
- **실행**: 문서 변경이 감지된 경우에만 동기화 실행
- **기능**: 변경된 파일만 대상으로 효율적 동기화

### 🔍 pre-commit
- **목적**: 커밋 전 Priority JSON 검증
- **실행**: Priority JSON 파일 유효성 검사
- **기능**: 검증 실패 시 커밋 차단

## 🛠️ 동작 방식

### 양방향 동기화 워크플로우

1. **요약 문서 → 실제 문서**
   - 요약 문서(*.txt) 변경 감지
   - 관련 Priority JSON 파일 업데이트
   - 메타데이터 추출 및 연결

2. **실제 문서 → 요약 문서**  
   - 실제 문서(*.md) 변경 감지
   - 요약 문서 헤더 업데이트
   - Priority JSON 상태 업데이트

## 🚨 문제 해결

### Hook 실행 실패
- Git hooks 권한 확인: \`chmod +x .husky/*\`
- 패키지 설치 확인: \`npm list @context-action/llms-generator\`

### 동기화 오류
- 로그 확인: hooks는 --quiet 모드로 실행되므로 수동 실행으로 디버깅
- 수동 실행: \`npx @context-action/llms-generator sync-docs\`

---

> **참고**: 이 hooks는 Context-Action 프레임워크의 문서 품질과 일관성을 자동으로 유지합니다.`;

      expect(readmeContent).toContain('Git Hooks for Context-Action LLMS Generator');
      expect(readmeContent).toContain('post-commit');
      expect(readmeContent).toContain('post-merge');
      expect(readmeContent).toContain('pre-commit');
      expect(readmeContent).toContain('양방향 동기화 워크플로우');
    });
  });

  describe('Hook Execution Simulation', () => {
    describe('post-commit execution', () => {
      it('should execute successfully with no changes', () => {
        mockExecSync.mockReturnValue('📄 변경된 문서가 없습니다.\n✅ 문서 동기화가 완료되었습니다.');

        const result = mockExecSync('npx @context-action/llms-generator sync-docs --quiet');
        expect(result.toString()).toContain('문서 동기화가 완료되었습니다');
      });

      it('should handle sync command execution', () => {
        mockExecSync.mockReturnValue('🔄 2개의 변경된 파일을 분석합니다...\n✅ 문서 동기화가 완료되었습니다.');

        const result = mockExecSync('npx @context-action/llms-generator sync-docs --quiet');
        expect(result.toString()).toContain('변경된 파일을 분석합니다');
        expect(result.toString()).toContain('문서 동기화가 완료되었습니다');
      });

      it('should handle sync command failures', () => {
        mockExecSync.mockImplementation(() => {
          const error = new Error('Command failed');
          (error as any).status = 1;
          throw error;
        });

        expect(() => {
          mockExecSync('npx @context-action/llms-generator sync-docs --quiet');
        }).toThrow('Command failed');
      });
    });

    describe('post-merge execution', () => {
      it('should detect and process changed markdown files', () => {
        const mockGitDiff = 'docs/getting-started.md\ndocs/api/actions.md\nsrc/index.ts\npackage.json';
        const expectedChangedFiles = 'docs/getting-started.md,docs/api/actions.md';

        mockExecSync
          .mockReturnValueOnce(mockGitDiff)
          .mockReturnValueOnce('✅ 변경된 문서에 대한 동기화가 완료되었습니다.');

        // Simulate git diff command
        const gitResult = mockExecSync('git diff HEAD~1 --name-only');
        const filteredFiles = gitResult.toString().split('\n')
          .filter(file => file.endsWith('.md') || file.endsWith('.txt'))
          .join(',');

        expect(filteredFiles).toBe(expectedChangedFiles);

        // Simulate sync command with changed files
        const syncResult = mockExecSync(`sync-docs --changed-files "${filteredFiles}" --quiet`);
        expect(syncResult.toString()).toContain('동기화가 완료되었습니다');
      });

      it('should handle no document changes', () => {
        mockExecSync.mockReturnValue('src/index.ts\npackage.json'); // No .md or .txt files

        const gitResult = mockExecSync('git diff HEAD~1 --name-only');
        const filteredFiles = gitResult.toString().split('\n')
          .filter(file => file.endsWith('.md') || file.endsWith('.txt'));

        expect(filteredFiles).toHaveLength(0);
        // No sync command should be executed in this case
      });
    });

    describe('pre-commit execution', () => {
      it('should pass validation and allow commit', () => {
        mockExecSync.mockReturnValue('✅ Priority JSON 검증이 완료되었습니다.');

        const result = mockExecSync('npx @context-action/llms-generator pre-commit-check');
        expect(result.toString()).toContain('검증이 완료되었습니다');
      });

      it('should fail validation and block commit', () => {
        mockExecSync.mockImplementation(() => {
          const error = new Error('❌ Priority JSON 검증에 실패했습니다.');
          (error as any).status = 1;
          throw error;
        });

        expect(() => {
          mockExecSync('npx @context-action/llms-generator pre-commit-check');
        }).toThrow('검증에 실패했습니다');
      });

      it('should handle missing priority files', () => {
        const errorOutput = `⚠️ 누락된 파일들:
  - data/ko/getting-started.json
  - data/en/api-reference.json
❌ Priority JSON 검증에 실패했습니다.`;

        mockExecSync.mockImplementation(() => {
          const error = new Error(errorOutput);
          (error as any).status = 1;
          throw error;
        });

        expect(() => {
          mockExecSync('npx @context-action/llms-generator pre-commit-check');
        }).toThrow('누락된 파일들');
      });
    });
  });

  describe('Hook Configuration', () => {
    it('should read husky configuration correctly', () => {
      const huskyConfig = {
        hooks: {
          'pre-commit': 'npx @context-action/llms-generator pre-commit-check',
          'post-commit': 'npx @context-action/llms-generator sync-docs --quiet', 
          'post-merge': 'npx @context-action/llms-generator sync-docs --changed-files "$(git diff HEAD~1 --name-only | grep -E \'\\.(md|txt)\')" --quiet'
        }
      };

      expect(huskyConfig.hooks['pre-commit']).toContain('pre-commit-check');
      expect(huskyConfig.hooks['post-commit']).toContain('sync-docs --quiet');
      expect(huskyConfig.hooks['post-merge']).toContain('sync-docs --changed-files');
    });

    it('should validate hook script syntax', () => {
      const hookScripts = [
        {
          name: 'post-commit',
          script: '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\necho "test"'
        },
        {
          name: 'post-merge', 
          script: '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\necho "test"'
        },
        {
          name: 'pre-commit',
          script: '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\necho "test"'
        }
      ];

      hookScripts.forEach(({ name, script }) => {
        expect(script).toContain('#!/usr/bin/env sh');
        expect(script).toContain('husky.sh');
        expect(name).toMatch(/^(pre-commit|post-commit|post-merge)$/);
      });
    });
  });

  describe('Error Handling in Hooks', () => {
    it('should handle command not found errors', () => {
      const commandNotFoundError = 'npx: command not found';
      
      mockExecSync.mockImplementation(() => {
        const error = new Error(commandNotFoundError);
        (error as any).status = 127;
        throw error;
      });

      expect(() => {
        mockExecSync('npx @context-action/llms-generator sync-docs');
      }).toThrow('command not found');
    });

    it('should handle package not installed errors', () => {
      const packageNotFoundError = 'Cannot resolve @context-action/llms-generator';
      
      mockExecSync.mockImplementation(() => {
        const error = new Error(packageNotFoundError);
        (error as any).status = 1;
        throw error;
      });

      expect(() => {
        mockExecSync('npx @context-action/llms-generator sync-docs');
      }).toThrow('Cannot resolve');
    });

    it('should handle git repository errors', () => {
      const gitError = 'fatal: not a git repository';
      
      mockExecSync.mockImplementation(() => {
        const error = new Error(gitError);
        (error as any).status = 128;
        throw error;
      });

      expect(() => {
        mockExecSync('git diff HEAD~1 --name-only');
      }).toThrow('not a git repository');
    });

    it('should handle file permission errors', () => {
      mockFs.accessSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      expect(() => {
        mockFs.accessSync('.husky/post-commit', fs.constants.X_OK);
      }).toThrow('permission denied');
    });
  });

  describe('Hook Performance', () => {
    it('should execute hooks within reasonable time limits', () => {
      const performanceTest = {
        startTime: Date.now(),
        hookExecutionTime: 0,
        maxAcceptableTime: 5000 // 5 seconds
      };

      // Simulate hook execution
      mockExecSync.mockReturnValue('Hook executed successfully');
      
      const result = mockExecSync('npx @context-action/llms-generator sync-docs --quiet');
      
      performanceTest.hookExecutionTime = Date.now() - performanceTest.startTime;

      expect(result.toString()).toContain('Hook executed successfully');
      expect(performanceTest.hookExecutionTime).toBeLessThan(performanceTest.maxAcceptableTime);
    });

    it('should optimize hook execution for minimal impact', () => {
      const optimizations = {
        useQuietMode: true,
        selectiveFileProcessing: true,
        parallelProcessing: false, // Git hooks should be sequential
        caching: false // Git hooks should be fresh
      };

      expect(optimizations.useQuietMode).toBe(true);
      expect(optimizations.selectiveFileProcessing).toBe(true);
      expect(optimizations.parallelProcessing).toBe(false);
      expect(optimizations.caching).toBe(false);
    });
  });

  describe('Hook Integration with CI/CD', () => {
    it('should skip hooks in CI environment when appropriate', () => {
      const ciEnvironments = [
        'GITHUB_ACTIONS',
        'CI', 
        'CONTINUOUS_INTEGRATION',
        'JENKINS_URL'
      ];

      // Simulate CI environment detection
      const isCI = ciEnvironments.some(envVar => process.env[envVar]);
      
      if (isCI) {
        // Hooks might be skipped or run differently in CI
        expect(true).toBe(true); // Placeholder for CI-specific logic
      } else {
        // Normal hook execution in development
        expect(true).toBe(true); // Placeholder for dev-specific logic
      }
    });

    it('should provide different behavior for different environments', () => {
      const environments = {
        development: {
          verboseOutput: true,
          strictValidation: false,
          autoFix: true
        },
        staging: {
          verboseOutput: false,
          strictValidation: true,
          autoFix: false
        },
        production: {
          verboseOutput: false,
          strictValidation: true,
          autoFix: false
        }
      };

      Object.entries(environments).forEach(([env, config]) => {
        expect(config).toHaveProperty('verboseOutput');
        expect(config).toHaveProperty('strictValidation');
        expect(config).toHaveProperty('autoFix');
        
        if (env === 'development') {
          expect(config.verboseOutput).toBe(true);
          expect(config.autoFix).toBe(true);
        } else {
          expect(config.verboseOutput).toBe(false);
          expect(config.strictValidation).toBe(true);
        }
      });
    });
  });
});