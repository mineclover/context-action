/**
 * ConfigManager Unit Tests
 * 
 * ConfigManager 클래스의 단위 테스트
 */

import { ConfigManager } from '../src/core/ConfigManager';
import { CHARACTER_LIMIT_PRESETS } from '../src/types/user-config';
import { TEST_CONFIGS, INVALID_CONFIGS, validateConfigStructure } from './test-utils';

describe('ConfigManager Unit Tests', () => {
  describe('🔧 설정 생성 (generateSampleConfig)', () => {
    test('모든 프리셋이 올바른 구조 생성', () => {
      const presets: Array<keyof typeof CHARACTER_LIMIT_PRESETS> = [
        'minimal', 'standard', 'extended', 'blog', 'documentation'
      ];
      
      presets.forEach(preset => {
        const config = ConfigManager.generateSampleConfig(preset);
        
        // 기본 구조 검증
        expect(config).toHaveProperty('characterLimits');
        expect(config).toHaveProperty('languages');
        expect(config).toHaveProperty('paths');
        
        // characterLimits 검증
        expect(Array.isArray(config.characterLimits)).toBe(true);
        expect(config.characterLimits.length).toBeGreaterThan(0);
        expect(config.characterLimits.every(limit => limit > 0)).toBe(true);
        
        // 중복 제거 검증
        const uniqueLimits = [...new Set(config.characterLimits)];
        expect(uniqueLimits.length).toBe(config.characterLimits.length);
        
        // 정렬 검증
        const sortedLimits = [...config.characterLimits].sort((a, b) => a - b);
        expect(config.characterLimits).toEqual(sortedLimits);
        
        // languages 검증
        expect(Array.isArray(config.languages)).toBe(true);
        expect(config.languages.length).toBeGreaterThan(0);
        expect(config.languages).toContain('en');
        expect(config.languages).toContain('ko');
        
        // paths 검증
        expect(config.paths).toHaveProperty('docsDir');
        expect(config.paths).toHaveProperty('dataDir');
        expect(config.paths).toHaveProperty('outputDir');
      });
    });

    test('프리셋별 특성 검증', () => {
      // minimal: 가장 적은 수의 제한
      const minimal = ConfigManager.generateSampleConfig('minimal');
      expect(minimal.characterLimits).toEqual([100, 500]);
      
      // standard: 균형잡힌 구성
      const standard = ConfigManager.generateSampleConfig('standard');
      expect(standard.characterLimits).toEqual([100, 300, 1000, 2000]);
      
      // extended: 가장 많은 수의 제한
      const extended = ConfigManager.generateSampleConfig('extended');
      expect(extended.characterLimits).toEqual([50, 100, 300, 500, 1000, 2000, 4000]);
      expect(extended.characterLimits.length).toBeGreaterThanOrEqual(5);
      
      // blog: 블로그 특화
      const blog = ConfigManager.generateSampleConfig('blog');
      expect(blog.characterLimits).toEqual([200, 500, 1500]);
      
      // documentation: 문서 특화
      const documentation = ConfigManager.generateSampleConfig('documentation');
      expect(documentation.characterLimits).toEqual([150, 400, 1000]);
    });
  });

  describe('✅ 설정 검증 (validateConfig)', () => {
    test('유효한 설정들 통과', () => {
      Object.entries(TEST_CONFIGS).forEach(([name, config]) => {
        const result = ConfigManager.validateConfig(config as any);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    test('잘못된 설정들 검출', () => {
      Object.entries(INVALID_CONFIGS).forEach(([name, config]) => {
        const result = ConfigManager.validateConfig(config as any);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('특정 에러 메시지 검증', () => {
      // 빈 characterLimits
      const emptyLimits = ConfigManager.validateConfig(INVALID_CONFIGS.emptyCharLimits as any);
      expect(emptyLimits.errors).toContain('At least one character limit must be defined');
      
      // 중복된 characterLimits
      const duplicateLimits = ConfigManager.validateConfig(INVALID_CONFIGS.duplicateCharLimits as any);
      expect(duplicateLimits.errors.some(error => error.includes('duplicate'))).toBe(true);
      
      // 잘못된 범위의 characterLimits
      const invalidLimits = ConfigManager.validateConfig(INVALID_CONFIGS.invalidCharLimits as any);
      expect(invalidLimits.errors.some(error => error.includes('must be greater than 0') || error.includes('max: 10000'))).toBe(true);
      
      // 빈 languages
      const emptyLanguages = ConfigManager.validateConfig(INVALID_CONFIGS.emptyLanguages as any);
      expect(emptyLanguages.errors).toContain('At least one language must be defined');
    });
  });

  describe('🎯 활성화된 글자 수 제한 (getEnabledCharacterLimits)', () => {
    test('모든 글자 수 제한이 활성화됨', () => {
      const config = {
        ...TEST_CONFIGS.standard,
        resolvedPaths: {
          projectRoot: '/test',
          configFile: '/test/config.json',
          docsDir: '/test/docs',
          dataDir: '/test/data',
          outputDir: '/test/output'
        }
      };
      
      const enabledLimits = ConfigManager.getEnabledCharacterLimits(config as any);
      expect(enabledLimits).toEqual(config.characterLimits);
    });

    test('정렬된 순서로 반환', () => {
      const config = {
        characterLimits: [1000, 100, 500, 300], // 의도적으로 섞인 순서
        languages: ['ko'],
        paths: {},
        resolvedPaths: {
          projectRoot: '/test',
          configFile: '/test/config.json',
          docsDir: '/test/docs',
          dataDir: '/test/data',
          outputDir: '/test/output'
        }
      };
      
      const enabledLimits = ConfigManager.getEnabledCharacterLimits(config as any);
      expect(enabledLimits).toEqual([100, 300, 500, 1000]);
    });
  });

  describe('🔄 설정 병합 (mergeWithDefaults)', () => {
    test('부분적 설정과 기본값 병합', () => {
      const partialConfig = {
        characterLimits: [150, 350]
        // languages와 paths 생략
      };
      
      const merged = ConfigManager.mergeWithDefaults(partialConfig as any);
      
      // 제공된 값 사용
      expect(merged.characterLimits).toEqual([150, 350]);
      
      // 기본값 사용
      expect(merged.languages).toEqual(['en', 'ko']);
      expect(merged.paths).toHaveProperty('docsDir');
      expect(merged.paths).toHaveProperty('dataDir');
      expect(merged.paths).toHaveProperty('outputDir');
    });

    test('빈 객체에 대한 기본값 적용', () => {
      const merged = ConfigManager.mergeWithDefaults({} as any);
      
      expect(merged.characterLimits).toEqual([100, 300, 1000, 2000]);
      expect(merged.languages).toEqual(['en', 'ko']);
      expect(merged.paths).toBeDefined();
    });

    test('중첩된 paths 객체 병합', () => {
      const partialConfig = {
        characterLimits: [100],
        languages: ['ko'],
        paths: {
          docsDir: './custom-docs'
          // dataDir와 outputDir 생략
        }
      };
      
      const merged = ConfigManager.mergeWithDefaults(partialConfig as any);
      
      expect(merged.paths.docsDir).toBe('./custom-docs');
      expect(merged.paths.dataDir).toBeDefined();
      expect(merged.paths.outputDir).toBeDefined();
    });
  });

  describe('📊 성능 테스트', () => {
    test('대용량 설정 처리 성능', () => {
      const largeConfig = {
        characterLimits: Array.from({ length: 100 }, (_, i) => i + 1),
        languages: Array.from({ length: 50 }, (_, i) => `lang${i}`),
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        }
      };
      
      const startTime = Date.now();
      const result = ConfigManager.validateConfig(largeConfig as any);
      const endTime = Date.now();
      
      expect(result.valid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // 100ms 이내
    });

    test('복잡한 설정 병합 성능', () => {
      const complexConfig = {
        characterLimits: Array.from({ length: 20 }, (_, i) => (i + 1) * 50),
        languages: ['ko', 'en', 'ja', 'zh', 'id', 'fr', 'de', 'es'],
        paths: {
          docsDir: './docs',
          dataDir: './data',
          outputDir: './output'
        }
      };
      
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        ConfigManager.mergeWithDefaults(complexConfig as any);
      }
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // 100회 실행이 100ms 이내
    });
  });

  describe('🔒 타입 안정성 테스트', () => {
    test('null/undefined 처리', () => {
      expect(() => ConfigManager.validateConfig(null as any)).not.toThrow();
      expect(() => ConfigManager.validateConfig(undefined as any)).not.toThrow();
      
      const nullResult = ConfigManager.validateConfig(null as any);
      expect(nullResult.valid).toBe(false);
      expect(nullResult.errors.length).toBeGreaterThan(0);
    });

    test('잘못된 타입 처리', () => {
      const invalidTypes = [
        { characterLimits: 'not-array', languages: ['ko'], paths: {} },
        { characterLimits: [100], languages: 'not-array', paths: {} },
        { characterLimits: [100], languages: ['ko'], paths: 'not-object' }
      ];
      
      invalidTypes.forEach(config => {
        const result = ConfigManager.validateConfig(config as any);
        expect(result.valid).toBe(false);
      });
    });

    test('깊은 중첩 객체 처리', () => {
      const deeplyNested = {
        characterLimits: [100],
        languages: ['ko'],
        paths: {
          docsDir: './docs',
          nested: {
            deep: {
              value: 'should-be-ignored'
            }
          }
        }
      };
      
      // 예상치 못한 중첩 속성이 있어도 에러가 발생하지 않아야 함
      expect(() => ConfigManager.validateConfig(deeplyNested as any)).not.toThrow();
    });
  });
});