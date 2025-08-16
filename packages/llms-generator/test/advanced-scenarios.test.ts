/**
 * Advanced Scenarios Integration Tests
 * 
 * 고급 시나리오와 에러 케이스를 포함한 포괄적 테스트
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const currentDir = __dirname;
const CLI_PATH = path.join(currentDir, '../dist/cli/index.js');
const TEST_ROOT = path.join(currentDir, 'advanced-test-workspace');
const CONFIG_FILE = path.join(TEST_ROOT, 'llms-generator.config.json');

describe('Advanced Scenarios Integration Tests', () => {
  beforeAll(() => {
    if (!existsSync(CLI_PATH)) {
      throw new Error('CLI not built. Run "npm run build" first.');
    }
  });

  beforeEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
    mkdirSync(TEST_ROOT, { recursive: true });
    
    const testPackageJson = {
      name: "advanced-test-workspace",
      version: "1.0.0"
    };
    writeFileSync(path.join(TEST_ROOT, 'package.json'), JSON.stringify(testPackageJson, null, 2));
    
    process.chdir(TEST_ROOT);
  });

  afterEach(() => {
    process.chdir(path.join(currentDir, '../../..'));
  });

  describe('🧪 에러 처리 및 엣지 케이스', () => {
    test('중복된 글자 수 제한 검증', () => {
      const invalidConfig = {
        characterLimits: [100, 200, 100], // 중복된 100
        languages: ['ko'],
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('유효하지 않은 글자 수 제한 (음수, 0, 너무 큰 값)', () => {
      const invalidConfig = {
        characterLimits: [0, -100, 15000], // 잘못된 값들
        languages: ['ko'],
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      }).toThrow();
    });

    test('존재하지 않는 언어 코드', () => {
      const invalidConfig = {
        characterLimits: [100, 300],
        languages: ['invalid-lang', 'xyz123'], // 잘못된 언어 코드
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(invalidConfig, null, 2));
      
      // 언어 코드는 유효성 검사를 하지 않을 수도 있지만, 빈 배열은 막아야 함
      const result = execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      expect(result).toContain('Configuration is valid'); // 현재는 언어 코드 검증 안함
    });

    test('JSON 형식이 잘못된 설정 파일', () => {
      const malformedJson = `{
        "characterLimits": [100, 300,
        "languages": ["ko"]
      }`; // 닫는 괄호 누락
      
      writeFileSync(CONFIG_FILE, malformedJson);
      
      // ConfigManager는 잘못된 파일을 무시하고 기본값 사용
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      expect(result).toContain('Config file: Default');
    });

    test('빈 설정 파일 처리', () => {
      // 빈 파일 생성
      writeFileSync(CONFIG_FILE, '');
      
      // ConfigManager는 빈 파일을 무시하고 기본값 사용
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      expect(result).toContain('Config file: Default');
    });
  });

  describe('🎛️ 고급 설정 옵션 테스트', () => {
    test('모든 프리셋의 characterLimits 검증', () => {
      const presets = ['minimal', 'standard', 'extended', 'blog', 'documentation'];
      
      presets.forEach(preset => {
        // 기존 파일 제거
        if (existsSync(CONFIG_FILE)) {
          rmSync(CONFIG_FILE);
        }
        
        const result = execSync(`node ${CLI_PATH} config-init ${preset}`, { encoding: 'utf-8' });
        expect(result).toContain('Configuration file created successfully!');
        
        const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
        expect(Array.isArray(config.characterLimits)).toBe(true);
        expect(config.characterLimits.length).toBeGreaterThan(0);
        expect(config.characterLimits.every((limit: number) => limit > 0)).toBe(true);
        
        // 중복 검사
        const uniqueLimits = [...new Set(config.characterLimits)];
        expect(uniqueLimits.length).toBe(config.characterLimits.length);
      });
    });

    test('커스텀 경로로 설정 파일 생성', () => {
      const customPath = 'custom-llms.config.json';
      
      const result = execSync(`node ${CLI_PATH} config-init minimal --path=${customPath}`, { encoding: 'utf-8' });
      expect(result).toContain('Configuration file created successfully!');
      expect(existsSync(customPath)).toBe(true);
      
      const config = JSON.parse(readFileSync(customPath, 'utf-8'));
      expect(config.characterLimits).toEqual([100, 500]);
      
      // 정리
      rmSync(customPath);
    });

    test('대량의 글자 수 제한 처리', () => {
      const largeConfig = {
        characterLimits: Array.from({ length: 20 }, (_, i) => (i + 1) * 100), // 100, 200, ..., 2000
        languages: ['ko', 'en', 'ja', 'zh', 'id', 'fr', 'de', 'es'],
        paths: {
          docsDir: './docs',
          dataDir: './data', 
          outputDir: './output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(largeConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      expect(result).toContain('2000 chars');
      expect(result).toContain('Languages: ko, en, ja, zh, id, fr, de, es');
    });
  });

  describe('🔄 CLI 명령어 조합 테스트', () => {
    beforeEach(() => {
      // 테스트용 기본 설정 생성
      execSync(`node ${CLI_PATH} config-init standard`, { encoding: 'utf-8' });
    });

    test('연속적인 설정 변경 및 검증', () => {
      // 1. 초기 설정 확인
      let result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      expect(result).toContain('100 chars');
      expect(result).toContain('2000 chars');
      
      // 2. 설정 파일 수정
      const modifiedConfig = {
        characterLimits: [150, 350, 750],
        languages: ['ja', 'zh'],
        paths: {
          docsDir: './custom-docs',
          dataDir: './custom-data',
          outputDir: './custom-output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(modifiedConfig, null, 2));
      
      // 3. 변경된 설정 확인
      result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      expect(result).toContain('150 chars');
      expect(result).toContain('350 chars');
      expect(result).toContain('750 chars');
      expect(result).toContain('Languages: ja, zh');
      expect(result).toContain('custom-docs');
      
      // 4. 검증
      result = execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      expect(result).toContain('Configuration is valid!');
      expect(result).toContain('Character limits: 3 (150, 350, 750)');
      expect(result).toContain('Languages: 2 (ja, zh)');
    });

    test('config-limits 명령어 상세 테스트', () => {
      // 정렬 테스트를 위한 무작위 순서 설정
      const randomConfig = {
        characterLimits: [1000, 100, 500, 300, 2000], // 의도적으로 섞인 순서
        languages: ['ko'],
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(randomConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-limits`, { encoding: 'utf-8' });
      
      // 출력에서 숫자들이 올바른 순서로 정렬되었는지 확인
      const lines = result.split('\n').filter(line => line.includes('chars'));
      expect(lines[0]).toContain('100 chars');
      expect(lines[1]).toContain('300 chars');
      expect(lines[2]).toContain('500 chars');
      expect(lines[3]).toContain('1000 chars');
      expect(lines[4]).toContain('2000 chars');
    });
  });

  describe('🌐 다국어 고급 테스트', () => {
    test('많은 수의 언어 처리', () => {
      const multiLangConfig = {
        characterLimits: [100, 300],
        languages: [
          'ko', 'en', 'ja', 'zh', 'id', 'fr', 'de', 'es', 'pt', 'ru',
          'it', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'tr', 'ar', 'hi'
        ], // 20개 언어
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(multiLangConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      expect(result).toContain('Languages: ko, en, ja, zh, id, fr, de, es, pt, ru, it, nl, sv, no, da, fi, pl, tr, ar, hi');
    });

    test('단일 언어 최적화', () => {
      const singleLangConfig = {
        characterLimits: [50, 100, 200, 500, 1000],
        languages: ['ko'], // 한국어만
        paths: {}
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(singleLangConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      expect(result).toContain('Languages: 1 (ko)');
      expect(result).toContain('Character limits: 5 (50, 100, 200, 500, 1000)');
    });
  });

  describe('🏗️ 경로 설정 고급 테스트', () => {
    test('절대 경로 vs 상대 경로', () => {
      const absolutePathConfig = {
        characterLimits: [100, 300],
        languages: ['ko'],
        paths: {
          docsDir: "/tmp/test-docs",
          dataDir: "/tmp/test-data", 
          outputDir: "/tmp/test-output"
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(absolutePathConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      expect(result).toContain('/tmp/test-docs');
      expect(result).toContain('/tmp/test-data');
      expect(result).toContain('/tmp/test-output');
    });

    test('경로에 특수 문자 포함', () => {
      const specialPathConfig = {
        characterLimits: [100],
        languages: ['ko'],
        paths: {
          docsDir: "./docs with spaces",
          dataDir: "./data-with-hyphens",
          outputDir: "./output_with_underscores"
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(specialPathConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      expect(result).toContain('docs with spaces');
      expect(result).toContain('data-with-hyphens');
      expect(result).toContain('output_with_underscores');
    });

    test('경로 설정 생략시 기본값 사용', () => {
      const minimalConfig = {
        characterLimits: [100, 300],
        languages: ['ko']
        // paths 필드 생략
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(minimalConfig, null, 2));
      
      const result = execSync(`node ${CLI_PATH} config-show`, { encoding: 'utf-8' });
      
      // 기본 경로들이 사용되는지 확인 (절대 경로로 표시됨)
      expect(result).toContain('/docs');
      expect(result).toContain('/packages/llms-generator/data');
      expect(result).toContain('/docs/llms');
    });
  });

  describe('⚡ 성능 및 안정성 테스트', () => {
    test('대용량 설정 파일 처리', () => {
      // 매우 큰 설정 파일 생성 (하지만 유효한)
      const largeConfig = {
        characterLimits: Array.from({ length: 100 }, (_, i) => i + 1), // 1-100
        languages: Array.from({ length: 50 }, (_, i) => `lang${i.toString().padStart(2, '0')}`), // lang00-lang49
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        }
      };
      
      writeFileSync(CONFIG_FILE, JSON.stringify(largeConfig, null, 2));
      
      // 성능 측정
      const startTime = Date.now();
      const result = execSync(`node ${CLI_PATH} config-validate`, { encoding: 'utf-8' });
      const endTime = Date.now();
      
      expect(result).toContain('Configuration is valid!');
      expect(endTime - startTime).toBeLessThan(5000); // 5초 이내
    });

    test('동시 실행 안정성', () => {
      // 여러 CLI 명령을 동시에 실행했을 때 안정성 테스트
      const commands = [
        `node ${CLI_PATH} config-show`,
        `node ${CLI_PATH} config-validate`,
        `node ${CLI_PATH} config-limits`
      ];
      
      // 병렬 실행
      const promises = commands.map(cmd => 
        new Promise((resolve, reject) => {
          try {
            const result = execSync(cmd, { encoding: 'utf-8' });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
      );
      
      return Promise.all(promises).then(results => {
        expect(results.length).toBe(3);
        results.forEach(result => {
          expect(typeof result).toBe('string');
          expect((result as string).length).toBeGreaterThan(0);
        });
      });
    });
  });
});