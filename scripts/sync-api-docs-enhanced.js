#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================
// 설정 (Configuration)
// =============================
const CONFIG = {
  sourceDir: './docs/api/generated',
  targetDir: './docs/en/api',
  sidebarConfigPath: './docs/.vitepress/config/api-spec.ts',
  cache: {
    enabled: true,
    dir: './.api-docs-cache',
    hashAlgorithm: 'sha256',
    ttl: 24 * 60 * 60 * 1000, // 24시간
    manifestFile: '.api-docs-cache/cache-manifest.json'
  },
  parallel: {
    enabled: true,
    maxWorkers: 4,
    batchSize: 10
  },
  quality: {
    validateLinks: true,
    validateMarkdown: true,
    checkAccessibility: true
  },
  metrics: {
    enabled: true,
    outputFile: './reports/api-docs-metrics.json'
  }
};

// 패키지 매핑
const PACKAGE_MAPPING = {
  'core': 'core',
  'react': 'react', 
  'jotai': 'jotai',
  'logger': 'logger'
};

// =============================
// 캐싱 시스템 (Caching System)
// =============================
class CacheManager {
  constructor(config) {
    this.config = config;
    this.manifest = {};
    this.stats = {
      hits: 0,
      misses: 0,
      expired: 0
    };
  }

  async initialize() {
    if (!this.config.enabled) return;
    
    // 캐시 디렉토리 생성
    if (!fs.existsSync(this.config.dir)) {
      fs.mkdirSync(this.config.dir, { recursive: true });
      console.log(`📁 캐시 디렉토리 생성: ${this.config.dir}`);
    }

    // 매니페스트 파일 로드
    if (fs.existsSync(this.config.manifestFile)) {
      try {
        const data = fs.readFileSync(this.config.manifestFile, 'utf8');
        this.manifest = JSON.parse(data);
        console.log(`📋 캐시 매니페스트 로드됨: ${Object.keys(this.manifest).length}개 항목`);
      } catch (error) {
        console.warn(`⚠️ 캐시 매니페스트 로드 실패, 새로 시작합니다.`);
        this.manifest = {};
      }
    }

    // 만료된 캐시 정리
    this.cleanExpiredCache();
  }

  getFileHash(filePath) {
    if (!fs.existsSync(filePath)) return null;
    
    const content = fs.readFileSync(filePath);
    return crypto
      .createHash(this.config.hashAlgorithm)
      .update(content)
      .digest('hex');
  }

  getCacheKey(sourcePath, targetPath) {
    return `${sourcePath}:${targetPath}`;
  }

  shouldProcess(sourcePath, targetPath) {
    if (!this.config.enabled) {
      this.stats.misses++;
      return true;
    }

    const cacheKey = this.getCacheKey(sourcePath, targetPath);
    const sourceHash = this.getFileHash(sourcePath);
    
    if (!sourceHash) {
      this.stats.misses++;
      return true;
    }

    const cacheEntry = this.manifest[cacheKey];
    
    // 캐시 엔트리가 없는 경우
    if (!cacheEntry) {
      this.stats.misses++;
      return true;
    }

    // TTL 체크
    const now = Date.now();
    if (now - cacheEntry.timestamp > this.config.ttl) {
      this.stats.expired++;
      delete this.manifest[cacheKey];
      return true;
    }

    // 해시 비교
    if (cacheEntry.sourceHash !== sourceHash) {
      this.stats.misses++;
      return true;
    }

    // 타겟 파일이 존재하고 해시가 일치하는 경우
    if (fs.existsSync(targetPath)) {
      const targetHash = this.getFileHash(targetPath);
      if (targetHash === cacheEntry.targetHash) {
        this.stats.hits++;
        return false; // 처리 불필요
      }
    }

    this.stats.misses++;
    return true;
  }

