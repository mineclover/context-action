#!/usr/bin/env node

/**
 * 실제 LLMS Generator를 사용한 테스트 (트리밍 적용)
 */

const { DocumentSummaryFactory, CharacterLimit } = require('./dist/index.js');
const fs = require('fs');

// 간단한 트리밍 함수
function smartTrim(content, limit) {
  if (content.length <= limit) {
    return content;
  }
  
  // 문장 단위 트리밍
  const sentences = content.split(/[.!?]\s+/);
  let result = '';
  
  for (const sentence of sentences) {
    const candidate = result + sentence + '. ';
    if (candidate.length > limit) {
      break;
    }
    result = candidate;
  }
  
  return result.trim() || content.substring(0, limit - 3) + '...';
}

async function testRealLLMSGeneration() {
  console.log('🔬 실제 LLMS Generator를 사용한 테스트 (트리밍 적용)\n');
  
  try {
    // API 문서 테스트
    const apiContentRaw = fs.readFileSync('./test-docs/api-spec-example.md', 'utf8');
    console.log('📋 API 문서 LLMS 생성 테스트');
    console.log('=' .repeat(50));
    console.log(`원본 길이: ${apiContentRaw.length}자\n`);
    
    // API 300자 생성
    const apiContent300 = smartTrim(apiContentRaw, 280); // 여유분 고려
    const api300Result = DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: 'api/hooks/useActionDispatch.md',
      documentTitle: 'useActionDispatch Hook API',
      documentCategory: 'api',
      content: apiContent300,
      characterLimit: 300,
      language: 'en',
      strategy: 'api-first',
      priorityScore: 90
    });
    
    if (api300Result.isSuccess) {
      const api300Summary = api300Result.value;
      console.log(`✅ API 300자 LLMS 생성 성공`);
      console.log(`   - 문서 ID: ${api300Summary.getUniqueId()}`);
      console.log(`   - 실제 길이: ${api300Summary.content.length}자`);
      console.log(`   - 사용률: ${(api300Summary.getUtilizationRate() * 100).toFixed(1)}%`);
      console.log(`   - 여유 공간: ${api300Summary.getRemainingSpace()}자`);
      console.log(`   - 복잡도: ${api300Summary.isComplex() ? '복잡' : '단순'}`);
      console.log(`   - 카테고리: ${api300Summary.getCategory()}`);
      console.log(`   - 컨텐츠 미리보기: "${api300Summary.content.substring(0, 100)}..."`);
    } else {
      console.log(`❌ API 300자 생성 실패: ${api300Result.error.message}`);
    }
    
    // API 1000자 생성
    const apiContent1000 = smartTrim(apiContentRaw, 980); // 여유분 고려
    const api1000Result = DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: 'api/hooks/useActionDispatch.md',
      documentTitle: 'useActionDispatch Hook API',
      documentCategory: 'api',
      content: apiContent1000,
      characterLimit: 1000,
      language: 'en',
      strategy: 'api-first',
      priorityScore: 90
    });
    
    if (api1000Result.isSuccess) {
      const api1000Summary = api1000Result.value;
      console.log(`✅ API 1000자 LLMS 생성 성공`);
      console.log(`   - 문서 ID: ${api1000Summary.getUniqueId()}`);
      console.log(`   - 실제 길이: ${api1000Summary.content.length}자`);
      console.log(`   - 사용률: ${(api1000Summary.getUtilizationRate() * 100).toFixed(1)}%`);
      console.log(`   - 여유 공간: ${api1000Summary.getRemainingSpace()}자`);
    } else {
      console.log(`❌ API 1000자 생성 실패: ${api1000Result.error.message}`);
    }
    
    console.log('\n');
    
    // 가이드 문서 테스트
    const guideContentRaw = fs.readFileSync('./test-docs/guide-example.md', 'utf8');
    console.log('📚 가이드 문서 LLMS 생성 테스트');
    console.log('=' .repeat(50));
    console.log(`원본 길이: ${guideContentRaw.length}자\n`);
    
    // 가이드 300자 생성
    const guideContent300 = smartTrim(guideContentRaw, 280); // 여유분 고려
    const guide300Result = DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: 'guide/getting-started.md',
      documentTitle: 'Getting Started Guide',
      documentCategory: 'guide',
      content: guideContent300,
      characterLimit: 300,
      language: 'en',
      strategy: 'concept-first',
      priorityScore: 85
    });
    
    if (guide300Result.isSuccess) {
      const guide300Summary = guide300Result.value;
      console.log(`✅ 가이드 300자 LLMS 생성 성공`);
      console.log(`   - 문서 ID: ${guide300Summary.getUniqueId()}`);
      console.log(`   - 실제 길이: ${guide300Summary.content.length}자`);
      console.log(`   - 사용률: ${(guide300Summary.getUtilizationRate() * 100).toFixed(1)}%`);
      console.log(`   - 여유 공간: ${guide300Summary.getRemainingSpace()}자`);
      console.log(`   - 복잡도: ${guide300Summary.isComplex() ? '복잡' : '단순'}`);
      console.log(`   - 카테고리: ${guide300Summary.getCategory()}`);
      console.log(`   - 컨텐츠 미리보기: "${guide300Summary.content.substring(0, 100)}..."`);
    } else {
      console.log(`❌ 가이드 300자 생성 실패: ${guide300Result.error.message}`);
    }
    
    // 가이드 1000자 생성
    const guideContent1000 = smartTrim(guideContentRaw, 980); // 여유분 고려
    const guide1000Result = DocumentSummaryFactory.fromPriorityBasedGeneration({
      documentPath: 'guide/getting-started.md',
      documentTitle: 'Getting Started Guide',
      documentCategory: 'guide',
      content: guideContent1000,
      characterLimit: 1000,
      language: 'en',
      strategy: 'concept-first',
      priorityScore: 85
    });
    
    if (guide1000Result.isSuccess) {
      const guide1000Summary = guide1000Result.value;
      console.log(`✅ 가이드 1000자 LLMS 생성 성공`);
      console.log(`   - 문서 ID: ${guide1000Summary.getUniqueId()}`);
      console.log(`   - 실제 길이: ${guide1000Summary.content.length}자`);
      console.log(`   - 사용률: ${(guide1000Summary.getUtilizationRate() * 100).toFixed(1)}%`);
      console.log(`   - 여유 공간: ${guide1000Summary.getRemainingSpace()}자`);
    } else {
      console.log(`❌ 가이드 1000자 생성 실패: ${guide1000Result.error.message}`);
    }
    
    console.log('\n🔍 결과 분석');
    console.log('=' .repeat(50));
    
    if (api300Result.isSuccess && api1000Result.isSuccess && 
        guide300Result.isSuccess && guide1000Result.isSuccess) {
      
      console.log('✅ 모든 LLMS 생성이 성공적으로 완료되었습니다!');
      console.log('\n📊 생성된 개별 문서들:');
      console.log(`1. ${api300Result.value.getUniqueId()} (API 300자)`);
      console.log(`2. ${api1000Result.value.getUniqueId()} (API 1000자)`);
      console.log(`3. ${guide300Result.value.getUniqueId()} (가이드 300자)`);
      console.log(`4. ${guide1000Result.value.getUniqueId()} (가이드 1000자)`);
      
      console.log('\n🎯 결론: API-spec과 Guide 요청 시 각각 두 개의 개별 LLMS 텍스트가 정상적으로 생성됩니다.');
      
      // ID 분석
      console.log('\n🔍 생성된 ID 분석:');
      console.log(`API 문서 ID 패턴: ${api300Result.value.document.id.value}`);
      console.log(`가이드 문서 ID 패턴: ${guide300Result.value.document.id.value}`);
      console.log(`더블 대시 규칙 적용: ${api300Result.value.document.id.isComplex() ? '적용됨' : '미적용'}`);
      
      // CharacterLimit Value Object 테스트
      console.log('\n🧪 CharacterLimit Value Object 테스트:');
      const limit300 = CharacterLimit.create(300);
      const limit1000 = CharacterLimit.create(1000);
      console.log(`300자 제한 카테고리: ${limit300.getCategory()}`);
      console.log(`1000자 제한 카테고리: ${limit1000.getCategory()}`);
      console.log(`300자는 1000자보다 작음: ${limit300.isLessThan(limit1000)}`);
      
      // Trimming 테스트
      console.log('\n✂️ 트리밍 기능 테스트:');
      const smallerLimit = CharacterLimit.create(100);
      const trimResult = api300Result.value.trimToLimit(smallerLimit);
      if (trimResult.isSuccess) {
        console.log(`원본 ${api300Result.value.content.length}자 → 100자로 트리밍 성공: ${trimResult.value.content.length}자`);
      } else {
        console.log(`트리밍 실패: ${trimResult.error.message}`);
      }
      
    } else {
      console.log('❌ 일부 LLMS 생성이 실패했습니다.');
    }
    
  } catch (error) {
    console.log(`💥 테스트 실행 중 오류: ${error.message}`);
    console.log(error.stack);
  }
}

if (require.main === module) {
  testRealLLMSGeneration().catch(console.error);
}

module.exports = { testRealLLMSGeneration };