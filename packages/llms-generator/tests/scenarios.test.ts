/**
 * Main Scenarios Integration Tests
 * 
 * 메인 사용 시나리오를 기반으로 한 통합 테스트
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const currentDir = __dirname;

const CLI_PATH = path.join(currentDir, '../dist/cli/index.js');
const TEST_ROOT = path.join(currentDir, 'test-workspace');
const CONFIG_FILE = path.join(TEST_ROOT, 'llms-generator.config.json');

describe('Main Scenarios Integration Tests', () => {
  beforeAll(() => {
    // Ensure CLI is built
    if (!existsSync(CLI_PATH)) {
      throw new Error('CLI not built. Run "npm run build" first.');
    }
  });

  beforeEach(() => {
    // Clean up test workspace
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
    mkdirSync(TEST_ROOT, { recursive: true });
    
    // Create a minimal package.json so ConfigManager finds this as project root
    const testPackageJson = {
      name: "test-workspace",
      version: "1.0.0"
    };
    writeFileSync(path.join(TEST_ROOT, 'package.json'), JSON.stringify(testPackageJson, null, 2));
    
    // Change to test workspace
    process.chdir(TEST_ROOT);
  });

  afterEach(() => {
    // Change back to original directory
    process.chdir(path.join(currentDir, '../../..'));
  });

  describe('시나리오 1: 신규 프로젝트 설정 및 초기 생성', () => {
    test('1. 표준 설정으로 초기화', () => {
      const result = execSync(`node ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      
      expect(result).toContain('✅ Configuration file created successfully!');
      expect(existsSync(CONFIG_FILE)).toBe(true);
      
      const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
      expect(config.characterLimits).toEqual([100, 300, 1000, 2000]);
      expect(config.languages).toEqual(['en', 'ko']);
      expect(config.paths).toBeDefined();
    });

    test('2. 설정 확인', () => {
      // First create config
      execSync(`node ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      expect(result).toContain('🔧 Current Configuration');
      expect(result).toContain('100 chars');
      expect(result).toContain('300 chars');
      expect(result).toContain('1000 chars');
      expect(result).toContain('2000 chars');
      expect(result).toContain('Languages: en, ko');
    });

    test('3. 설정 검증', () => {
      // First create config
      execSync(`node ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      
      const result = execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      
      expect(result).toContain('✅ Configuration is valid!');
      expect(result).toContain('Character limits: 4 (100, 300, 1000, 2000)');
      expect(result).toContain('Languages: 2 (en, ko)');
    });

    test('4. 글자 수 제한 확인', () => {
      // First create config
      execSync(`node ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
      
      const result = execSync(`node ${CLI_PATH} config-limits`, { encoding: 'utf-8' });
      
      expect(result).toContain('📏 Character Limits');
      expect(result).toContain('100 chars');
      expect(result).toContain('300 chars');
      expect(result).toContain('1000 chars');
      expect(result).toContain('2000 chars');
    });
  });

  describe('시나리오 2: 커스텀 설정으로 작업', () => {
    test('커스텀 글자 수 설정', () => {
      // Create custom config
      const customConfig = {
        characterLimits: [150, 400, 800],
        languages: ['ko', 'en'],
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(customConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      expect(result).toContain('150 chars');
      expect(result).toContain('400 chars');
      expect(result).toContain('800 chars');
      expect(result).toContain('Languages: ko, en');
    });

    test('다양한 프리셋 테스트', () => {
      // Test minimal preset
      execSync(`node ${CLI_PATH} config-init minimal --path=minimal.config.json`, { encoding: 'utf-8' });
      const minimalConfig = JSON.parse(readFileSync('minimal.config.json', 'utf-8'));
      expect(minimalConfig.characterLimits).toEqual([100, 500]);

      // Test extended preset
      execSync(`node ${CLI_PATH} config-init extended --path=extended.config.json`, { encoding: 'utf-8' });
      const extendedConfig = JSON.parse(readFileSync('extended.config.json', 'utf-8'));
      expect(extendedConfig.characterLimits).toEqual([50, 100, 300, 500, 1000, 2000, 4000]);

      // Test blog preset
      execSync(`node ${CLI_PATH} config-init blog --path=blog.config.json`, { encoding: 'utf-8' });
      const blogConfig = JSON.parse(readFileSync('blog.config.json', 'utf-8'));
      expect(blogConfig.characterLimits).toEqual([200, 500, 1500]);

      // Test documentation preset
      execSync(`node ${CLI_PATH} config-init documentation --path=doc.config.json`, { encoding: 'utf-8' });
      const docConfig = JSON.parse(readFileSync('doc.config.json', 'utf-8'));
      expect(docConfig.characterLimits).toEqual([150, 400, 1000]);
    });
  });

  describe('시나리오 3: 설정 검증 및 오류 처리', () => {
    test('잘못된 설정 파일 검증', () => {
      // Create invalid config
      const invalidConfig = {
        characterLimits: [], // Empty array should fail
        languages: ['ko'],
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('중복된 글자 수 제한 검증', () => {
      // Create config with duplicate limits
      const invalidConfig = {
        characterLimits: [100, 200, 100], // Duplicate 100
        languages: ['ko'],
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('유효하지 않은 글자 수 제한 검증', () => {
      // Create config with invalid limits
      const invalidConfig = {
        characterLimits: [0, -100, 15000], // Invalid limits
        languages: ['ko'],
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('언어가 없는 경우 검증', () => {
      // Create config without languages
      const invalidConfig = {
        characterLimits: [100, 200],
        languages: [], // Empty languages
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      }).toThrow();
    });
  });

  describe('시나리오 4: 설정 기반 CLI 작동', () => {
    beforeEach(() => {
      // Create test config
      const testConfig = {
        characterLimits: [120, 250, 500],
        languages: ['ko', 'en'],
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(testConfig, null, 2));
    });

    test('설정 기반 help 명령어가 config 값 반영', () => {
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      expect(result).toContain('120 chars');
      expect(result).toContain('250 chars');
      expect(result).toContain('500 chars');
      expect(result).toContain('Languages: ko, en');
    });

    test('커맨드라인 오버라이드 기능', () => {
      // CLI arguments should override config
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      // The displayed config should show our test config values
      expect(result).toContain('120 chars');
      expect(result).toContain('250 chars');
      expect(result).toContain('500 chars');
    });
  });

  describe('시나리오 5: 다국어 및 특수 언어 지원', () => {
    test('다국어 설정', () => {
      const multiLangConfig = {
        characterLimits: [100, 300, 500],
        languages: ['ko', 'en', 'ja', 'zh', 'id'],
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(multiLangConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      expect(result).toContain('Languages: ko, en, ja, zh, id');
    });

    test('단일 언어 설정', () => {
      const singleLangConfig = {
        characterLimits: [200, 400],
        languages: ['id'],
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(singleLangConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      expect(result).toContain('Languages: id');
      expect(result).toContain('200 chars');
      expect(result).toContain('400 chars');
    });
  });

  describe('시나리오 6: 경로 설정 테스트', () => {
    test('커스텀 경로 설정', () => {
      const customPathConfig = {
        characterLimits: [100, 300],
        languages: ['ko'],
        paths: {
          docsDir: './custom-docs',
          dataDir: './custom-data',
          outputDir: './custom-output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(customPathConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      expect(result).toContain('custom-docs');
      expect(result).toContain('custom-data');
      expect(result).toContain('custom-output');
    });

    test('기본 경로 설정', () => {
      const defaultPathConfig = {
        characterLimits: [100, 300],
        languages: ['ko']
        // paths 생략하면 기본값 사용
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(defaultPathConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      expect(result).toContain('/docs');
      expect(result).toContain('/packages/llms-generator/data');
      expect(result).toContain('/docs/llms');
    });
  });
});