  updateCache(sourcePath, targetPath) {
    if (!this.config.enabled) return;

    const cacheKey = this.getCacheKey(sourcePath, targetPath);
    const sourceHash = this.getFileHash(sourcePath);
    const targetHash = this.getFileHash(targetPath);

    this.manifest[cacheKey] = {
      sourceHash,
      targetHash,
      timestamp: Date.now(),
      sourcePath,
      targetPath
    };
  }

  cleanExpiredCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of Object.entries(this.manifest)) {
      if (now - entry.timestamp > this.config.ttl) {
        delete this.manifest[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 만료된 캐시 ${cleaned}개 항목 정리됨`);
    }
  }

  saveManifest() {
    if (!this.config.enabled) return;

    try {
      fs.writeFileSync(
        this.config.manifestFile,
        JSON.stringify(this.manifest, null, 2)
      );
      console.log(`💾 캐시 매니페스트 저장됨: ${Object.keys(this.manifest).length}개 항목`);
    } catch (error) {
      console.error(`❌ 캐시 매니페스트 저장 실패:`, error.message);
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: `${hitRate}%`
    };
  }
}

// =============================
// 에러 처리 시스템 (Error Handling)
// =============================
class ErrorHandler {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  handleError(error, context) {
    const errorInfo = {
      message: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    this.errors.push(errorInfo);

    // 에러 타입별 복구 전략
    const recovery = this.getRecoveryStrategy(error.code);
    if (recovery) {
      console.log(`🔧 복구 시도: ${recovery.message}`);
      return recovery.action();
    }

    console.error(`❌ ${context}: ${error.message}`);
    return null;
  }

  getRecoveryStrategy(errorCode) {
    const strategies = {
      'ENOENT': {
        message: '파일/디렉토리를 찾을 수 없음',
        action: () => null // 스킵
      },
      'EACCES': {
        message: '권한 부족',
        action: () => {
          console.log('💡 팁: sudo 권한으로 실행하거나 파일 권한을 확인하세요.');
          return null;
        }
      },
      'ENOSPC': {
        message: '디스크 공간 부족',
        action: () => {
          console.log('💡 팁: 디스크 공간을 확보한 후 다시 시도하세요.');
          process.exit(1);
        }
      }
    };

    return strategies[errorCode];
  }

  addWarning(message, context) {
    this.warnings.push({
      message,
      context,
      timestamp: new Date().toISOString()
    });
    console.warn(`⚠️ ${context}: ${message}`);
  }

  getSummary() {
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
      details: {
        errors: this.errors,
        warnings: this.warnings
      }
    };
  }
}

// =============================
// 품질 검증 시스템 (Quality Validation)
// =============================
class QualityValidator {
  constructor(config) {
    this.config = config;
    this.issues = [];
  }

  async validateFile(filePath) {
    const results = [];

    if (this.config.validateMarkdown) {
      results.push(await this.validateMarkdown(filePath));
    }

    if (this.config.validateLinks) {
      results.push(await this.validateLinks(filePath));
    }

    if (this.config.checkAccessibility) {
      results.push(await this.checkAccessibility(filePath));
    }

    return results.filter(r => r !== null);
  }

  async validateMarkdown(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const issues = [];

      // 기본 마크다운 검증
      if (content.includes('undefined')) {
        issues.push('Contains "undefined" - possible template error');
      }

      if (content.match(/\[.*?\]\(\s*\)/g)) {
        issues.push('Empty link found');
      }

      if (content.match(/```[\s\S]*?```/g)?.some(block => !block.includes('\n'))) {
        issues.push('Code block without content');
      }

      if (issues.length > 0) {
        this.issues.push({ file: filePath, issues });
        return { file: filePath, issues };
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  async validateLinks(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const issues = [];
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        const linkPath = match[2];
        
        // 내부 링크 검증
        if (linkPath.startsWith('/') || linkPath.startsWith('./')) {
          const absolutePath = path.resolve(path.dirname(filePath), linkPath);
          if (!fs.existsSync(absolutePath) && !linkPath.includes('#')) {
            issues.push(`Broken link: ${linkPath}`);
          }
        }
      }

      if (issues.length > 0) {
        this.issues.push({ file: filePath, issues });
        return { file: filePath, issues };
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  async checkAccessibility(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const issues = [];

      // 이미지 alt 텍스트 체크
      const imgRegex = /!\[([^\]]*)\]/g;
      let match;

      while ((match = imgRegex.exec(content)) !== null) {
        if (!match[1] || match[1].trim() === '') {
          issues.push('Image without alt text');
        }
      }

      // 제목 계층 구조 체크
      const headings = content.match(/^#{1,6} .+$/gm) || [];
      let prevLevel = 0;

      for (const heading of headings) {
        const level = heading.match(/^#+/)[0].length;
        if (level > prevLevel + 1 && prevLevel !== 0) {
          issues.push(`Heading level skip: H${prevLevel} to H${level}`);
        }
        prevLevel = level;
      }

      if (issues.length > 0) {
        this.issues.push({ file: filePath, issues });
        return { file: filePath, issues };
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  getSummary() {
    return {
      totalIssues: this.issues.length,
      files: this.issues
    };
  }
}

// =============================
// 메트릭스 수집기 (Metrics Collector)
// =============================
class MetricsCollector {
  constructor(config) {
    this.config = config;
    this.startTime = Date.now();
    this.metrics = {
      filesProcessed: 0,
      filesSkipped: 0,
      errors: 0,
      warnings: 0,
      totalSize: 0,
      processingTime: 0
    };
  }

  recordFile(filePath, skipped = false) {
    if (skipped) {
      this.metrics.filesSkipped++;
    } else {
      this.metrics.filesProcessed++;
      try {
        const stats = fs.statSync(filePath);
        this.metrics.totalSize += stats.size;
      } catch {}
    }
  }

  recordError() {
    this.metrics.errors++;
  }

  recordWarning() {
    this.metrics.warnings++;
  }

  finalize(cacheStats, qualityStats, errorStats) {
    this.metrics.processingTime = Date.now() - this.startTime;
    this.metrics.cache = cacheStats;
    this.metrics.quality = qualityStats;
    this.metrics.errors = errorStats.errors;
    this.metrics.warnings = errorStats.warnings;

    return this.metrics;
  }

  save() {
    if (!this.config.enabled) return;

    try {
      const reportDir = path.dirname(this.config.outputFile);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      fs.writeFileSync(
        this.config.outputFile,
        JSON.stringify(this.metrics, null, 2)
      );
      console.log(`📊 메트릭스 저장됨: ${this.config.outputFile}`);
    } catch (error) {
      console.error(`❌ 메트릭스 저장 실패:`, error.message);
    }
  }
}

// =============================
// 유틸리티 함수들 (Utility Functions)
// =============================

/**
 * 디렉토리가 존재하는지 확인하고 없으면 생성
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 디렉토리 생성: ${dirPath}`);
  }
}

