/**
 * Test Utilities
 * 
 * 테스트에서 공통으로 사용하는 유틸리티 함수들
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, rmSync } from 'fs';
import path from 'path';

export interface TestWorkspace {
  root: string;
  configFile: string;
  cleanup: () => void;
  createConfig: (config: any) => void;
  runCLI: (command: string) => string;
}

/**
 * 테스트용 작업공간 생성
 */
export function createTestWorkspace(name: string, cliPath: string): TestWorkspace {
  const root = path.join(__dirname, `${name}-workspace`);
  const configFile = path.join(root, 'llms-generator.config.json');

  return {
    root,
    configFile,
    
    cleanup: () => {
      if (existsSync(root)) {
        rmSync(root, { recursive: true, force: true });
      }
    },
    
    createConfig: (config: any) => {
      writeFileSync(configFile, JSON.stringify(config, null, 2));
    },
    
    runCLI: (command: string) => {
      return execSync(`node ${cliPath} ${command}`, { 
        encoding: 'utf-8',
        cwd: root 
      });
    }
  };
}

/**
 * 표준 테스트 설정들
 */
export const TEST_CONFIGS = {
  minimal: {
    characterLimits: [100, 500],
    languages: ['en', 'ko'],
    paths: {
      docsDir: './docs',
      dataDir: './packages/llms-generator/data',
      outputDir: './docs/llms'
    }
  },
  
  standard: {
    characterLimits: [100, 300, 1000, 2000],
    languages: ['en', 'ko'],
    paths: {
      docsDir: './docs',
      dataDir: './packages/llms-generator/data',
      outputDir: './docs/llms'
    }
  },
  
  extended: {
    characterLimits: [50, 100, 300, 500, 1000, 2000, 4000],
    languages: ['en', 'ko'],
    paths: {
      docsDir: './docs',
      dataDir: './packages/llms-generator/data',
      outputDir: './docs/llms'
    }
  },
  
  multiLanguage: {
    characterLimits: [100, 300, 1000],
    languages: ['ko', 'en', 'ja', 'zh', 'id'],
    paths: {
      docsDir: './docs',
      dataDir: './packages/llms-generator/data',
      outputDir: './docs/llms'
    }
  },
  
  customPaths: {
    characterLimits: [100, 300],
    languages: ['ko'],
    paths: {
      docsDir: './custom-docs',
      dataDir: './custom-data',
      outputDir: './custom-output'
    }
  }
};

/**
 * 잘못된 설정들 (에러 테스트용)
 */
export const INVALID_CONFIGS = {
  emptyCharLimits: {
    characterLimits: [],
    languages: ['ko'],
    paths: {}
  },
  
  duplicateCharLimits: {
    characterLimits: [100, 200, 100],
    languages: ['ko'],
    paths: {}
  },
  
  invalidCharLimits: {
    characterLimits: [0, -100, 15000],
    languages: ['ko'],
    paths: {}
  },
  
  emptyLanguages: {
    characterLimits: [100, 300],
    languages: [],
    paths: {}
  },
  
  missingCharLimits: {
    languages: ['ko'],
    paths: {}
  },
  
  missingLanguages: {
    characterLimits: [100, 300],
    paths: {}
  }
};

/**
 * CLI 출력 검증 헬퍼들
 */
export const EXPECTED_OUTPUTS = {
  configShow: {
    hasConfigFile: (output: string) => output.includes('Config file:'),
    hasProjectRoot: (output: string) => output.includes('Project root:'),
    hasPaths: (output: string) => output.includes('📁 Paths:'),
    hasCharLimits: (output: string) => output.includes('📏 Character Limits:'),
    hasLanguages: (output: string) => output.includes('🌐 Languages:')
  },
  
  configValidate: {
    isValid: (output: string) => output.includes('✅ Configuration is valid!'),
    hasErrors: (output: string) => output.includes('❌ Configuration has errors:'),
    hasSummary: (output: string) => output.includes('📊 Summary:')
  },
  
  configInit: {
    success: (output: string) => output.includes('✅ Configuration file created successfully!'),
    hasNextSteps: (output: string) => output.includes('📝 Next steps:')
  }
};

/**
 * 성능 측정 헬퍼
 */
export function measurePerformance<T>(fn: () => T): { result: T; duration: number } {
  const startTime = Date.now();
  const result = fn();
  const endTime = Date.now();
  
  return {
    result,
    duration: endTime - startTime
  };
}

/**
 * 에러 검증 헬퍼
 */
export function expectError(fn: () => void, expectedErrorMessage?: string): Error {
  let error: Error | null = null;
  
  try {
    fn();
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).not.toBeNull();
  
  if (expectedErrorMessage) {
    expect(error!.message).toContain(expectedErrorMessage);
  }
  
  return error!;
}

/**
 * 비동기 CLI 실행 헬퍼
 */
export async function runCLIAsync(command: string, cliPath: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const result = execSync(`node ${cliPath} ${command}`, {
        encoding: 'utf-8',
        cwd: cwd || process.cwd()
      });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 설정 파일 검증 헬퍼
 */
export function validateConfigStructure(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.characterLimits || !Array.isArray(config.characterLimits)) {
    errors.push('characterLimits must be an array');
  } else if (config.characterLimits.length === 0) {
    errors.push('characterLimits cannot be empty');
  }
  
  if (!config.languages || !Array.isArray(config.languages)) {
    errors.push('languages must be an array');
  } else if (config.languages.length === 0) {
    errors.push('languages cannot be empty');
  }
  
  if (config.paths && typeof config.paths !== 'object') {
    errors.push('paths must be an object');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 테스트 데이터 생성기
 */
export function generateTestData(size: 'small' | 'medium' | 'large') {
  const sizes = {
    small: { charLimits: 3, languages: 2 },
    medium: { charLimits: 10, languages: 5 },
    large: { charLimits: 50, languages: 20 }
  };
  
  const { charLimits, languages } = sizes[size];
  
  return {
    characterLimits: Array.from({ length: charLimits }, (_, i) => (i + 1) * 100),
    languages: Array.from({ length: languages }, (_, i) => `lang${i.toString().padStart(2, '0')}`),
    paths: {
      docsDir: './docs',
      dataDir: './data',
      outputDir: './output'
    }
  };
}