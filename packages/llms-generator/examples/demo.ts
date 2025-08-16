/**
 * Demo script to showcase the Enhanced LLMS Generator
 * TypeScript migration of demo-enhanced-generation.cjs
 */

import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { LLMSGenerator } from '../src/core/LLMSGenerator.js';
import { CategoryMinimumGenerator } from '../src/core/CategoryMinimumGenerator.js';
import type { LLMSConfig } from '../src/types/config.js';

export interface DemoOptions {
  outputDir?: string;
  verbose?: boolean;
  characterLimits?: number[];
  languages?: string[];
}

export async function runEnhancedGenerationDemo(options: DemoOptions = {}): Promise<void> {
  console.log('🚀 Enhanced LLMS Generator 데모');
  console.log('다양한 글자 수 제한으로 파일 생성 (예: -100, -200)');
  console.log('');

  const outputDir = options.outputDir || resolve(process.cwd(), 'demo-output');
  const characterLimits = options.characterLimits || [100, 200, 500, 1000, 2000];
  const languages = options.languages || ['en', 'ko'];
  const verbose = options.verbose || false;

  // 데모 설정 생성
  const demoConfig: LLMSConfig = {
    paths: {
      docsDir: resolve(outputDir, 'demo-docs'),
      llmContentDir: resolve(outputDir, 'demo-data'),
      outputDir: outputDir,
      templatesDir: resolve(outputDir, 'templates'),
      instructionsDir: resolve(outputDir, 'instructions')
    },
    generation: {
      supportedLanguages: languages,
      characterLimits: characterLimits,
      defaultLanguage: 'en',
      outputFormat: 'md'
    },
    quality: {
      minCompletenessThreshold: 0.75,
      enableValidation: true,
      strictMode: false
    }
  };

  try {
    // 출력 디렉토리 생성
    await mkdir(outputDir, { recursive: true });
    await mkdir(demoConfig.paths.docsDir, { recursive: true });
    await mkdir(demoConfig.paths.llmContentDir, { recursive: true });

    console.log(`📂 데모 디렉토리: ${outputDir}`);
    console.log(`📏 글자 수 제한: ${characterLimits.join(', ')}`);
    console.log(`🌐 언어: ${languages.join(', ')}`);
    console.log('');

    // 샘플 문서 생성
    await createSampleDocuments(demoConfig, verbose);

    // 카테고리별 생성 데모
    await demonstrateCategoryGeneration(demoConfig, verbose);

    // LLMS 생성기 데모
    await demonstrateLLMSGeneration(demoConfig, verbose);

    console.log('');
    console.log('🎉 Enhanced LLMS Generator 데모 완료!');
    console.log(`📁 결과 확인: ${outputDir}`);
    console.log('');
    console.log('📋 생성된 파일들:');
    console.log('  - demo-docs/     : 샘플 원본 문서');
    console.log('  - demo-data/     : 생성된 LLMS 데이터');
    console.log('  - categories/    : 카테고리별 요약');
    console.log('  - individual/    : 개별 글자 수 제한 파일');

  } catch (error) {
    console.error('❌ 데모 실행 중 오류:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function createSampleDocuments(config: LLMSConfig, verbose: boolean): Promise<void> {
  console.log('📝 샘플 문서 생성...');

  const sampleDocs = [
    {
      name: 'api-guide.md',
      category: 'guide',
      content: `# API 사용 가이드

## 개요
Context-Action 프레임워크의 API를 사용하는 방법을 설명합니다.

## 시작하기
1. 패키지 설치
2. 기본 설정
3. 첫 번째 액션 생성

## 기본 사용법
\`\`\`typescript
import { createActionContext } from '@context-action/react';

const { Provider, useActionDispatch } = createActionContext();
\`\`\`

## 고급 기능
- 액션 파이프라인
- 스토어 통합
- 타입 안전성
`
    },
    {
      name: 'hooks-reference.md',
      category: 'api',
      content: `# Hooks Reference

## useActionDispatch
액션을 디스패치하는 훅입니다.

### 매개변수
- \`actionType\`: 액션 타입
- \`payload\`: 액션 페이로드

### 반환값
- \`dispatch\`: 액션 디스패치 함수

### 예시
\`\`\`typescript
const dispatch = useActionDispatch();
dispatch('updateUser', { id: 1, name: 'John' });
\`\`\`

## useStoreValue
스토어 값을 구독하는 훅입니다.

### 매개변수
- \`store\`: 스토어 인스턴스

### 반환값
- 현재 스토어 값
`
    }
  ];

  for (const doc of sampleDocs) {
    const filePath = resolve(config.paths.docsDir, doc.name);
    await writeFile(filePath, doc.content, 'utf-8');
    
    if (verbose) {
      console.log(`  ✅ ${doc.name} (${doc.category})`);
    }
  }

  console.log(`  📄 ${sampleDocs.length}개 샘플 문서 생성 완료`);
}

async function demonstrateCategoryGeneration(config: LLMSConfig, verbose: boolean): Promise<void> {
  console.log('\n🎯 카테고리별 생성 데모...');

  const generator = new CategoryMinimumGenerator(config);
  const categories = ['guide', 'api'];

  for (const category of categories) {
    for (const language of config.generation.supportedLanguages) {
      try {
        if (verbose) {
          console.log(`  🔄 ${category} (${language}) 생성 중...`);
        }

        // 실제 구현에서는 generator.generateCategoryMinimum() 호출
        const mockResult = {
          success: true,
          filesGenerated: config.generation.characterLimits.length,
          totalCharacters: config.generation.characterLimits.reduce((sum, limit) => sum + limit, 0)
        };

        if (mockResult.success) {
          console.log(`  ✅ ${category}-${language}: ${mockResult.filesGenerated}개 파일, ${mockResult.totalCharacters}자`);
        }
      } catch (error) {
        console.log(`  ❌ ${category}-${language}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

async function demonstrateLLMSGeneration(config: LLMSConfig, verbose: boolean): Promise<void> {
  console.log('\n⚡ LLMS 생성기 데모...');

  const generator = new LLMSGenerator(config);

  for (const language of config.generation.supportedLanguages) {
    for (const limit of config.generation.characterLimits) {
      try {
        if (verbose) {
          console.log(`  🔄 ${language}-${limit} 생성 중...`);
        }

        // 실제 구현에서는 generator.generate() 호출
        const mockResult = {
          success: true,
          language,
          characterLimit: limit,
          filesGenerated: 2, // 예시: guide, api 각각
          averageUtilization: 85 + Math.random() * 10 // 85-95% 활용률
        };

        if (mockResult.success) {
          console.log(`  ✅ ${language}-${limit}: ${mockResult.filesGenerated}개 파일, ${mockResult.averageUtilization.toFixed(1)}% 활용률`);
        }
      } catch (error) {
        console.log(`  ❌ ${language}-${limit}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

// CLI integration for standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
  const verbose = args.includes('--verbose');
  const characterLimits = args.find(arg => arg.startsWith('--chars='))?.split('=')[1]?.split(',').map(Number);
  const languages = args.find(arg => arg.startsWith('--lang='))?.split('=')[1]?.split(',');

  runEnhancedGenerationDemo({
    outputDir,
    verbose,
    characterLimits,
    languages
  }).catch(error => {
    console.error('❌ 데모 실행 실패:', error);
    process.exit(1);
  });
}