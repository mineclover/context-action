/**
 * 실제 LLMS Generator를 사용한 테스트
 * TypeScript migration of test-real-llms.cjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { DocumentSummary } from '../../src/domain/entities/DocumentSummary.js';
import { DocumentId } from '../../src/domain/value-objects/DocumentId.js';
import { CharacterLimit } from '../../src/domain/value-objects/CharacterLimit.js';

export interface TestLLMSOptions {
  testDocsPath?: string;
  outputPath?: string;
  verbose?: boolean;
}

export async function testRealLLMSGeneration(options: TestLLMSOptions = {}): Promise<void> {
  console.log('🔬 실제 LLMS Generator를 사용한 테스트\n');
  
  const testDocsPath = options.testDocsPath || resolve(process.cwd(), 'test-docs');
  const verbose = options.verbose || false;
  
  try {
    // API 문서 테스트
    const apiDocPath = resolve(testDocsPath, 'api-spec-example.md');
    if (!existsSync(apiDocPath)) {
      console.log(`⚠️  테스트 파일이 없습니다: ${apiDocPath}`);
      console.log('💡 test-docs/api-spec-example.md 파일을 생성하여 테스트하세요');
      return;
    }
    
    const apiContent = readFileSync(apiDocPath, 'utf8');
    console.log('📋 API 문서 LLMS 생성 테스트');
    console.log('='.repeat(50));
    
    // API 300자 생성 테스트
    await testApiGeneration(apiContent, 300, verbose);
    
    // API 1000자 생성 테스트
    await testApiGeneration(apiContent, 1000, verbose);
    
    // 가이드 문서 테스트
    const guideDocPath = resolve(testDocsPath, 'guide-example.md');
    if (existsSync(guideDocPath)) {
      const guideContent = readFileSync(guideDocPath, 'utf8');
      console.log('\n📖 가이드 문서 LLMS 생성 테스트');
      console.log('='.repeat(50));
      
      await testGuideGeneration(guideContent, 500, verbose);
      await testGuideGeneration(guideContent, 1500, verbose);
    }
    
    console.log('\n🎉 모든 테스트가 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function testApiGeneration(content: string, characterLimit: number, verbose: boolean): Promise<void> {
  try {
    const documentId = DocumentId.create('api--hooks--useactiondispatch');
    const charLimit = CharacterLimit.create(characterLimit);
    
    const summaryResult = DocumentSummary.create({
      document: {
        path: 'api/hooks/useActionDispatch.md',
        title: 'useActionDispatch Hook API',
        id: documentId,
        category: 'api'
      },
      priority: {
        score: 90,
        tier: 'critical'
      },
      summary: {
        characterLimit: charLimit,
        focus: 'API usage and parameters',
        strategy: 'api-first',
        language: 'en'
      },
      content: content.slice(0, characterLimit), // 간단한 요약 생성
      generated: {
        from: 'origin',
        timestamp: new Date(),
        sourceType: 'content_based',
        characterCount: Math.min(content.length, characterLimit)
      }
    });
    
    if (summaryResult.isSuccess) {
      const summary = summaryResult.value;
      console.log(`✅ API ${characterLimit}자 LLMS 생성 성공`);
      console.log(`   - 문서 ID: ${summary.document.id.value}`);
      console.log(`   - 실제 글자수: ${summary.generated.characterCount}자`);
      console.log(`   - 카테고리: ${summary.document.category}`);
      console.log(`   - 전략: ${summary.summary.strategy}`);
      
      if (verbose) {
        console.log(`   - 생성 시간: ${summary.generated.timestamp.toISOString()}`);
        console.log(`   - 내용 미리보기: ${summary.content.slice(0, 100)}...`);
      }
    } else {
      console.log(`❌ API ${characterLimit}자 생성 실패: ${summaryResult.error.message}`);
    }
  } catch (error) {
    console.log(`❌ API ${characterLimit}자 생성 중 오류:`, error instanceof Error ? error.message : String(error));
  }
}

async function testGuideGeneration(content: string, characterLimit: number, verbose: boolean): Promise<void> {
  try {
    const documentId = DocumentId.create('guide--getting-started');
    const charLimit = CharacterLimit.create(characterLimit);
    
    const summaryResult = DocumentSummary.create({
      document: {
        path: 'guide/getting-started.md',
        title: 'Getting Started Guide',
        id: documentId,
        category: 'guide'
      },
      priority: {
        score: 85,
        tier: 'essential'
      },
      summary: {
        characterLimit: charLimit,
        focus: 'Step-by-step tutorial',
        strategy: 'tutorial-first',
        language: 'en'
      },
      content: content.slice(0, characterLimit), // 간단한 요약 생성
      generated: {
        from: 'minimum',
        timestamp: new Date(),
        sourceType: 'content_based',
        characterCount: Math.min(content.length, characterLimit)
      }
    });
    
    if (summaryResult.isSuccess) {
      const summary = summaryResult.value;
      console.log(`✅ 가이드 ${characterLimit}자 LLMS 생성 성공`);
      console.log(`   - 문서 ID: ${summary.document.id.value}`);
      console.log(`   - 실제 글자수: ${summary.generated.characterCount}자`);
      console.log(`   - 카테고리: ${summary.document.category}`);
      console.log(`   - 전략: ${summary.summary.strategy}`);
      
      if (verbose) {
        console.log(`   - 생성 시간: ${summary.generated.timestamp.toISOString()}`);
        console.log(`   - 내용 미리보기: ${summary.content.slice(0, 100)}...`);
      }
    } else {
      console.log(`❌ 가이드 ${characterLimit}자 생성 실패: ${summaryResult.error.message}`);
    }
  } catch (error) {
    console.log(`❌ 가이드 ${characterLimit}자 생성 중 오류:`, error instanceof Error ? error.message : String(error));
  }
}

// CLI integration for standalone execution
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const testDocsPath = args.find(arg => arg.startsWith('--test-docs='))?.split('=')[1];
  
  testRealLLMSGeneration({
    testDocsPath,
    verbose
  }).catch(console.error);
}