/**
 * 마크다운 파일의 Vue 호환성을 위한 후처리
 */
function postProcessMarkdown(content) {
  // Vue 컴파일러가 HTML 태그로 인식하는 패턴들을 완전히 제거
  return content
    // 제네릭 타입 파라미터 \<T\> -> &lt;T&gt;
    .replace(/\\<`([A-Z])`\\>/g, '&lt;`$1`&gt;')
    // 다른 제네릭 패턴들도 처리
    .replace(/\\<`([A-Z][A-Za-z0-9]*)`\\>/g, '&lt;`$1`&gt;')
    // 복잡한 제네릭 타입도 처리 (예: \<T, K\>)
    .replace(/\\<`([^`]+)`\\>/g, '&lt;`$1`&gt;')
    // Vue가 문제를 일으키는 일반적인 제네릭 타입 패턴들 처리
    .replace(/([A-Za-z]+)<([A-Z])>/g, '$1&lt;$2&gt;')
    // Vue가 문제를 일으키는 단일 타입 파라미터 헤더들을 안전한 형태로 변경
    .replace(/^### ([A-Z])$/gm, '### Generic type $1')
    // 백틱이 있는 단일 대문자를 완전히 안전한 형태로 변경
    .replace(/Type parameter `([A-Z])`/g, 'Type parameter **$1**')
    // 단일 줄에 단일 대문자만 있는 경우 (예: `T`)
    .replace(/^`([A-Z])`$/gm, 'Type parameter **$1**')
    // 단일 줄에 제네릭 타입만 있는 경우 (예: `T extends Something`)
    .replace(/^`([A-Z][A-Za-z0-9 =<>\[\]]*)`$/gm, 'Type parameter **$1**')
    // 타입 파라미터 설명 라인들을 안전하게 처리
    .replace(/^Generic type parameter ([A-Z])$/gm, 'Type parameter **$1**');
}

/**
 * 파일명을 읽기 쉬운 텍스트로 변환
 */
function formatDisplayName(filename) {
  // README 파일 처리
  if (filename === 'README') {
    return 'Overview';
  }
  
  // 파일명을 카멜케이스로 변환
  let displayName = filename
    .replace(/([A-Z])/g, ' $1') // 대문자 앞에 공백 추가
    .replace(/^./, str => str.toUpperCase()) // 첫 글자 대문자
    .trim();
  
  // 특수한 경우들 처리
  const specialCases = {
    'ActionRegister': 'Action Register',
    'ActionDispatcher': 'Action Dispatcher',
    'ActionMetrics': 'Action Metrics',
    'ActionPayloadMap': 'Action Payload Map',
    'ActionRegisterConfig': 'Action Register Config',
    'ActionRegisterEvents': 'Action Register Events',
    'EventEmitter': 'Event Emitter',
    'HandlerConfig': 'Handler Config',
    'HandlerRegistration': 'Handler Registration',
    'PipelineController': 'Pipeline Controller',
    'PipelineContext': 'Pipeline Context',
    'ActionHandler': 'Action Handler',
    'EventHandler': 'Event Handler',
    'UnregisterFunction': 'Unregister Function',
    'ExecutionMode': 'Execution Mode',
    'ExecutionResult': 'Execution Result',
    'DispatchOptions': 'Dispatch Options',
    'executeParallel': 'Execute Parallel',
    'executeRace': 'Execute Race',
    'executeSequential': 'Execute Sequential',
    'ConsoleLogger': 'Console Logger',
    'EventBus': 'Event Bus',
    'NumericStore': 'Numeric Store',
    'RegistryUtils': 'Registry Utils',
    'ScopedEventBus': 'Scoped Event Bus',
    'Store': 'Store',
    'StoreRegistry': 'Store Registry',
    'StoreUtils': 'Store Utils',
    'LogLevel': 'Log Level',
    'ActionProvider': 'Action Provider',
    'StoreProvider': 'Store Provider',
    'createActionContext': 'createActionContext',
    'createDeclarativeStorePattern': 'Create Declarative Store Pattern',
    'createComputedStore': 'createComputedStore',
    'createLogger': 'createLogger',
    'createRegistrySync': 'createRegistrySync',
    'createStore': 'createStore',
    'createStoreContext': 'createStoreContext',
    'createStoreSync': 'createStoreSync',
    'createTypedActionProvider': 'createTypedActionProvider',
    'createTypedStoreHooks': 'createTypedStoreHooks',
    'createTypedStoreProvider': 'createTypedStoreProvider',
    'getLogLevelFromEnv': 'getLogLevelFromEnv',
    'useActionDispatch': 'useActionDispatch',
    'useActionRegister': 'useActionRegister',
    'useActionWithStores': 'useActionWithStores',
    'useBatchStoreSync': 'useBatchStoreSync',
    'useComputedStore': 'useComputedStore',
    'useComputedValue': 'useComputedValue',
    'useDynamicStore': 'useDynamicStore',
    'useLocalState': 'useLocalState',
    'useLocalStore': 'useLocalStore',
    'useMVVMStore': 'useMVVMStore',
    'useMultiMVVMStore': 'useMultiMVVMStore',
    'useMultiStoreAction': 'useMultiStoreAction',
    'usePersistedStore': 'usePersistedStore',
    'useRegistry': 'useRegistry',
    'useRegistryStore': 'useRegistryStore',
    'useStore': 'useStore',
    'useStoreActions': 'useStoreActions',
    'useStoreQuery': 'useStoreQuery',
    'useStoreRegistry': 'useStoreRegistry',
    'useStoreSync': 'useStoreSync',
    'useStoreValue': 'useStoreValue',
    'useStoreValues': 'useStoreValues',
    'useTransactionAction': 'useTransactionAction',
    'ActionContextConfig': 'Action Context Config',
    'ActionContextReturn': 'Action Context Return',
    'ActionContextType': 'Action Context Type',
    'ActionProviderProps': 'Action Provider Props',
    'DynamicStoreOptions': 'Dynamic Store Options',
    'HookOptions': 'Hook Options',
    'IEventBus': 'IEventBus',
    'IStore': 'IStore',
    'IStoreRegistry': 'IStoreRegistry',
    'RegistryStoreMap': 'Registry Store Map',
    'StoreContextReturn': 'Store Context Return',
    'StoreContextType': 'Store Context Type',
    'StoreProviderContextType': 'Store Provider Context Type',
    'StoreProviderProps': 'Store Provider Props',
    'StoreSyncConfig': 'Store Sync Config',
    'Listener': 'Listener',
    'Subscribe': 'Subscribe',
    'Unsubscribe': 'Unsubscribe',
    'useDynamicStoreSnapshot': 'useDynamicStoreSnapshot',
    'useDynamicStoreWithDefault': 'useDynamicStoreWithDefault',
    'useDynamicStores': 'useDynamicStores',
    'useStoreContext': 'useStoreContext',
    'createAtomContext': 'createAtomContext',
    'AtomContextConfig': 'Atom Context Config',
    'NoopLogger': 'Noop Logger',
    'getDebugFromEnv': 'getDebugFromEnv',
    'getLoggerNameFromEnv': 'getLoggerNameFromEnv',
    'assertStoreValue': 'Assert Store Value',
    'compareValues': 'Compare Values',
    'deepClone': 'Deep Clone',
    'deepEqual': 'Deep Equal',
    'defaultEqualityFn': 'Default Equality Fn',
    'getGlobalComparisonOptions': 'Get Global Comparison Options',
    'getGlobalImmutabilityOptions': 'Get Global Immutability Options',
    'performantSafeGet': 'Performant Safe Get',
    'safeGet': 'Safe Get',
    'safeSet': 'Safe Set',
    'setGlobalComparisonOptions': 'Set Global Comparison Options',
    'shallowEqual': 'Shallow Equal',
    'useAsyncComputedStore': 'Use Async Computed Store',
    'useComputedStoreInstance': 'Use Computed Store Instance',
    'useMultiComputedStore': 'Use Multi Computed Store',
    'useMultiStoreSelector': 'Use Multi Store Selector',
    'useStorePathSelector': 'Use Store Path Selector',
    'useStoreSelector': 'Use Store Selector',
    'ComparisonOptions': 'Comparison Options',
    'Snapshot': 'Snapshot',
    'StoreConfig': 'Store Config',
    'StoreEventHandler': 'Store Event Handler',
    'WithProviderConfig': 'With Provider Config',
    'ComparisonStrategy': 'Comparison Strategy',
    'CustomComparator': 'Custom Comparator',
    'InferInitialStores': 'Infer Initial Stores',
    'InferStoreTypes': 'Infer Store Types',
    'InitialStores': 'Initial Stores',
    'StoreDefinitions': 'Store Definitions',
    'StoreValues': 'Store Values'
  };
  
  return specialCases[filename] || displayName;
}

// =============================
// 병렬 처리 시스템 (Parallel Processing)
// =============================
async function processFilesInParallel(files, processor, config) {
  if (!config.parallel.enabled || files.length < config.parallel.batchSize) {
    // 순차 처리
    const results = [];
    for (const file of files) {
      results.push(await processor(file));
    }
    return results;
  }

  // 병렬 처리
  const batches = [];
  for (let i = 0; i < files.length; i += config.parallel.batchSize) {
    batches.push(files.slice(i, i + config.parallel.batchSize));
  }

  const results = [];
  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map(file => processor(file)));
    results.push(...batchResults);
  }

  return results;
}

// =============================
// 메인 처리 함수들 (Main Processing)
// =============================

/**
 * 파일을 안전하게 복사 (캐싱 사용)
 */
async function copyFileWithCache(sourcePath, targetPath, cache, validator, metrics, errorHandler) {
  try {
    // 캐시 확인
    if (!cache.shouldProcess(sourcePath, targetPath)) {
      console.log(`✨ 캐시 히트: ${path.basename(sourcePath)}`);
      metrics.recordFile(sourcePath, true);
      return { success: true, cached: true };
    }

    // 타겟 디렉토리 생성
    const targetDir = path.dirname(targetPath);
    ensureDirectoryExists(targetDir);
    
    // 파일 읽기 및 후처리
    let content = fs.readFileSync(sourcePath, 'utf8');
    content = postProcessMarkdown(content);
    
    // 처리된 내용을 타겟 파일에 쓰기
    fs.writeFileSync(targetPath, content);
    console.log(`📄 파일 처리: ${path.basename(sourcePath)}`);
    
    // 품질 검증
    if (validator) {
      await validator.validateFile(targetPath);
    }
    
    // 캐시 업데이트
    cache.updateCache(sourcePath, targetPath);
    metrics.recordFile(targetPath);
    
    return { success: true, cached: false };
  } catch (error) {
    return errorHandler.handleError(error, `파일 복사: ${sourcePath}`);
  }
}

/**
 * 디렉토리 내의 모든 파일을 재귀적으로 처리
 */
async function processDirectory(sourcePath, targetPath, cache, validator, metrics, errorHandler) {
  if (!fs.existsSync(sourcePath)) {
    errorHandler.addWarning(`소스 경로가 존재하지 않습니다: ${sourcePath}`, 'processDirectory');
    return [];
  }

  const processedFiles = [];
  const items = fs.readdirSync(sourcePath);
  
  // 파일 목록 준비
  const filesToProcess = [];
  const dirsToProcess = [];
  
  for (const item of items) {
    const sourceItemPath = path.join(sourcePath, item);
    const targetItemPath = path.join(targetPath, item);
    const stat = fs.statSync(sourceItemPath);
    
    if (stat.isDirectory()) {
      dirsToProcess.push({ source: sourceItemPath, target: targetItemPath });
    } else if (stat.isFile() && item.endsWith('.md')) {
      filesToProcess.push({ source: sourceItemPath, target: targetItemPath });
    }
  }
  
  // 파일 병렬 처리
  const fileResults = await processFilesInParallel(
    filesToProcess,
    async (file) => {
      const result = await copyFileWithCache(
        file.source,
        file.target,
        cache,
        validator,
        metrics,
        errorHandler
      );
      if (result && result.success) {
        return file.target;
      }
      return null;
    },
    CONFIG
  );
  
  processedFiles.push(...fileResults.filter(r => r !== null));
  
  // 디렉토리 재귀 처리
  for (const dir of dirsToProcess) {
    const subFiles = await processDirectory(
      dir.source,
      dir.target,
      cache,
      validator,
      metrics,
      errorHandler
    );
    processedFiles.push(...subFiles);
  }
  
  return processedFiles;
}

/**
 * 패키지별로 파일을 이동
 */
async function movePackageDocs(packageName, cache, validator, metrics, errorHandler) {
  const sourcePackagePath = path.join(CONFIG.sourceDir, 'packages', packageName);
  const targetPackagePath = path.join(CONFIG.targetDir, packageName);
  
  if (!fs.existsSync(sourcePackagePath)) {
    errorHandler.addWarning(
      `패키지 소스 경로가 존재하지 않습니다: ${sourcePackagePath}`,
      'movePackageDocs'
    );
    return [];
  }
  
  console.log(`\n📦 패키지 처리 중: ${packageName}`);
  return await processDirectory(
    sourcePackagePath,
    targetPackagePath,
    cache,
    validator,
    metrics,
    errorHandler
  );
}

/**
 * API 구조를 파싱하여 사이드바 설정 생성
 */
function parseApiStructure() {
  const structure = {};
  
  for (const [packageName, targetName] of Object.entries(PACKAGE_MAPPING)) {
    const packagePath = path.join(CONFIG.targetDir, targetName);
    if (!fs.existsSync(packagePath)) continue;
    
    structure[targetName] = {
      text: `${targetName.charAt(0).toUpperCase() + targetName.slice(1)} API`,
      items: []
    };
    
    // src 디렉토리 처리
    const srcPath = path.join(packagePath, 'src');
    if (fs.existsSync(srcPath)) {
      const srcItems = fs.readdirSync(srcPath);
      
      for (const item of srcItems) {
        const itemPath = path.join(srcPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // 디렉토리인 경우 하위 파일들 처리
          const subItems = fs.readdirSync(itemPath)
            .filter(file => file.endsWith('.md'))
            .map(file => {
              const filename = file.replace('.md', '');
              return {
                text: formatDisplayName(filename),
                path: `/${targetName}/src/${item}/${filename}`
              };
            });
          
          if (subItems.length > 0) {
            structure[targetName].items.push(...subItems);
          }
        } else if (item.endsWith('.md')) {
          // 직접 파일인 경우
          const filename = item.replace('.md', '');
          structure[targetName].items.push({
            text: formatDisplayName(filename),
            path: `/${targetName}/src/${filename}`
          });
        }
      }
    }
  }
  
  return structure;
}

/**
 * 사이드바 설정 파일 생성
 */
function generateSidebarConfig(structure, errorHandler) {
  const configContent = `// 자동 생성된 API 사이드바 설정
