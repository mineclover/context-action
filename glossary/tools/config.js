/**
 * Configuration for glossary mapping tools
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

export const config = {
  // 스캔 대상 경로 (프로젝트 루트 기준)
  scanPaths: [
    'example/src/**/*.{ts,tsx,js,jsx}',
    'packages/*/src/**/*.{ts,tsx,js,jsx}'
  ],
  
  // 제외 경로
  excludePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/*.d.ts'
  ],
  
  // 용어집 파일 경로 (docs 기준)
  glossaryPaths: {
    'core-concepts': 'glossary/core-concepts.md',
    'architecture-terms': 'glossary/architecture-terms.md', 
    'api-terms': 'glossary/api-terms.md',
    'naming-conventions': 'glossary/naming-conventions.md'
  },
  
  // 출력 설정 (docs 기준)
  output: {
    mappingsFile: 'implementations/_data/mappings.json',
    implementationsDir: 'implementations/',
    templatesDir: 'tools/templates/'
  },
  
  // 절대 경로들
  paths: {
    root: rootDir,
    docs: join(rootDir, 'docs'),
    tools: __dirname
  },
  
  // TypeScript 파서 설정
  parser: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      typescript: true
    },
    project: join(rootDir, 'tsconfig.json')
  },
  
  // 검증 설정
  validation: {
    strictMode: true,
    allowUnknownTerms: false,
    allowMissingCategories: true,
    warnOnDuplicates: true
  },
  
  // 태그 패턴 정의
  tagPatterns: {
    // JSDoc 스타일: @glossary action-handler, pipeline-controller
    jsdoc: /@glossary\s+([^\n\r*]+)/g,
    // 간단한 주석 스타일: // @glossary: action-handler
    simple: /@glossary:\s*([^\n\r]+)/g,
    // 카테고리 태그
    category: /@category[:\s]+([^\n\r*]+)/g,
    // 패턴 태그  
    pattern: /@pattern[:\s]+([^\n\r*]+)/g,
    // 관련 용어 태그
    related: /@related[:\s]+([^\n\r*]+)/g
  }
};

export default config;