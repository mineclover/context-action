/**
 * @fileoverview Configuration loader and merger for glossary system
 * 설정 파일 로딩 및 병합 유틸리티
 */

import fs from 'fs';
import path from 'path';
import type { GlossaryParserOptions } from './types.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Partial<GlossaryParserOptions> = {
  rootDir: '.',
  debug: false,
  parseSignatures: true,
  scanPaths: [
    'src/**/*.{ts,tsx,js,jsx}',
  ],
  excludePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/*.d.ts',
  ],
  glossaryPaths: {
    'core-concepts': 'glossary/terms/core-concepts.md',
  },
};

/**
 * Configuration file names to search for
 */
const CONFIG_FILES = [
  'glossary.config.js',
  'glossary.config.mjs',
  'glossary.config.ts',
  '.glossaryrc.js',
  '.glossaryrc.json',
];

/**
 * Load configuration from file or use defaults
 */
export async function loadConfig(
  configPath?: string,
  rootDir: string = process.cwd()
): Promise<GlossaryParserOptions> {
  let userConfig: Partial<GlossaryParserOptions> = {};

  if (configPath) {
    // Load specific config file
    userConfig = await loadConfigFile(path.resolve(rootDir, configPath));
  } else {
    // Search for config files
    for (const fileName of CONFIG_FILES) {
      const filePath = path.resolve(rootDir, fileName);
      if (fs.existsSync(filePath)) {
        userConfig = await loadConfigFile(filePath);
        break;
      }
    }
  }

  // Merge with defaults
  const config = mergeConfig(DEFAULT_CONFIG, userConfig);
  
  // Resolve relative paths
  return resolveConfigPaths(config, rootDir);
}

/**
 * Load configuration from a specific file
 */
async function loadConfigFile(filePath: string): Promise<Partial<GlossaryParserOptions>> {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.json') {
      // JSON configuration
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } else if (ext === '.js' || ext === '.mjs' || ext === '.ts') {
      // JavaScript/TypeScript configuration
      const module = await import(filePath);
      return module.default || module;
    }
  } catch (error) {
    console.warn(`Failed to load config file ${filePath}:`, error);
  }
  
  return {};
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(
  defaultConfig: Partial<GlossaryParserOptions>,
  userConfig: Partial<GlossaryParserOptions>
): GlossaryParserOptions {
  const merged = { ...defaultConfig };
  
  for (const [key, value] of Object.entries(userConfig)) {
    if (value === undefined || value === null) {
      continue;
    }
    
    if (Array.isArray(value)) {
      // Replace arrays completely
      (merged as any)[key] = [...value];
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Deep merge objects
      (merged as any)[key] = {
        ...(merged as any)[key] || {},
        ...value,
      };
    } else {
      // Replace primitive values
      (merged as any)[key] = value;
    }
  }
  
  return merged as GlossaryParserOptions;
}

/**
 * Resolve relative paths in configuration
 */
function resolveConfigPaths(
  config: GlossaryParserOptions,
  rootDir: string
): GlossaryParserOptions {
  // Resolve rootDir
  if (config.rootDir && !path.isAbsolute(config.rootDir)) {
    config.rootDir = path.resolve(rootDir, config.rootDir);
  }
  
  // Resolve glossary paths
  if (config.glossaryPaths) {
    const resolvedPaths: Record<string, string> = {};
    for (const [key, glossaryPath] of Object.entries(config.glossaryPaths)) {
      if (!path.isAbsolute(glossaryPath)) {
        resolvedPaths[key] = path.resolve(config.rootDir || rootDir, glossaryPath);
      } else {
        resolvedPaths[key] = glossaryPath;
      }
    }
    config.glossaryPaths = resolvedPaths;
  }
  
  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: GlossaryParserOptions): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!config.rootDir) {
    errors.push('rootDir is required');
  }
  
  if (!config.scanPaths || config.scanPaths.length === 0) {
    errors.push('scanPaths must contain at least one path');
  }
  
  if (!config.glossaryPaths || Object.keys(config.glossaryPaths).length === 0) {
    errors.push('glossaryPaths must contain at least one glossary file');
  }
  
  // Check if paths exist
  if (config.rootDir && !fs.existsSync(config.rootDir)) {
    errors.push(`rootDir does not exist: ${config.rootDir}`);
  }
  
  // Check glossary files
  if (config.glossaryPaths) {
    for (const [category, filePath] of Object.entries(config.glossaryPaths)) {
      if (!fs.existsSync(filePath)) {
        errors.push(`Glossary file does not exist: ${filePath} (category: ${category})`);
      }
    }
  }
  
  return errors;
}

/**
 * Create a configuration template
 */
export function createConfigTemplate(rootDir: string): string {
  const templatePath = path.resolve(rootDir, 'glossary.config.js');
  
  const template = `/**
 * Glossary System Configuration
 * 용어집-코드 매핑 시스템 설정 파일
 */

export default {
  // 기본 설정
  rootDir: '.',
  debug: false,
  parseSignatures: true,

  // 📂 코드 스캔 영역 설정
  scanPaths: [
    'src/**/*.{ts,tsx,js,jsx}',
    // 추가 경로들...
  ],

  // ❌ 제외할 영역 설정
  excludePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/*.d.ts',
  ],

  // 📚 용어집 문서 영역 설정
  glossaryPaths: {
    'core-concepts': 'docs/glossary/core-concepts.md',
    // 추가 용어집 파일들...
  },
};`;

  fs.writeFileSync(templatePath, template, 'utf8');
  return templatePath;
}

/**
 * Print configuration summary
 */
export function printConfigSummary(config: GlossaryParserOptions): void {
  console.log('📋 Glossary Configuration Summary:');
  console.log(`   Root Directory: ${config.rootDir}`);
  console.log(`   Scan Paths: ${config.scanPaths?.length || 0} patterns`);
  console.log(`   Exclude Paths: ${config.excludePaths?.length || 0} patterns`);
  console.log(`   Glossary Files: ${Object.keys(config.glossaryPaths || {}).length} files`);
  
  if (config.debug) {
    console.log('\n🔍 Detailed Configuration:');
    console.log('   Scan Paths:');
    config.scanPaths?.forEach(path => console.log(`     - ${path}`));
    console.log('   Glossary Files:');
    Object.entries(config.glossaryPaths || {}).forEach(([category, path]) => {
      console.log(`     - ${category}: ${path}`);
    });
  }
}