// 이 파일은 scripts/sync-api-docs.js에 의해 자동 생성됩니다.

// 로케일별 경로 생성 유틸리티
function createLocalePath(locale: string, path: string): string {
  return \`/\${locale}\${path}\`
}

// 타입 정의
type SidebarItem = {
  text: string
  link: string
}

type SidebarSection = {
  text: string
  collapsed: boolean
  items: SidebarItem[]
}

// API 구조 (자동 생성됨)
export const API_STRUCTURE = ${JSON.stringify(structure, null, 2)}

// 사이드바 섹션 생성 함수
function createSidebarSection(locale: string, section: any): SidebarSection {
  return {
    text: section.text,
    collapsed: false,
    items: section.items.map((item: any) => ({
      text: item.text,
      link: createLocalePath(locale, item.path)
    }))
  }
}

// API 사이드바 생성
export function sidebarApiEn() {
  return Object.values(API_STRUCTURE).map(section => 
    createSidebarSection('en', section)
  )
}

export function sidebarApiKo() {
  return Object.values(API_STRUCTURE).map(section => 
    createSidebarSection('ko', section)
  )
}
`;

  try {
    ensureDirectoryExists(path.dirname(CONFIG.sidebarConfigPath));
    fs.writeFileSync(CONFIG.sidebarConfigPath, configContent);
    console.log(`📝 사이드바 설정 생성: ${CONFIG.sidebarConfigPath}`);
  } catch (error) {
    errorHandler.handleError(error, '사이드바 설정 생성');
  }
}

