#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const SOURCE_DIR = './docs/api/generated';
const TARGET_DIR = './docs/en/api';
const SIDEBAR_CONFIG_PATH = './docs/.vitepress/config/api-spec.ts';

// 패키지 매핑
const PACKAGE_MAPPING = {
  'core': 'core',
  'react': 'react', 
  'jotai': 'jotai',
  'logger': 'logger'
};

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
 * 파일의 수정 시간을 비교하여 새로 생성된 파일인지 확인
 */
function isNewerFile(sourcePath, targetPath) {
  if (!fs.existsSync(targetPath)) {
    return true; // 타겟 파일이 없으면 새 파일로 간주
  }
  
  const sourceStat = fs.statSync(sourcePath);
  const targetStat = fs.statSync(targetPath);
  
  return sourceStat.mtime > targetStat.mtime;
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
 * 파일을 안전하게 복사 (새 파일만)
 */
function copyFileIfNewer(sourcePath, targetPath) {
  try {
    if (!isNewerFile(sourcePath, targetPath)) {
      console.log(`⏭️  건너뜀 (최신): ${path.basename(sourcePath)}`);
      return false;
    }
    
    // 타겟 디렉토리 생성
    const targetDir = path.dirname(targetPath);
    ensureDirectoryExists(targetDir);
    
    // 파일 읽기 및 후처리
    let content = fs.readFileSync(sourcePath, 'utf8');
    content = postProcessMarkdown(content);
    
    // 처리된 내용을 타겟 파일에 쓰기
    fs.writeFileSync(targetPath, content);
    console.log(`📄 파일 복사 및 후처리: ${path.basename(sourcePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ 파일 복사 실패: ${sourcePath}`, error.message);
    return false;
  }
}

/**
 * 디렉토리 내의 모든 파일을 재귀적으로 처리
 */
function processDirectory(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  소스 경로가 존재하지 않습니다: ${sourcePath}`);
    return [];
  }

  const copiedFiles = [];
  const items = fs.readdirSync(sourcePath);
  
  for (const item of items) {
    const sourceItemPath = path.join(sourcePath, item);
    const targetItemPath = path.join(targetPath, item);
    const stat = fs.statSync(sourceItemPath);
    
    if (stat.isDirectory()) {
      // 디렉토리인 경우 재귀적으로 처리
      const subFiles = processDirectory(sourceItemPath, targetItemPath);
      copiedFiles.push(...subFiles);
    } else if (stat.isFile() && item.endsWith('.md')) {
      // 마크다운 파일인 경우 복사
      if (copyFileIfNewer(sourceItemPath, targetItemPath)) {
        copiedFiles.push(targetItemPath);
      }
    }
  }
  
  return copiedFiles;
}

/**
 * 패키지별로 파일을 이동
 */
function movePackageDocs(packageName) {
  const sourcePackagePath = path.join(SOURCE_DIR, 'packages', packageName);
  const targetPackagePath = path.join(TARGET_DIR, packageName);
  
  if (!fs.existsSync(sourcePackagePath)) {
    console.log(`⚠️  패키지 소스 경로가 존재하지 않습니다: ${sourcePackagePath}`);
    return [];
  }
  
  console.log(`\n📦 패키지 처리 중: ${packageName}`);
  return processDirectory(sourcePackagePath, targetPackagePath);
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
    'PipelineController': 'Pipeline Controller',
    'ActionHandler': 'Action Handler',
    'EventHandler': 'Event Handler',
    'UnregisterFunction': 'Unregister Function',
    'ConsoleLogger': 'Console Logger',
    'EventBus': 'Event Bus',
    'NumericStore': 'Numeric Store',
    'RegistryUtils': 'Registry Utils',
    'ScopedEventBus': 'Scoped Event Bus',
    'StoreRegistry': 'Store Registry',
    'StoreUtils': 'Store Utils',
    'LogLevel': 'Log Level',
    'ActionProvider': 'Action Provider',
    'StoreProvider': 'Store Provider',
    'createActionContext': 'createActionContext',
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
    'getLoggerNameFromEnv': 'getLoggerNameFromEnv'
  };
  
  return specialCases[filename] || displayName;
}

/**
 * API 구조를 파싱하여 사이드바 설정 생성
 */
function parseApiStructure() {
  const structure = {};
  
  for (const [packageName, targetName] of Object.entries(PACKAGE_MAPPING)) {
    const packagePath = path.join(TARGET_DIR, targetName);
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
function generateSidebarConfig(structure) {
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
    ensureDirectoryExists(path.dirname(SIDEBAR_CONFIG_PATH));
    fs.writeFileSync(SIDEBAR_CONFIG_PATH, configContent);
    console.log(`📝 사이드바 설정 생성: ${SIDEBAR_CONFIG_PATH}`);
  } catch (error) {
    console.error(`❌ 사이드바 설정 생성 실패:`, error.message);
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🚀 TypeDoc API 문서 동기화 시작...\n');
  
  // 타겟 디렉토리 생성
  ensureDirectoryExists(TARGET_DIR);
  
  let totalCopiedFiles = [];
  
  // 각 패키지별로 문서 이동
  for (const [packageName, targetName] of Object.entries(PACKAGE_MAPPING)) {
    const copiedFiles = movePackageDocs(packageName);
    totalCopiedFiles.push(...copiedFiles);
  }
  
  // README 파일도 복사 (새 파일인 경우만)
  const sourceReadme = path.join(SOURCE_DIR, 'README.md');
  const targetReadme = path.join(TARGET_DIR, 'README.md');
  
  if (fs.existsSync(sourceReadme)) {
    if (copyFileIfNewer(sourceReadme, targetReadme)) {
      totalCopiedFiles.push(targetReadme);
    }
  }
  
  // API 구조 파싱 및 사이드바 설정 생성
  console.log('\n🔍 API 구조 파싱 중...');
  const structure = parseApiStructure();
  generateSidebarConfig(structure);
  
  console.log('\n✅ API 문서 동기화 완료!');
  console.log(`📁 동기화된 위치: ${TARGET_DIR}`);
  console.log(`📄 총 ${totalCopiedFiles.length}개 파일 처리됨`);
  console.log(`📝 사이드바 설정: ${SIDEBAR_CONFIG_PATH}`);
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  movePackageDocs,
  processDirectory,
  copyFileIfNewer,
  ensureDirectoryExists,
  parseApiStructure,
  generateSidebarConfig
}; 