// =============================
// 메인 실행 함수 (Main Execution)
// =============================
async function main() {
  console.log('🚀 TypeDoc API 문서 동기화 시작 (고도화 버전)...\n');
  
  // 시스템 초기화
  const cache = new CacheManager(CONFIG.cache);
  const validator = new QualityValidator(CONFIG.quality);
  const metrics = new MetricsCollector(CONFIG.metrics);
  const errorHandler = new ErrorHandler();
  
  await cache.initialize();
  
  // 타겟 디렉토리 생성
  ensureDirectoryExists(CONFIG.targetDir);
  
  let totalProcessedFiles = [];
  
  // 각 패키지별로 문서 이동
  for (const [packageName, targetName] of Object.entries(PACKAGE_MAPPING)) {
    const processedFiles = await movePackageDocs(
      packageName,
      cache,
      validator,
      metrics,
      errorHandler
    );
    totalProcessedFiles.push(...processedFiles);
  }
  
  // README 파일도 복사
  const sourceReadme = path.join(CONFIG.sourceDir, 'README.md');
  const targetReadme = path.join(CONFIG.targetDir, 'README.md');
  
  if (fs.existsSync(sourceReadme)) {
    const result = await copyFileWithCache(
      sourceReadme,
      targetReadme,
      cache,
      validator,
      metrics,
      errorHandler
    );
    if (result && result.success) {
      totalProcessedFiles.push(targetReadme);
    }
  }
  
  // API 구조 파싱 및 사이드바 설정 생성
  console.log('\n🔍 API 구조 파싱 중...');
  const structure = parseApiStructure();
  generateSidebarConfig(structure, errorHandler);
  
  // 캐시 저장
  cache.saveManifest();
  
  // 메트릭스 정리 및 저장
  const finalMetrics = metrics.finalize(
    cache.getStats(),
    validator.getSummary(),
    errorHandler.getSummary()
  );
  metrics.save();
  
  // 결과 출력
  console.log('\n' + '='.repeat(60));
  console.log('✅ API 문서 동기화 완료!');
  console.log('='.repeat(60));
  console.log(`📁 동기화 위치: ${CONFIG.targetDir}`);
  console.log(`📄 처리된 파일: ${totalProcessedFiles.length}개`);
  console.log(`⏱️  처리 시간: ${(finalMetrics.processingTime / 1000).toFixed(2)}초`);
  console.log('\n📊 캐시 통계:');
  console.log(`  - 히트율: ${finalMetrics.cache.hitRate}`);
  console.log(`  - 히트: ${finalMetrics.cache.hits}회`);
  console.log(`  - 미스: ${finalMetrics.cache.misses}회`);
  console.log(`  - 만료: ${finalMetrics.cache.expired}회`);
  
  if (finalMetrics.quality.totalIssues > 0) {
    console.log('\n⚠️ 품질 이슈:');
    console.log(`  - 총 ${finalMetrics.quality.totalIssues}개 파일에서 이슈 발견`);
  }
  
  if (finalMetrics.errors > 0 || finalMetrics.warnings > 0) {
    console.log('\n⚠️ 에러 및 경고:');
    console.log(`  - 에러: ${finalMetrics.errors}개`);
    console.log(`  - 경고: ${finalMetrics.warnings}개`);
  }
  
  console.log('\n📝 상세 보고서:');
  console.log(`  - 메트릭스: ${CONFIG.metrics.outputFile}`);
  console.log(`  - 캐시 매니페스트: ${CONFIG.cache.manifestFile}`);
  console.log(`  - 사이드바 설정: ${CONFIG.sidebarConfigPath}`);
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 치명적 오류:', error);
    process.exit(1);
  });
}

export {
  movePackageDocs,
  processDirectory,
  copyFileWithCache,
  ensureDirectoryExists,
  parseApiStructure,
  generateSidebarConfig,
  CacheManager,
  ErrorHandler,
  QualityValidator,
  MetricsCollector
};